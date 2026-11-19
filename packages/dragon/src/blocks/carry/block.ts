/**
 * 運ぶ物のブロック (#3345)。
 *
 * 線の上を走る物。何も書かなければ封筒が走り、`[tag: <値>]` で字を書いた札、`[carry: coin]` で硬貨、
 * `[carry: none]` で何も走らせない線になる。1 本の線に運ぶ物は 1 つで、`carry` と `tag` は一緒に書けない。
 * 枝分かれの図 (#3164) の線は札を動かす線で、書かなければ送る側の名前の札を運び、書き戻す時はその札を書かない。
 * 運ぶ物は線の行の属性で行の頭の語を持たないので、線の行を読む処理が `readCarry` を呼び、線の行を書き戻す処理が `carryAttrs` を呼ぶ。
 * 走る時刻は `timing.ts`、描き方は `draw.ts` が持つ。
 */
import type { Block } from "../block";

export type Carry = { kind: "envelope" } | { kind: "tag"; text: string } | { kind: "coin" } | { kind: "none" };

/** `carry` に書ける運ぶ物。封筒は書かない時、札は `tag` で書く。型が欠けを止める (原本の運ぶ物の値に語が無い時は型の検査が落ちる) */
export const CARRIES = Object.keys({ coin: true, none: true } satisfies Record<Exclude<Carry["kind"], "envelope" | "tag">, true>) as Exclude<Carry["kind"], "envelope" | "tag">[];

export const block: Block = {
  name: "carry",
  rank: 84,
  attach: { how: "ride-on-line", except: ["pipe"] },
  words: { attrs: { edge: ["carry", "tag"] } },
};
