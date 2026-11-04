/**
 * 脇道のブロック (#3163、#3171、#3347)。
 *
 * 状態遷移図の部品 (`only: state`)。最初の `step` より前に書いた線 (`<名札> -> <名札>: <線の名前>`) は、移れるが今回は通らない道になる。
 * 道は点線で引き、運ぶ物を走らせず、属性 (`carry`、`tag`、`side`) を持たない。どの段も辿り着かない状態は薄い箱にし、図の右上の脇道の囲みに入れる。
 * 道の行は線の行と同じ形なので行の頭の語を持たず、定義の `lines` で最初の `step` より前の線の行を名指し、読み方 (`read.ts`) の `take` が読む。
 * 原本の欄は `blocks.path` で、欄の名前は道の行の呼び名のまま骨組み (`schemas/base.schema.json`) が持つ。このブロックは道 1 本の形 (`path`) を持ち、欄の鍵を `fields` に書く。
 */
import type { Block } from "../block";

export interface StatePath {
  from: string;
  to: string;
  label?: string;
}

export const block: Block = {
  name: "side-path",
  rank: 35,
  attach: { how: "connect", only: "state" },
  words: {},
  // 最初の段より前の線は移れる道の地図で、行の形で読む
  lines: [{ edges: "before-steps" }],
  fields: ["path"],
};
