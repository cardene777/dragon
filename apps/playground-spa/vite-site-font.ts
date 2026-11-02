import { readFileSync } from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

import { codesOf, rangeOf } from "./scripts/unicode-ranges.mjs";

/** 切り出した字の面。`scripts/site-fonts.mjs` が書く */
const SITE_CSS = path.resolve(__dirname, "src/site/font/noto-sans-jp-site.css");
/** 分割された字の面を並べた CSS */
const ORIGINAL_CSS = /\/@fontsource-variable\/noto-sans-jp\/index\.css(?:\?|$)/u;
/** ASCII のために必ず読むので、範囲を変えない面 */
const LATIN_FACE = /noto-sans-jp-latin-wght/u;
const FACE = /@font-face\s*\{[^}]*\}/gu;
const RANGE = /unicode-range:\s*([^;}]+)/u;

/** 分割された字の面から `taken` の字を外す。字が 1 つも残らない面は消す */
function trimFaces(css: string, taken: ReadonlySet<number>): string {
  return css.replace(FACE, (face) => {
    const list = RANGE.exec(face)?.[1];
    if (list === undefined || LATIN_FACE.test(face)) return face;
    const left = codesOf(list).filter((code) => !taken.has(code));
    return left.length === 0 ? "" : face.replace(list, rangeOf(left));
  });
}

/**
 * 見本帳の字の CSS で、切り出した字に在る字を分割された字の面の範囲から外す (#3296)。
 *
 * 面の範囲が重なると、Firefox は切り出した字を読んでいる間に、重なった分割された字の file も読み始める。
 * 使い方の頁で 42 件読み、切り出した字の分だけ今より重くなった。範囲を外せば、どのブラウザーでも読む字が決まる。
 * `latin` の字も外すのは、番号付きの面が ASCII を持っていて、同じ重なりが起きるから。
 */
export function createSiteFontPlugin(): Plugin {
  return {
    name: "dragon-site-font",
    enforce: "pre",
    transform(code, id) {
      if (!ORIGINAL_CSS.test(id)) return null;
      const latin = RANGE.exec(code.match(FACE)?.find((face) => LATIN_FACE.test(face)) ?? "")?.[1];
      const site = RANGE.exec(readFileSync(SITE_CSS, "utf8"))?.[1];
      if (latin === undefined || site === undefined) this.error("字の範囲を読めない");
      return trimFaces(code, new Set([...codesOf(latin), ...codesOf(site)]));
    },
  };
}
