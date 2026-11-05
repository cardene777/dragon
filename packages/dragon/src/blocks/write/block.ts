/**
 * 値の札のブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。`hold <持つ Contract>: <名前> <値>` で宣言した残高でない値 (owner、mapping の 1 件、止めているかの印) を、
 * 持つ Contract の列の下の札に描き、段の中の `write <書く Contract>: <名前> <値>` の行で札の値を書き替える。前の値は消し線で残る。
 * 処理を借りる呼び出し (`[call: delegate]`) の内側の `write` は、借りた側でなく呼んだ側の札を書き替える。
 */
import type { Block } from "../block";

/** 段の中の、`box` が値 `name` を `value` に書き替える出来事。書き替わる札の持ち主は、開いている呼び出しから決まる */
export interface PipeWrite {
  type: "write";
  box: string;
  name: string;
  value: string;
}

export const block: Block = {
  name: "write",
  rank: 121,
  attach: { how: "attach-to-box", only: "pipe" },
  words: { heads: ["write"] },
};
