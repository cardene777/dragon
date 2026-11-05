/**
 * 呼び出しの管のブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。段の中の `<呼ぶ者> -> <呼ばれる者>: <字>` の行で、関係者の名札の上を走る呼び出しの管を開き、
 * `return <戻る者>: <値>` の行で、今いちばん内側で開いている呼び出しを閉じて戻る値を管の上の札に出す。
 * 呼び出しが深くなるごとに管は 1 段下がり、閉じた管は点線になる。一番外の呼び出しが戻った段で、暫定だった変更が全て確定する。
 * 配管の図の呼び出しの行は全てこのブロックが読み (`lines` の線の行)、開いている呼び出しの重なりと、最後まで閉じない呼び出しの誤りを持つ (`always`)。
 * 呼び出しの種類 (`call`) と ETH の送金 (`value`) と畳み (`fold`) の印は呼び出しの行の属性で、読むのはこのブロック。
 */
import type { Block } from "../block";

/** 呼び出しの種類の印に書ける値。`create` は後から足す余地として断る */
export const CALL_KINDS = ["delegate", "static"] as const;
export type PipeCallKind = (typeof CALL_KINDS)[number];

/** 呼び出しの行に書ける印。`fold` は値を持たない */
export const CALL_ATTRS = ["call", "value", "fold"] as const;

/** ETH の決まった名前。`box` で宣言せず、残高の単位と `[value: <量> ETH]` にだけ書く */
export const ETH = "ETH";

/** 段の中の、`from` が `to` を呼ぶ出来事。`value` は添えて送る ETH の量、`call` は呼び出しの種類、`fold` は内側を畳む印 */
export interface PipeCall {
  type: "call";
  from: string;
  to: string;
  label?: string;
  value?: string;
  call?: PipeCallKind;
  fold?: true;
}

/** 段の中の、今いちばん内側で開いている呼び出しの呼ばれた者 `box` が `value` を返して戻る出来事 */
export interface PipeReturn {
  type: "return";
  box: string;
  value?: string;
}

export const block: Block = {
  name: "return",
  rank: 122,
  attach: { how: "connect", only: "pipe" },
  words: { heads: ["return"] },
  lines: [{ edges: "any" }],
  always: true,
};
