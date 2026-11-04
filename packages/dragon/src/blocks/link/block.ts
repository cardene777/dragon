/**
 * 飛び先のブロック (#3345、#3199)。
 *
 * 箱に書く飛び先。`box` の行の `[link: <飛び先>]` で書き、描いた図ではその箱が飛び先への link になる。
 * 飛び先は頁を移る形 (`/` で始まる path か、`http://` か `https://` で始まる URL) だけを書け、ほかの形 (`javascript:` など) は断る。
 * 段の出典 (`source` の行の `url`) も同じ形の決まりを使うので、出典のブロックもこのブロックの `urlOf` で読む。
 * 飛び先は箱の行の属性で行の頭の語を持たないので、箱の行を読む処理が `urlOf` を呼び、箱の宣言を書き戻す処理が `link` の鍵を書く。
 */
import type { Messages } from "../../messages";
import { type Attr, fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type Block, none } from "../block";

/** 頁を移る形。原本の JSON の飛び先の形と同じ */
export const URL_FORM = /^(\/|https?:\/\/)/u;

export interface LinkMessages {
  /** 箱の飛び先 (`link`) か段の出典 (`url`) に、頁を移る形でない URL を書いた (#3199) */
  badUrl: (key: string) => string;
}

export interface LinkFieldMessages {
  /** 頁を移る形だけを書ける決まり (箱の飛び先と段の出典の URL、#3199) */
  url: string;
}

/** 頁を移る形の URL。ほかの形 (`javascript:` など) は、その属性の位置を示して断る */
export function urlOf(source: SourceLine, key: string, attr: Attr, m: Messages): string {
  if (!URL_FORM.test(attr.value)) throw fail(source, attr.at, m.badUrl(key));
  return attr.value;
}

export const block: Block<LinkMessages, LinkFieldMessages> = {
  name: "link",
  rank: 89,
  attach: { how: "attach-to-box", except: ["lineup"] },
  words: { attrs: { box: ["link"] } },
  read: none("飛び先は箱の行の属性で、行の頭の語を持たない。箱の行を読む処理が urlOf を呼ぶ"),
  print: none("飛び先は箱の行の属性で、箱の宣言を書き戻す処理が link の鍵を書く"),
  messages: {
    ja: { badUrl: (key) => `${key} には / で始まる path か、http:// か https:// で始まる URL を書く` },
    en: { badUrl: (key) => `Write a path that starts with / or a URL that starts with http:// or https:// for ${key}` },
  },
  fieldMessages: {
    ja: { url: "/ で始まる path か、http:// か https:// で始まる URL にする" },
    en: { url: "Use a path that starts with / or a URL that starts with http:// or https://" },
  },
};
