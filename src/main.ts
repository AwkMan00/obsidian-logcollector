import { normalizePath, Notice, Platform, Plugin } from "obsidian";
import { ConsoleProxy } from "./console-proxy";
import { findFormatterByID } from "./formatters";
import { PLUGIN_INFO } from "./plugin-info";
import { LogcollectorSettingTab } from "./settings";
import { LogEvent, LogcollectorSettings } from "./types";
import {
  createQueue,
  getDeviceName,
  getFile,
  logLevelFilter,
  prefixMsg,
} from "./utils";
import { getTimezoneOffset } from "date-fns-tz";


const DEFAULT_SETTINGS: LogcollectorSettings = {
  formatterID: "plaintext",
  folderIsExt: true,
  outputFolder: "/",
  outputExtFolder: "default",
  fileNameContainsDate: true,
  printInUTCtime: false,
  logLevel: "debug",
  debounceWrites: true,
};

export default class Logcollector extends Plugin {
  private queue: LogEvent[];
  private proxy: ConsoleProxy;
  private deviceName: string = getDeviceName(this.app);
  

  settings: LogcollectorSettings;
  outputFileBasename: string = `console-log.${this.deviceName}`;
  outputExtFileHandler: any = null;
  fileLinkHTML: any = null;
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  async onload() {
    await this.loadSettings();

    this.queue = createQueue(
      this.writeToFile.bind(this),
      this.settings.debounceWrites,
    );
    this.proxy = new ConsoleProxy(this.queue).setup();
    this.proxy.storeEvent(
      "info",
      "plugin:logcollector",
      prefixMsg(`Proxy set up (v${PLUGIN_INFO.pluginVersion})`),
    );
    this.addSettingTab(new LogcollectorSettingTab(this.app, this));
    //Change default path in windows
    if (Platform.isWin && this.settings.outputExtFolder == "default" ) {
		this.settings.outputExtFolder = process.env.LOCALAPPDATA ?? "C:\\Users\\Public";
		if (this.settings.outputExtFolder != "C:\\Users\\Public") {
			this.settings.outputExtFolder += "\\Temp";
    	}
    } else if (this.settings.outputExtFolder == "default" ) {
		this.settings.outputExtFolder = process.env.HOME ?? "/tmp";
    }

    new Notice("Logcollector is enabled!");
  }

  onunload() {
    this.proxy.teardown();
    new Notice("Logcollector is disabled");
	//Close opened output file outside the vault
	if (this.outputExtFileHandler != null) {
		this.outputExtFileHandler.end();
		this.outputExtFileHandler = null;
	}
  }

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  getOutputFilename(ext: string) {
	//Convert date to local time. Function "getTimezoneOffset" from "date-fns-tz" takes into account day savings time
	let currentDate;
	if (this.settings.printInUTCtime==false) {
		const currentDateFull = new Date();
		const timeZoneOffset = getTimezoneOffset(this.timeZone,new Date(currentDateFull.getTime()));
		currentDate = new Date(currentDateFull.getTime() + timeZoneOffset).toISOString().split("T")[0];
	} else {
		currentDate = new Date().toISOString().split("T")[0];
	}
    const filename = this.settings.fileNameContainsDate
      ? `${this.outputFileBasename}.${currentDate}.${ext}`
      : `${this.outputFileBasename}.${ext}`;

	let	pathSeparator =  "/";
	if (Platform.isWin == true ) {
		pathSeparator = "\\";
	}
	if (this.settings.folderIsExt == true ) {
		//Remove trailing slash and backslashes from path
	    return `${this.settings.outputExtFolder.replace(/[\/\\]+$/,"")}${pathSeparator}${filename}`;
	} else {
	    return normalizePath(`${this.settings.outputFolder}/${filename}`);
	}
  }

  /**
   * This function writes the log event to the file. It is called by the queue
   * when new log events have been intercepted.
   */


  private async writeToFile() {
    const { vault, workspace } = this.app;

    // Processing files before the layout is ready is usually not a good idea…
    workspace.onLayoutReady(async () => {
      const formatter = findFormatterByID(this.settings.formatterID)!;
      const filename = this.getOutputFilename(formatter.fileExt);

	  let fileInt:any;

      // Retrieve the file
	  if (this.settings.folderIsExt == true ) {
		  if (this.outputExtFileHandler == null ) {
			  try {
				  var fs = require('fs');
				  this.outputExtFileHandler = await fs.createWriteStream(filename, {flags: 'a'});
				  //This code is necessary to catch error when opening file (e.g. when directory does not exists)
				  this.outputExtFileHandler.on('error', function(err:string) {
					new Notice(err);
					this.outputExtFileHandler = null;
				  });
			  } catch(e:unknown) {
				new Notice("Error opening file " + filename + ". Error is: " + (e as Error).message);
				this.outputExtFileHandler = null;
				return;
			  }
		  }
	  } else {
		  fileInt = await getFile(vault, filename, formatter.contentHead);
	  }

      // Write the log events to the file
      let logEvent: LogEvent | undefined;
	  let line = "";
      while ((logEvent = this.queue.shift())) {
        if (logLevelFilter(logEvent, this.settings.logLevel)) {
		if (this.settings.printInUTCtime == false) {
			//Convert date to local time. Function "getTimezoneOffset" from "date-fns-tz" takes into account day savings time
			const timeZoneOffset = getTimezoneOffset(this.timeZone,new Date(logEvent.timestamp.getTime()));
			logEvent.timestamp = new Date(logEvent.timestamp.getTime() + timeZoneOffset);
			//Remove "Z" from line, as it is not UTC
        	line = formatter.format(logEvent).replace(/Z/,"") + "\n";
		} else {
        	line = formatter.format(logEvent) + "\n";
		}
	  if (this.settings.folderIsExt == true ) {
	  	try {
		  this.outputExtFileHandler.write(line);
		} catch(e:unknown) {
		  new Notice("Error writing to file " + filename + ". Error is: " + (e as Error).message);
		}
	  } else {
	       await vault.append(fileInt, line);
	  }
        }
      }
    });
  }
}
