/**
 * `dragon embed` が書く、外へ通信しない1 file の HTML (#3343)。
 *
 * 頁の入口の1行 (src が `dist/cdn/dragon.js` で終わる script) を、全ての種類の部品を束ねた script の中身に置き換える。
 * 埋めた script は字の CSS を読まないので、図は端末の字で描く。記法の塊と、頁のほかの部分は書いたまま残す。
 * 頁の記法が絵柄集の絵柄 (`tabler:<名前>`) を書いていれば、その絵柄の形だけを script の前に収める (#3493)。
 */
import { readFileSync } from "node:fs";
import { iconsElement } from "../blocks/icon/page-icons";

/** 埋める script。build で `script-offline.ts` を 1 file に束ねた物 */
const OFFLINE = new URL("./offline.global.js", import.meta.url);

/** 入口の1行。jsDelivr のほか、手元や別の置き場の写しを読む行も同じに扱う */
const ENTRY_LINE = /<script\b[^>]*\bsrc\s*=\s*(["'])[^"']*\/dist\/cdn\/dragon\.js\1[^>]*>\s*<\/script\s*>/giu;

/** 入口の1行を埋めた script に置き換えた HTML。1行が無ければ `undefined`。2行目からは同じ script を2度回さないよう消す */
export function embedPage(html: string): string | undefined {
  if (html.search(ENTRY_LINE) < 0) return undefined;
  // `</script>` で script が途切れないよう、書き出しの頁と同じく逃がす
  const script = readFileSync(OFFLINE, "utf8").replace(/<\/script/giu, "<\\/script");
  let first = true;
  return html.replace(ENTRY_LINE, () => {
    if (!first) return "";
    first = false;
    return `${iconsElement(pageIcons(html))}<script>${script}</script>`;
  });
}

/** 頁の字に書いた絵柄集の絵柄 (`icon: tabler:<名前>`) の名前。同じ名前は 1 度だけ */
const pageIcons = (html: string): string[] => [...new Set([...html.matchAll(/\bicon:\s*(tabler:[a-z0-9]+(?:-[a-z0-9]+)*)/gu)].map((match) => match[1] as string))];
