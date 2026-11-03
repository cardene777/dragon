/**
 * 絵のブロック (#3345)。
 *
 * 箱と区画の名前に添える絵。`box` と `group` の行の `[icon: <名前>]` で、絵柄の表 (`icons.ts` の `ICONS`) に在る名前を選ぶ。
 * 書き間違えた名前は何も描かれず、名前の高さ (#3307) まで変わるため、読む所で断り、近い名前が在ればそれを示す (#3315)。
 * 絵は箱と区画の行の属性で行の頭の語を持たないので、箱と区画の行を読む処理が `readIcon` を呼び、箱と区画の宣言を書き戻す処理が `icon` の鍵を書く。
 * 絵柄の形の表は同じ置き場の `icons.ts` が持ち、この定義は表から名前の一覧を引く。形の表は package の入口からも出す。
 */
import { nearest } from "../../nearest";
import type { Messages } from "../../messages";
import { type Attr, fail, list } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type Block, none } from "../block";
import { ICONS } from "./icons";

/**
 * アイコン名の一覧。記法の `icon:` に書ける値と、誤りの文に並べる値 (#3311)。
 * 描く部品のアイコンの表から引く
 */
export const ICON_NAMES: readonly string[] = Object.keys(ICONS);

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

export const block: Block<IconMessages> = {
  name: "icon",
  rank: 88,
  attach: { how: "attach-to-box" },
  words: { attrs: { group: ["icon"], box: ["icon"] } },
  shape: {
    definitions: {
      icon: { description: "箱と区画のアイコン名。描く部品のアイコンの表 (ICONS) に在る名前だけ", enum: ICON_NAMES },
    },
  },
  read: none("絵は箱と区画の行の属性で、行の頭の語を持たない。箱と区画の行を読む処理が readIcon を呼ぶ"),
  print: none("絵は箱と区画の行の属性で、箱と区画の宣言を書き戻す処理が icon の鍵を書く"),
  messages: {
    ja: { badIcon: (value) => withNear(value, (near) => `${value} という icon は無い。近い名前は ${near}`, `icon は ${list(ICON_NAMES)} のどれか`) },
    en: { badIcon: (value) => withNear(value, (near) => `There is no icon named ${value}. The closest is ${near}`, `icon is one of ${list(ICON_NAMES)}`) },
  },
};
