/**
 * 線のブロック (#3345)。
 *
 * 段の中の `<名札> -> <名札>: <線の名前> [<属性>]` の行で、送る側の箱から受ける側の箱へ線を引く。1 つの段に何本でも並べ、書いた順に引く。
 * 線の行は行の頭の語を持たず、名札の次に `->` が来る行を parser が見分けて `readEdgeLine` を呼ぶ。名札が行の頭の語と同じ綴りでも線と読む。
 * 線の端の名札の確かめ方と、時間軸の図の列 (`at` と `into`) は図の種類ごとに違うので、読んでいる記法の状態 (`ParseState`) から引く。
 * 線の名前は線の名前のブロック、運ぶ物は運ぶ物のブロックの下請けで読み書きする。列の図は線を持たないので、列の図の線の行は断る。
 */
import type { DiagramEvent } from "../../schema";
import type { Block } from "../block";

export type EdgeEvent = Extract<DiagramEvent, { type: "edge" }>;

/** 線の行。名札、`->`、名札 */
export const EDGE = /^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du;

/** 矢印の先の名札を書き忘れた線の行。`->` の後ろが行の終わりか、線の名前 (`:`) か属性 (`[`) で始まる (#3468) */
export const EDGE_WITHOUT_TARGET = /^([^\s:[\]]+?)\s*->\s*(?=$|[:[])/du;

export const block: Block = {
  name: "edge",
  rank: 82,
  attach: { how: "connect", except: ["pipe"] },
  words: {},
};
