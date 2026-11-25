/**
 * HTMLの字を要素の木に読む小さな読み手 (#3908)。HTMLの形の図と頁を、ブラウザの無い所 (命令と検査) でも読むために使う。
 *
 * 要素ごとに始まりの`<`の行と列を持ち、誤りをHTMLの行で名指せるようにする。
 * ブラウザと同じく、`/>`で書いた要素は`img`のような中身を持たない要素の外では閉じない。閉じたと思って書いた所は`selfClosed`で分かる。
 * `script`、`style`、`textarea`、`title`の中身は要素として読まない。`<pre>`の直ぐ後ろの改行は中身に数えない。
 * 閉じない`p`、`li`、`tr`、`td`、`th`は、ブラウザと同じく次の同じ要素か、`p`を閉じる要素の前で閉じる。
 * 字の中の`&amp;`のような書き方は元の字に戻す。
 */

export interface HtmlElement {
  type: "element";
  /** 小文字にした要素の名前。木の根は`#document` */
  name: string;
  /** 属性。名前は小文字、値は書き方を元の字に戻した字。値の無い属性は空の字 */
  attrs: [string, string][];
  children: HtmlNode[];
  line: number;
  column: number;
  /** `/>`で書いたが、中身を持たない要素でないので閉じなかった */
  selfClosed?: boolean;
}

export interface HtmlText {
  type: "text";
  text: string;
  line: number;
  column: number;
}

export type HtmlNode = HtmlElement | HtmlText;

/** 中身を持たない要素 */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
/** 中身を要素として読まない要素 */
const RAW = new Set(["script", "style", "textarea", "title"]);
/** 開くと、開いている`p`を閉じる要素 */
const CLOSES_P = new Set([
  "address", "article", "aside", "blockquote", "details", "div", "dl", "fieldset", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6",
  "header", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "ul",
]);

const NAMED: Readonly<Record<string, string>> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** `&amp;`のような書き方を元の字に戻す。知らない名前の書き方はそのまま残す */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (whole, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    return NAMED[body.toLowerCase()] ?? whole;
  });
}

/** 属性の値に書けるよう、`&`、`"`、`<`、`>`を書き換える */
export const escapeAttr = (text: string): string => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** 要素の字に書けるよう、`&`、`<`、`>`を書き換える */
export const escapeText = (text: string): string => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** HTMLの字を読み、要素の木の根を返す */
export function parseHtml(source: string): HtmlElement {
  const starts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === "\n") starts.push(i + 1);
  const where = (offset: number): { line: number; column: number } => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if ((starts[mid] ?? 0) <= offset) low = mid;
      else high = mid - 1;
    }
    return { line: low + 1, column: offset - (starts[low] ?? 0) + 1 };
  };
  const root: HtmlElement = { type: "element", name: "#document", attrs: [], children: [], line: 1, column: 1 };
  const stack: HtmlElement[] = [root];
  const top = (): HtmlElement => stack[stack.length - 1] ?? root;
  const closeTo = (name: string): boolean => {
    const at = stack.map((element) => element.name).lastIndexOf(name);
    if (at <= 0) return false;
    stack.length = at;
    return true;
  };
  const addText = (text: string, offset: number): void => {
    if (text === "") return;
    const parent = top();
    // `<pre>`の直ぐ後ろの改行は中身に数えない
    let body = text;
    let at = offset;
    if (parent.name === "pre" && parent.children.length === 0 && body.startsWith("\n")) {
      body = body.slice(1);
      at += 1;
    }
    if (body !== "") parent.children.push({ type: "text", text: decodeEntities(body), ...where(at) });
  };
  let i = 0;
  while (i < source.length) {
    const lt = source.indexOf("<", i);
    if (lt < 0) {
      addText(source.slice(i), i);
      break;
    }
    if (lt > i) addText(source.slice(i, lt), i);
    if (source.startsWith("<!--", lt)) {
      const end = source.indexOf("-->", lt + 4);
      i = end < 0 ? source.length : end + 3;
      continue;
    }
    if (source[lt + 1] === "!" || source[lt + 1] === "?") {
      const end = source.indexOf(">", lt);
      i = end < 0 ? source.length : end + 1;
      continue;
    }
    const closing = /^<\/([a-zA-Z][^\s/>]*)[^>]*>?/u.exec(source.slice(lt));
    if (closing) {
      closeTo((closing[1] ?? "").toLowerCase());
      i = lt + closing[0].length;
      continue;
    }
    const opening = /^<([a-zA-Z][^\s/>]*)/u.exec(source.slice(lt));
    if (!opening) {
      addText("<", lt);
      i = lt + 1;
      continue;
    }
    const name = (opening[1] ?? "").toLowerCase();
    const attrs: [string, string][] = [];
    let at = lt + opening[0].length;
    let selfClosed = false;
    for (;;) {
      while (at < source.length && /\s/u.test(source[at] ?? "")) at++;
      if (at >= source.length) break;
      if (source[at] === ">") {
        at++;
        break;
      }
      if (source.startsWith("/>", at)) {
        selfClosed = true;
        at += 2;
        break;
      }
      if (source[at] === "/") {
        at++;
        continue;
      }
      const attr = /^[^\s"'>/=]+/u.exec(source.slice(at));
      if (!attr) {
        at++;
        continue;
      }
      at += attr[0].length;
      while (at < source.length && /\s/u.test(source[at] ?? "")) at++;
      let value = "";
      if (source[at] === "=") {
        at++;
        while (at < source.length && /\s/u.test(source[at] ?? "")) at++;
        const quote = source[at];
        if (quote === '"' || quote === "'") {
          const end = source.indexOf(quote, at + 1);
          value = source.slice(at + 1, end < 0 ? source.length : end);
          at = end < 0 ? source.length : end + 1;
        } else {
          const bare = /^[^\s>]*/u.exec(source.slice(at))?.[0] ?? "";
          value = bare;
          at += bare.length;
        }
      }
      attrs.push([attr[0].toLowerCase(), decodeEntities(value)]);
    }
    // 閉じないp、li、tr、td、thを、ブラウザと同じ所で閉じる
    if (CLOSES_P.has(name) && top().name === "p") stack.pop();
    if (name === "li") closeWithin("li", ["ul", "ol"]);
    if (name === "tr") closeWithin("tr", ["table", "thead", "tbody", "tfoot"]);
    if (name === "td" || name === "th") {
      closeWithin("td", ["tr", "table"]);
      closeWithin("th", ["tr", "table"]);
    }
    const element: HtmlElement = { type: "element", name, attrs, children: [], ...where(lt), ...(selfClosed && !VOID.has(name) ? { selfClosed: true } : {}) };
    top().children.push(element);
    i = at;
    if (VOID.has(name)) continue;
    if (RAW.has(name)) {
      const end = source.toLowerCase().indexOf(`</${name}`, i);
      const body = source.slice(i, end < 0 ? source.length : end);
      if (body !== "") element.children.push({ type: "text", text: name === "script" || name === "style" ? body : decodeEntities(body), ...where(i) });
      const close = end < 0 ? source.length : source.indexOf(">", end);
      i = close < 0 ? source.length : close + 1;
      continue;
    }
    stack.push(element);
  }
  return root;

  /** 開いている`name`の要素を、`fence`の要素より内側に在る時だけ閉じる */
  function closeWithin(name: string, fence: readonly string[]): void {
    for (let k = stack.length - 1; k > 0; k--) {
      const open = stack[k]?.name ?? "";
      if (fence.includes(open)) return;
      if (open === name) {
        stack.length = k;
        return;
      }
    }
  }
}

/** 属性の値。無ければundefined */
export const attrOf = (element: HtmlElement, name: string): string | undefined => element.attrs.find(([key]) => key === name)?.[1];

/** 子の要素 */
export const elementsOf = (element: HtmlElement): HtmlElement[] => element.children.filter((child): child is HtmlElement => child.type === "element");

/** 直ぐ下の字を全てつないで、前後の空白を外した字 */
export const ownText = (element: HtmlElement): string =>
  element.children
    .filter((child): child is HtmlText => child.type === "text")
    .map((child) => child.text)
    .join("")
    .trim();

/** 中の全ての字をつないだ字 */
export const textOf = (node: HtmlNode): string => (node.type === "text" ? node.text : node.children.map(textOf).join(""));

/** 要素をHTMLの字に書き戻す。読んだ字と同じにはならず、属性の書き方と空白は整える */
export function serialize(node: HtmlNode): string {
  if (node.type === "text") return escapeText(node.text);
  const attrs = node.attrs.map(([name, value]) => (value === "" ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`)).join("");
  if (VOID.has(node.name)) return `<${node.name}${attrs}>`;
  const inner = RAW.has(node.name) && (node.name === "script" || node.name === "style") ? node.children.map((child) => (child.type === "text" ? child.text : "")).join("") : node.children.map(serialize).join("");
  return `<${node.name}${attrs}>${inner}</${node.name}>`;
}
