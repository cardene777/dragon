/**
 * 絵のブロック (#3345)。
 *
 * 箱と区画の名前に添える絵。`box` と `group` の行の `[icon: <名前>]` で、絵柄の表 (`icons.ts` の `ICONS`) に在る名前を選ぶ。
 * 書き間違えた名前は何も描かれず、名前の高さ (#3307) まで変わるため、読む所で断り、近い名前が在ればそれを示す (#3315)。
 * 絵は箱と区画の行の属性で行の頭の語を持たないので、箱と区画の行を読む処理が `readIcon` を呼び、箱と区画の宣言を書き戻す処理が `icon` の鍵を書く。
 * 絵柄の形の表は同じ置き場の `icons.ts` が持ち、この定義は表から名前の一覧を引く。形の表は package の入口からも出す。
 */
import type { Block } from "../block";
import { ICONS } from "./icons";

export const ICON_NAMES: readonly string[] = Object.keys(ICONS);

export interface IconFieldMessages {
  /** 原本の JSON に書いた知らないアイコン名 `value` と、それに一番近い名前 `near` (#3315) */
  unknownIcon: (value: string, near: string) => string;
}

export const block: Block<IconFieldMessages> = {
  name: "icon",
  rank: 88,
  attach: { how: "attach-to-box", except: ["lineup"] },
  words: { attrs: { group: ["icon"], box: ["icon"] } },
  fieldMessages: {
    ja: { unknownIcon: (value, near) => `${value} という icon は無い。近い名前は ${near}` },
    en: { unknownIcon: (value, near) => `There is no icon named ${value}. The closest is ${near}` },
  },
};
