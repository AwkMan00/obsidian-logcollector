import { LogEventsFormatter } from "../types";

/**
 * A formatter that generates a plain text file
 */
export default <LogEventsFormatter> {
  id: "plaintext",
  title: "Plain text",
  description: "Generates a plain text file",
  fileExt: "txt",
  contentHead: [
    "Timestamp Originator Level Message",
  ].join("\n"),

  format: ({ timestamp, level, sender, args }) => {
    // Format the log message
    const logMsg = args
      .join(" ");

    return [
      "",
      timestamp.toISOString(),
      escapeForPlainText(sender ?? ""),
      level,
      logMsg,
      "",
    ]
      .join(" ")
      .trim();
  },
};

const escapeForPlainText = (str: string) =>
  str
    .replace(/([\|\[<])/sg, "\\$1")
