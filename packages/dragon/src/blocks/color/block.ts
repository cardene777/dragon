/**
 * 色の役のブロック (#3345)。
 *
 * 箱と区画に付ける色の役。`box` と `group` の行の `[color: <色>]` で、7 つの役 (`COLORS`) から選ぶ。色そのものは色味 (`look/values.ts`) が決める。
 * 色は箱と区画の行の属性で行の頭の語を持たないので、箱と区画の行を読む処理がこのブロックの `readLook` で見た目の属性 (添え書き、色、絵) をまとめて読み、
 * 箱と区画の宣言を書き戻す処理が `color` の鍵を書く。
 * 時間軸の図の印の列と節目、列の図のチップも同じ色の役の一覧と誤りの文を使う。
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type Block, none } from "../block";
import { readIcon } from "../icon/block";

export type Color = "blue" | "amber" | "green" | "violet" | "rose" | "slate" | "coin";
/** 色の役の一覧。記法の `color:` に書ける値と、誤りの文に並べる値 */
export const COLORS: readonly Color[] = ["blue", "amber", "green", "violet", "rose", "slate", "coin"];

export interface ColorMessages {
  badColor: string;
}

/** 区画と箱の見た目の属性 (`note` と `color` と `icon`)。知らない色と絵の名前は誤りで止める */
export function readLook(source: SourceLine, attrs: Map<string, Attr>, m: Messages): { note?: string; color?: Color; icon?: string } {
  const color = attrs.get("color");
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  const icon = readIcon(source, attrs, m);
  const note = attrs.get("note")?.value;
  return {
    ...(note !== undefined ? { note } : {}),
    ...(color ? { color: color.value as Color } : {}),
    ...(icon ? { icon: icon.value } : {}),
  };
}

export const block: Block<ColorMessages> = {
  name: "color",
  rank: 87,
  attach: { how: "attach-to-box" },
  words: { attrs: { group: ["color"], box: ["color"] } },
  read: none("色は箱と区画の行の属性で、行の頭の語を持たない。箱と区画の行を読む処理が readLook を呼ぶ"),
  print: none("色は箱と区画の行の属性で、箱と区画の宣言を書き戻す処理が color の鍵を書く"),
  messages: {
    ja: { badColor: `color は ${list(COLORS)} のどれか` },
    en: { badColor: `color is one of ${list(COLORS)}` },
  },
};
