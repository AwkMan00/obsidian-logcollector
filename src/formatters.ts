import mdcodeblocks from "./formatters/mdcodeblocks";
import mdtable from "./formatters/mdtable";
import ndjson from "./formatters/ndjson";
import plaintext from "./formatters/plaintext";

export const formatters = [
  mdtable,
  ndjson,
  mdcodeblocks,
  plaintext
]
  .sort((a, b) => a.title.localeCompare(b.title));

export function findFormatterByID(id: string) {
  return formatters.find((formatter) => formatter.id === id);
}
