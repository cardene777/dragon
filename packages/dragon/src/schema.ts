/**
 * 図の原本の形と、原本を JSON Schema で検査する命令。
 *
 * 形の正は `schemas/diagram.schema.json` の 1 本で、下の型はその写し。ブロックの置き場へ移した欄の型はブロックが持ち、ここから出し直す (#3345)。
 * `schemas/diagram.schema.json` は、骨組み (`schemas/base.schema.json`) とブロックの形の欠片を build の時に束ねて書き出した物 (#3346)。
 * 版1の原本は検査の前に版2の形へ移して検査し、誤りの場所は版1の欄の場所へ戻して返す。検査の関数を 1 つにして、見本帳が読む量を増やさない。
 * 誤りは JSON Pointer で場所を示す。欄が足りない時と知らない欄がある時は、その欄の場所まで示す。
 * 誤りの文は呼ぶ側が渡した言葉 (渡さなければ英語) で出す。文の表は `field-messages.ts` が持つ (#2999)。
 *
 * 検査の関数は schema から前もって書き出した物 (`schemas/validate-diagram.js`) を使う。
 * ajv に schema をその場で組み立てさせると `new Function` を使い、`eval` を許さない頁の CSP で止まる。
 * 書き出しは `scripts/build-validator.mjs` が ajv の設定 `{ allErrors: true, discriminator: true, strictTypes: false, messages: false }` で行う。
 * ajv の英語の文は書き出さないので、誤りの `message` は持たない。
 */
import { readyParts } from "./kinds/registry";
import type { UserBlocks } from "./user-blocks";
import type { ErrorObject } from "ajv";
import type { GitBranch } from "./blocks/branch/block";
import type { ChartItem } from "./blocks/chart-item/block";
import type { ChartSet } from "./blocks/chart-set/block";
import type { ChartShape, VennShape } from "./blocks/chart-shape/block";
import type { Carry } from "./blocks/carry/block";
import { type Color, COLORS } from "./blocks/color/block";
import type { GitCommit } from "./blocks/commit/block";
import type { GitDelete } from "./blocks/delete/block";
import type { LabelSide } from "./blocks/edge-label/block";
import { ICON_NAMES } from "./blocks/icon/block";
import type { TablerMessages } from "./blocks/icon/sets";
import type { LineupItem, LineupShape } from "./blocks/item/block";
import type { MindIdea } from "./blocks/idea/block";
import type { MatrixAxis, MatrixSpec } from "./blocks/axis/block";
import type { MatrixItem } from "./blocks/matrix-item/block";
import type { TreeLeaf } from "./blocks/leaf/block";
import type { LineupOrder } from "./blocks/line/block";
import type { TreeNode } from "./blocks/node/block";
import type { LineupAct, LineupRole } from "./blocks/role/block";
import type { TimePoint } from "./blocks/point/block";
import type { TimeMarkEvent, TimeRow } from "./blocks/row/block";
import type { TimePeriod, TimeScale, TimeSpanEvent } from "./blocks/scale/block";
import type { TimeTask } from "./blocks/task/block";
import type { StatePath } from "./blocks/side-path/block";
import type { FlowChoice } from "./blocks/choice/block";
import type { StepSource } from "./blocks/source/block";
import type { PipeCalc } from "./blocks/calc/block";
import type { CheckOp, PipeCheck } from "./blocks/check/block";
import type { PipeEmit } from "./blocks/emit/block";
import type { PipeHold, PipeMove } from "./blocks/hold/block";
import type { PipeCall, PipeCallKind, PipeReturn } from "./blocks/return/block";
import type { PipeRevert } from "./blocks/revert/block";
import type { PipeWrite } from "./blocks/write/block";
import type { LineupStamp } from "./blocks/stamp/block";
import type { ErCell, ErField, ErFormula, ErLookup, ErTable } from "./blocks/table/block";
import type { VennCount, VennNone, VennSet } from "./blocks/circle/block";
import { type Allowed, FIELD_MESSAGES, type FieldMessages, type Forbidden } from "./field-messages";
import { FORMAT_VERSION, isVersion1, toVersion1Pointer, upgrade, version1SectionOf } from "./model";
import { nearest } from "./nearest";
import { DEFAULT_LANG, type NotationLang, STATE_ENDS } from "./words";

/** 色の役の型と一覧は色の役のブロック、アイコン名の一覧は絵のブロックが持つ (#3311、#3345) */
export { type Color, COLORS, ICON_NAMES };

export interface Region {
  id: string;
  name: string;
  note?: string;
  color?: Color;
  icon?: string;
}

export interface Box {
  id: string;
  name: string;
  sub?: string;
  color?: Color;
  icon?: string;
  region?: string;
  /** 飛び先。描いた図ではこの箱がここへの link になる。`/` で始まる path か、http:// か https:// で始まる URL (#3199) */
  link?: string;
  /** 列の図の箱の並べ方 (#3351)。`none` は順番の無い置き場で、書かない箱は上から実行する札 */
  order?: "none";
  /** 列の図の箱に並べられる札の数の上限 (#3624)。1 から 12 までの整数で、書かない箱は 1 列に並べられる札の数まで並べられる */
  limit?: number;
  /** 使う人が足した、箱を元にしたブロックの名前 (#3399)。形と色はその定義から読む */
  block?: string;
}

/** 見せ方。`fixed` は全体を止めて中だけ動かし、`follow` は寄って動かし全体図で今どこかを示す。 */
export type ViewMode = "fixed" | "follow";

export type DiagramEvent =
  | { type: "edge"; from: string; to: string; label?: string; carry: Carry; labelSide?: LabelSide; at?: number; into?: number; block?: string }
  | { type: "action"; box: string; label: string }
  | { type: "swap"; box: string; text: string; color?: Color }
  | { type: "strip"; field: string; value?: string; tag?: string }
  | GitCommit
  | { type: "branch"; branch: string; from: string }
  | GitDelete
  | { type: "now"; to: number }
  | TimeMarkEvent
  | TimeSpanEvent
  | TreeLeaf
  | TreeNode
  | LineupOrder
  | { type: "seal"; box: string }
  | { type: "open"; box: string }
  | { type: "pick"; box: string }
  | LineupStamp
  | LineupAct
  | TryLine
  | TryAsk
  | TryPress
  | TryEdit
  | PipeCall
  | PipeReturn
  | PipeRevert
  | PipeMove
  | PipeWrite
  | PipeCheck
  | PipeEmit
  | PipeCalc
  | ChartSet
  | MindIdea
  | ErLookup
  | ErCell
  | ErFormula
  | VennCount
  | VennNone;

/**
 * 時間軸の図 (#3165) の印の色を変える出来事と範囲の括弧の出来事と、目盛りと区切りと印の列と節目の型は、
 * 印の列と目盛りと針と節目のブロックが持つ (#3348)
 */
export type { TimeMarkEvent, TimePeriod, TimePoint, TimeRow, TimeScale, TimeSpanEvent };
/** 時間軸の図の作業の型は作業の棒のブロックが持つ (#3562) */
export type { TimeTask };

/** 時間軸の図の種類の欄。作業 (`tasks`、#3562) を持つ図は印の列 (`rows`) が空でもよい */
export interface TimeSpec {
  scale: TimeScale;
  period?: TimePeriod;
  rows: TimeRow[];
  tasks?: TimeTask[];
  points?: TimePoint[];
  /** 拡大の帯に列を作る目盛りの範囲 */
  zoom?: { from: number; to: number };
}

/** 中身の帯の物差しの欄。`line` の割合 (`2/3` か `97%`) の所に線を引く */
export interface StripMeter {
  field: string;
  line: string;
}

/** 枝分かれの図 (#3164) の commit を積む出来事の型は commit のブロックが持つ (#3347)。枝を消す出来事の型は枝を消すブロックが持つ (#3632) */
export type { GitCommit, GitDelete };

/** 表どうしの関係の図 (#3618) の表と項目と、段の中の出来事の型は表のブロックが持つ */
export type { ErCell, ErField, ErFormula, ErLookup, ErTable };

/** 集合の重なりの図 (#3620) の集まりと、段の中の数の出来事の型は集まりの円のブロックが持つ */
export type { VennCount, VennNone, VennSet };

/** 木の図 (#3233) の葉を出す出来事と親を組む出来事の型は、葉と組んだ親のブロックが持つ (#3348) */
export type { TreeLeaf, TreeNode };

/** 考えを広げる地図 (#3619) の考えを出す出来事の型は、考えのブロックが持つ */
export type { MindIdea };

/** 2つの軸で置く図 (#3622) の軸と課題の型は、軸のブロックと課題のブロックが持つ。区画へ置く出来事は列の図と同じ `line` の出来事 */
export type { MatrixAxis, MatrixItem, MatrixSpec };

/**
 * 列の図 (#3239) の、列の並びを書き換える出来事と札を押す出来事と役が動く出来事と、チップと役の型は、
 * 列の並びと札と役とチップのブロックが持つ (#3348)
 */
export type { LineupAct, LineupItem, LineupOrder, LineupRole, LineupStamp };

/** 列の図の見た目 (#3625) の型は、チップのブロックが持つ。列の図の決まりはチップのブロックが持つため */
export type { LineupShape };

/** 列の図 (#3625) の見た目。列の図だけが書き、書かない列の図は箱を札にして横に並べる */
export interface LineupLook {
  shape: LineupShape;
}

/** 量の図 (#3560) の項目と見た目と、項目の値を変える出来事の型は、項目と見た目と値のブロックが持つ */
export type { ChartItem, ChartSet, ChartShape, VennShape };

/** 量の図の種類の欄 (#3560)。見た目と、宣言した順の項目 */
export interface ChartSpec {
  shape: ChartShape;
  /** 点で数える見た目 (#3635) の 1 点の件数。書かなければ全体が最も大きい段で点が 100 個に近くなる数を選ぶ */
  unit?: number;
  items: ChartItem[];
}

/** 集合の重なりの図 (#3635) の見た目。`dots` は区画ごとの件数を点の数で数え、`unit` はその 1 点の件数 */
export interface VennLook {
  shape: VennShape;
  unit?: number;
}

/** 試す図 (#3337) の、待ち行列 `part` の中身を `items` の並びにするか、機械の列 `part` に `items` を入れた新しいブロックを足す出来事 */
export interface TryLine {
  type: "line";
  part: string;
  items: string[];
}

/** 試す図の、入力の帯の欄の値 `values` (欄の順) でチップを作って送る出来事。書き手の例として読み手の送る操作を書く */
export interface TryAsk {
  type: "ask";
  values: string[];
}

/** 試す図の、釦 `press` を押す出来事。釦の待ち行列の上からチップを取り出し、機械の列の新しいブロックへ移す */
export interface TryPress {
  type: "press";
  press: string;
}

/** 試す図の、チップ `item` の欄の値を `values` (鍵は欄) に書き換える出来事。読み手の書き換えと同じ */
export interface TryEdit {
  type: "item";
  item: string;
  values: Record<string, string>;
}

/**
 * 試す図の部品。書いた順に図の上から積む。網 (`route`) は `-` でつないだ節の並び (`paths`) を持ち、`from` から `to` へチップを運ぶ。
 * 待ち行列 (`queue`) は `order` の欄の値の高い順にチップを並べ、機械の列 (`chain`) は `edit` の欄を読み手に書き換えさせる。
 * 入力の帯 (`ask`) は図に 1 つまでで、`id` は常に `ask`。最初の欄の値がチップの名前になる。
 * `choices` は欄ごとの選択肢 (`choose` の行を書いた順、#3422) で、選択肢を持つ欄は読み手に値を選ばせる。
 * `into` に欄を書くと、送ったチップはその欄の値と同じ名札の待ち行列へ入る (#3441)。その欄は選択肢を持ち、選択肢ごとに同じ名札の待ち行列が要る。
 * 記録の列 (`log`、#3441) は釦が取り出したチップを番号の付いた記録にまとめ、機械の列と違って prev と hash を持たない。
 * `all` を書くと、記録の中のチップの `all.field` の欄が全て `all.value` なら `all.yes`、1 つでも違えば `all.no` の印を記録に出す。
 * 釦 (`press`) は `from` の待ち行列の上から `take` 件を `into` の機械の列の新しいブロックか記録の列の新しい記録へ移し、`at` の部品の所に置く。
 * 待ち行列の `accept` は入れてよいチップの名前 (#3453) で、書いた待ち行列へは書いていない名前のチップを送れない。
 * 釦の `from` は待ち行列が 1 つなら名札の字で、2 つ以上なら名札の配列 (#3453)。配列の釦は書いた順にそれぞれの上から `take` 件ずつを 1 つにまとめ、
 * どれかの待ち行列が `take` 件に満たない間は押せない
 */
export type TryPart =
  | { type: "route"; id: string; paths: string[][]; from: string; to: string }
  | { type: "queue"; id: string; order?: string; accept?: string[] }
  | { type: "chain"; id: string; edit?: string }
  | { type: "log"; id: string; all?: TryVerdict }
  | { type: "ask"; id: "ask"; fields: string[]; into: string; via?: string; choices?: Record<string, string[]> }
  | { type: "press"; id: string; from: string | string[]; into: string; take: number; at?: string };

/** 記録の列の印の決め方 (#3441)。記録の中のチップの `field` の欄が全て `value` なら `yes`、1 つでも違えば `no` */
export interface TryVerdict {
  field: string;
  value: string;
  yes: string;
  no: string;
}

/** 試す図のチップ。`values` の鍵は入力の帯の欄 (最初の欄を除く) で、名札がチップの名前 (最初の欄の値) になる */
export interface TryItem {
  id: string;
  values: Record<string, string>;
}

/**
 * 試す図の網の節の関門 (#3476)。最初の `step` より前の `check` の行で、入力の帯の網 (`via`) の最短の道の節 `node` に置く。
 * 送ったチップの欄 `field` の値が `op` で `value` と比べて成り立てば通り、成り立たなければその節で止まり、記録の列 `into` にエラーの名前 `no` を持つ記録が 1 件増える。
 * `value` は書いたままの字で、数なら欄の値も数として比べ (数でない欄の値は成り立たない)、数でなければ `==` と `!=` で字として比べる。
 * `retry` は書いた時だけ `true` を持ち、記録に「再試行できる」の印を、書かない関門は「直して送り直す」の印を出す
 */
export interface TryCheck {
  node: string;
  field: string;
  op: CheckOp;
  value: string;
  no: string;
  retry?: true;
  into: string;
}

/** 枝分かれの図の枝の型は枝のブロック、状態遷移図の移れる道の型は脇道のブロックが持つ (#3347) */
export type { GitBranch, StatePath };

/** 手順の図 (#3561) の判断の型は判断のブロックが持つ */
export type { FlowChoice };

/** 段の出典の型は出典のブロックが持つ (#3345) */
export type { StepSource };
/** 線の名前を置く側の型は線の名前のブロックが持つ (#3345) */
export type { LabelSide };
/** 線の上を走る物の型は運ぶ物のブロックが持つ (#3345) */
export type { Carry };
/** 配管の図 (#3389) の始めの値と、段の中の出来事 */
export type { CheckOp, PipeCalc, PipeCall, PipeCallKind, PipeCheck, PipeEmit, PipeHold, PipeMove, PipeReturn, PipeRevert, PipeWrite };

export interface Step {
  title: string;
  body: string;
  code?: string;
  /** 書いた順の出典。書かない段は欄を持たない */
  sources?: StepSource[];
  /** 段の要点。配管の図だけが持ち、書かない段は欄を持たない (#3464) */
  gist?: string;
  events: DiagramEvent[];
}

/** 図の種類。最初の行の頭の語で、原本の `kind` の欄 */
export type DiagramKind = "checkout" | "sequence" | "architecture" | "state" | "git" | "time" | "tree" | "lineup" | "try" | "pipe" | "chart" | "flow" | "cycle" | "mind" | "er" | "matrix" | "venn" | "sankey";

/** 中身の帯。題と欄の名前の並び。物差しの欄は時間軸の図だけが書ける */
export interface Strip {
  title: string;
  fields: string[];
  meters?: StripMeter[];
}

/**
 * 原本の図の宣言 (#3346)。ブロックの名前ごとの欄に、そのブロックの宣言を持つ。空の並びは書かない。
 * 区画 (`group`)、箱 (`box`)、中身の帯 (`strip`) と、図の種類だけの宣言 (状態遷移図と手順の図の移れる道 `path`、手順の図の判断 `choice`、枝分かれの図の枝 `branch`、
 * 時間軸の図の目盛り `scale` と区切り `period` と印の列 `row` と作業 `task` と節目 `point` と拡大の範囲 `zoom`、列の図と試す図のチップ `item`、試す図の部品 `part` と関門 `check`)
 */
export interface DiagramBlocks {
  [purchaseBlock: `purchase-${string}`]: import("./checkout/read").CheckoutBlock[] | undefined;
  group?: Region[];
  box?: Box[];
  /** 手順の図 (#3561) の判断。ひし形で描く */
  choice?: FlowChoice[];
  strip?: Strip;
  path?: StatePath[];
  branch?: GitBranch[];
  scale?: TimeScale;
  period?: TimePeriod;
  row?: TimeRow[];
  task?: TimeTask[];
  point?: TimePoint[];
  zoom?: { from: number; to: number };
  item?: LineupItem[] | TryItem[];
  role?: LineupRole[];
  part?: TryPart[];
  /** 試す図 (#3429) の、同じ行に左から並べる部品の名札の組 */
  side?: string[][];
  /** 試す図 (#3476) の網の節の関門。書いた順に確かめる */
  check?: TryCheck[];
  /** 配管の図 (#3389) の始めの値。残高と、残高でない値 */
  hold?: PipeHold[];
  /** 表どうしの関係の図 (#3618) の表。書いた順に左から右へ並べる */
  table?: ErTable[];
  /** 集合の重なりの図 (#3620) の集まり。宣言した順に円を置く */
  circle?: VennSet[];
}

/**
 * 図の原本 (版2、#3346)。図の宣言を `blocks` のブロックの名前ごとの欄に持ち、段 (`steps`) に段ごとに起きることを持つ。
 * 版1の原本は読む時に版2へ移す (`readDiagram`)
 */
export interface Diagram {
  version: number;
  kind: DiagramKind;
  checkout?: Omit<import("./checkout/read").CheckoutDefinition, "blocks">;
  title: string;
  view?: ViewMode;
  /** 図の頭に書いた、使う人が足すブロックの定義 (#3399) */
  define?: UserBlocks;
  /** 量の図 (#3560) の見た目と項目。量の図だけが書き、ブロックの宣言の欄 (`blocks`) を使わない */
  chart?: ChartSpec;
  /** 2つの軸で置く図 (#3622) の軸と課題。2つの軸で置く図だけが書き、区画は `blocks` の箱 (`box`) に持つ */
  matrix?: MatrixSpec;
  /** 列の図 (#3625) の見た目。列の図だけが書き、箱とチップと役は `blocks` に持つ */
  lineup?: LineupLook;
  /** 集合の重なりの図 (#3635) の見た目。集合の重なりの図だけが書き、集まりは `blocks` の `circle` に持つ */
  venn?: VennLook;
  blocks: DiagramBlocks;
  steps: Step[];
}

/**
 * 描く処理が読む図の形 (#3346)。版1の原本と同じ欄と並びを持ち、版の欄も版1の `1` を持つ。
 * 図の id はこの形の字から作るので、版2の原本を足す前と同じ図からは同じ id の SVG を描く。
 * 原本からは `model.ts` の `toModel` が組み直す
 */
export interface DiagramModel {
  version: 1;
  kind: DiagramKind;
  checkout?: import("./checkout/read").CheckoutDefinition;
  title: string;
  view?: ViewMode;
  /** 図の頭に書いた、使う人が足すブロックの定義 (#3399) */
  define?: UserBlocks;
  regions?: Region[];
  boxes: Box[];
  strip?: Strip;
  steps: Step[];
  sequence?: { lifelines: string[] };
  state?: { paths: StatePath[] };
  git?: { branches: GitBranch[] };
  time?: TimeSpec;
  /** 列の図のチップと役と、見た目 (#3625)。見た目は版2の原本の根の `lineup` の欄から移す */
  lineup?: { items: LineupItem[]; roles?: LineupRole[]; shape?: LineupShape };
  /** 試す図 (#3337) の部品とチップと関門 (#3476)。版1の原本に無かった種類なので、版2の原本の `part` と `item` と `check` をそのまま持つ */
  try?: { parts: TryPart[]; items: TryItem[]; sides?: string[][]; checks?: TryCheck[] };
  /**
   * 配管の図 (#3389) の始めの値と、`[fold]` の呼び出しを畳んだ箱。版1の原本に無かった種類なので、版2の原本の `hold` をそのまま持つ。
   * `folds` は描く処理が畳んだ図 (`kinds/pipe/layout.ts` の `foldPipe`) だけが持ち、原本は持たない
   */
  pipe?: { holds: PipeHold[]; folds?: PipeFold[] };
  /** 量の図 (#3560) の見た目と項目。版1の原本に無かった種類なので、版2の原本の `chart` をそのまま持つ */
  chart?: ChartSpec;
  /** 手順の図 (#3561) の判断と、最初の段より前に書いた移れる道。版1の原本に無かった種類なので、版2の原本の `choice` と `path` をそのまま持つ */
  flow?: { choices: FlowChoice[]; paths: StatePath[] };
  /** 表どうしの関係の図 (#3618) の表。版1の原本に無かった種類なので、版2の原本の `table` をそのまま持つ */
  er?: { tables: ErTable[] };
  /** 2つの軸で置く図 (#3622) の軸と課題。版1の原本に無かった種類なので、版2の原本の根の `matrix` をそのまま持つ */
  matrix?: MatrixSpec;
  /** 集合の重なりの図 (#3620) の集まりと見た目 (#3635)。版1の原本に無かった種類なので、版2の原本の `circle` と根の `venn` の欄をそのまま持つ */
  venn?: { sets: VennSet[]; shape?: VennShape; unit?: number };
}

/**
 * 配管の図の、`[fold]` の呼び出しを畳んだ箱 (#3389)。`call` は畳んだ呼び出しの出てきた順の番号、`step` は箱を描く段 (畳んだ後の段の番号)、
 * `from` と `to` は箱にまとめた原本の段の範囲 (`to` を含む)、`hidden` は内側の段にしか出ない関係者。畳んだ間は `hidden` の列と槽と札を描かない
 */
export interface PipeFold {
  call: number;
  step: number;
  from: number;
  to: number;
  hidden: string[];
}

export interface FieldError {
  /** 誤った欄の場所 (JSON Pointer) */
  pointer: string;
  message: string;
}

export type Checked = { ok: true } | { ok: false; errors: FieldError[] };

export interface CheckOptions {
  /** 誤りの文の言葉。渡さなければ英語 (#3338) */
  lang?: NotationLang;
}

/** 段の中で起きることの種類。schema の event の `discriminator` が見る `type` の値 */
const EVENT_TYPES = ["edge", "action", "swap", "strip", "commit", "branch", "delete", "now", "mark", "span", "leaf", "node", "line", "seal", "open", "pick", "stamp", "ask", "press", "item", "call", "return", "revert", "move", "write", "check", "emit", "calc", "set", "lookup", "cell", "formula", "count", "none"] as const satisfies readonly DiagramEvent["type"][];
/** 試す図の部品の種類。schema の part の `discriminator` が見る `type` の値 (#3337) */
const PART_TYPES = ["route", "queue", "chain", "log", "ask", "press"] as const satisfies readonly TryPart["type"][];

/**
 * その種類の図に書けない根の欄を書いた時の決まりの場所 (#3164)。根の欄に `not: {}` を置く決まり (`absent`) を指し、
 * 誤りの場所の最後の欄が書いた欄になる。種類の欄は、その欄と同じ名前の図の種類だけが書ける
 */
const ABSENT = "#/definitions/absent/not";
/**
 * 種類の欄でない欄を書ける図の種類。区画は枝分かれの図と時間軸の図に書けない。
 * 線の列 (`at` と `into`)、節目の丸の色 (`color`)、物差し (`meters`) は時間軸の図だけが書ける (#3165)
 */
const ABSENT_KINDS: Record<string, string> = {
  regions: "sequence / architecture / state",
  group: "sequence / architecture / state",
  path: "state / flow",
  choice: "flow",
  branch: "git",
  scale: "time",
  period: "time",
  row: "time",
  task: "time",
  point: "time",
  zoom: "time",
  item: "lineup / try",
  role: "lineup",
  part: "try",
  check: "try",
  values: "try",
  hold: "pipe",
  box: "sequence / architecture / state / git / time / tree / lineup / pipe / flow / cycle / matrix / sankey",
  order: "lineup",
  limit: "lineup",
  at: "time",
  into: "time",
  color: "time",
  meters: "time",
  region: "sequence / architecture / state",
  icon: "sequence / architecture / state / git / time / tree / pipe / flow / cycle",
  link: "sequence / architecture / state / git / time / tree / flow / cycle",
  gist: "pipe",
  chart: "chart",
  matrix: "matrix",
  table: "er",
  circle: "venn",
};
/** 運ぶ物の書けない組み合わせ (`not: { required: [欄] }`)。誤りの場所の最後の欄で引く */
const NOT_ALLOWED: Record<string, Allowed> = {
  carry: { field: "text", kind: "tag" },
};

/** 状態遷移図と手順の図 (#3561) の箱と判断の名札に予約の名前を書いた時の決まりの場所 */
const RESERVED_ID = /\/(?:box|choice)\/items\/properties\/id\/not$/u;
/** 枝分かれの図でない図に、枝分かれの図だけの出来事を書いた時の決まりの場所 (#3164) */
const GIT_EVENT = /\/events\/items\/properties\/type\/not$/u;
/** 枝分かれの図だけが書ける出来事 */
const GIT_EVENTS = ["commit", "branch", "delete"] as const satisfies readonly DiagramEvent["type"][];
/** 時間軸の図でない図に、時間軸の図だけの出来事を書いた時の決まりの場所 (#3165)。出来事に `not` を置く */
const TIME_EVENT = /\/events\/items\/not$/u;
/** 時間軸の図だけが書ける出来事 */
const TIME_EVENTS = ["now", "mark", "span"] as const satisfies readonly DiagramEvent["type"][];
/** 木の図でない図に、木の図だけの出来事を書いた時の決まりの場所 (#3233)。出来事の `allOf` の中に `not` を置く */
const TREE_EVENT = /\/events\/items\/allOf\/0\/not$/u;
/** 木の図だけが書ける出来事 */
const TREE_EVENTS = ["leaf", "node"] as const satisfies readonly DiagramEvent["type"][];
/** 列の図でない図に、列の図だけの出来事を書いた時の決まりの場所 (#3239) */
const LINEUP_EVENT = "#/definitions/notLineupEvent/not";
/** 列の図だけが書ける出来事 */
const LINEUP_EVENTS = ["line", "seal", "open", "pick", "stamp", "role"] as const satisfies readonly DiagramEvent["type"][];
/** 試す図でない図に、試す図だけの出来事を書いた時の決まりの場所 (#3337) */
const TRY_EVENT = "#/definitions/notTryEvent/not";
/** 試す図だけが書ける出来事 */
const TRY_EVENTS = ["ask", "press", "item"] as const satisfies readonly DiagramEvent["type"][];
/** 配管の図でない図に、配管の図だけの出来事を書いた時の決まりの場所 (#3389) */
const PIPE_EVENT = "#/definitions/notPipeEvent/not";
/** 配管の図だけが書ける出来事 */
export const PIPE_EVENTS = ["call", "return", "revert", "move", "write", "check", "emit", "calc"] as const satisfies readonly DiagramEvent["type"][];
/** 量の図でない図に、量の図だけの出来事を書いた時の決まりの場所 (#3560) */
const CHART_EVENT = "#/definitions/notChartEvent/not";
/** 量の図だけが書ける出来事 */
const CHART_EVENTS = ["set"] as const satisfies readonly DiagramEvent["type"][];
/** 考えを広げる地図でない図に、考えを広げる地図だけの出来事を書いた時の決まりの場所 (#3619) */
const MIND_EVENT = "#/definitions/notMindEvent/not";
/** 考えを広げる地図だけが書ける出来事 */
const MIND_EVENTS = ["idea"] as const satisfies readonly DiagramEvent["type"][];
/** 表どうしの関係の図でない図に、表どうしの関係の図だけの出来事を書いた時の決まりの場所 (#3618) */
const ER_EVENT = "#/definitions/notErEvent/not";
/** 表どうしの関係の図だけが書ける出来事 */
const ER_EVENTS = ["lookup", "cell", "formula"] as const satisfies readonly DiagramEvent["type"][];
/** 集合の重なりの図でない図に、集合の重なりの図だけの出来事を書いた時の決まりの場所 (#3620) */
const VENN_EVENT = "#/definitions/notVennEvent/not";
/** 集合の重なりの図だけが書ける出来事 */
const VENN_EVENTS = ["count", "none"] as const satisfies readonly DiagramEvent["type"][];
/** 試す図の部品の種類の決まりの場所 (#3337) */
const PART_TAG = "#/definitions/part/discriminator";
/** 列の図に、線と処理の出来事を書いた時の決まりの場所 (#3239) */
const WIRED_EVENT = "#/definitions/notWiredEvent/not";
/** 列の図が書けない、箱と線の図の出来事 */
const WIRED_EVENTS = ["edge", "action"] as const satisfies readonly DiagramEvent["type"][];
/** 時間軸の図の目盛りの長さの決まり (`^[0-9]+(\.[0-9]+)?(<単位>|<単位>)$`)。書ける単位を読む */
const DURATION = /^\^\[0-9\]\+\(\\\.\[0-9\]\+\)\?\(([a-z|]+)\)\$$/u;
/** 割合の決まり。百分率の `%` を持つ */
const RATIO = /%\)\$$/u;

const escape = (key: string): string => key.replaceAll("~", "~0").replaceAll("/", "~1");

/** JSON Pointer `pointer` が指す `input` の中の値。辿れない時は `undefined` */
function valueAt(input: unknown, pointer: string): unknown {
  let value = input;
  for (const raw of pointer.split("/").slice(1)) {
    if (typeof value !== "object" || value === null) return undefined;
    value = (value as Record<string, unknown>)[raw.replaceAll("~1", "/").replaceAll("~0", "~")];
  }
  return value;
}

/** 箱の飛び先と段の出典の URL の決まりの場所 (#3199) */
const URL_RULE = "#/definitions/url/pattern";

/** 箱と区画のアイコン名の決まりの場所 (#3311)。近い名前が在れば一覧の代わりにそれを示す (#3315) */
const ICON_RULE = "#/definitions/icon/enum";

/** commit の hash の決まり (`^[0-9a-f]{<最小>,<最大>}$`)。字の数の幅を読む */
const HEX = /^\^\[0-9a-f\]\{(\d+),(\d+)\}\$$/u;

/** `^[^…]+$` の形の決まりから書けない字を読む。違う形の決まりでは `undefined` */
function forbiddenOf(pattern: string): Forbidden | undefined {
  const inside = /^\^\[\^(.+)\]\+\$$/u.exec(pattern)?.[1];
  if (inside === undefined) return undefined;
  const chars: string[] = inside.match(/\\.|[^\\]/gu) ?? [];
  return { space: chars.includes("\\s"), chars: chars.filter((char) => char !== "\\s").map((char) => char.replace(/^\\/u, "")) };
}

/** `anyOf` の中の決まりが出した誤り。`anyOf` の誤り 1 つにまとめて出す */
const branchesOf = (anyOf: ErrorObject, errors: readonly ErrorObject[]): ErrorObject[] =>
  errors.filter(
    (error) =>
      error !== anyOf &&
      error.schemaPath.startsWith(`${anyOf.schemaPath}/`) &&
      (error.instancePath === anyOf.instancePath || error.instancePath.startsWith(`${anyOf.instancePath}/`)),
  );

function toFieldError(error: ErrorObject, errors: readonly ErrorObject[], m: FieldMessages, input: unknown): FieldError {
  const params = error.params as Record<string, unknown>;
  const at = error.instancePath;
  switch (error.keyword) {
    case "additionalProperties": {
      const key = String(params.additionalProperty);
      return { pointer: `${at}/${escape(key)}`, message: m.additionalProperties(key) };
    }
    case "required": {
      const key = String(params.missingProperty);
      return { pointer: `${at}/${escape(key)}`, message: m.required(key) };
    }
    case "not": {
      if (RESERVED_ID.test(error.schemaPath)) return { pointer: at, message: (input as { kind?: unknown }).kind === "flow" ? m.flowReserved(STATE_ENDS) : m.reserved(STATE_ENDS) };
      if (GIT_EVENT.test(error.schemaPath)) return { pointer: at, message: m.kindOnly(GIT_EVENTS, "git") };
      if (TIME_EVENT.test(error.schemaPath)) return { pointer: `${at}/type`, message: m.kindOnly(TIME_EVENTS, "time") };
      if (TREE_EVENT.test(error.schemaPath)) return { pointer: `${at}/type`, message: m.kindOnly(TREE_EVENTS, "tree") };
      if (error.schemaPath === LINEUP_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(LINEUP_EVENTS, "lineup") };
      if (error.schemaPath === TRY_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(TRY_EVENTS, "try") };
      if (error.schemaPath === PIPE_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(PIPE_EVENTS, "pipe") };
      if (error.schemaPath === CHART_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(CHART_EVENTS, "chart") };
      if (error.schemaPath === MIND_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(MIND_EVENTS, "mind") };
      if (error.schemaPath === ER_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(ER_EVENTS, "er") };
      if (error.schemaPath === VENN_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(VENN_EVENTS, "venn") };
      if (error.schemaPath === WIRED_EVENT) return { pointer: `${at}/type`, message: m.kindOnly(WIRED_EVENTS, "sequence / architecture / state / git / time / tree") };
      const last = at.slice(at.lastIndexOf("/") + 1);
      if (error.schemaPath === ABSENT) return { pointer: at, message: m.not({ field: last, kind: ABSENT_KINDS[last] ?? last }) };
      const allowed = NOT_ALLOWED[last];
      return { pointer: allowed ? `${at}/${allowed.field}` : at, message: m.not(allowed) };
    }
    case "anyOf": {
      const branches = branchesOf(error, errors);
      const missing = branches.every((branch) => branch.keyword === "required") ? branches.map((branch) => String(branch.params.missingProperty)) : [];
      return { pointer: at, message: m.anyOf(missing) };
    }
    case "discriminator": {
      const tag = String(params.tag);
      return { pointer: `${at}/${escape(tag)}`, message: m.discriminator(tag, error.schemaPath === PART_TAG ? PART_TYPES : EVENT_TYPES) };
    }
    case "enum": {
      const written = error.schemaPath === ICON_RULE ? valueAt(input, at) : undefined;
      const near = typeof written === "string" ? nearest(written, ICON_NAMES) : undefined;
      if (typeof written === "string" && near !== undefined) return { pointer: at, message: m.unknownIcon(written, near) };
      return { pointer: at, message: m.enum((params.allowedValues as unknown[]).map(String)) };
    }
    case "type":
      return { pointer: at, message: m.type(String(params.type)) };
    case "minLength":
      return { pointer: at, message: m.minLength(Number(params.limit)) };
    case "maxLength":
      return { pointer: at, message: m.maxLength(Number(params.limit)) };
    case "pattern": {
      if (error.schemaPath === URL_RULE) return { pointer: at, message: m.url };
      const pattern = String(params.pattern);
      const hex = HEX.exec(pattern);
      if (hex) return { pointer: at, message: m.hex(Number(hex[1]), Number(hex[2])) };
      const duration = DURATION.exec(pattern);
      if (duration) return { pointer: at, message: m.duration((duration[1] ?? "").split("|")) };
      if (RATIO.test(pattern)) return { pointer: at, message: m.ratio };
      return { pointer: at, message: m.pattern(forbiddenOf(pattern)) };
    }
    case "minItems":
      return { pointer: at, message: m.minItems(Number(params.limit)) };
    case "maxItems":
      return { pointer: at, message: m.maxItems(Number(params.limit)) };
    case "minimum":
      return { pointer: at, message: m.minimum(Number(params.limit)) };
    case "maximum":
      return { pointer: at, message: m.maximum(Number(params.limit)) };
    case "const":
      return { pointer: at, message: m.const(String(params.allowedValue)) };
    case "oneOf":
      return { pointer: at, message: m.oneOf };
    default:
      return { pointer: at, message: error.keyword };
  }
}

const unescape = (key: string): string => key.replaceAll("~1", "/").replaceAll("~0", "~");

/**
 * 版2へ移した版1の原本の誤りを、版1の欄の場所の誤りにする。図の種類が書けない欄は、版1の図の種類の欄 (`/git` など) の場所にする。
 * 欄が足りない時と知らない欄がある時は、欄の名前も版1の名前にする
 */
function toVersion1Error(error: ErrorObject): ErrorObject {
  const section = error.schemaPath === ABSENT ? version1SectionOf(error.instancePath) : undefined;
  if (section !== undefined) return { ...error, instancePath: section };
  const param = error.keyword === "required" ? "missingProperty" : error.keyword === "additionalProperties" ? "additionalProperty" : undefined;
  if (param === undefined) return { ...error, instancePath: toVersion1Pointer(error.instancePath) };
  const full = toVersion1Pointer(`${error.instancePath}/${escape(String(error.params[param as keyof typeof error.params]))}`);
  const cut = full.lastIndexOf("/");
  return { ...error, instancePath: full.slice(0, cut), params: { ...error.params, [param]: unescape(full.slice(cut + 1)) } };
}

/**
 * build の時に原本の形の決まりから書き出した検査の関数の形 (`schemas/validate-diagram.js`)。
 * 誤りの中身は ajv の形 (`ErrorObject`) で、読む時に形を決める。登録する口の型に ajv の型を出さないため、ここでは object として持つ
 */
interface Validate {
  (input: unknown): boolean;
  errors?: readonly object[] | null;
}

/** 原本の検査の塊 (`schemas/validator.ts`)。形の検査の関数と、Tabler の絵柄が表に在るかの検査 (#3493) と、漏斗の見た目の値の検査 (#3621) */
interface Validator {
  shape: Validate;
  tablerErrors: (input: unknown, m: TablerMessages) => FieldError[];
  funnelErrors: (input: unknown, lang: NotationLang) => FieldError[];
}

/**
 * 原本の検査 (#3400)。gzip で約 30KB あり、記法から読んだ図を描くだけの頁は要らないので、最初に読む束に入れない。
 * 全部を持つ入口は初めから登録し (`kinds/all.ts`、`node.ts`)、軽い入口は原本の JSON を読む前に後から読んで登録する (`loadFor`)
 */
let validator: Validator | undefined;

/** 原本の検査を登録する */
export function registerValidator(given: Validator): void {
  validator = given;
}

/** 原本の検査を読んだか */
export const validatorLoaded = (): boolean => validator !== undefined;

/**
 * 原本の JSON を検査する。版が道具より新しいかは見ない (`readDiagram` が見る)。
 * 軽い入口で原本の形の検査を読む前に呼ぶと、読んでいないことを名指す誤りを投げる。
 * 版1の原本は版2の形へ移して検査し、誤りは版1の欄の場所で返す。同じ場所の同じ文の誤りは 1 つにまとめる
 */
export function validateDiagram(input: unknown, options: CheckOptions = {}): Checked {
  if (validator === undefined) throw new Error(FIELD_MESSAGES[options.lang ?? DEFAULT_LANG].validatorNotLoaded);
  const { shape: validate, tablerErrors, funnelErrors } = validator;
  const version1 = isVersion1(input);
  const lang = options.lang ?? DEFAULT_LANG;
  const m = FIELD_MESSAGES[lang];
  // 絵柄集の絵柄は、形が名前の書き方だけを決めるので、絵柄集に在るかをここで確かめる (#3493)。
  // 原本を書いた形 (版1か版2) のまま辿るので、誤りの場所は書いた原本の欄になる。
  // 量の図の漏斗の見た目の値が段を進むほど減るかも、形に書けないのでここで確かめる (#3621)
  const sets = [...tablerErrors(input, m), ...funnelErrors(input, lang)];
  if (typeof input === "object" && input !== null && (input as Diagram).kind) {
    const native = readyParts((input as Diagram).kind)?.validate;
    if (native) sets.push(...native(input as Diagram).map(message => ({pointer:"/blocks",message})));
  }
  if (validate(version1 ? upgrade(input, FORMAT_VERSION) : input)) return sets.length === 0 ? { ok: true } : { ok: false, errors: sets };
  const all = ((validate.errors ?? []) as ErrorObject[]).map((error) => (version1 ? toVersion1Error(error) : error));
  const inBranch = new Set(all.filter((error) => error.keyword === "anyOf").flatMap((anyOf) => branchesOf(anyOf, all)));
  // 条件付きの決まり (if / then) は中で落ちた決まりの誤りを別に出すので、包む側の if の誤りは出さない
  const found = all.filter((error) => error.keyword !== "if" && !inBranch.has(error)).map((error) => toFieldError(error, all, m, input));
  const errors = [...found, ...sets];
  return { ok: false, errors: errors.filter((error, i) => errors.findIndex((other) => other.pointer === error.pointer && other.message === error.message) === i) };
}

