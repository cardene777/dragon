/**
 * 頁にHTMLの形で書いた図を、script の1行の入口がその場で描く (#3908)。
 *
 * 頁に入口の1行と`<dg-<種類>>`の図を置くと、図は記法の塊 (`<pre class="dragon">`) で書いた時と同じく動く図に置き換わり、
 * 再生の帯を持って段ごとに動く。HTMLの形を読む処理は後から読む塊に置き、記法の塊だけの頁が最初に読む量を増やさない。
 *
 * 入口の file は build した`dist/cdn`から読み、頁は`http://localhost/`に置く。外への通信は全て止める。
 * 頁を開いて押して待つ仕事は、1 件 10 秒の上限に掛からない file を読み込む段 (`at-load.ts`) で済ませる (#3815)。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { ACTION_LIMIT_MS } from "./page-wait";
import { fileChromium } from "./page-needs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = join(ROOT, "dist/cdn");
const ENTRY = "dragon.js";
const PAGE = "http://localhost/";
const LOCAL_ROOT = "http://localhost/cdn/";
/** 図の字の CSS。jsDelivr の fontsource の版ごとの`index.css` */
const FONT_CSS = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource-variable\/(noto-sans-jp|jetbrains-mono)@[^/]+\/index\.css$/u;
/** 図が置き換わるのを待つ長さ */
const SETTLE = 15_000;

/** HTMLの形で書いた時系列図。箱 2 つ、段 2 つ */
const FIGURE = [
  '<dg-sequence title="ログイン">',
  '  <dg-box id="browser">ブラウザ</dg-box>',
  '  <dg-box id="app">アプリ</dg-box>',
  '  <dg-step title="押す">',
  "    <dg-body>利用者がログインを押す。</dg-body>",
  '    <dg-edge from="browser" to="app">GET /login</dg-edge>',
  "  </dg-step>",
  '  <dg-step title="返す">',
  "    <dg-body>アプリが認可の頁へ送る。</dg-body>",
  '    <dg-edge from="app" to="browser">認可の頁へ送る</dg-edge>',
  "  </dg-step>",
  "</dg-sequence>",
].join("\n");

/** 頁で見たこと */
interface Seen {
  /** 再生の部品の数と、図を描いた再生の部品の数と、残ったHTMLの形の図の数 */
  counted: { players: number; drawn: number; forms: number };
  /** 再生の帯の段の数 */
  segments: number;
  /** 帯を押す前と、次の段の釦を押した後の段の題 */
  titles: { first: string | null; next: string | null };
  /** 止めた外への通信 */
  outside: string[];
}

const DRAWN = await atLoad("HTMLの形の図を置いた頁を開き、次の段へ送る", async (): Promise<Seen | undefined> => {
  if (!existsSync(join(CDN, ENTRY))) return undefined;
  const context = await (await fileChromium()).newContext({ viewport: { width: 960, height: 720 } });
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  const outside: string[] = [];
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><script type="module" src="${LOCAL_ROOT}${ENTRY}"></script></head><body><p>ログインの流れ。</p>\n${FIGURE}\n</body></html>`;
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (url === PAGE) return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
    if (url.startsWith(LOCAL_ROOT)) {
      const path = join(CDN, url.slice(LOCAL_ROOT.length));
      if (!existsSync(path)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ contentType: path.endsWith(".js") ? "text/javascript" : "application/json", body: readFileSync(path) });
    }
    if (FONT_CSS.test(url)) return route.fulfill({ contentType: "text/css", body: "" });
    outside.push(url);
    return route.abort();
  });
  try {
    const page = await context.newPage();
    await page.goto(PAGE);
    await page
      .waitForFunction(() => document.querySelectorAll("dg-sequence").length === 0 && document.querySelector('[data-dragon="player"] svg') !== null, undefined, { timeout: SETTLE })
      .catch(() => undefined);
    const counted = await page.evaluate(() => {
      const players = [...document.querySelectorAll('[data-dragon="player"]')];
      return { players: players.length, drawn: players.filter((player) => player.querySelector("svg") !== null).length, forms: document.querySelectorAll("dg-sequence").length };
    });
    const segments = await page.locator('[data-dragon="segment"]').count();
    const titleOf = (): Promise<string | null> => page.evaluate(() => document.querySelector('[data-dragon="step-title"]')?.textContent ?? null);
    let first: string | null = null;
    let next: string | null = null;
    if (counted.drawn > 0) {
      // 流れを止めて最初の段へ戻してから、次の段の釦で 1 段送る
      await page.locator('[data-dragon="toggle"]').click();
      await page.locator('[data-dragon="restart"]').click();
      first = await titleOf();
      await page.locator('[data-dragon="next"]').click();
      await page.waitForFunction((before) => document.querySelector('[data-dragon="step-title"]')?.textContent !== before, first, { timeout: ACTION_LIMIT_MS }).catch(() => undefined);
      next = await titleOf();
    }
    return { counted, segments, titles: { first, next }, outside };
  } finally {
    await context.close();
  }
});

describe("頁に置いたHTMLの形の図 (#3908)", () => {
  it("html-form-draws-in-page", () => {
    const seen = DRAWN.get();
    expect(seen, `入口の file が無い: ${join(CDN, ENTRY)}`).toBeDefined();
    if (!seen) return;
    expect(seen.counted, "HTMLの形の図が1つの動く図に置き換わる").toEqual({ players: 1, drawn: 1, forms: 0 });
    expect(seen.segments, "再生の帯が図の段の数だけ区切りを持つ").toBe(2);
    expect(seen.titles, "次の段の釦で 1 段目から 2 段目へ送る").toEqual({ first: "押す", next: "返す" });
    expect(seen.outside, "入口と塊と字の CSS のほかに取りに行った物").toEqual([]);
  });
});
