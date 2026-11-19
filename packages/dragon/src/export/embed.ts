/**
 * `dragon embed` が書く、外へ通信しない1 file の HTML (#3343)。
 *
 * 頁の入口の1行 (src が `dist/cdn/dragon.js` で終わる script) を、全ての種類の部品を束ねた script の中身に置き換える。
 * 埋めた script は字の CSS を読まないので、図は端末の字で描く。記法の塊と、頁のほかの部分は書いたまま残す。
 * 頁の記法が絵柄集の絵柄 (`tabler:<名前>`) を書いていれば、その絵柄の形だけを script の前に収める (#3493)。
 * 頁の配管の図の塊は、最初に見える形と畳んだ箱を 1 つだけ開いた形の並べ方を組んで script の前に収める (#3748)。
 * 頁は収めた並べ方で、道を探さずに図を描く。
 */
import { readFileSync } from "node:fs";
import { iconsElement } from "../blocks/icon/page-icons";
import { dedent } from "../embed/dedent";
import type { StoredPipeLayout } from "../kinds/pipe/layout";
import { parseNotation } from "../parser";
import type { NotationLang } from "../words";
import { pipeLayouts } from "./layouts";

/** 埋める script。build で `script-offline.ts` を 1 file に束ねた物 */
const OFFLINE = new URL("./offline.global.js", import.meta.url);

/** 入口の1行。jsDelivr のほか、手元や別の置き場の写しを読む行も同じに扱う */
const ENTRY_LINE = /<script\b[^>]*\bsrc\s*=\s*(["'])[^"']*\/dist\/cdn\/dragon\.js\1[^>]*>\s*<\/script\s*>/giu;

/** 入口の1行を埋めた script に置き換えた HTML。1行が無ければ `undefined`。2行目からは同じ script を2度回さないよう消す */
export function embedPage(html: string): string | undefined {
  if (html.search(ENTRY_LINE) < 0) return undefined;
  return embedPageWith(html, readFileSync(OFFLINE, "utf8"));
}

/** `embedPage` の中身。埋める script の中身 `script` を受け取り、file を読まない */
export function embedPageWith(html: string, script: string): string | undefined {
  if (html.search(ENTRY_LINE) < 0) return undefined;
  // `</script>` で script が途切れないよう、書き出しの頁と同じく逃がす
  const body = script.replace(/<\/script/giu, "<\\/script");
  const layouts = pageBlockLayouts(html);
  const stored = layouts.length > 0 ? `<script type="application/json" id="dragon-layouts">${JSON.stringify(layouts).replace(/</gu, "\\u003c")}</script>` : "";
  let first = true;
  return html.replace(ENTRY_LINE, () => {
    if (!first) return "";
    first = false;
    return `${stored}${iconsElement(pageIcons(html))}<script>${body}</script>`;
  });
}

/** 頁の字に書いた絵柄集の絵柄 (`icon: tabler:<名前>`) の名前。同じ名前は 1 度だけ */
const pageIcons = (html: string): string[] => [...new Set([...html.matchAll(/\bicon:\s*(tabler:[a-z0-9]+(?:-[a-z0-9]+)*)/gu)].map((match) => match[1] as string))];

/** 頁の記法の塊の中身。頁の script (`page-blocks.ts`) と同じく、`<pre class="dragon">` と Markdown の囲みから作った `<pre><code class="language-dragon">` */
const BLOCK = /<pre\b[^>]*\bclass\s*=\s*(["'])(?:[^"']*\s)?dragon(?:\s[^"']*)?\1[^>]*>([\s\S]*?)<\/pre\s*>/giu;
const CODE_BLOCK = /<pre\b[^>]*>\s*<code\b[^>]*\bclass\s*=\s*(["'])(?:[^"']*\s)?language-dragon(?:\s[^"']*)?\1[^>]*>([\s\S]*?)<\/code\s*>/giu;

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };

/** 塊の中身の字。頁が読む `textContent` と同じく、中の要素の印を外して文字の参照を字に戻す */
const textOf = (inner: string): string =>
  inner
    .replace(/<[^>]*>/gu, "")
    .replace(/&(?:#x([0-9a-f]+)|#([0-9]+)|([a-z]+));/giu, (whole, hex?: string, dec?: string, name?: string) => {
      if (hex !== undefined) return String.fromCodePoint(Number.parseInt(hex, 16));
      if (dec !== undefined) return String.fromCodePoint(Number.parseInt(dec, 10));
      return ENTITY[(name ?? "").toLowerCase()] ?? whole;
    });

/** 頁の言葉。頁の script と同じく、`<html>` の `lang` 属性が `ja` で始まれば日本語、ほかは英語 */
const pageLang = (html: string): NotationLang => (/<html\b[^>]*\blang\s*=\s*(["']?)ja/iu.test(html) ? "ja" : "en");

/**
 * 頁の配管の図の塊ごとに、頁の script が描く時と同じ言葉で読み、最初に見える形と畳んだ箱を 1 つだけ開いた形の並べ方を組む (#3748)。
 * 読めない塊と配管の図でない塊は飛ばす。頁は飛ばした塊をその場で組んで描く。同じ鍵の並べ方は 1 つだけ収める
 */
export function pageBlockLayouts(html: string): StoredPipeLayout[] {
  const lang = pageLang(html);
  const found = new Map<string, StoredPipeLayout>();
  for (const match of [...html.matchAll(BLOCK), ...html.matchAll(CODE_BLOCK)]) {
    const parsed = parseNotation(dedent(textOf(match[2] ?? "")), { lang });
    if (!parsed.ok || parsed.diagram.kind !== "pipe") continue;
    for (const stored of pipeLayouts(parsed.diagram, { lang })) found.set(stored.key, stored);
  }
  return [...found.values()];
}
