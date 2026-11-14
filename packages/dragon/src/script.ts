/**
 * script の1行の入口の本体 (#3343)。build で `dist/cdn/dragon-main.js` になり、頁は jsDelivr から ES module として読む。
 * 頁が読む `dist/cdn/dragon.js` は案内役 (`script-loader.ts`) で、自分と同じ版の場所からこの本体を読む (#3375)。
 *
 * ```html
 * <script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@<版>/dist/cdn/dragon.js"></script>
 * <pre class="dragon">sequence ...</pre>
 * ```
 *
 * 読み込むと、図の字の CSS を jsDelivr から読む `<link>` を頁に1度だけ足し、頁の記法の塊を図に置き換える。
 * 属性 `data-header` を持つ塊は、図を描いた後に帯の塊 (`frame/framed.ts`) を読み、エクスポートとエディタとコードの帯を付ける (#3699)。
 * 帯の塊には本体の再生の部品と記法の語の一覧を渡し、帯の塊が本体の file を最初に読む別の file へ分けないようにする。
 * 描く部品は軽い入口 (`light.ts`) と同じく、書いた図の種類の部品と使う個別ブロックだけを後から読む。
 */
import { loadFor } from "./light";
import { drawPageBlocks } from "./page-blocks";
import { mountDiagram } from "./player";
import { NOTATION_WORDS } from "./words";

/** 図の字の package と版。build が依存の版を入れる (`tsup.config.ts`) */
declare const __DRAGON_FONT_VERSIONS__: Readonly<Record<string, string>>;

/** 図の字の CSS を読む `<link>` を足す。同じ CSS を読む `<link>` が頁に在れば足さない */
function addFontLinks(doc: Document): void {
  for (const [name, version] of Object.entries(__DRAGON_FONT_VERSIONS__)) {
    const href = `https://cdn.jsdelivr.net/npm/@fontsource-variable/${name}@${version}/index.css`;
    if ([...doc.querySelectorAll("link")].some((link) => link.getAttribute("href") === href)) continue;
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    doc.head.append(link);
  }
}

addFontLinks(document);
drawPageBlocks(document, loadFor, (host, drawn, source, diagram, options) => {
  void import("./frame/framed").then(({ frameDrawn }) => frameDrawn(host, drawn, source, diagram, options, mountDiagram, NOTATION_WORDS));
});
