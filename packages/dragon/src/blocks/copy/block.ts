/**
 * 当て直しのブロック (#3164、#3347)。
 *
 * 枝分かれの図の接続ブロック (`only: git`)。`commit <名札> on <枝>` の後ろに `copy <commit>` を書くと、元の commit と同じ変更を当て直した commit になり、
 * 元の commit から写しへ点線を引いて 2 つの commit を結ぶ。rebase で作り直す commit に使い、枝の札は動かさない。
 * `copy` の語は commit の行の中に書くので行の頭の語を持たず、commit の行は commit のブロックが読み書きする。原本の形も commit の出来事の `copy` の欄にある。
 */
import type { Block } from "../block";

export const COPY = "copy";

export const block: Block = {
  name: "copy",
  rank: 7,
  attach: { how: "connect", only: "git" },
  words: {},
};
