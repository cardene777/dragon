/**
 * `carry` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list } from "../../read-kit";
import type { DiagramEvent } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, type KindName, none } from "../block";
import { CARRIES, type Carry } from "./block";

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

export const reading: BlockReading<CarryMessages> = {
  read: none("運ぶ物は線の行の属性で、行の頭の語を持たない。線の行を読む処理が readCarry を呼ぶ"),
  print: none("運ぶ物は線の行の属性で、線の行を書き戻す処理が carryAttrs を呼んで書く"),
  messages: {
    ja: { badCarry: `carry は ${list(CARRIES)} のどれか。札は tag: <値> で書く`, carryTwice: "運ぶ物は 1 本の線に 1 つまで。carry と tag は一緒に書かない" },
    en: { badCarry: `carry is one of ${list(CARRIES)}. Write a tag as tag: <value>`, carryTwice: "A line carries one thing. Do not write carry and tag together" },
  },
};
