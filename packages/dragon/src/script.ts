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
 * 属性 `data-header` を持つ塊は、記法が使う部品と同時に帯の塊 (`frame/framed.ts`) を読み、エクスポートとエディタとコードの帯の内側に図を 1 度だけ描く (#3699、#3789)。
 * `data-header` の塊が無い頁は帯の塊を読まないので、最初に読む量は増えない。頁の帯の設定の塊 (`#dragon-header`) は全ての帯に効く。
 * 帯の塊には本体の再生の部品と記法の語の一覧を渡し、帯の塊が本体の file を最初に読む別の file へ分けないようにする。
 * 描く部品は軽い入口 (`light.ts`) と同じく、書いた図の種類の部品と使う個別ブロックだけを後から読む。
 * 配管の図を描いた後は、先に組む塊 (`pipe-ahead.ts`) を後から読み、空いた時間に畳んだ箱を 1 つだけ開いた形を組む (#3753)。
 *
 * 初めから持つ並べ方は時系列図だけで、構成図の並べ方は構成図の塊を置いた頁だけが後から読む (#3782)。
 * 読む処理は軽い入口を通らずに `light-load.ts` から読み、軽い入口が出す既定の入口の部品 (`api.ts`) を最初に読む file に入れない。
 */
import "./kind-use/sequence";
import { loadCapture } from "./frame/capture-load.mjs";
import { kindLoaded, partsOf } from "./kinds/registry";
import { diagramKind, loadFor } from "./light-load";
import { toModel } from "./model";
import { drawPageBlocks, type FramedBlock } from "./page-blocks";
import { mountDiagram } from "./player";
import { withUserBlocks } from "./user-blocks";
import { readDiagram } from "./version";
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

/**
 * 塊の記法を描く前に、描くのに要る部品を読む。構成図の塊の時は、構成図の並べ方の登録の file も後から読む (#3782)。
 * 構成図を後から読むのはこの入口だけで、軽い入口と共に使う読む処理 (`light-load.ts`) には置かない (理由はそちらの file の頭に在る)
 */
async function prepare(text: string): Promise<void> {
  const layout = diagramKind(text) === "architecture" && !kindLoaded("architecture") ? import("./kind-use/architecture") : undefined;
  await Promise.all([loadFor(text), layout]);
}

addFontLinks(document);
drawPageBlocks(
  document,
  prepare,
  // 帯のHTMLとGIFとMP4は、入口の隣の書き出す部品 (`dist/cdn/capture.js`) を読んで作る (#3786)
  () =>
    import("./frame/framed").then(({ mountInFrame }): FramedBlock => (host, source, diagram, options) => {
      mountInFrame(host, source, diagram, options, mountDiagram, NOTATION_WORDS, loadCapture);
    }),
  // 配管の図は、描いた後の空いた時間に畳んだ箱を 1 つだけ開いた形を先に組み、箱を押した時に道を探さない (#3753)
  (diagram, options) => {
    if (diagram.kind === "pipe")
      void import("./pipe-ahead").then(({ composeAhead }) => composeAhead(diagram, options, { readDiagram, toModel, partsOf, withUserBlocks }));
  },
);
