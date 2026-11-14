/**
 * 図と帯の見た目を、図を置いた所の根へ入れる (#3695)。
 *
 * 根は文書か、帯つきの図が持つ影の根 (shadow root)。文書の頭へ入れると、帯の内側に置いた図へ見た目が届かない。
 * 帯つきの図は`stylesFor`の口を使い、根が`adoptedStyleSheets`を持つ時は作った表 (`CSSStyleSheet`) を足してstyle要素を作らない。
 * CSPがstyle要素を止める頁でも見た目が入り、置いた頁の頭にも何も足さない。
 * 持たない時は、渡された`nonce`を付けたstyle要素を根の終わり (文書は`head`) に置く。
 * 同じ`id`の見た目は根ごとに1度だけ入れる。別のfileに束ねた入口どうしでも重ねないよう、表には`id`を印として持たせる。
 *
 * 帯を付けずに置いた図は口を渡さず、再生の部品と後から読む種類の部品が今までどおり文書の頭へstyle要素で入れる。
 * scriptの1行の入口が最初に読む量に上限が在り、このfileの処理を最初に読む塊へ入れないため。
 * 再生の部品と後から読む種類の部品は口の型だけを読み、口 (`Styles`) は設定`styles`で受け取る
 */

/** 見た目を入れる根 */
export type StyleRoot = Document | ShadowRoot;

/** 見た目を入れる口。帯つきの図が作り、再生の部品と後から読む種類の部品へ渡す */
export interface Styles {
  /** 見た目`css`を`id`の名で根`root`へ入れる。`root`を書かない時は図を置いた所の根 */
  adopt(id: string, css: string, root?: StyleRoot): void;
  /** 図の SVG の`<style>`に`nonce`を付けた形。図の SVG は書き出しが読む`<style>`を持つので、外へ出さずに残す */
  markup(svg: string): string;
}

/** 作った表に持たせる印の名前。値は見た目の`id` */
const MARK = "dragonStyle";

const documentOf = (root: StyleRoot): Document => ("body" in root ? root : root.ownerDocument);

/** 見た目`css`を`id`の名のstyle要素にして根`root`の終わり (文書は`head`) に置く。同じ`id`が既に在る時は何もしない */
function appendStyle(root: StyleRoot, id: string, css: string, nonce?: string): void {
  // `nonce`は置く前に付ける。CSPは置いた時に`nonce`を確かめ、後から付けても見た目を入れない
  if (!root.getElementById(id)) ((root as Document).head ?? root).append(Object.assign(documentOf(root).createElement("style"), { id, nonce: nonce ?? "", textContent: css }));
}

/** 見た目`css`を`id`の名で根`root`の`adoptedStyleSheets`へ足す。持たない根はstyle要素で入れる。同じ`id`が既に在る時は何もしない */
export function adoptStyle(root: StyleRoot, id: string, css: string, nonce?: string): void {
  // 型は全ての根が持つと書くが、古いブラウザと jsdom の根は持たない
  const adoptable: boolean = "adoptedStyleSheets" in root;
  if (!adoptable) return appendStyle(root, id, css, nonce);
  if (root.adoptedStyleSheets.some((sheet) => (sheet as unknown as Record<string, unknown>)[MARK] === id)) return;
  const sheet = new (documentOf(root).defaultView as Window & typeof globalThis).CSSStyleSheet();
  sheet.replaceSync(css);
  (sheet as unknown as Record<string, unknown>)[MARK] = id;
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}

/** 図の SVG の`<style>`に`nonce`を付けた形。`nonce`が無い時は`svg`のまま */
const withNonce = (svg: string, nonce?: string): string => (nonce ? svg.replace(/<style>/gu, `<style nonce="${nonce}">`) : svg);

/** `node`を置いた所の根。文書にも影の根にも繋がっていない時は、`node`の文書 */
const rootOf = (node: Node): StyleRoot => {
  const root = node.getRootNode();
  return root.nodeType === 9 || (root.nodeType === 11 && "host" in root) ? (root as StyleRoot) : (node.ownerDocument as Document);
};

/** `node`を置いた所の根へ`adoptedStyleSheets`で見た目を入れる口。帯つきの図が使う */
export function stylesFor(node: Node, nonce?: string): Styles {
  return {
    adopt: (id, css, root = rootOf(node)) => adoptStyle(root, id, css, nonce),
    markup: (svg) => withNonce(svg, nonce),
  };
}
