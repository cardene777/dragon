/**
 * `color` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none } from "../block";
import { readIcon } from "../icon/read";
import { COLORS, type Color } from "./block";

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

export const reading: BlockReading<ColorMessages> = {
  read: none("色は箱と区画の行の属性で、行の頭の語を持たない。箱と区画の行を読む処理が readLook を呼ぶ"),
  print: none("色は箱と区画の行の属性で、箱と区画の宣言を書き戻す処理が color の鍵を書く"),
  messages: {
    ja: { badColor: `color は ${list(COLORS)} のどれか` },
    en: { badColor: `color is one of ${list(COLORS)}` },
  },
};
