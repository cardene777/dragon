/**
 * `icon` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { nearest } from "../../nearest";
import type { Messages } from "../../messages";
import { type Attr, fail, list } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none } from "../block";
import { ICON_NAMES } from "./block";

export interface IconMessages {
  /** 知らないアイコン名 `value`。近い名前が在ればそれだけを、無ければ使える名前を全て挙げる (#3315) */
  badIcon: (value: string) => string;
}

/** 箱と区画の行の属性の、絵の名前。知らない名前は誤りで止める */
export function readIcon(source: SourceLine, attrs: Map<string, Attr>, m: Messages): Attr | undefined {
  const icon = attrs.get("icon");
  if (icon && !ICON_NAMES.includes(icon.value)) throw fail(source, icon.at, m.badIcon(icon.value));
  return icon;
}

/** 書いたアイコン名に近い名前が在れば `near` の文、無ければ `none` の文 (#3315) */
const withNear = (value: string, near: (name: string) => string, none: string): string => {
  const name = nearest(value, ICON_NAMES);
  return name === undefined ? none : near(name);
};

export const reading: BlockReading<IconMessages> = {
  read: none("絵は箱と区画の行の属性で、行の頭の語を持たない。箱と区画の行を読む処理が readIcon を呼ぶ"),
  print: none("絵は箱と区画の行の属性で、箱と区画の宣言を書き戻す処理が icon の鍵を書く"),
  messages: {
    ja: { badIcon: (value) => withNear(value, (near) => `${value} という icon は無い。近い名前は ${near}`, `icon は ${list(ICON_NAMES)} のどれか`) },
    en: { badIcon: (value) => withNear(value, (near) => `There is no icon named ${value}. The closest is ${near}`, `icon is one of ${list(ICON_NAMES)}`) },
  },
};
