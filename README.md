# Logcollector


This is a plugin for [Obsidian](https://obsidian.md) that logs all console output and uncaught exceptions to a note (inside or outside a vault).  **It's mainly aimed at developers.**

As such, it's also useful for letting your plugin's users help you debug your plugin's issues: Ask your customers to install this plugin, then send you the resulting log when they report a bug.

This plugin is a fork of [Logstravaganza](https://github.com/czottmann/obsidian-logstravaganza) plugin (version 2.3.0), but with the following added capabilities:
    - Place the log file outside the vault (avoids crashing Obsidian if there are too many entries).
    - Save timestamps in local time (default) or UTC format.
    - Write messages in plain text format.

## What it does

- Intercepts and writes all `console.*()` output to a file in your vault.
- Logs uncaught exceptions to the same file, including exceptions occurring in async code and promises (as long as they're happening in the main thread).
- Logs can be written in several formats:
    - [NDJSON](https://github.com/ndjson/ndjson-spec), a plain text format that can be read by humans and machines alike. Every line in the file is a JSON object. Think CSV, but with JSON.
    - Markdown file containing a table.
    - Markdown file containing code blocks.
    - Plain text (no formatting applied).

## Known issues

- Time logged in console through `console.timeLog(*label*)` and `console.timeEnd(*label*)` is not shown in log (only the *label*). This is due to the time is not passed in the arguments in `console.timeLog(*label*)` and `console.timeEnd(*label*)` events.
- When logging outside the vault, filename in bottom of options menu has a non functional link (due to security reasons, links to files outside the vault are not allowed).
- Worker messages (warnings, errors, etc.) are not captured by this plugin (even though they appear in the console). The main plugin process needs to capture the messages and print them using a `console.*()` call.


## Example output

The log output will be written to a `console-log.DEVICE-NAME.*` or, optionally, `console-log.DEVICE-NAME.2024-01-31.*` . (Here, `DEVICE-NAME` is a placeholder for the actual device name as returned by the core Sync plugin. This works whether or not Sync is activated or not.)


### Using the NDJSON formatter

Output file name: `console-log.DEVICE-NAME.ndjson`

```plaintext
{"timestamp":"2024-03-24T16:18:04.256Z","level":"info","sender":"plugin:logcollector","args":["[Logcollector] Proxy set up (v2.0.0)"]}
{"timestamp":"2024-03-24T16:18:04.419Z","level":"log","sender":"plugin:actions-uri:12152:11","args":[["[Actions URI]","Registered URI handlers:",["actions-uri","actions-uri/command","actions-uri/command/list","actions-uri/command/execute","actions-uri/dataview","actions-uri/dataview/table-query","actions-uri/dataview/list-query","actions-uri/file","actions-uri/file/list","actions-uri/file/get-active","actions-uri/file/open","actions-uri/file/delete","actions-uri/file/trash","actions-uri/file/rename","actions-uri/folder","actions-uri/folder/list","actions-uri/folder/create","actions-uri/folder/rename","actions-uri/folder/delete","actions-uri/folder/trash","actions-uri/info","actions-uri/note-properties","actions-uri/note-properties/get","actions-uri/note-properties/set","actions-uri/note-properties/clear","actions-uri/note-properties/remove-keys","actions-uri/note","actions-uri/note/list","actions-uri/note/get","actions-uri/note/get-first-named","actions-uri/note/get-active","actions-uri/note/open","actions-uri/note/create","actions-uri/note/append","actions-uri/note/prepend","actions-uri/note/touch","actions-uri/note/delete","actions-uri/note/trash","actions-uri/note/rename","actions-uri/note/search-string-and-replace","actions-uri/note/search-regex-and-replace","actions-uri/omnisearch","actions-uri/omnisearch/all-notes","actions-uri/omnisearch/open","actions-uri/daily-note","actions-uri/daily-note/list","actions-uri/daily-note/get-current","actions-uri/daily-note/get-most-recent","actions-uri/daily-note/open-current","actions-uri/daily-note/open-most-recent","actions-uri/daily-note/create","actions-uri/daily-note/append","actions-uri/daily-note/prepend","actions-uri/daily-note/search-string-and-replace","actions-uri/daily-note/search-regex-and-replace","actions-uri/weekly-note","actions-uri/weekly-note/list","actions-uri/weekly-note/get-current","actions-uri/weekly-note/get-most-recent","actions-uri/weekly-note/open-current","actions-uri/weekly-note/open-most-recent","actions-uri/weekly-note/create","actions-uri/weekly-note/append","actions-uri/weekly-note/prepend","actions-uri/weekly-note/search-string-and-replace","actions-uri/weekly-note/search-regex-and-replace","actions-uri/monthly-note","actions-uri/monthly-note/list","actions-uri/monthly-note/get-current","actions-uri/monthly-note/get-most-recent","actions-uri/monthly-note/open-current","actions-uri/monthly-note/open-most-recent","actions-uri/monthly-note/create","actions-uri/monthly-note/append","actions-uri/monthly-note/prepend","actions-uri/monthly-note/search-string-and-replace","actions-uri/monthly-note/search-regex-and-replace","actions-uri/quarterly-note","actions-uri/quarterly-note/list","actions-uri/quarterly-note/get-current","actions-uri/quarterly-note/get-most-recent","actions-uri/quarterly-note/open-current","actions-uri/quarterly-note/open-most-recent","actions-uri/quarterly-note/create","actions-uri/quarterly-note/append","actions-uri/quarterly-note/prepend","actions-uri/quarterly-note/search-string-and-replace","actions-uri/quarterly-note/search-regex-and-replace","actions-uri/yearly-note","actions-uri/yearly-note/list","actions-uri/yearly-note/get-current","actions-uri/yearly-note/get-most-recent","actions-uri/yearly-note/open-current","actions-uri/yearly-note/open-most-recent","actions-uri/yearly-note/create","actions-uri/yearly-note/append","actions-uri/yearly-note/prepend","actions-uri/yearly-note/search-string-and-replace","actions-uri/yearly-note/search-regex-and-replace","actions-uri/search","actions-uri/search/all-notes","actions-uri/search/open","actions-uri/tags","actions-uri/tags/list","actions-uri/vault","actions-uri/vault/open","actions-uri/vault/close","actions-uri/vault/info","actions-uri/vault/list-all-files","actions-uri/vault/list-non-notes-files"]]]}
{"timestamp":"2024-03-24T16:18:04.530Z","level":"time","sender":"plugin:omnisearch:50:7444","args":[["Omnisearch - Indexing total time"]]}
{"timestamp":"2024-03-24T16:18:04.530Z","level":"log","sender":"plugin:omnisearch:50:7571","args":[["Omnisearch - 66 files total"]]}
```

Obsidian won't open `.ndjson` files, even though they're basically plain text files.

In NDJSON, every line is a self-contained JSON object.  This makes it easy to read and parse with tools like `jq`. For example, the file can be filtered with `jq`:

```bash
jq -r 'select(.level == "error")' < "console-log.DEVICE-NAME.ndjson"
```

This will only show the lines where the `level` is `error`. You can also stream the output of the plugin to a file and then use `jq` to filter it in real-time.

```bash
tail -f "console-log.DEVICE-NAME.ndjson" | jq -r 'select(.level == "error")'
```


### Using the Markdown Table formatter

Output file name: `console-log.DEVICE-NAME.md`

```plaintext
| Timestamp | Originator | Level | Message |
| --------- | ---------- | ----- | ------- |
| 2024-03-23T17:25:42.973Z | plugin:logcollector | info | \[Logcollector] Proxy set up (v1.3.0) |
| 2024-03-23T17:25:43.109Z | plugin:actions-uri:12152:11 | log | \["\[Actions URI]","Registered URI handlers:",\["actions-uri","actions-uri/command","actions-uri/command/list","actions-uri/command/execute","actions-uri/dataview","actions-uri/dataview/table-query","actions-uri/dataview/list-query","actions-uri/file","actions-uri/file/list","actions-uri/file/get-active","actions-uri/file/open","actions-uri/file/delete","actions-uri/file/trash","actions-uri/file/rename","actions-uri/folder","actions-uri/folder/list","actions-uri/folder/create","actions-uri/folder/rename","actions-uri/folder/delete","actions-uri/folder/trash","actions-uri/info","actions-uri/note-properties","actions-uri/note-properties/get","actions-uri/note-properties/set","actions-uri/note-properties/clear","actions-uri/note-properties/remove-keys","actions-uri/note","actions-uri/note/list","actions-uri/note/get","actions-uri/note/get-first-named","actions-uri/note/get-active","actions-uri/note/open","actions-uri/note/create","actions-uri/note/append","actions-uri/note/prepend","actions-uri/note/touch","actions-uri/note/delete","actions-uri/note/trash","actions-uri/note/rename","actions-uri/note/search-string-and-replace","actions-uri/note/search-regex-and-replace","actions-uri/omnisearch","actions-uri/omnisearch/all-notes","actions-uri/omnisearch/open","actions-uri/daily-note","actions-uri/daily-note/list","actions-uri/daily-note/get-current","actions-uri/daily-note/get-most-recent","actions-uri/daily-note/open-current","actions-uri/daily-note/open-most-recent","actions-uri/daily-note/create","actions-uri/daily-note/append","actions-uri/daily-note/prepend","actions-uri/daily-note/search-string-and-replace","actions-uri/daily-note/search-regex-and-replace","actions-uri/weekly-note","actions-uri/weekly-note/list","actions-uri/weekly-note/get-current","actions-uri/weekly-note/get-most-recent","actions-uri/weekly-note/open-current","actions-uri/weekly-note/open-most-recent","actions-uri/weekly-note/create","actions-uri/weekly-note/append","actions-uri/weekly-note/prepend","actions-uri/weekly-note/search-string-and-replace","actions-uri/weekly-note/search-regex-and-replace","actions-uri/monthly-note","actions-uri/monthly-note/list","actions-uri/monthly-note/get-current","actions-uri/monthly-note/get-most-recent","actions-uri/monthly-note/open-current","actions-uri/monthly-note/open-most-recent","actions-uri/monthly-note/create","actions-uri/monthly-note/append","actions-uri/monthly-note/prepend","actions-uri/monthly-note/search-string-and-replace","actions-uri/monthly-note/search-regex-and-replace","actions-uri/quarterly-note","actions-uri/quarterly-note/list","actions-uri/quarterly-note/get-current","actions-uri/quarterly-note/get-most-recent","actions-uri/quarterly-note/open-current","actions-uri/quarterly-note/open-most-recent","actions-uri/quarterly-note/create","actions-uri/quarterly-note/append","actions-uri/quarterly-note/prepend","actions-uri/quarterly-note/search-string-and-replace","actions-uri/quarterly-note/search-regex-and-replace","actions-uri/yearly-note","actions-uri/yearly-note/list","actions-uri/yearly-note/get-current","actions-uri/yearly-note/get-most-recent","actions-uri/yearly-note/open-current","actions-uri/yearly-note/open-most-recent","actions-uri/yearly-note/create","actions-uri/yearly-note/append","actions-uri/yearly-note/prepend","actions-uri/yearly-note/search-string-and-replace","actions-uri/yearly-note/search-regex-and-replace","actions-uri/search","actions-uri/search/all-notes","actions-uri/search/open","actions-uri/tags","actions-uri/tags/list","actions-uri/vault","actions-uri/vault/open","actions-uri/vault/close","actions-uri/vault/info","actions-uri/vault/list-all-files","actions-uri/vault/list-non-notes-files"]] |
| 2024-03-23T17:25:43.168Z | plugin:omnisearch:50:7444 | time | \["Omnisearch - Indexing total time"] |
| 2024-03-23T17:25:43.168Z | plugin:omnisearch:50:7571 | log | \["Omnisearch - 66 files total"] |
```

In reading mode, the output will be displayed as a table.


### Using the Markdown Code Blocks formatter

Output file name: `console-log.DEVICE-NAME.md`

    ```
    time: 2024-05-06T17:31:06.874Z
    from: plugin:logcollector
    level: info
    [Logcollector] Proxy set up (v2.0.1)
    ```

    ```
    time: 2024-05-06T17:31:07.017Z
    from: plugin:actions-uri:12152:11
    level: log
    [
        "[Actions URI]",
        "Registered URI handlers:",
        [
            "actions-uri",
            "actions-uri/command",
            "actions-uri/command/list",
            "actions-uri/command/execute",
            "actions-uri/dataview",
    …
            "actions-uri/vault/list-all-files",
            "actions-uri/vault/list-non-notes-files"
        ]
    ]
    ```

    ```
    time: 2024-05-06T17:31:07.098Z
    from: plugin:omnisearch:50:7444
    level: time
    Omnisearch - Indexing total time
    ```

    ```
    time: 2024-05-06T17:31:07.098Z
    from: plugin:omnisearch:50:7571
    level: log
    Omnisearch - 75 files total
    ```

In reading mode, the output will be displayed as separate MD code blocks.

### Using the plain text formatter

Output file name: `console-log.DEVICE-NAME.txt`

```plaintext
2026-05-03T13:09:54.039 plugin:logcollector info [Logcollector] Proxy set up (v3.0.0)
2026-05-03T13:09:57.567 plugin:omnisearch:136:8916 time Indexing total time
2026-05-03T13:19:06.658 plugin:omnisearch:136:8994 debug List files ALL Numfiles 2 test1.md,test2.md
2026-05-03T13:09:58.050 plugin:omnisearch:136:9237 debug Cache is enabled
2026-05-03T13:09:58.051 plugin:omnisearch:136:9323 time Loading index from cache
2026-05-03T13:09:58.283 plugin:omnisearch:134:179565 log Omnisearch - No cache found
```

This output does not apply any formatting or character scaping. It can be viewed with any text editor and easily parsed with text parsing tools (e.g. `grep` or `awk`).

## Caveats

Naturally, the plugin can't know about past console output.  It can only log what happens after when it's activated/enabled.

**Please note:** When this plugin is active and proxying `console` calls, all output to the actual console will appear as coming from `plugin:logcollector`.


## Bug Reports & Discussions

Bug reports and feature requests are welcome, feel free to [open an issue](https://github.com/AwkMan00/obsidian-logcollector/issues) here on GitHub — thank you!


## Installation

### Using Obsidian community plugin browser

1. Open **Settings → Community Plugins**
2. Search for **Logcollector**
3. Install and enable the plugin.

### Manual Installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/AwkMan00/obsidian-logcollector/releases/latest)
2. Copy them to `<your-vault>/.obsidian/plugins/obsidian-logcollector/`
3. Enable the plugin in **Settings → Community Plugins**


## Development

Clone the repository, run `pnpm install` OR `npm install` to install the dependencies.  Afterwards, run `pnpm dev` OR `npm run dev` to compile and have it watch for file changes.


## Author

Deimos Ibáñez

## Acknowledgements

Carlo Zottmann, for creating the Logstravanza plugin from which this plugins is forked from, and all its contributors.

To FolderBridge plugin developers, whose code was used to open the file explorer for selecting a folder outside Obsidian vaults.


## Disclaimer

Use at your own risk.  Things might go sideways, hard.  I'm not responsible for any data loss or damage.  You have been warned.

Always back up your data.  Seriously.


## License

MIT, see [LICENSE.md](LICENSE.md).
