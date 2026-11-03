/**
 * ブロックの定義の型 (#3342、#3345)。
 *
 * 図を組み立てる1つひとつをブロックと呼び、ブロックごとに `blocks/<名前>/` の置き場を1つ持つ。
 * どの図の種類にも使えるブロックをコアブロック、1つの図の種類だけで使うブロックを個別ブロック、
 * 2つのブロックを結ぶブロック (線) を接続ブロックと呼ぶ。
 * ブロックが図のどこに付くかを付け方と呼び、5つ (置く、つなぐ、線に乗る、箱に付く、図に付く) から1つを名乗る。
 * 図の種類 (`kinds/<種類>/`) は並べ方と受け付ける付け方だけを持ち、付け方の合うブロックを並べる。
 *
 * 置き場の `block.ts` は、語、原本の形、読む処理、書き戻す処理、日英の誤りの文を1つの定義に持つ。
 * 描き方は同じ置き場の `draw.ts` が持ち、見本帳の分は `gallery/` が持つ。
 * 定義は描き方を読まない。描き方は描く下請け (`render/parts.ts`) を読み、下請けは語の表 (`words.ts`) を読む。
 * 語の表はブロックの一覧から語を集めるので、定義が描き方を読むと輪になる。
 * 同じ理由で、定義は語の表と原本の形の検査 (`schema.ts`) と誤りの文の表 (`messages.ts`) を型でだけ読む。
 *
 * 今は中身の無い欄は、作らずに「持たない」値 (`none(<理由>)`) を置く。
 */
import type { Messages } from "../messages";
import type { Attr } from "../read-kit";
import type { Box, Diagram, DiagramEvent, Region, Step, StripMeter } from "../schema";
import type { SourceLine } from "../tokenize";

/** 付け方。置く、つなぐ、線に乗る、箱に付く、図に付く */
export type AttachHow = "place" | "connect" | "ride-on-line" | "attach-to-box" | "attach-to-figure";

/** 図の種類の名前。最初の行の頭の語 */
export type KindName = Diagram["kind"];

/** 持たない欄。今は中身が無い理由を持つ */
export interface None {
  readonly none: string;
}

/** 持たない欄の値。理由は空にしない (`blocks.test.ts` の `block-check-flags-missing-messages` が見る) */
export const none = (reason: string): None => ({ none: reason });

/** 一覧のブロックを、ブロックの並び (`rank`) の順に返す。同じ並びのブロックは一覧の順 (置き場の dir の名前の順) */
export const ranked = (blocks: Readonly<Record<string, Block>>): Block[] => Object.values(blocks).sort((a, b) => a.rank - b.rank);

/** 読んでいる段。`body` は `say` を読むまで無い */
export interface StepDraft {
  source: SourceLine;
  title: string;
  body?: string[];
  code?: string;
  sources: NonNullable<Step["sources"]>;
  events: DiagramEvent[];
}

/** 宣言の行でブロックが組む、図の原本の欄。parser が図の原本の決まった位置に置く */
export interface FigureDraft {
  /** 宣言した区画。区画のブロックが `group` の行で足す */
  regions: Region[];
  /** 宣言した箱。箱のブロックが `box` の行で足す */
  boxes: Box[];
  /** 開いている区画 (`group` の行から `end` の行まで)。箱は開いている区画に置く */
  group?: { source: SourceLine; id: string };
  /** 最初に宣言した箱の行。時間軸の図で拡大の範囲が無い時に名指す */
  firstBox?: SourceLine;
  /** 中身の帯。中身の帯のブロックが `strip` の行で組む */
  strip?: { title: string; fields: string[] };
  /** 時間軸の図の物差しの欄。中身の帯のブロックが `strip` の行の欄の `[meter: <割合>]` で組む */
  meters: StripMeter[];
}

/** ブロックの読む処理が受ける、読んでいる記法の状態 */
export interface ParseState {
  /** 誤りの文。呼ぶ側が渡した言葉で出す */
  readonly m: Messages;
  /** 図の種類 */
  readonly kind: KindName;
  /** 行ごとに書ける属性の鍵 (語の表の `ATTRS`)。鍵は行の頭の語で、線の行は `edge` */
  readonly attrs: Readonly<Record<string, readonly string[]>>;
  /** 段の中に書く行の書き先の段。最初の `step` より前に書いた行は誤りで止める */
  readonly inStep: (source: SourceLine) => StepDraft;
  /** 宣言の行を確かめる。最初の `step` より後に書いた宣言の行は誤りで止める */
  readonly beforeSteps: (source: SourceLine) => void;
  /** 宣言した箱の名札 `id` をそのまま返す。宣言していない名札は、名札の列 `at` を示して誤りで止める */
  readonly boxAt: (source: SourceLine, id: string, at: number) => string;
  /**
   * 宣言の行の名札 `id` を、ほかの宣言と重ならない名札として取る。
   * 図の種類が名札に使えない名前 (状態遷移図の始まりと終わりの印、枝分かれの図の `HEAD`、時間軸の図の `now`) と、宣言済みの名札は誤りで止める
   */
  readonly claim: (source: SourceLine, id: string, at: number) => void;
  /**
   * 線の端の名札 `id` をそのまま返す。`side` は送る側 (`from`) か受ける側 (`to`)。
   * 書ける名札は図の種類で違い (状態遷移図の始まりと終わりの印、枝分かれの図の枝と commit、時間軸の図の節目、木の図の木の箱)、書けない名札は誤りで止める
   */
  readonly endAt: (source: SourceLine, id: string, at: number, side: "from" | "to") => string;
  /**
   * 線の列 (`at` と `into`)。時間軸の図の箱どうしの線だけが持ち、ほかの図の種類で書いた列は誤りで止める。
   * `end` は線の名前の後ろの位置で、書くべき列が無い時に誤りの位置として示す
   */
  readonly columns: (source: SourceLine, from: string, to: string, attrs: Map<string, Attr>, end: number) => { at?: number; into?: number };
  /** 宣言の行でブロックが組む、図の原本の欄 */
  readonly figure: FigureDraft;
}

/** 行の頭の語の読む処理。読んだ結果は `state` が渡す書き先へ足し、誤りは行と列を添えて投げる (`read-kit.ts` の `fail`) */
export type HeadReader = (source: SourceLine, state: ParseState) => void;

/** 段の中で起きることの種類 */
export type EventType = DiagramEvent["type"];

/** 種類 `T` の出来事を、段の中の 1 行に書き戻す処理。`kind` は図の種類 */
export type EventPrinter<T extends EventType = EventType> = (event: Extract<DiagramEvent, { type: T }>, kind: KindName) => string;

/** 書き戻す処理 */
export interface BlockPrint {
  /** 段の中でブロックが受け持つ行。字下げを除いた行を、段の中で起きることより前に書く */
  step?: (step: Step) => string[];
  /** 段の中で起きることの書き戻し。鍵は出来事の種類で、段の中で起きた順に出来事ごとに呼ぶ */
  events?: { readonly [T in EventType]?: EventPrinter<T> };
  /**
   * 最初の `step` より前に、図の種類の宣言 (枝分かれの図の枝、時間軸の図の目盛りなど) の直ぐ後ろに書く宣言の塊 (区画と箱)。
   * 列の図のチップと `figure` の塊より前に、ブロックの並びの順に書く
   */
  declare?: (diagram: Diagram) => string[];
  /** 最初の `step` より前に書く宣言の塊。区画と箱の宣言の後ろ、状態遷移図の道より前に、ブロックの並びの順に書く */
  figure?: (diagram: Diagram) => string[];
}

/** 原本の形の欠片。鍵と値は `schemas/diagram.schema.json` と同じ */
export interface BlockShape {
  /** `definitions` の欠片。鍵は `definitions` の鍵 */
  definitions?: Readonly<Record<string, unknown>>;
  /** 段の中で起きること (`definitions.event` の `oneOf`) の枝。鍵は出来事の種類 (`type`) */
  events?: Readonly<Record<string, unknown>>;
}

/** ブロックが受け持つ記法の語 */
export interface BlockWords {
  /** 行の頭の語 */
  heads?: readonly string[];
  /**
   * 行の頭の語のうち、ブロックの並び (`rank`) と別の番号で語の表に並べる語と、その番号。
   * 1 つのブロックの行の頭の語が、語の表の離れた所に並ぶ時に書く (中身の帯の `strip` と `set`)
   */
  headRanks?: Readonly<Record<string, number>>;
  /** 行ごとに書ける属性の鍵。鍵は行の頭の語 */
  attrs?: Readonly<Record<string, readonly string[]>>;
}

/**
 * ブロックの定義。`M` はブロックが持つ誤りの文の表の型で、日英で同じ鍵を持つ。
 * 誤りの文の鍵はブロックの間で重ならない (`blocks.test.ts` の `block-message-keys-unique` が見る)
 */
export interface Block<M extends object = object, F extends object = object> {
  /** 置き場の dir の名前 */
  name: string;
  /** ブロックの並び。語の表 (`words.ts`) はこの順にブロックの語を並べる (行の頭の語は `words.headRanks` で別の番号にできる) */
  rank: number;
  /** 付け方。`only` を書いたブロックは、その図の種類だけで使う個別ブロック */
  attach: { how: AttachHow; only?: KindName };
  words: BlockWords;
  /** 原本の形の欠片。形がほかのブロックの欄の一部で、自分の欠片を持たないブロックは `none` を置く */
  shape: BlockShape | None;
  /** 行の頭の語ごとの読む処理 */
  read: Readonly<Record<string, HeadReader>> | None;
  print: BlockPrint | None;
  messages: { ja: M; en: M } | None;
  /**
   * 原本の JSON の誤りの文 (`field-messages.ts`) のうち、ブロックの形の決まりに当てる文。`F` はその表の型で、日英で同じ鍵を持つ。
   * 原本の誤りの文を持たないブロックは書かない
   */
  fieldMessages?: { ja: F; en: F };
}
