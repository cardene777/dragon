/**
 * 既定の入口 (`index.ts`) と軽い入口 (`light.ts`) が共に出す部品 (#3248)。
 * 図の種類の部品を読むかだけが 2 つの入口で違うので、ここでは種類の部品を読まない。
 */
// 記法をエディタで開く URL (#3644)。依存を持たないので、描く入口と軽い入口の両方が出す
export { editorUrl, type EditorUrlOptions } from "./editor-url";
export { extractDiagrams, type Fence } from "./markdown";
export { type LineError, type ParseOptions, type Parsed, parseNotation } from "./parser";
export { type PrintOptions, printNotation } from "./printer";
export { type NotationLang, NOTATION_WORDS } from "./words";
export {
  type Box,
  type Carry,
  type ChartItem,
  type ChartSet,
  type ChartShape,
  type ChartSpec,
  type Checked,
  type CheckOp,
  type CheckOptions,
  type Color,
  type Diagram,
  type DiagramBlocks,
  type DiagramEvent,
  type DiagramKind,
  type DiagramModel,
  type ErCell,
  type ErField,
  type ErFormula,
  type ErLookup,
  type ErTable,
  type FieldError,
  type FlowChoice,
  type GitBranch,
  type GitCommit,
  type GitDelete,
  type LabelSide,
  type LineupAct,
  type LineupItem,
  type LineupLook,
  type LineupOrder,
  type LineupRole,
  type LineupShape,
  type LineupStamp,
  type MatrixAxis,
  type MatrixItem,
  type MatrixSpec,
  type MindIdea,
  type PipeCalc,
  type PipeCall,
  type PipeCallKind,
  type PipeCheck,
  type PipeEmit,
  type PipeFold,
  type PipeHold,
  type PipeMove,
  type PipeReturn,
  type PipeRevert,
  type PipeWrite,
  type Region,
  type StatePath,
  type Step,
  type StepSource,
  type Strip,
  type StripMeter,
  type TimeMarkEvent,
  type TimePeriod,
  type TimePoint,
  type TimeRow,
  type TimeScale,
  type TimeSpanEvent,
  type TimeSpec,
  type TimeTask,
  type TreeLeaf,
  type TreeNode,
  type TryAsk,
  type TryCheck,
  type TryEdit,
  type TryItem,
  type TryLine,
  type TryPart,
  type TryPress,
  type TryVerdict,
  validateDiagram,
  validatorLoaded,
  type VennCount,
  type VennLook,
  type VennNone,
  type VennSet,
  type VennShape,
  type ViewMode,
} from "./schema";
export { FORMAT_VERSION, type Read, readDiagram } from "./version";
export type { ReadBlocks, UserBase, UserBlock, UserBlockError, UserBlocks } from "./user-blocks";
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
export type { TimeAxis, TimeBox, TimeColumn, TimeLayout, TimeMark, TimePeriodPlaced, TimePointPlaced, TimeRowPlaced, TimeSpanPlaced, TimeTaskPlaced, TimeTick, TimeWire, TimeZoom } from "./kinds/time/layout";
export type { TreeLayout, TreeLink, TreePlaced, TreeRun } from "./kinds/tree/layout";
export type { TryChainPlaced, TryLayout, TryLogPlaced, TryMoment, TryNetLink, TryNodePlaced, TryPartPlaced, TryQueuePlaced, TryRoutePlaced, TryTitle } from "./kinds/try/layout";
export type { TryBlock, TryRecord, TryState, TryTrip } from "./try-state";
export type {
  PipeAt,
  PipeBranch,
  PipeBus,
  PipeBusAt,
  PipeCallLane,
  PipeChip,
  PipeColumn,
  PipeConverter,
  PipeCrossing,
  PipeEventChip,
  PipeFlow,
  PipeFoldBox,
  PipeGauge,
  PipeGlass,
  PipeHousing,
  PipeLane,
  PipeLayout,
  PipeLevel,
  PipeMain,
  PipeParty,
  PipePill,
  PipePlate,
  PipePort,
  PipeRing,
  PipeRole,
  PipeShape,
  PipeState,
  PipeStub,
  PipeTank,
  PipeText,
  PipeTie,
  PipeValuePipe,
  PipeWordsInput,
  PipeWrite as PipeWritePlaced,
} from "./kinds/pipe/layout";
export type { ChartArc, ChartBarRow, ChartLayout, ChartLayoutOptions, ChartLegendRow, ChartPlan, ChartRow, ChartSpot, FunnelGap, FunnelPlan, FunnelRow, FunnelTotal } from "./kinds/chart/layout";
export type { LineupAhead, LineupAheadTag, LineupArrow, LineupAt, LineupBack, LineupBand, LineupBandNote, LineupCount, LineupGhost, LineupHeadline, LineupLane, LineupLayout, LineupLegendRow, LineupMark, LineupPick, LineupRemark, LineupRoleCard, LineupRun, LineupSeal, LineupSeat, LineupStamp as LineupStampPlaced, LineupStations, LineupStationsLine, LineupStop, LineupText, LineupTick, LineupValue, TextLine } from "./kinds/lineup/layout";
export type { DotBox, DotGroup, DotPlan, DotSize, DotText, DotTextRole, PlacedDot } from "./layout/dots";
export { type Family, FONTS } from "./look/fonts";
export { type ColorKey, type ColorName, type Colors, type Corner, DEFAULT_PALETTE, type Palette, PALETTES, READABLE_PX, resolvePalette, type TextStyle, type Theme } from "./look/values";
export { mountDiagram, type Player, type PlayerOptions } from "./player";
export { ICONS } from "./blocks/icon/icons";
export { describeOverlap, type InkPart, type Overlap, type OverlapSpot } from "./render/ink";
export type { FrameSide, LayoutBreak, LayoutBreakKind, LayoutPart } from "./render/breaks";
export { checkLayoutText, describeBreak } from "./render/layout-check";
export { iconSvg } from "./blocks/icon/draw";
export { type DiagramWords, type Rendered, type RenderOptions, renderDiagram } from "./render/draw";
export { LINE_STYLES, type LineStyle, penLoaded } from "./render/pen-store";
export type { CarrierTime, EdgeTime, EventTime, LabelTime, MarkTime, Span, StateTime, Timeline } from "./timeline";
export { chooseView } from "./view";
/** ブロックを使える図の種類。ブロックの付け方と図の種類が受け付ける付け方から導く (#3348) */
export { blockKinds } from "./blocks/usable";
