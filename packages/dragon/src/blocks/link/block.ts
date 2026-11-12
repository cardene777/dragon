/**
 * 飛び先のブロック (#3345、#3199)。
 *
 * 箱に書く飛び先。`box` の行の `[link: <飛び先>]` で書き、描いた図ではその箱が飛び先への link になる。
 * 飛び先は頁を移る形 (`/` で始まる path か、`http://` か `https://` で始まる URL) だけを書け、ほかの形 (`javascript:` など) は断る。
 * 段の出典 (`source` の行の `url`) も同じ形の決まりを使うので、出典のブロックもこのブロックの `urlOf` で読む。
 * 飛び先は箱の行の属性で行の頭の語を持たないので、箱の行を読む処理が `urlOf` を呼び、箱の宣言を書き戻す処理が `link` の鍵を書く。
 * 量の行き先の図 (#3626) の箱は量の棒で札を包まないので、飛び先のブロックを描かない図の種類に書く。
 */
import type { Block } from "../block";

/** 頁を移る形の決まり。/ で始まる path か、http:// か https:// で始まる URL。原本の形の検査と、記法から読んだ図を読む時に使う (#3400) */
export const LINK_URL = "^(/|https?://)";

export interface LinkFieldMessages {
  /** 頁を移る形だけを書ける決まり (箱の飛び先と段の出典の URL、#3199) */
  url: string;
}

export const block: Block<LinkFieldMessages> = {
  name: "link",
  rank: 89,
  attach: { how: "attach-to-box", except: ["lineup", "pipe", "sankey"] },
  words: { attrs: { box: ["link"] } },
  fieldMessages: {
    ja: { url: "/ で始まる path か、http:// か https:// で始まる URL にする" },
    en: { url: "Use a path that starts with / or a URL that starts with http:// or https://" },
  },
};
