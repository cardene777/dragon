/**
 * 見つからない頁だけが使う言葉。日本語と英語の 2 つを持つ (#3880)。
 *
 * 見つからない頁 (`NotFound.tsx`) だけがこの file を読むので、build はこの字を頁と一緒に後から読む塊に入れる (#3832)。
 * 頁の題と、編集画面を開く釦の字は、頁の題と概要の頁が使うので最初に読む言葉の表 (`../text.ts`) に残す。
 */
import type { Lang } from "../text";

interface NotFoundText {
  /** 見出しの頭の強める語 */
  em: string;
  lead: (entries: number) => string;
  catalog: string;
  docs: string;
}

export const NOT_FOUND_TEXT: Readonly<Record<Lang, NotFoundText>> = {
  ja: {
    em: "そこは",
    lead: (entries) => `お探しの頁は移動または削除されたか、そもそも存在しません。dragon の ${entries} つの入口から探してみてください。`,
    catalog: "カタログを見る",
    docs: "使い方を読む",
  },
  en: {
    em: "That page",
    lead: (entries) => `The page you are looking for was moved, deleted, or never existed. Try one of dragon's ${entries} entry points.`,
    catalog: "Browse the catalog",
    docs: "Read the docs",
  },
};
