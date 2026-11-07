/**
 * 段の要点のブロック (#3464)。
 *
 * 配管の図の部品 (`only: pipe`)。段の中の `gist <要点>` の行で、その段の要点を 1 行で書く。1 つの段に 1 行まで書ける。
 * 配管の図の再生の部品は段の本文 (`say`) を見せないので、本文にしか無い要点が画面から消える。要点を書いた段だけ、
 * 図の下の段の矢印の後ろに要点の札 (名札と要点の文) を出す (`pipe-player.ts`)。読み上げの段の一覧にも要点の文を出す (`draw.ts`)。
 * 原本の JSON では段の `gist` に要点の文を持ち、要点を書かない段は欄を持たない。図の SVG には描かない。
 * `point` の語は時間軸の図の節目のブロックが持つので、要点の行の頭の語は `gist` にする。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "gist",
  rank: 130,
  attach: { how: "attach-to-figure", only: "pipe" },
  words: { heads: ["gist"] },
  stepFields: ["gist"],
};
