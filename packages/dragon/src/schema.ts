/**
 * 図の原本の形と、原本を JSON Schema で検査する命令。
 *
 * 形の正は `schemas/diagram.schema.json` の 1 本で、下の型はその写し。ブロックの置き場へ移した欄の型はブロックが持ち、ここから出し直す (#3345)。
 * `schemas/diagram.schema.json` は、骨組み (`schemas/base.schema.json`) とブロックの形の欠片を build の時に束ねて書き出した物 (#3346)。
 * 版1の原本は検査の前に版2の形へ移して検査し、誤りの場所は版1の欄の場所へ戻して返す。検査の関数を 1 つにして、見本帳が読む量を増やさない。
 * 誤りは JSON Pointer で場所を示す。欄が足りない時と知らない欄がある時は、その欄の場所まで示す。
 * 誤りの文は呼ぶ側が渡した言葉 (渡さなければ英語) で出す。文の表は `field-messages.ts` が持ち、原本の検査の塊が一緒に運ぶ (#2999、#3846)。
 *
 * 検査の関数は schema から前もって書き出した物 (`schemas/validate-diagram.js`) を使う。
 * ajv に schema をその場で組み立てさせると `new Function` を使い、`eval` を許さない頁の CSP で止まる。
 * 書き出しは `scripts/build-validator.mjs` が ajv の設定 `{ allErrors: true, discriminator: true, strictTypes: false, messages: false }` で行う。
 * ajv の英語の文は書き出さないので、誤りの `message` は持たない。
 */
import type { UserBlocks } from "./user-blocks";
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
import type { LineupItem } from "./blocks/item/block";
import type { LineupShape } from "./blocks/item/limits";
import type { MindIdea } from "./blocks/idea/block";
import type { MatrixAxis, MatrixShape, MatrixSpec } from "./blocks/axis/block";
import type { MatrixItem, MatrixPlot } from "./blocks/matrix-item/block";
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
import type { PipeHold, PipeHoldLink, PipeMove } from "./blocks/hold/block";
import type { PipeCall, PipeCallKind, PipeReturn } from "./blocks/return/block";
import type { PipeRevert } from "./blocks/revert/block";
import type { PipeWrite } from "./blocks/write/block";
import type { LineupStamp } from "./blocks/stamp/block";
import type { ErCell, ErField, ErFormula, ErLookup, ErTable } from "./blocks/table/block";
import type { VennCount, VennNone, VennSet } from "./blocks/circle/block";
import type { Gauge, GaugeSet } from "./blocks/gauge/block";
import type { CardDelete, CardItem, CardMake, CardMove, CardRefuse } from "./blocks/card/block";
import { READ_MESSAGES } from "./read-messages";
import { DEFAULT_LANG, type NotationLang } from "./words";

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
  /** 札で見せる図 (根の `note` が `pop`) の札の下に、灰色の帯で出す例 (#3877)。`sub` を持つ箱だけが持てる */
  example?: string;
  color?: Color;
  icon?: string;
  region?: string;
  /** 飛び先。描いた図ではこの箱がここへの link になる。`/` で始まる path か、http:// か https:// で始まる URL か、`#` で始まる頁の中の場所 (#3199、#3755) */
  link?: string;
  /** 列の図の箱の並べ方 (#3351)。`none` は順番の無い置き場で、書かない箱は上から実行する札 */
  order?: "none";
  /** 列の図の箱に並べられる札の数の上限 (#3624)。1 から 12 までの整数で、書かない箱は 1 列に並べられる札の数まで並べられる */
  limit?: number;
  /**
   * 回り続ける図の時計の文字盤の見た目と輪を開いた帯の見た目の手順の長さ (#3638、#3639) と、列の図の階段の見た目の層の時間 (#3640)。
   * 数と単位 (`ms`、`s`、`min`、`h`、`d`) の組で、回り続ける図には 0 を書かない
   */
  time?: string;
  /** 使う人が足した、箱を元にしたブロックの名前 (#3399)。形と色はその定義から読む */
  block?: string;
  /** 持ち主ごとのカードの図の列で出す印の語 (#3846)。カードの `mark` でこの列を選ぶと、この列に載るそのカードの写しにこの語の札を出す */
  mark?: string;
}

/** 見せ方。`fixed` は全体を止めて中だけ動かし、`follow` は寄って動かし全体図で今どこかを示す。 */
export type ViewMode = "fixed" | "follow";

export type DiagramEvent =
  | { type: "edge"; from: string; to: string; label?: string; carry: Carry; op?: number; labelSide?: LabelSide; at?: number; into?: number; block?: string }
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
  | MatrixPlot
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
  | VennNone
  | GaugeSet
  | CardMake
  | CardMove
  | CardDelete
  | CardRefuse;

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
/** 量の目盛り (#3880) の宣言と、段の中の値の出来事の型は目盛りのブロックが持つ */
export type { Gauge, GaugeSet };

/** 持ち主ごとのカードの図 (#3846) のカードと、段の中のカードの出来事の型は持ち主ごとのカードのブロックが持つ */
export type { CardDelete, CardItem, CardMake, CardMove, CardRefuse };

/** 木の図 (#3233) の葉を出す出来事と親を組む出来事の型は、葉と組んだ親のブロックが持つ (#3348) */
export type { TreeLeaf, TreeNode };

/** 考えを広げる地図 (#3619) の考えを出す出来事の型は、考えのブロックが持つ */
export type { MindIdea };

/** 2つの軸で置く図 (#3622) の軸と課題の型は、軸のブロックと課題のブロックが持つ。区画へ置く出来事は列の図と同じ `line` の出来事 */
export type { MatrixAxis, MatrixItem, MatrixPlot, MatrixShape, MatrixSpec };

/**
 * 列の図 (#3239) の、列の並びを書き換える出来事と札を押す出来事と役が動く出来事と、チップと役の型は、
 * 列の並びと札と役とチップのブロックが持つ (#3348)
 */
export type { LineupAct, LineupItem, LineupOrder, LineupRole, LineupStamp };

/** 列の図の見た目 (#3625、#3624、#3640) の型は、チップのブロックが持つ。列の図の決まりはチップのブロックが持つため */
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

/**
 * 回り続ける図 (#3638) の見た目。`clock` は手順を長さの弧で置く時計の文字盤で、`turn` が `left` なら左回りに置く。
 * `band` は手順を左から右へ山形で並べ、回ごとに帯を積む輪を開いた帯 (#3639) で、`turn` を持たない
 */
export interface CycleLook {
  shape: "clock" | "band";
  turn?: "left";
}

/**
 * 量の行き先の図の見た目。`rows` (#3641) は段ごとに図の幅いっぱいの帯を1行ずつ上から積み、各行をその段までの線で分かれた区画に分ける。
 * `treemap` (#3642) は全量を1つの四角にし、段ごとに切る線を引いて量の面積に割る
 */
export interface SankeyLook {
  shape: "rows" | "treemap";
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
export type { CheckOp, PipeCalc, PipeCall, PipeCallKind, PipeCheck, PipeEmit, PipeHold, PipeHoldLink, PipeMove, PipeReturn, PipeRevert, PipeWrite };

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

/**
 * 1 つの図の場面 (#3878)。箱と全ての場面に共通の段は図で 1 回だけ持ち、場面は分かれる所から先のその場面だけの段を持つ。
 * `stop` を持つ場面は、最後の段で止まってその理由の文を出す
 */
export interface DiagramScene {
  name: string;
  steps: Step[];
  stop?: string;
}

/** 場面の見せ方 (#3878)。`stack` は場面を縦に並べて同じ段の送りで同時に動かし、`pick` は場面の名前の釦で選んだ 1 つの場面を追う */
export type SceneShow = "stack" | "pick";

/** 図の場面と見せ方 (#3878)。場面を書いた図だけが持つ */
export interface DiagramScenes {
  show: SceneShow;
  list: DiagramScene[];
}

/** 図の種類。最初の行の頭の語で、原本の `kind` の欄 */
export type DiagramKind = "checkout" | "sequence" | "architecture" | "state" | "git" | "time" | "tree" | "lineup" | "try" | "pipe" | "chart" | "flow" | "cycle" | "mind" | "er" | "matrix" | "venn" | "sankey" | "judge" | "cards";

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
  /** 量の目盛り (#3880)。`on` の箱の下と図の上の帯に、宣言した順に縦に積む */
  gauge?: Gauge[];
  /** 持ち主ごとのカードの図 (#3846) の、最初の段より前から在るカード。書いた順に列の上から積む */
  card?: CardItem[];
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
  /**
   * 箱の説明の見せ方 (#3877)。`pop` は箱の `sub` を名前の下に描かず、押すと箱のすぐ下に出る札で見せる。
   * 箱の札を描く図の種類 (`blockKinds("pop")`) だけが持て、書かない図は名前の下の字で見せる
   */
  note?: "pop";
  /** パイプ図の置き方 (Tracelyth #165、#166、#168)。パイプ図だけが持つ */
  layout?: PipeLayoutName;
  /** パイプ図の置き方が通り道を空ける、人から箱への呼び出しの組 (`route` の行、#3721)。パイプ図だけが持つ */
  routes?: { from: string; to: string }[];
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
  /** 回り続ける図の見た目 (#3638)。回り続ける図だけが書き、手順の長さは `blocks` の箱 (`box`) の `time` に持つ */
  cycle?: CycleLook;
  /** 量の行き先の図の見た目 (#3641)。量の行き先の図だけが書き、出どころと行き先は `blocks` の箱 (`box`) に持つ */
  sankey?: SankeyLook;
  /** 時系列図の見た目 (#3720)。時系列図だけが書き、書かない図は今の見た目で描く */
  sequence?: { shape: SequenceShape };
  /** 判定の表 (#3879) の規則と例と判定の語。判定の表だけが書き、ブロックの宣言の欄 (`blocks`) を使わない */
  judge?: import("./judge/types").JudgeSpec;
  blocks: DiagramBlocks;
  /** 段。場面を書いた図 (#3878) では、全ての場面に共通の段 */
  steps: Step[];
  /** 場面と見せ方 (#3878)。場面を書いた図だけが持つ */
  scenes?: DiagramScenes;
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
  /** 箱の説明の見せ方 (#3877)。版2の原本の根の `note` の欄をそのまま持つ */
  note?: "pop";
  /** パイプ図の置き方 (Tracelyth #165、#166、#168)。パイプ図だけが持つ */
  layout?: PipeLayoutName;
  /** パイプ図の置き方が通り道を空ける、人から箱への呼び出しの組 (`route` の行、#3721)。パイプ図だけが持つ */
  routes?: { from: string; to: string }[];
  /** 図の頭に書いた、使う人が足すブロックの定義 (#3399) */
  define?: UserBlocks;
  regions?: Region[];
  boxes: Box[];
  strip?: Strip;
  /** 量の目盛り (#3880)。版1の原本に無かった欄なので、版2の原本の `gauge` をそのまま持つ */
  gauge?: Gauge[];
  steps: Step[];
  /** 場面と見せ方 (#3878)。版2の原本の根の `scenes` の欄をそのまま持つ。描く処理は場面ごとに共通の段と場面の段をつないだ図を組んで描く */
  scenes?: DiagramScenes;
  /** 時系列図の生存線の並びと、見た目 (#3720)。見た目は版2の原本の根の `sequence` の欄から移す */
  sequence?: { lifelines: string[]; shape?: SequenceShape };
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
  /** 回り続ける図の見た目 (#3638)。版1の原本に無かった欄なので、版2の原本の根の `cycle` の欄をそのまま持つ */
  cycle?: CycleLook;
  /** 量の行き先の図の見た目 (#3641)。版1の原本に無かった欄なので、版2の原本の根の `sankey` の欄をそのまま持つ */
  sankey?: SankeyLook;
  /** 判定の表 (#3879) の規則と例と判定の語。版1の原本に無かった種類なので、版2の原本の根の `judge` の欄をそのまま持つ */
  judge?: import("./judge/types").JudgeSpec;
  /** 持ち主ごとのカードの図 (#3846) の、最初の段より前から在るカード。版1の原本に無かった種類なので、版2の原本の `card` をそのまま持つ */
  cards?: { items: CardItem[] };
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

/**
 * パイプ図の置き方の名前 (Tracelyth #165、#166、#168)。`auto` は形を機械に任せる名前で、`top` と `bottom` と箱の並びから点数の低い組を選ぶ。
 * `ledger` (帳簿型) と `mesh` (網型) と `bus` (母線型) は、槽をトークンごとの行に並べる形
 */
export const PIPE_LAYOUTS = ["top", "bottom", "ledger", "mesh", "bus", "auto"] as const;
export type PipeLayoutName = (typeof PIPE_LAYOUTS)[number];

/**
 * 時系列図の見た目の名前 (#3720)。`pipe` はパイプ図の部品で並べて描く見た目で、種類の行の `[shape: pipe]` で選ぶ (Tracelyth #86、#91、#93、#97)。
 * 書かない時系列図は今の見た目で描く
 */
export const SEQUENCE_SHAPES = ["pipe"] as const;
export type SequenceShape = (typeof SEQUENCE_SHAPES)[number];

/** 配管の図だけが書ける出来事 */
export const PIPE_EVENTS = ["call", "return", "revert", "move", "write", "check", "emit", "calc"] as const satisfies readonly DiagramEvent["type"][];

/** 原本の検査の塊 (`schemas/validator.ts`)。形の検査と、形に書けない決まりの検査と、誤りを欄の場所と文にする処理を持つ (#3400、#3846) */
interface Validator {
  check: (input: unknown, lang: NotationLang) => Checked;
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
  const lang = options.lang ?? DEFAULT_LANG;
  if (validator === undefined) throw new Error(READ_MESSAGES[lang].validatorNotLoaded);
  return validator.check(input, lang);
}

