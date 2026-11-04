/**
 * 段のブロック (#3345)。
 *
 * 図は `step <段の題>` の行で段に区切り、1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。
 * 本文を 2 行以上に分ける時は、`say` だけの行の下に、`say` より深く字下げして続ける。続きの行の間の空行は本文の空の行になる。
 * `code <命令>` の行はその段で打つ命令で、1 つの段に 1 行まで書ける。
 * 見せ方は最初の行の終わりの `[view: fixed]` か `[view: follow]` で選び、書かなければ字の大きさで選ぶ。
 * どの図の種類にも書けるコアブロックで、図に付く。
 *
 * 段を閉じる時に開いたままの区画を断るのは読む処理 (`parser.ts` の `closeStep`) が、時間軸の図の宣言を確かめるのは目盛りのブロックの読み方 (`scale/read.ts` の `settle`) が行う。
 * 段の区切りの `step <段の題>` の行は書き戻す処理 (`printer.ts`) が段ごとに書き、このブロックは段の中の `say` と `code` の行を書く。
 */
import type { ViewMode } from "../../schema";
import type { Block } from "../block";

export const VIEWS = Object.keys({ fixed: true, follow: true } satisfies Record<ViewMode, true>) as ViewMode[];

export const block: Block = {
  name: "step",
  rank: 40,
  attach: { how: "attach-to-figure", except: ["try"] },
  words: { heads: ["step", "say", "code"], attrs: { diagram: ["view"] } },
};
