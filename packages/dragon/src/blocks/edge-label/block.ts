/**
 * 線の名前のブロック (#3345)。
 *
 * 線の行の `:` の後ろの名前 (`<名札> -> <名札>: <線の名前>`) と、名前を置く側を指す `[side: <側>]` を受け持つ。
 * 名前と側は線の行の一部で行の頭の語を持たないので、線の行を読む処理が `readLabel` と `readSide` を呼び、
 * 線の行を書き戻す処理が名前と `side` の属性を書く。
 * 原本では線の出来事 (`edge`) の欄 (`label` と `labelSide`) で、線の出来事の形の一部になる。
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list, readName } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type Block, none } from "../block";

/** 線の名前を置く側 */
export type LabelSide = "above" | "below" | "left" | "right";

/** `side` に書ける側。型が欠けを止める (原本の側の値に語が無い時は型の検査が落ちる) */
export const SIDES = Object.keys({ above: true, below: true, left: true, right: true } satisfies Record<LabelSide, true>) as LabelSide[];

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

export const block: Block<EdgeLabelMessages> = {
  name: "edge-label",
  rank: 86,
  attach: { how: "ride-on-line" },
  words: { attrs: { edge: ["side"] } },
  shape: none("線の名前と置く側は線の出来事 (edge) の欄 (label と labelSide) で、線の出来事の形の一部"),
  read: none("線の名前と置く側は線の行の一部で、行の頭の語を持たない。線の行を読む処理が readLabel と readSide を呼ぶ"),
  print: none("線の名前と置く側は線の行の一部で、線の行を書き戻す処理が : <線の名前> と side の属性を書く"),
  messages: {
    ja: { emptyLabel: "線の : の後ろに線の名前を書く。名前を書かない時は : も書かない", badSide: `side は ${list(SIDES)} のどれか` },
    en: { emptyLabel: "Write the label after the : of a line, or leave out the : as well", badSide: `side is one of ${list(SIDES)}` },
  },
};
