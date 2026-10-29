/**
 * dragon の入口。
 *
 * 図の原本は JSON で、人は行の頭の英語の語で行の種類を決める dragon記法で書く。記法と JSON は行き来でき、
 * JSON は JSON Schema 1 本で検査する。原本から図を描き、頁に置いて段ごとに動かす。
 * 頁に字を読み込むのは別の入口 `@cardenelabs/dragon/fonts`、原本の file を移すのは Node でだけ動く入口 `@cardenelabs/dragon/node`。
 * この入口は頁を束ねる道具が読むため、Node の組み込みの module を読む部品を置かない (#3206)。
 */
export { extractDiagrams, type Fence } from "./markdown";
export { type LineError, type ParseOptions, type Parsed, parseNotation } from "./parser";
export { printNotation } from "./printer";
export type { NotationLang } from "./words";
export {
  type Box,
  type Carry,
  type Checked,
  type CheckOptions,
  type Color,
  type Diagram,
  type DiagramEvent,
  type FieldError,
  type GitBranch,
  type GitCommit,
  type LabelSide,
  type Region,
  type StatePath,
  type Step,
  validateDiagram,
  type ViewMode,
} from "./schema";
export { FORMAT_VERSION, type Read, readDiagram } from "./version";
export type {
  Layout,
  Point,
  Rect,
  SceneAction,
  SceneBadge,
  SceneBox,
  SceneEdge,
  SceneEnd,
  SceneField,
  SceneLabel,
  SceneLifeline,
  ScenePath,
  SceneRegion,
  SceneSide,
  SceneStrip,
  SceneTrail,
} from "./layout/scene";
export { type Family, FONTS } from "./look/fonts";
export { type ColorKey, type ColorName, type Colors, DEFAULT_PALETTE, type Palette, PALETTES, READABLE_PX, resolvePalette, type Theme } from "./look/values";
export { mountDiagram, type Player, type PlayerOptions } from "./player";
export { ICONS } from "./render/icons";
export { describeOverlap, type InkPart, type Overlap, type OverlapSpot } from "./render/ink";
export { iconSvg } from "./render/parts";
export { type Rendered, type RenderOptions, renderDiagram } from "./render/svg";
export type { CarrierTime, EdgeTime, EventTime, LabelTime, Span, StateTime, Timeline } from "./timeline";
export { chooseView } from "./view";
