/**
 * `icon` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { nearest } from "../../nearest";
import type { Messages } from "../../messages";
import { type Attr, fail, list } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none } from "../block";
import { userBlock } from "../../user-blocks";
import { ICON_NAMES } from "./block";
import { isTabler, TABLER_MESSAGES, type TablerMessages, tablerError } from "./sets";

/** 絵柄集の絵柄 (`tabler:<名前>`) の誤りの文は、原本の検査と同じ文を使う (#3493) */
export interface IconMessages extends TablerMessages {
  /** 知らないアイコン名 `value`。近い名前が在ればそれだけを、無ければ使える名前を全て挙げる (#3315) */
  badIcon: (value: string) => string;
}

/**
 * 箱と区画の行の属性の、絵の名前。知らない名前は誤りで止める。
 * `+` で始まる名前は、使う人が足した印のブロックの名前で、読む前に定義してあれば読む (#3399)。
 * `tabler:` で始まる名前は絵柄集の絵柄で、絵柄集の表に在る名前だけを読む。軽い入口で絵柄集を読む前に書くと、`loadFor` を待つよう断る (#3493)
 */
export function readIcon(source: SourceLine, attrs: Map<string, Attr>, m: Messages): Attr | undefined {
  const icon = attrs.get("icon");
  if (icon?.value.startsWith("+")) {
    const added = userBlock(icon.value);
    if (!added) throw fail(source, icon.at, m.userBlocks.undefinedBlock(icon.value));
    if (added.base !== "icon") throw fail(source, icon.at, m.userBlocks.wrongBase(icon.value, added.base, "icon"));
    return icon;
  }
  if (!icon) return icon;
  const error = iconError(icon.value, m);
  if (error !== undefined) throw fail(source, icon.at, error);
  return icon;
}

/**
 * 絵の名前 `value` の誤りの文。描ける名前なら `undefined`。
 * Tabler の絵柄は Tabler の表と比べ、ほかは手描きの絵柄の表と比べる。箱の行と、箱を元にしたブロックの定義 (#3489) が同じ決まりを使う
 */
export const iconError = (value: string, m: IconMessages): string | undefined =>
  isTabler(value) ? tablerError(value, m) : ICON_NAMES.includes(value) ? undefined : m.badIcon(value);

/** 書いたアイコン名に近い名前が在れば `near` の文、無ければ `none` の文 (#3315) */
const withNear = (value: string, near: (name: string) => string, none: string): string => {
  const name = nearest(value, ICON_NAMES);
  return name === undefined ? none : near(name);
};

/** 絵の名前の誤りの文。箱を元にしたブロックの定義の誤りの文 (`user-blocks-read.ts`) も使う (#3489) */
export const ICON_MESSAGES: { ja: IconMessages; en: IconMessages } = {
  ja: { ...TABLER_MESSAGES.ja, badIcon: (value) => withNear(value, (near) => `${value} という icon は無い。近い名前は ${near}`, `icon は ${list(ICON_NAMES)} のどれか`) },
  en: { ...TABLER_MESSAGES.en, badIcon: (value) => withNear(value, (near) => `There is no icon named ${value}. The closest is ${near}`, `icon is one of ${list(ICON_NAMES)}`) },
};

export const reading: BlockReading<IconMessages> = {
  read: none("絵は箱と区画の行の属性で、行の頭の語を持たない。箱と区画の行を読む処理が readIcon を呼ぶ"),
  print: none("絵は箱と区画の行の属性で、箱と区画の宣言を書き戻す処理が icon の鍵を書く"),
  messages: ICON_MESSAGES,
};
