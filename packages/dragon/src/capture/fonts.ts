/**
 * 頁で描いた SVG の字を、画像に埋める `@font-face` にする (#3644)。
 *
 * SVG を画像として描く時、画像の中からは頁の字の file を読めない。頁が読み込んだ `@font-face` から、
 * SVG が描く字の範囲 (`unicode-range`) に当たる字の file だけを読み、丸ごと `data:` で埋める。
 * 字の file を削る道具 (`subset-font` の wasm) はブラウザに載せない。文字の多い図では埋める量が増え、書き出しが数秒遅くなる。
 *
 * 字は要素ごとに、計算した `font-family` の並びの前から、その字の範囲を持つ `@font-face` が在る字の名前を選ぶ。
 * 字の file を読めない時と、読める `@font-face` が無いのに頁が字を持つ時 (別の場所の CSS、script で足した字) は、
 * 読めない字の名前と範囲を名指して断り、字の無い画像を返さない。
 *
 * 埋めた字は返す前に頁で 1 度読み込む。画像は字の file を読み終える前に描かれることがあり、
 * 頁で同じ `data:` の字を読み込んでおくと、画像を描く時に読み終えた字を使う (Chromium で確かめた)。
 *
 * HTML の頁 (#3667) は、図が名指す 2 つの字 (`FONTS`) について、頁と再生の帯で描かれうる字の範囲に当たる `@font-face` を埋める。
 * 範囲が重なる `@font-face` は、ブラウザと同じく後に宣言した 1 つだけを選ぶ。
 */
import { FONTS } from "../look/fonts";
import type { NotationLang } from "../words";

/** 字を埋める先。断りの文の言い方を替える */
type Target = "image" | "page";

/** 読めない字の file の断り。読めない物を `"<字の名前>" <字の範囲>` で並べて名指す */
const UNREADABLE: Record<NotationLang, Record<Target, (faces: string[]) => string>> = {
  ja: {
    image: (faces) => `画像に埋める字の file を読めない (${faces.join("、")})`,
    page: (faces) => `HTML の頁に埋める字の file を読めない (${faces.join("、")})`,
  },
  en: {
    image: (faces) => `Cannot read the font files to embed in the image (${faces.join("; ")})`,
    page: (faces) => `Cannot read the font files to embed in the HTML page (${faces.join("; ")})`,
  },
};

/** 字の範囲。`[始め, 終わり]` の並び */
type Span = [number, number][];

/** 頁の `@font-face` の 1 つ */
interface Face {
  family: string;
  italic: boolean;
  span: Span;
  /** 範囲を CSS の書き方で。断りの文に使う */
  range: string;
  /** 字の file の URL。読めない書き方の時は空 */
  url: string;
  rule: CSSFontFaceRule;
}

const ALL: Span = [[0, 0x10ffff]];

/** `U+30-39, U+4??` の形の範囲 */
function spanOf(list: string): Span {
  if (list.trim() === "") return ALL;
  return list.split(",").map((part) => {
    const text = part.trim().replace(/^U\+/iu, "");
    if (text.includes("?")) return [parseInt(text.replaceAll("?", "0"), 16), parseInt(text.replaceAll("?", "F"), 16)];
    const [from = "0", to = from] = text.split("-");
    return [parseInt(from, 16), parseInt(to, 16)];
  });
}

const covers = (span: Span, code: number): boolean => span.some(([from, to]) => code >= from && code <= to);

/** 字の名前の比べ方。囲みの引用符を外し、大文字と小文字を区別しない */
const familyKey = (name: string): string => name.trim().replace(/^["']|["']$/gu, "").toLowerCase();

/** 斜めの字か。`italic` と `oblique` を同じに扱う */
const slanted = (style: string): boolean => /italic|oblique/u.test(style);

/** `src` の中の字の file の URL。woff2 と書いた物を先に選ぶ */
function sourceOf(src: string): string {
  const urls = [...src.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)\s*(?:format\(\s*["']?([^"')]+)["']?\s*\))?/gu)].map((m) => ({ url: m[2] ?? "", format: m[3] ?? "" }));
  return (urls.find((u) => /woff2/u.test(u.format) || /\.woff2(?:$|[?#])/u.test(u.url)) ?? urls[0])?.url ?? "";
}

/** 字の規則を、`@import` と入れ子の規則 (`@media` など) の中までたどって集める。読めない CSS (別の場所の物) は飛ばす */
function collectRules(sheet: CSSStyleSheet, into: CSSFontFaceRule[]): void {
  let rules: CSSRuleList;
  try {
    rules = sheet.cssRules;
  } catch {
    return;
  }
  const walk = (list: CSSRuleList): void => {
    for (const rule of list) {
      if (rule instanceof CSSFontFaceRule) into.push(rule);
      else if (rule instanceof CSSImportRule) {
        if (rule.styleSheet) collectRules(rule.styleSheet, into);
      } else if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  walk(rules);
}

/** 頁の `@font-face` の全て */
function pageFaces(doc: Document): Face[] {
  const rules: CSSFontFaceRule[] = [];
  for (const sheet of doc.styleSheets) collectRules(sheet, rules);
  return rules.map((rule) => {
    const range = rule.style.getPropertyValue("unicode-range").trim();
    const src = sourceOf(rule.style.getPropertyValue("src"));
    const base = rule.parentStyleSheet?.href ?? doc.baseURI;
    let url = "";
    try {
      url = src === "" ? "" : new URL(src, base).href;
    } catch {
      url = "";
    }
    return {
      family: familyKey(rule.style.getPropertyValue("font-family")),
      italic: slanted(rule.style.getPropertyValue("font-style")),
      span: spanOf(range),
      range: range === "" ? "U+0-10FFFF" : range,
      url,
      rule,
    };
  });
}

/** SVG が描く字を、要素ごとの字の名前の並びと斜めかで分けて集める。`<style>` などの描かない字は数えない */
function drawnTexts(svg: SVGSVGElement): { families: string[]; italic: boolean; chars: Set<string> }[] {
  const view = svg.ownerDocument.defaultView;
  const groups = new Map<string, { families: string[]; italic: boolean; chars: Set<string> }>();
  const walker = svg.ownerDocument.createTreeWalker(svg, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest("style, script, title, desc, metadata")) continue;
    const style = view?.getComputedStyle(parent);
    const families = (style?.fontFamily ?? "").split(",").map(familyKey).filter((name) => name !== "");
    const italic = slanted(style?.fontStyle ?? "");
    const key = `${italic ? "i" : "n"}:${families.join(",")}`;
    const group = groups.get(key) ?? { families, italic, chars: new Set<string>() };
    for (const char of node.textContent ?? "") if (char !== "\n" && char !== "\r" && char !== "\t") group.chars.add(char);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** 頁が読み込んだ字のうち、`@font-face` の規則を持たない物 (script で足した字など) から、字の名前と字を範囲に持つ物を探す */
function loadedFace(doc: Document, family: string, code: number): FontFace | undefined {
  const loaded: FontFace[] = [];
  doc.fonts?.forEach((face) => loaded.push(face));
  return loaded.find((face) => familyKey(face.family) === family && covers(spanOf(face.unicodeRange), code));
}

/** 読めない字の名前と範囲。断りの文に使う */
const hiddenName = (face: FontFace): string => `"${face.family.replace(/^["']|["']$/gu, "")}" ${face.unicodeRange}`;

/**
 * 描く字が要る `@font-face` と、頁が字を持つのに読める `@font-face` が無い字の範囲。
 * 字の名前の並びの前から、その字を範囲に持つ `@font-face` が在る名前を選ぶ。斜めかが合う物が無い時は、斜めかを問わない
 */
function neededFaces(svg: SVGSVGElement, faces: Face[]): { needed: Face[]; hidden: string[] } {
  const needed = new Set<Face>();
  const hidden = new Set<string>();
  for (const { families, italic, chars } of drawnTexts(svg)) {
    for (const char of chars) {
      const code = char.codePointAt(0) ?? 0;
      for (const family of families) {
        const own = faces.filter((face) => face.family === family && covers(face.span, code));
        const fit = own.filter((face) => face.italic === italic);
        const chosen = fit.length ? fit : own;
        if (chosen.length) {
          for (const face of chosen) needed.add(face);
          break;
        }
        // 読める `@font-face` は無いが頁が字を持つ。字の中身を読めないまま画像にすると、端末の字で描かれる
        const unseen = loadedFace(svg.ownerDocument, family, code);
        if (unseen) {
          hidden.add(hiddenName(unseen));
          break;
        }
      }
    }
  }
  return { needed: [...needed], hidden: [...hidden] };
}

/**
 * HTML の頁の字 `texts` が要る `@font-face`。図が名指す 2 つの字ごとに、字を範囲に持つ斜めでない `@font-face` を選ぶ。
 * 範囲が重なる時は、ブラウザが描く時と同じく後に宣言した 1 つを選ぶ。
 * 字を持つ `@font-face` が無いのに頁が字を持つ時は、読めない字の範囲として返す
 */
function pageNeededFaces(doc: Document, faces: Face[], texts: readonly string[]): { needed: Face[]; hidden: string[] } {
  const needed = new Set<Face>();
  const hidden = new Set<string>();
  const chars = new Set([...texts.join("")].filter((char) => char !== "\n" && char !== "\r" && char !== "\t"));
  for (const family of Object.values(FONTS).map(familyKey)) {
    const own = faces.filter((face) => face.family === family);
    const upright = own.filter((face) => !face.italic);
    const usable = upright.length ? upright : own;
    for (const char of chars) {
      const code = char.codePointAt(0) ?? 0;
      let chosen: Face | undefined;
      for (const face of usable) if (covers(face.span, code)) chosen = face;
      if (chosen) {
        needed.add(chosen);
        continue;
      }
      const unseen = loadedFace(doc, family, code);
      if (unseen) hidden.add(hiddenName(unseen));
    }
  }
  // 頁に宣言した順に並べ、範囲が重なる時に後の物が勝つ順を埋めた CSS でも保つ
  return { needed: faces.filter((face) => needed.has(face)), hidden: [...hidden] };
}

/** byte の並びを base64 にする */
function base64(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}

/** 字の file を `data:` の URL にする。読めない時は undefined */
async function dataUrl(url: string): Promise<string | undefined> {
  if (url.startsWith("data:")) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    return `data:font/woff2;base64,${base64(new Uint8Array(await response.arrayBuffer()))}`;
  } catch {
    return undefined;
  }
}

/** `@font-face` の `src` と `font-display` のほかの書き方を写し、字の file を `data:` で埋めた規則にする */
function embedded(face: Face, data: string): string {
  const style = face.rule.style;
  const lines: string[] = [];
  for (let i = 0; i < style.length; i++) {
    const name = style.item(i);
    if (name === "src" || name === "font-display") continue;
    lines.push(`${name}:${style.getPropertyValue(name)}`);
  }
  // 字の file を読み終えるまで端末の字で描かないよう、待つ形にする
  return `@font-face{${[...lines, "font-display:block", `src:url(${data}) format("woff2")`].join(";")}}`;
}

/**
 * `needed` の字の file を読み、`data:` で埋めた `@font-face` の並びにする。
 * 読めない字の file が 1 つでも在る時と `hidden` が在る時は、読めない字の名前と範囲を `lang` の言葉で名指して断る
 */
async function embedFaces({ needed, hidden }: { needed: Face[]; hidden: string[] }, lang: NotationLang, target: Target): Promise<string> {
  const unreadable = [...hidden];
  const named = (face: Face): string => `"${face.rule.style.getPropertyValue("font-family").trim().replace(/^["']|["']$/gu, "")}" ${face.range}`;
  const rules = await Promise.all(
    needed.map(async (face) => {
      const data = face.url === "" ? undefined : await dataUrl(face.url);
      // 頁で 1 度読み込む。読めない中身の file もここで見つける
      const ok =
        data !== undefined &&
        (await new FontFace(face.family, `url(${data}) format("woff2")`)
          .load()
          .then(() => true)
          .catch(() => false));
      if (!ok) {
        unreadable.push(named(face));
        return "";
      }
      return embedded(face, data);
    }),
  );
  if (unreadable.length) throw new Error(UNREADABLE[lang][target](unreadable));
  return rules.join("");
}

/**
 * SVG が描く字の `@font-face` を、字の file を `data:` で埋めた CSS にする。
 * 読めない字の file が 1 つでも在る時は、読めない字の名前と範囲を `lang` の言葉で名指して断る
 */
export async function embeddedFontCss(svg: SVGSVGElement, lang: NotationLang): Promise<string> {
  return embedFaces(neededFaces(svg, pageFaces(svg.ownerDocument)), lang, "image");
}

/**
 * HTML の頁で描かれうる字 `texts` の `@font-face` を、頁 `doc` が読み込んだ字の file を `data:` で埋めた CSS にする (#3667)。
 * 読めない字の file が 1 つでも在る時は、読めない字の名前と範囲を `lang` の言葉で名指して断る
 */
export async function pageFontCss(doc: Document, texts: readonly string[], lang: NotationLang): Promise<string> {
  return embedFaces(pageNeededFaces(doc, pageFaces(doc), texts), lang, "page");
}
