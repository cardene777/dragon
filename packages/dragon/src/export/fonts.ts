/**
 * 書き出す図で描く字だけに、同梱した字の file を削る。
 *
 * 同梱した字の package は、字の範囲ごとに分けた file (woff2) と、file ごとの範囲の表 (`unicode.json`) を持つ。
 * 描く字が入る file だけを、描く字だけに削り、`data:` で埋めた `@font-face` にする。
 * 太さの軸は、値の表 (`TYPE`) が使う太さの間に縮める。
 *
 * 形を 1 つも持たない字の file を Chromium は読まない。空白の類だけを描く file には、
 * 同じ file の形のある字を 1 つ足して削る。足した字は `unicode-range` に載せないので描かれない (#3212)。
 */
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { FONTS } from "../look/fonts";
import { TYPE } from "../look/values";

const require_ = createRequire(import.meta.url);
// subset-font は型を持たないので、使う形だけをここで名指す
const subsetFont = require_("subset-font") as (
  font: Buffer,
  text: string,
  options: { targetFormat: "woff2"; variationAxes: Record<string, { min: number; max: number }> },
) => Promise<Buffer>;

/** 字の名前と、その字を持つ package */
const PACKAGES = [
  { family: FONTS.sans, name: "noto-sans-jp" },
  { family: FONTS.mono, name: "jetbrains-mono" },
] as const;

const weights = Object.values(TYPE).map((style) => style.weight);
const WEIGHT = { min: Math.min(...weights), max: Math.max(...weights) };

/** `U+30-39,U+3000-303F` の形の範囲の一覧 */
function ranges(list: string): [number, number][] {
  return list.split(",").map((part) => {
    const [from = "", to = from] = part.trim().replace(/^U\+/i, "").split("-");
    return [parseInt(from, 16), parseInt(to, 16)];
  });
}

const hex = (code: number): string => `U+${code.toString(16).toUpperCase()}`;

/** 形を持たない字 (空白の類、書式の字、制御の字) か */
const shapeless = (char: string): boolean => /^[\s\p{Cf}\p{Cc}]$/u.test(char);

/** 範囲の中で最初の、形を持つ字。空白の類だけを描く file を読める形にするために足す */
function shapedIn(span: [number, number][]): string | undefined {
  for (const [from, to] of span) {
    for (let code = from; code <= to; code++) {
      const char = String.fromCodePoint(code);
      if (!shapeless(char)) return char;
    }
  }
  return undefined;
}

/** 字を空白ごと集める。改行は字の file に要らない */
export function charsOf(texts: string[]): string[] {
  return [...new Set([...texts.join("")])].filter((char) => char !== "\n" && char !== "\r" && char !== "\t").sort();
}

/** 描く字だけに削った字の file を `data:` で埋めた `@font-face` の並び */
export async function fontFaces(chars: string[]): Promise<string> {
  const faces = await Promise.all(
    PACKAGES.flatMap(({ family, name }) => {
      const base = dirname(require_.resolve(`@fontsource-variable/${name}/unicode.json`));
      const table = JSON.parse(readFileSync(join(base, "unicode.json"), "utf8")) as Record<string, string>;
      return Object.entries(table).map(async ([key, list]) => {
        const span = ranges(list);
        const own = chars.filter((char) => {
          const code = char.codePointAt(0) ?? -1;
          return span.some(([from, to]) => code >= from && code <= to);
        });
        if (!own.length) return "";
        const filler = own.every(shapeless) ? (shapedIn(span) ?? "") : "";
        const file = join(base, "files", `${name}-${key.replace(/[[\]]/g, "")}-wght-normal.woff2`);
        const woff2 = await subsetFont(await readFile(file), own.join("") + filler, { targetFormat: "woff2", variationAxes: { wght: WEIGHT } });
        const unicode = own.map((char) => hex(char.codePointAt(0) ?? 0)).join(",");
        return `@font-face{font-family:"${family}";font-style:normal;font-display:block;font-weight:${WEIGHT.min} ${WEIGHT.max};src:url(data:font/woff2;base64,${woff2.toString("base64")}) format("woff2");unicode-range:${unicode}}`;
      });
    }),
  );
  return faces.join("");
}
