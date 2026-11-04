/**
 * `edge-label` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none } from "../block";
import { type LabelSide, SIDES } from "./block";

export interface EdgeLabelMessages {
  emptyLabel: string;
  badSide: string;
}

/** 線の行の `at` の位置から読む、`:` の後ろの線の名前。`:` が無ければ名前を持たない。返す `at` は名前の後ろの位置 */
export function readLabel(source: SourceLine, at: number, m: Messages): { label?: string; at: number } {
  if (source.text[at] !== ":") return { at };
  const named = readName(source, at + 1, m);
  if (named.value === "") throw fail(source, at, m.emptyLabel);
  return { label: named.value, at: named.rest };
}

/** 線の行の `side` の属性。書かなければ `undefined` */
export function readSide(source: SourceLine, attrs: Map<string, Attr>, m: Messages): LabelSide | undefined {
  const side = attrs.get("side");
  if (side && !isOneOf(SIDES, side.value)) throw fail(source, side.at, m.badSide);
  return side ? (side.value as LabelSide) : undefined;
}

export const reading: BlockReading<EdgeLabelMessages> = {
  read: none("線の名前と置く側は線の行の一部で、行の頭の語を持たない。線の行を読む処理が readLabel と readSide を呼ぶ"),
  print: none("線の名前と置く側は線の行の一部で、線の行を書き戻す処理が : <線の名前> と side の属性を書く"),
  messages: {
    ja: { emptyLabel: "線の : の後ろに線の名前を書く。名前を書かない時は : も書かない", badSide: `side は ${list(SIDES)} のどれか` },
    en: { emptyLabel: "Write the label after the : of a line, or leave out the : as well", badSide: `side is one of ${list(SIDES)}` },
  },
};
