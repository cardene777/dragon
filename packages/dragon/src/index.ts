/**
 * dragon の入口。
 *
 * 図の原本は JSON で、人は 1 行が 1 本の線になる記法で書く。記法と JSON は行き来でき、
 * JSON は JSON Schema 1 本で検査する。
 */
export { extractDiagrams, type Fence } from "./markdown";
export { type LineError, type Parsed, parseNotation } from "./parser";
export { printNotation } from "./printer";
export {
  type Box,
  type Carry,
  type Checked,
  type Color,
  type Diagram,
  type DiagramEvent,
  type FieldError,
  type LabelSide,
  type Region,
  type Step,
  validateDiagram,
} from "./schema";
export { FORMAT_VERSION, type Migrated, migrateFile, type Read, readDiagram } from "./version";
