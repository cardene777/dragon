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
import type { Diagram, DiagramEvent, Step } from "../schema";
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

/** ブロックの読む処理が受ける、読んでいる記法の状態 */
export interface ParseState {
  /** 誤りの文。呼ぶ側が渡した言葉で出す */
  readonly m: Messages;
  /** 図の種類 */
  readonly kind: KindName;
  /** 段の中に書く行の書き先の段。最初の `step` より前に書いた行は誤りで止める */
  inStep(source: SourceLine): StepDraft;
}

/** 行の頭の語の読む処理。読んだ結果は `state` が渡す書き先へ足し、誤りは行と列を添えて投げる (`read-kit.ts` の `fail`) */
export type HeadReader = (source: SourceLine, state: ParseState) => void;

/** 書き戻す処理 */
export interface BlockPrint {
  /** 段の中でブロックが受け持つ行。字下げを除いた行を、段の中で起きることより前に書く */
  step?: (step: Step) => string[];
}

/** ブロックが受け持つ記法の語 */
export interface BlockWords {
  /** 行の頭の語 */
  heads?: readonly string[];
  /** 行ごとに書ける属性の鍵。鍵は行の頭の語 */
  attrs?: Readonly<Record<string, readonly string[]>>;
}

/**
 * ブロックの定義。`M` はブロックが持つ誤りの文の表の型で、日英で同じ鍵を持つ。
 * 誤りの文の鍵はブロックの間で重ならない (`blocks.test.ts` の `block-message-keys-unique` が見る)
 */
export interface Block<M extends object = object> {
  /** 置き場の dir の名前 */
  name: string;
  /** ブロックの並び。語の表 (`words.ts`) はこの順にブロックの語を並べる */
  rank: number;
  /** 付け方。`only` を書いたブロックは、その図の種類だけで使う個別ブロック */
  attach: { how: AttachHow; only?: KindName };
  words: BlockWords;
  /** 原本の形の欠片。鍵と値は `schemas/diagram.schema.json` の `definitions` と同じ */
  shape: { definitions: Readonly<Record<string, unknown>> };
  /** 行の頭の語ごとの読む処理 */
  read: Readonly<Record<string, HeadReader>> | None;
  print: BlockPrint | None;
  messages: { ja: M; en: M } | None;
}
