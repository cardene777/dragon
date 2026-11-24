/**
 * 組み込みの見本の頁 (#3701) だけが使う言葉。日本語と英語の 2 つを持つ (#3880)。
 *
 * 組み込みの見本の頁 (`EmbedSample.tsx`) だけがこの file を読むので、build はこの字を頁と一緒に後から読む塊に入れる (#3701)。
 * 頁の題は頁の題が使うので最初に読む言葉の表 (`../text.ts`) に残す。
 */
import type { Lang } from "../text";

interface EmbeddingText {
  eyebrow: string;
  lead: string;
  back: string;
  notation: string;
  /** 4つの置き方の札の名前と説明。鍵は `EmbedSample.tsx` の `WAYS` */
  ways: Readonly<Record<"script" | "npm" | "element" | "iframe", { name: string; note: string }>>;
}

export const EMBEDDING_TEXT: Readonly<Record<Lang, EmbeddingText>> = {
  ja: {
    eyebrow: "組み込み",
    lead: "下の記法の図を、外の頁に置く4つの置き方で並べた。どの図も帯からコード、エディタ、コピー、エクスポート、拡大を使える。",
    back: "← 使い方の組み込みの節に戻る",
    notation: "見本の記法",
    ways: {
      script: { name: "scriptの1行", note: "<pre class=\"dragon\">の塊に属性data-headerを付けると、入口がその塊に帯を付ける。" },
      npm: { name: "SDKの関数", note: "SDKの関数mountDragonが、要素に帯つきの図を置く。" },
      element: { name: "Web Component", note: "defineDragonElementで登録した要素<dragon-diagram>が、中の字を記法として読んで図を置く。" },
      iframe: { name: "iframe", note: "embedUrlが作った埋め込みの頁のURLを、iframeで開く。" },
    },
  },
  en: {
    eyebrow: "Embedding",
    lead: "The diagram below, placed on a page in each of the four ways. Every one has the bar with Code, Editor, Copy, Export and expand.",
    back: "← Back to the embedding section of the docs",
    notation: "Sample notation",
    ways: {
      script: { name: "One script line", note: "Add data-header to a <pre class=\"dragon\"> block and the script puts the bar on that block." },
      npm: { name: "The SDK function", note: "The SDK function mountDragon puts the diagram with its bar in an element." },
      element: { name: "Web Component", note: "The <dragon-diagram> element registered by defineDragonElement reads the text inside as the notation." },
      iframe: { name: "iframe", note: "Open the embed page URL made by embedUrl in an iframe." },
    },
  },
};
