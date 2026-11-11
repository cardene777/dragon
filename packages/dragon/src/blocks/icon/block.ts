/**
 * 絵のブロック (#3345)。
 *
 * 箱と区画の名前に添える絵。`box` と `group` の行の `[icon: <名前>]` で、絵柄の表 (`icons.ts` の `ICONS`) に在る名前を選ぶ。
 * 書き間違えた名前は何も描かれず、名前の高さ (#3307) まで変わるため、読む所で断り、近い名前が在ればそれを示す (#3315)。
 * 絵は箱と区画の行の属性で行の頭の語を持たないので、箱と区画の行を読む処理が `readIcon` を呼び、箱と区画の宣言を書き戻す処理が `icon` の鍵を書く。
 * 絵柄の形の表は同じ置き場の `icons.ts` が持ち、この定義は表から名前の一覧を引く。形の表は package の入口からも出す。
 * `tabler:<名前>` は外の絵柄集 Tabler の絵柄で、名前の一覧と形は絵柄集の登録簿 (`sets.ts`) が持つ (#3493)。
 * 量の行き先の図 (#3626) の箱は量の棒で絵を描く所を持たないので、絵のブロックを描かない図の種類に書く。
 */
import type { Block } from "../block";
import { ICONS } from "./icons";
import { TABLER_MESSAGES, type TablerMessages } from "./sets";

export const ICON_NAMES: readonly string[] = Object.keys(ICONS);

/** 原本の JSON に書いた絵柄集の絵柄 (`tabler:<名前>`) の誤りの文は、読む処理と同じ文を使う (#3493) */
export interface IconFieldMessages extends TablerMessages {
  /** 原本の JSON に書いた知らないアイコン名 `value` と、それに一番近い名前 `near` (#3315) */
  unknownIcon: (value: string, near: string) => string;
}

export const block: Block<IconFieldMessages> = {
  name: "icon",
  rank: 88,
  attach: { how: "attach-to-box", except: ["lineup", "sankey"] },
  words: { attrs: { group: ["icon"], box: ["icon"] } },
  fieldMessages: {
    ja: { ...TABLER_MESSAGES.ja, unknownIcon: (value, near) => `${value} という icon は無い。近い名前は ${near}` },
    en: { ...TABLER_MESSAGES.en, unknownIcon: (value, near) => `There is no icon named ${value}. The closest is ${near}` },
  },
};
