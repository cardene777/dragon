/**
 * ブロックの定義の型 (#3342、#3345)。
 *
 * 図を組み立てる1つひとつをブロックと呼び、ブロックごとに `blocks/<名前>/` の置き場を1つ持つ。
 * どの図の種類にも使えるブロックをコアブロック、1つの図の種類だけで使うブロックを個別ブロック、
 * 2つのブロックを結ぶブロック (線) を接続ブロックと呼ぶ。
 * ブロックが図のどこに付くかを付け方と呼び、5つ (置く、つなぐ、線に乗る、箱に付く、図に付く) から1つを名乗る。
 * 図の種類 (`kinds/<種類>/`) は並べ方と受け付ける付け方だけを持ち、付け方の合うブロックを並べる。
 *
 * 置き場の `block.ts` は、名前と並びと付け方と語と、読む前に書いた図が使うブロックを引くための宣言を持つ。
 * 読む処理と書き戻す処理と日英の誤りの文は同じ置き場の `read.ts` が持ち、軽い入口は後から読む図の種類の個別ブロックの `read.ts` を書いた図が使う時に読む (#3349)。
 * 原本の形の欠片は同じ置き場の `shape.ts`、描き方は `draw.ts`、見本帳の分は `gallery/` が持つ。
 * 原本の形の欠片は build の時に原本の検査を書き出す script と検査だけが読み、描く時に読む塊に入れないので定義と分ける (#3348)。
 * 定義は描き方を読まない。描き方は描く下請け (`render/parts.ts`) を読み、下請けは語の表 (`words.ts`) を読む。
 * 語の表はブロックの一覧から語を集めるので、定義が描き方を読むと輪になる。
 * 同じ理由で、定義は語の表と原本の形の検査 (`schema.ts`) と誤りの文の表 (`messages.ts`) を型でだけ読む。
 *
 * 今は中身の無い欄は、作らずに「持たない」値 (`none(<理由>)`) を置く。
 */
import type { Messages } from "../messages";
import type { Attr } from "../read-kit";
import type { Box, DiagramModel, DiagramEvent, GitBranch, LineupItem, LineupRole, PipeHold, Region, StatePath, Step, StripMeter, TimePeriod, TimePoint, TimeRow, TimeScale, TimeTask, TryCheck, TryItem, TryPart } from "../schema";
import type { PipeRun } from "../pipe-run";
import type { TryRun } from "../try-state";
import type { SourceLine } from "../tokenize";

/** 付け方。置く、つなぐ、線に乗る、箱に付く、図に付く */
export type AttachHow = "place" | "connect" | "ride-on-line" | "attach-to-box" | "attach-to-figure";

/** 図の種類の名前。最初の行の頭の語 */
export type KindName = DiagramModel["kind"];

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
  /** 段の要点。配管の図の `gist` の行を読むまで無い (#3464) */
  gist?: string;
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
  /** 状態遷移図の、最初の段より前に書いた移れる道。parser が段より前の線を見分けて、脇道のブロックの `readPath` で読む (#3347) */
  paths: StatePath[];
  /** 枝分かれの図の枝。枝のブロックが `branch` の行で足す (#3347) */
  branches: GitBranch[];
  /**
   * 枝分かれの図で積んだ commit と、枝の札が今指す commit (まだ何も指さない枝は `null`)。
   * commit のブロックが積み、枝のブロックが枝を切る行で札を置き、parser が札を動かす線で札を動かす (#3347)
   */
  git: { commits: Set<string>; tips: Map<string, string | null> };
  /**
   * 時間軸の図の目盛りと区切りと印の列と作業 (#3562) と節目と拡大の範囲。目盛りと針と、印の列と、作業の棒と、節目と、拡大の帯のブロックが宣言の行で組む (#3348)。
   * 目盛りの数が決まってから確かめる宣言の行の目盛りは `pending` に積み、最初の段を始める時か記法の終わりに 1 度だけ確かめる (`settled`)。
   * `needle` は針が今いる目盛りの境 (0 から数える)
   */
  time: { scale?: TimeScale; period?: TimePeriod; rows: TimeRow[]; tasks: TimeTask[]; points: TimePoint[]; zoom?: { from: number; to: number }; pending: (() => void)[]; settled: boolean; needle: number };
  /** 木の図で書いた木の箱と、書いた行と名札の位置 (`boxes`) と、子の箱から親の名札 (`parents`)。葉と組んだ親のブロックが組む (#3348) */
  tree: { boxes: Map<string, { source: SourceLine; at: number }>; parents: Map<string, string> };
  /** 列の図で宣言したチップと役と、今封をしている列。チップと役と封のブロックが組む (#3348) */
  lineup: { items: LineupItem[]; roles: LineupRole[]; sealed: Set<string> };
  /**
   * 試す図の部品とチップと網の節の関門。部品のブロックと入力の帯のブロックが宣言の行で組み、関門は網のブロックが `check` の行で足す (#3337、#3348、#3476)。
   * 部品を名指す属性と欄を名指す鍵は全ての宣言を読んでから確かめるので `pending` に積み、最初の段を始める時か記法の終わりに 1 度だけ確かめる。
   * 確かめた後に、段の中の出来事を当てる状態 (`run`) を作る
   */
  try: { parts: TryPart[]; items: TryItem[]; sides: string[][]; checks: TryCheck[]; pending: (() => void)[]; run?: TryRun };
  /**
   * 配管の図の始めの値と、段の中の出来事を当てる手順と、開いている呼び出しを書いた行 (#3389)。槽のブロックが `hold` の行で始めの値を足し、
   * 呼び出しの管のブロックが最初の段を始める時に手順 (`run`) を作る。開いている呼び出しを書いた行は手順の呼び出しと同じ順に積み、閉じない呼び出しの誤りで名指す
   */
  pipe: { holds: PipeHold[]; run?: PipeRun; opened: SourceLine[] };
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
  /** 書いている段。最初の `step` より前は `undefined` (#3348) */
  readonly current: () => StepDraft | undefined;
  /**
   * 書いている段を閉じて、原本の段の並びへ足す。段の無い時は何もしない。
   * 開いたままの区画と、時間軸の図の宣言の目盛りを先に確かめ、誤りで止める
   */
  readonly closeStep: () => void;
  /** 次の段を書き始める。段の中に書く行は、この段へ足す */
  readonly openStep: (draft: StepDraft) => void;
  /** 宣言の行を確かめる。最初の `step` より後に書いた宣言の行は誤りで止める */
  readonly beforeSteps: (source: SourceLine) => void;
  /** 宣言した箱の名札 `id` をそのまま返す。宣言していない名札は、名札の列 `at` を示して誤りで止める */
  readonly boxAt: (source: SourceLine, id: string, at: number) => string;
  /** 名札 `id` を、ほかの宣言と重ならない名札として取る。図の種類が名札に使えない名前は確かめない (#3348) */
  readonly declare: (source: SourceLine, id: string, at: number) => void;
  /** 名札 `id` を既に宣言したか (#3348) */
  readonly declared: (id: string) => boolean;
  /** 図の種類が名札に使えない名前 (状態遷移図の始まりと終わりの印、枝分かれの図の `HEAD`、時間軸の図の `now`) を誤りで止める (#3348) */
  readonly notReserved: (source: SourceLine, id: string, at: number) => void;
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

/**
 * 行の頭の語の読む処理。読んだ結果は `state` が渡す書き先へ足し、誤りは行と列を添えて投げる (`read-kit.ts` の `fail`)。
 * `after(n)` は読んでいる行の n 行後ろの行 (無ければ `undefined`)。下の行まで続けて読む処理 (段の本文の `say`) は、
 * 読み終えた続きの行の数を返し、parser はその行を飛ばす
 */
export type HeadReader = (source: SourceLine, state: ParseState, after: (offset: number) => SourceLine | undefined) => number | void;

/** 段の中で起きることの種類 */
export type EventType = DiagramEvent["type"];

/** 種類 `T` の出来事を、段の中の 1 行に書き戻す処理。`kind` は図の種類 */
export type EventPrinter<T extends EventType = EventType> = (event: Extract<DiagramEvent, { type: T }>, kind: KindName, diagram: DiagramModel) => string;

/** 書き戻す処理 */
export interface BlockPrint {
  /** 段の中でブロックが受け持つ行。字下げを除いた行を、段の中で起きることより前に書く。空の行は字下げせずに書く */
  step?: (step: Step) => string[];
  /** 段の中で起きることの書き戻し。鍵は出来事の種類で、段の中で起きた順に出来事ごとに呼ぶ */
  events?: { readonly [T in EventType]?: EventPrinter<T> };
  /**
   * 図の種類の行の直ぐ後ろ、宣言の塊 (`declare`) より前に書く、図の種類の宣言の塊 (時間軸の図の目盛りと区切りと印の列と節目と拡大の範囲、列の図の役)。
   * ブロックの並びの順に書く (#3348)
   */
  lead?: (diagram: DiagramModel) => string[];
  /**
   * 最初の `step` より前に、図の種類の宣言 (`lead`) の直ぐ後ろに書く宣言の塊 (枝分かれの図の枝と、区画と箱と、列の図のチップ)。
   * 列の図のチップと `figure` の塊より前に、ブロックの並びの順に書く
   */
  declare?: (diagram: DiagramModel) => string[];
  /** 最初の `step` より前に書く宣言の塊。区画と箱の宣言の後ろ、状態遷移図の道より前に、ブロックの並びの順に書く */
  figure?: (diagram: DiagramModel) => string[];
  /**
   * 試す図 (#3337) の部品の 1 行。部品の種類 (`type`) と同じ名前のブロックが持ち、渡す部品はその種類の部品だけ。
   * 部品の行は図の種類の行の直ぐ後ろに、原本の並びのまま 1 つの塊に書く (#3348)
   */
  part?: (part: TryPart) => string;
}

/**
 * 原本の形の欠片 (置き場の `shape.ts` の `shape`)。鍵と値は `schemas/diagram.schema.json` と同じ。
 * build の時に `scripts/build-validator.mjs` が骨組み (`schemas/base.schema.json`) とブロックの欠片を束ねて形を書き出す (#3346)。
 * 形がほかのブロックの欄の一部で、自分の欠片を持たないブロックは `none` を置く
 */
export interface BlockShape {
  /** 原本の `blocks` の中に、ブロックの名前で持つ欄の形。欄を持たないブロックは書かない */
  field?: unknown;
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
 * 読む前に見る行の形 (#3349)。読む前に書いた図が使うブロックを引く処理 (`blocks/used.ts`) と読む処理 (`parser.ts`) が同じ関数 (`lineView`) で作る。
 * 行の頭の語と 2 つ目の語と、線の行か、最初の `step` より後の行かだけを持ち、行を読まずに作れる
 */
export interface LineView {
  /** 行の頭の語 */
  word: string;
  /** 行の 2 つ目の語 */
  second?: string;
  /** 線の行 (`<名札> -> <名札>`) なら、送る側の名札 */
  edgeFrom?: string;
  /** 最初の `step` より後の行か */
  inSteps: boolean;
}

/**
 * ブロックが読むか、読む時に確かめる行の形 (#3349)。ブロックの図の種類 (`attach.only`) の図の行だけに当てる。
 * 書いた欄が全て合う行に当たる
 */
export interface LineMatch {
  /** 行の頭の語がこのどれか */
  heads?: readonly string[];
  /** 線の行。`before-steps` は最初の `step` より前の線だけ */
  edges?: "any" | "before-steps";
  /** 線の送る側の名札がこれ */
  from?: string;
  /** 線の送る側の名札がこれでない */
  exceptFrom?: string;
  /** 行の 2 つ目の語がこれ */
  second?: string;
}

/**
 * 入口に置くブロックの定義 (#3342、#3345、#3349)。`F` は原本の JSON の誤りの文の表の型で、日英で同じ鍵を持つ。
 * 読む処理と書き戻す処理と誤りの文は同じ置き場の読み方 (`read.ts` の `reading`) が持ち、軽い入口は後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 * 定義は、読む前に書いた図が使うブロックを引くための宣言 (語と `lines` と `always`) を持つ
 */
export interface Block<F extends object = object> {
  /** 置き場の dir の名前 */
  name: string;
  /** ブロックの並び。語の表 (`words.ts`) はこの順にブロックの語を並べる (行の頭の語は `words.headRanks` で別の番号にできる) */
  rank: number;
  /**
   * 付け方。`only` を書いたブロックは、その図の種類だけで使う個別ブロック。
   * `except` は付け方を受け付ける図の種類のうち、このブロックを描かない図の種類 (列の図は箱の中の処理と絵と飛び先を、試す図は箱と段と出典と中身の帯を描かない)。
   * ブロックを使える図の種類は、この欄と図の種類の `accepts` から導く (`blocks/usable.ts`、#3348)
   */
  attach: { how: AttachHow; only?: KindName; except?: readonly KindName[] };
  words: BlockWords;
  /**
   * 行の頭の語のほかに、このブロックが読むか、読む時に確かめる行の形 (#3349)。
   * 行の形で読む行 (時間軸の図の針を進める行、状態遷移図の最初の段より前の線) は、読み方の `take` が読む
   */
  lines?: readonly LineMatch[];
  /** 図の種類の図なら、行が無くても使う。図の種類の決まり (名札に使えない名前、読み終えた時の確かめ) を読み方が持つ (#3349) */
  always?: true;
  /**
   * 原本の `blocks` の中で、ブロックの名前と違う鍵で持つ欄 (骨組みが持つ `path` と `period`、#3349)。
   * 原本から書いた図が使うブロックを引く時 (`blocks/used.ts`) に、欄の鍵からこのブロックを引く
   */
  fields?: readonly string[];
  /**
   * 原本の段の中で、このブロックが持つ欄 (配管の図の段の要点 `gist`、#3464)。
   * 原本から書いた図が使うブロックを引く時 (`blocks/used.ts`) に、段の欄の鍵からこのブロックを引く
   */
  stepFields?: readonly string[];
  /**
   * 原本の JSON の誤りの文 (`field-messages.ts`) のうち、ブロックの形の決まりに当てる文。`F` はその表の型で、日英で同じ鍵を持つ。
   * 原本の誤りの文を持たないブロックは書かない
   */
  fieldMessages?: { ja: F; en: F };
}

/**
 * ブロックの読み方 (置き場の `read.ts` の `reading`、#3349)。`M` はブロックが持つ誤りの文の表の型で、日英で同じ鍵を持つ。
 * 誤りの文の鍵はブロックの間で重ならない (`blocks.test.ts` の `block-message-keys-unique` が見る)。
 * 図の種類の決まりを持つブロックは、読む処理 (`parser.ts`) が決まった所で呼ぶ手続き (`take` から `verify` まで) を持つ。
 * 手続きは、図の種類が読み方を使える図 (`blocks/usable.ts` の `fits`) を読む時だけ呼ぶ
 */
export interface BlockReading<M extends object = object> {
  /** 行の頭の語ごとの読む処理 */
  read: Readonly<Record<string, HeadReader>> | None;
  print: BlockPrint | None;
  messages: { ja: M; en: M } | None;
  /** 定義の `lines` に当たる行を、行の頭の語より先に読む。読んだら true、読まない行なら false を返し、parser は続けて行の頭の語で読む */
  take?: (source: SourceLine, state: ParseState, view: LineView) => boolean;
  /** 行の頭の語の誤り (図の種類だけの語と、知らない語) を確かめた後に、行の頭の語を確かめる (試す図に書けない行) */
  checkHead?: (source: SourceLine, word: string, state: ParseState) => void;
  /** 最初の段を始める時か、記法の終わりに 1 度だけ呼ぶ。全ての宣言を読んでから確かめる宣言を確かめる */
  settle?: (state: ParseState, head: SourceLine) => void;
  /** 段を書き始める度に呼ぶ */
  beginStep?: (state: ParseState) => void;
  /** 線の端の名札。図の種類が箱のほかに書ける名札なら、その名札を返す。書けない名札は誤りで止め、箱の名札なら `undefined` */
  endAt?: (source: SourceLine, id: string, at: number, side: "from" | "to", state: ParseState) => string | undefined;
  /** 図の種類が名札に使えない名前を誤りで止める */
  reserved?: (source: SourceLine, id: string, at: number, state: ParseState) => void;
  /** 線の列 (`at` と `into`)。持つ図の種類だけが持つ */
  columns?: (source: SourceLine, from: string, to: string, attrs: Map<string, Attr>, end: number, state: ParseState) => { at?: number; into?: number };
  /** 線を読んだ後に呼ぶ (枝分かれの図は、送る側の枝の札を受ける側の commit へ動かす) */
  afterEdge?: (edge: { from: string; to: string }, state: ParseState) => void;
  /** 記法を読み終えた時の確かめ。箱と段の確かめより前に呼ぶ */
  finish?: (state: ParseState, head: SourceLine) => void;
  /** 記法を読み終えた時の確かめ。箱と段の確かめより後に呼ぶ */
  verify?: (state: ParseState, head: SourceLine) => void;
}
