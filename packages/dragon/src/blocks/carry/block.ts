/**
 * 運ぶ物のブロック (#3345)。
 *
 * 線の上を走る物。何も書かなければ封筒が走り、`[tag: <値>]` で字を書いた札、`[carry: coin]` で硬貨、
 * `[carry: none]` で何も走らせない線になる。1 本の線に運ぶ物は 1 つで、`carry` と `tag` は一緒に書けない。
 * 枝分かれの図 (#3164) の線は札を動かす線で、書かなければ送る側の名前の札を運び、書き戻す時はその札を書かない。
 * 運ぶ物は線の行の属性で行の頭の語を持たないので、線の行を読む処理が `readCarry` を呼び、線の行を書き戻す処理が `carryAttrs` を呼ぶ。
 * 走る時刻は `timing.ts`、描き方は `draw.ts` が持つ。
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list } from "../../read-kit";
import type { DiagramEvent } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { type Block, type KindName, none } from "../block";

/** 線の上を走る物。封筒 (メッセージや要求)、札 (名前のある値)、硬貨 (価値)、無し */
export type Carry = { kind: "envelope" } | { kind: "tag"; text: string } | { kind: "coin" } | { kind: "none" };

/** `carry` に書ける運ぶ物。封筒は書かない時、札は `tag` で書く。型が欠けを止める (原本の運ぶ物の値に語が無い時は型の検査が落ちる) */
export const CARRIES = Object.keys({ coin: true, none: true } satisfies Record<Exclude<Carry["kind"], "envelope" | "tag">, true>) as Exclude<Carry["kind"], "envelope" | "tag">[];

export interface CarryMessages {
  badCarry: string;
  carryTwice: string;
}

/** 線の行の属性から運ぶ物を読む。`from` は線の送る側の名札、`kind` は図の種類 */
export function readCarry(source: SourceLine, attrs: Map<string, Attr>, from: string, kind: KindName, m: Messages): Carry {
  const tag = attrs.get("tag");
  const carried = attrs.get("carry");
  if (tag && carried) throw fail(source, Math.max(tag.at, carried.at), m.carryTwice);
  if (carried && !isOneOf(CARRIES, carried.value)) throw fail(source, carried.at, m.badCarry);
  // 枝分かれの図の線は札を動かす線で、書かなければ送る側の名前の札を運ぶ
  let carry: Carry = kind === "git" ? { kind: "tag", text: from } : { kind: "envelope" };
  if (tag) carry = { kind: "tag", text: tag.value };
  else if (carried) carry = carried.value === "coin" ? { kind: "coin" } : { kind: "none" };
  return carry;
}

/** 線の行に書く運ぶ物の属性。書かない時に運ぶ物 (枝分かれの図は送る側の名前の札、ほかの図は封筒) なら何も書かない */
export function carryAttrs(e: Extract<DiagramEvent, { type: "edge" }>, kind: KindName): [string, string][] {
  const plain = kind === "git" ? e.carry.kind === "tag" && e.carry.text === e.from : e.carry.kind === "envelope";
  return plain ? [] : e.carry.kind === "tag" ? [["tag", e.carry.text]] : [["carry", e.carry.kind]];
}

export const block: Block<CarryMessages> = {
  name: "carry",
  rank: 84,
  attach: { how: "ride-on-line" },
  words: { attrs: { edge: ["carry", "tag"] } },
  read: none("運ぶ物は線の行の属性で、行の頭の語を持たない。線の行を読む処理が readCarry を呼ぶ"),
  print: none("運ぶ物は線の行の属性で、線の行を書き戻す処理が carryAttrs を呼んで書く"),
  messages: {
    ja: { badCarry: `carry は ${list(CARRIES)} のどれか。札は tag: <値> で書く`, carryTwice: "運ぶ物は 1 本の線に 1 つまで。carry と tag は一緒に書かない" },
    en: { badCarry: `carry is one of ${list(CARRIES)}. Write a tag as tag: <value>`, carryTwice: "A line carries one thing. Do not write carry and tag together" },
  },
};
