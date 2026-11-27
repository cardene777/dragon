/**
 * jsDelivr の script の1行で dragon を読む頁を、`http://localhost/` に置いた Chromium で開く道具 (#3755)。
 *
 * 頁が jsDelivr から読む dragon の入口と塊は build した `dist/cdn` から返し、図の字の CSS は空の CSS で返す。
 * 頁の file は渡した表から返し、ほかの外への通信は止めて数える。
 * Chromium は file で 1 つの物 (`page-needs.ts` の `fileChromium`) を借り、頁は文脈ごとに開いて閉じる。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright-core";

import { fileChromium } from "./page-needs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = join(ROOT, "dist/cdn");

/** 頁を置く場所 */
export const SITE = "http://localhost/";
/** jsDelivr の dragon の入口と塊。版の範囲 (`@0.77`) でも版を全て書いた形でも、build した `dist/cdn` の file を返す */
const DRAGON =
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/@cardenelabs\/dragon@[^/]+\/dist\/cdn\/([^?#]+)$/u;
/** 図の字の CSS。jsDelivr の fontsource の版ごとの `index.css` */
const FONT_CSS = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource-variable\/[^/]+\/index\.css$/u;
const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
};

/** 頁の file の表。置き場からの path と、中身の字か byte */
export type SiteFiles = Readonly<Record<string, string | Buffer>>;

/** script の1行の入口を読む HTML の頁。`body` は頁の中身 */
export const cdnPage = (body: string, lang = "ja"): string =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
  `<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@0.88/dist/cdn/dragon.js"></script></head><body>${body}</body></html>`;

/** HTML の字として書けるよう、`<` と `&` を逃がす */
export const escapeHtml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

/**
 * `files` を置いた所で `path` の頁を開き、`run` を回す。`outside` は止めた外への通信の URL。
 * 頁は回し終えたら閉じる
 */
export async function withSite<T>(
  files: SiteFiles,
  path: string,
  run: (page: Page, outside: string[]) => Promise<T>,
  viewport: { width: number; height: number } = { width: 1200, height: 900 },
): Promise<T> {
  const context = await (await fileChromium()).newContext({ viewport });
  const outside: string[] = [];
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    const dragon = DRAGON.exec(url)?.[1];
    if (dragon !== undefined) {
      const file = join(CDN, dragon);
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({
        contentType: TYPES[extname(file)] ?? "application/octet-stream",
        body: readFileSync(file),
      });
    }
    if (FONT_CSS.test(url)) return route.fulfill({ contentType: "text/css", body: "" });
    if (url.startsWith(SITE)) {
      const name = decodeURIComponent(new URL(url).pathname.slice(1));
      const body = files[name];
      if (body === undefined) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({
        contentType: TYPES[extname(name)] ?? "application/octet-stream",
        body,
      });
    }
    outside.push(url);
    return route.abort();
  });
  try {
    const page = await context.newPage();
    await page.goto(`${SITE}${path}`);
    return await run(page, outside);
  } finally {
    await context.close();
  }
}
