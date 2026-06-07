import { App, PluginSettingTab, Setting, Notice, TFolder } from "obsidian";
import Logcollector from "./main";
import { formatters } from "./formatters";
import { getObsidianURI } from "./utils";


// START section imported from Folder Bridge Obsidian extension
import { getRuntimeRequire } from './runtimeNode';


/** Minimal interface for Electron's dialog module. */
interface ElectronDialog {
    showOpenDialog(options: ElectronOpenDialogOptions): Promise<{ canceled: boolean; filePaths: string[] }>;
}

/** Options for Electron's dialog.showOpenDialog. */
interface ElectronOpenDialogOptions {
    properties: string[];
    title?: string;
    defaultPath?: string;
}

// ---------------------------------------------------------------------------
// Electron folder-picker helper
// ---------------------------------------------------------------------------


/**
 * Open the native OS folder-picker dialog via Electron's remote API.
 * Returns the selected absolute path, or null if the user cancelled or the
 * Electron remote API is unavailable in the current host environment.
 */
export async function browseFolderOnDisk(title = 'Select folder', defaultPath?: string): Promise<string | null> {
    try {
        const runtimeRequire = getRuntimeRequire();
        const electron = runtimeRequire?.('electron');
        // Electron ≥ 14 ships remote via @electron/remote; Obsidian re-exports
        // it on the electron object so both old and new versions work here.
        const dialog: ElectronDialog | undefined = electron?.remote?.dialog ?? electron?.dialog;
        if (!dialog?.showOpenDialog) {
            new Notice('Native folder browser is unavailable. Please type the path manually.');
            return null;
        }
        const options: ElectronOpenDialogOptions = {
            properties: ['openDirectory'],
            title,
        };
        if (defaultPath) {
            options.defaultPath = defaultPath;
        }
        const result = await dialog.showOpenDialog(options);
        if (result.canceled || !result.filePaths?.length) return null;
        return result.filePaths[0];
    } catch (err) {
        new Notice('Native folder browser is unavailable. Please type the path manually.');
        return null;
    }
}

// END section imported from Folder Bridge Obsidian extension

export class LogcollectorSettingTab extends PluginSettingTab {
  plugin: Logcollector;

  constructor(app: App, plugin: Logcollector) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(onlyLink?: boolean): void {
    const { containerEl, plugin } = this;
	
	//Only draw the full settings if we are not updating the filename at the end
	//The reason for this is for the case when the user manually writes the folder path
	// for the logfile outside the vault. When any character is changed, this triggers a full
	// refresh of the settings panel, which is very slow and freezes the windows. To avoid it, 
	// only the link is refreshed.
	if (onlyLink == null || onlyLink == false) {
	    containerEl.empty();
		plugin.fileLinkHTML = null;
	
	    // Output format
	    new Setting(containerEl)
	      .setName("Output format")
	      .setDesc(`
	        This plugin intercepts developer console messages, and saves them to a
	        file in your vault. Select the output file format here.`)
	      .addDropdown((dropdown) => {
	        dropdown
	          .addOptions(this.allFormatters())
	          .setValue(plugin.settings.formatterID)
	          .onChange(
	            async (value) => {
	              plugin.settings.formatterID = value;
	              await plugin.saveSettings();
	              this.display(true);
	            },
	          );
	      });
	
	    const ul = containerEl.createEl("ul", {
	      cls: "setting-item-description",
	      attr: { style: "margin-block-start: 0; padding-inline-start: 2em;" },
	    });
	    formatters.forEach((f) => {
		 //This code replaces the usage of "innerHTML (where HTML code was set directly).
		 //We use the 'p' instead of 'li' because it does not add a new line after the end of the text
		 ul.createEl("p",{ attr: { style: "margin-bottom: 0.5rem;font-weight: bold;"} , text: `• ${f.title} ` });
		 ul.createEl("t",{ attr: { style: "margin-bottom: 0.5rem;"} ,
			text: `${f.description}
			File extension: `;
			});
		 ul.createEl("code",{ attr: { style: "margin-bottom: 0.5rem;"} text: `.${f.fileExt}`});
	    });
	
	    // Option to set whether to save inside or outside the vault
	    new Setting(containerEl)
	      .setName("Save log outside the vault.")
	      .setDesc("Select to save log file inside or outside the vault. Default is outside the vault, to avoid the log file to be indexed by Obsidian (which will crash if there are too many entries).")
	      .addToggle((toggle) => {
	        toggle
	          .setValue(plugin.settings.folderIsExt)
	          .onChange(async (value) => {
	            plugin.settings.folderIsExt = value;
	            await plugin.saveSettings();
	            this.display();
	          });
	      });
	
		if (plugin.settings.folderIsExt == true ) {
			// Output folder outside vault
			new Setting(containerEl)
			  .setName("Output folder outside vault")
			  .setDesc("Where to save the log file outside the vault.")
			  .addText((text) => {
				text
				  .setValue(plugin.settings.outputExtFolder)
				  .onChange(
					async (value) => {
					  plugin.settings.outputExtFolder = value.trim();
					  await plugin.saveSettings();
					  this.display(true);
					  //Close current file and set handler to null to force file reopening
					  if (plugin.outputExtFileHandler != null) {
						  plugin.outputExtFileHandler.end();
						  plugin.outputExtFileHandler = null;
					  }
					}
				  );
			  })
			  .addButton(button => {
				button.setButtonText('Browse')
					.setTooltip('Open the system folder picker')
					.onClick(() => {
						void (async () => {
							var fs = require('fs');
							let selected;
							if (fs.existsSync(plugin.settings.outputExtFolder)) {
								//Open in current selected folder (if it exists)
								selected = await browseFolderOnDisk('Select external folder',plugin.settings.outputExtFolder);
							} else {
								selected = await browseFolderOnDisk('Select external folder');
							}
							if (selected) {
								plugin.settings.outputExtFolder = selected.trim();
								await plugin.saveSettings();
								this.display(true);
								//Close current file and set handler to null to force file reopening
								if (plugin.outputExtFileHandler != null) {
									plugin.outputExtFileHandler.end();
									plugin.outputExtFileHandler = null;
								}
							}
						})();
					});
				button.buttonEl.setAttribute('aria-label', 'Browse for folder on disk');
			});
	
		} else {
			// Output folder inside vault
			new Setting(containerEl)
			  .setName("Output folder inside vault")
			  .setDesc("Where to save the log file inside the vault.")
			  .addDropdown((dropdown) => {
				dropdown
				  .addOptions(this.allFolders())
				  .setValue(plugin.settings.outputFolder)
				  .onChange(
					async (value) => {
					  plugin.settings.outputFolder = value;
					  await plugin.saveSettings();
					  this.display(true);
					  //Close current file and set handler to null, as it is no longer used
					  if (plugin.outputExtFileHandler != null) {
						  plugin.outputExtFileHandler.end();
						  plugin.outputExtFileHandler = null;
					  }
					},
				  );
			  });
		}
	
	    // Include current date in filename
	    new Setting(containerEl)
	      .setName("Include current date in filename")
	      .setDesc("Adds the YYYY-MM-DD timestamp to the output filename.")
	      .addToggle((toggle) => {
	        toggle
	          .setValue(plugin.settings.fileNameContainsDate)
	          .onChange(async (value) => {
	            plugin.settings.fileNameContainsDate = value;
	            await plugin.saveSettings();
	            this.display(true);
		  		//Close current file and set handler to null to force file reopening
		    	if (plugin.outputExtFileHandler != null) {
			    	plugin.outputExtFileHandler.end();
			    	plugin.outputExtFileHandler = null;
		    	}
	          });
	      });
	
	    // Log time in UTC
	    new Setting(containerEl)
	      .setName("Log time in UTC")
	      .setDesc("Prints the log events timestamp in UTC instead of local time.")
	      .addToggle((toggle) => {
	        toggle
	          .setValue(plugin.settings.printInUTCtime)
	          .onChange(async (value) => {
	            plugin.settings.printInUTCtime = value;
	            await plugin.saveSettings();
	            this.display(true);
				//Close current file and set handler to null to force file reopening 
				//In this it is due to due to offset from UTC, we may changed the current day
				if (plugin.outputExtFileHandler != null) {
					plugin.outputExtFileHandler.end();
					plugin.outputExtFileHandler = null;
				}
	          });
	      });

	    // Log level!
	    new Setting(containerEl)
	      .setName("Log level to render")
	      .setDesc(`
	        Only print out the log level equal to or above what you set here.
	      `)
	      .addDropdown((dropdown) => {
	        dropdown
	          .addOption("debug", "debug (print everything)")
	          .addOption("info", "info")
	          .addOption("warn", "warn")
	          .addOption("error", "error (only print error)")
	          .setValue(plugin.settings.logLevel)
	          .onChange(async (value) => {
	            plugin.settings.logLevel = value as any;
	            await plugin.saveSettings();
	            this.display();
	          });
	      });
	
	    new Setting(containerEl)
	      .setName("Debounce writing to output file")
	      .setDesc(`
	        Disabling this setting will cause Logcollector to write everything
	        to the output file as it happens, and as such will impact performance.
	        Usually, you'll want to keep this setting enabled.
	      `)
	      .addToggle((toggle) => {
	        toggle
	          .setValue(plugin.settings.debounceWrites)
	          .onChange(async (value) => {
	            plugin.settings.debounceWrites = value;
	            await plugin.saveSettings();
	            this.display();
	          });
	      });
	
		new Setting(containerEl).setName("Output file").setHeading()
	}

    // Display & link output file path
    const fileExt = formatters
      .find((f) => f.id === plugin.settings.formatterID)!
      .fileExt;
	const filename = plugin.getOutputFilename(fileExt);

	//Links to local files are forbidden due to security reasons, so for files outside
	//the vault there will be no link
	const link = plugin.settings.folderIsExt?"":getObsidianURI(this.app.vault, filename);

	 if (plugin.fileLinkHTML != null ) {
		plugin.fileLinkHTML.textContent = filename;
     	if (plugin.settings.folderIsExt == false ) {
			plugin.fileLinkHTML.attr = {href: link};
		}
	 } else {
     	if (plugin.settings.folderIsExt == true ) {
  	      plugin.fileLinkHTML = containerEl
				.createEl("p", { text: "→ " })
	      		.createEl("a", { text: filename,  attr: { href: null } });
  	   } else {
  		      plugin.fileLinkHTML = containerEl
    	    	.createEl("p", { text: "→ " })
      			.createEl("a", { text: filename, attr: { href: link } });
       }
	 }
  }

  private allFolders(): Record<string, string> {
    return this.app.vault
      .getAllLoadedFiles()
      .filter((f) => f instanceof TFolder)
      .map((f) => ({
        name: `/${f.path}`.replace(/^\/+/, "/"),
        path: f.path,
      }))
      .sort((a, b) => b.name.localeCompare(a.name))
      .reduce(
        (obj: any, f) => ({ [f.path]: f.name, ...obj }),
        {},
      );
  }

  private allFormatters(): Record<string, string> {
    return formatters.reduce(
      (obj: any, f) => ({ [f.id]: f.title, ...obj }),
      {},
    );
  }
}
