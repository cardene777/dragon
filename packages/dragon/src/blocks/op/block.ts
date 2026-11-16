/**
 * 線を起こした操作の番号のブロック (#3720)。
 *
 * 時系列図の部品 (`only: sequence`)。線の行に `[op: <番号>]` を付けると、線を起こした記録の操作の番号を線に持たせる (Tracelyth #93)。
 * 描いた線は `data-op="段/番号"` でその番号を持ち、外の画面が線とコードの行を結ぶ。図の見た目は変えない。
 * 番号は線の行の属性で行の頭の語を持たないので、線の行を読む処理 (`edge/read.ts`) が読んで書き戻す。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "op",
  rank: 85,
  attach: { how: "ride-on-line", only: "sequence" },
  words: { attrs: { edge: ["op"] } },
};
