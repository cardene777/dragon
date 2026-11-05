/**
 * 呼び出しの種類のブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。呼び出しの行に `[call: delegate]` を付けると処理を借りる呼び出しになり、内側の `write` は呼んだ側の値の札を書き替える。
 * `[call: static]` を付けると書き込めない呼び出しになり、管は普通の呼び出しの半分の太さで描き、内側の `move` と `write` と `emit` と `[value]` を断る。
 * 印は呼び出しの行の属性で、行を読むのは呼び出しの管のブロック (`return`)。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "call",
  rank: 123,
  attach: { how: "ride-on-line", only: "pipe" },
  words: { attrs: { edge: ["call"] } },
};
