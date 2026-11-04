/**
 * `link` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { Messages } from "../../messages";
import { type Attr, fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none } from "../block";

export const URL_FORM = /^(\/|https?:\/\/)/u;

export interface LinkMessages {
  /** 箱の飛び先 (`link`) か段の出典 (`url`) に、頁を移る形でない URL を書いた (#3199) */
  badUrl: (key: string) => string;
}

/** 頁を移る形の URL。ほかの形 (`javascript:` など) は、その属性の位置を示して断る */
export function urlOf(source: SourceLine, key: string, attr: Attr, m: Messages): string {
  if (!URL_FORM.test(attr.value)) throw fail(source, attr.at, m.badUrl(key));
  return attr.value;
}

export const reading: BlockReading<LinkMessages> = {
  read: none("飛び先は箱の行の属性で、行の頭の語を持たない。箱の行を読む処理が urlOf を呼ぶ"),
  print: none("飛び先は箱の行の属性で、箱の宣言を書き戻す処理が link の鍵を書く"),
  messages: {
    ja: { badUrl: (key) => `${key} には / で始まる path か、http:// か https:// で始まる URL を書く` },
    en: { badUrl: (key) => `Write a path that starts with / or a URL that starts with http:// or https:// for ${key}` },
  },
};
