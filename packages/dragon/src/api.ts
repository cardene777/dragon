/**
 * 既定の入口 (`index.ts`) と軽い入口 (`light.ts`) が共に出す部品 (#3248)。
 * 図の種類の部品を読むかだけが 2 つの入口で違うので、ここでは種類の部品を読まない。
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
  type LineupItem,
  type LineupOrder,
  type LineupStamp,
  type Region,
  type StatePath,
  type Step,
  type StepSource,
  type StripMeter,
  type TimeMarkEvent,
  type TimePeriod,
  type TimePoint,
  type TimeRow,
  type TimeScale,
  type TimeSpanEvent,
  type TimeSpec,
  type TreeLeaf,
  type TreeNode,
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
export type { TimeAxis, TimeBox, TimeColumn, TimeLayout, TimeMark, TimePeriodPlaced, TimePointPlaced, TimeRowPlaced, TimeSpanPlaced, TimeTick, TimeWire, TimeZoom } from "./layout/time";
export type { TreeLayout, TreeLink, TreePlaced, TreeRun } from "./layout/tree";
export type { LaneText, LineupAt, LineupLane, LineupLayout, LineupPick, LineupSeal, LineupSeat, LineupStamp as LineupStampPlaced } from "./layout/lineup";
export { type Family, FONTS } from "./look/fonts";
export { type ColorKey, type ColorName, type Colors, DEFAULT_PALETTE, type Palette, PALETTES, READABLE_PX, resolvePalette, type TextStyle, type Theme } from "./look/values";
export { mountDiagram, type Player, type PlayerOptions } from "./player";
export { ICONS } from "./render/icons";
export { describeOverlap, type InkPart, type Overlap, type OverlapSpot } from "./render/ink";
export { iconSvg } from "./render/parts";
export { type Rendered, type RenderOptions, renderDiagram } from "./render/draw";
export type { CarrierTime, EdgeTime, EventTime, LabelTime, Span, StateTime, Timeline } from "./timeline";
export { chooseView } from "./view";
