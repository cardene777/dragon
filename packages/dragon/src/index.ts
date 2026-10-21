/**
 * dragon の入口。
 *
 * 図の原本は JSON で、人は 1 行が 1 本の線になる記法で書く。記法と JSON は行き来でき、
 * JSON は JSON Schema 1 本で検査する。原本から図を描き、頁に置いて段ごとに動かす。
 * 頁に字を読み込むのは別の入口 `@cardenelabs/dragon/fonts`。
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
  type ViewMode,
} from "./schema";
export { FORMAT_VERSION, type Migrated, migrateFile, type Read, readDiagram } from "./version";
export type { Layout } from "./layout/scene";
export { FONTS } from "./look/fonts";
export { DEFAULT_PALETTE, type Palette, PALETTES, resolvePalette, type Theme } from "./look/values";
export { mountDiagram, type Player } from "./player";
export { type Rendered, type RenderOptions, renderDiagram } from "./render/svg";
export type { Timeline } from "./timeline";
export { chooseView } from "./view";
