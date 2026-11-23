/**
 * `user-blocks.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { ACTION_LIMIT_MS } from "./page-wait";
import { fileChromium } from "./page-needs";
import "../src/kind-use/architecture";

/** 足した箱の形の path。形を囲む最も小さい四角を箱の枠いっぱいに伸ばす (#3520) */
const BRIDGE = "M 0 70 Q 50 0 100 70 Z";

/** 足した印の path。今の絵柄と同じく、(0, 0) を中心に 20 四方へ収める */
const KEY = "M -8 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 0 0 h 8 M 5 0 v 3";

/** 箱と線と印の 3 つを足す定義の記法 */
const DEFS = [
  "blocks 1",
  "block +bridge",
  "  base box",
  `  shape path "${BRIDGE}"`,
  "  color violet",
  "end",
  "block +wire",
  "  base edge",
  "  shape dashed",
  "  color amber",
  "end",
  "block +key",
  "  base icon",
  `  shape path "${KEY}"`,
  "end",
].join("\n");

/** 足したブロックを使う図の中身。1 段目は今の線で橋へ送り、2 段目は足した線で橋から渡す */
const BODY = [
  "box eth as Ethereum",
  "+bridge cc as CCIP [note: 橋]",
  "box base as Base [icon: +key]",
  "",
  "step 送る",
  "  say トークンを橋へ送る。",
  "  eth -> cc: 送る",
  "",
  "step 渡す",
  "  say 橋がトークンを渡す。",
  "  cc +wire base: 渡す",
].join("\n");

/** 定義を持たない記法。定義は code か頁の link から渡す */
const BARE_TEXT = `architecture 橋を渡る\n\n${BODY}\n`;

/* 頁の `<link rel="dragon-blocks">` は script の 1 行の入口が読む。入口と塊は build した `dist/cdn` から渡す */
const CDN = join(process.cwd(), "packages/dragon/dist/cdn");

const PAGE = "http://localhost/";

const LOCAL = "http://localhost/cdn/";

const DEFS_URL = "http://localhost/blocks/bridge.dragon";

const FONT_CSS = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource-variable\/[^/]+\/index\.css$/u;

const escape = (text: string): string => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

/** 頁の link の定義を読む頁を開いて読んだ物。入口の file が build されていない時は頁を開かない */
interface LinkSeen {
  /** 入口の file (`dist/cdn/dragon.js`) が在る */
  built: boolean;
  /** 記法の塊ごとに、link の定義の形で描いたか */
  drawn?: boolean[];
  /** 誤りになった記法の塊の字 */
  errors?: string[];
  /** 頁が読んだ定義の file の URL */
  defsRead?: string[];
  /** 止めた外への通信の URL */
  outside?: string[];
}

// 件の中で頁を開いて描くのを待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3816)。
// 頁を開いて読む仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は読んだ物を元の件と同じ順で確かめる
const LINK_PAGE = await atLoad("頁の link の定義を読む 2 つの記法の塊の頁を開く", async (): Promise<LinkSeen> => {
  const built = existsSync(join(CDN, "dragon.js"));
  if (!built) return { built };
  const second = BARE_TEXT.replace("architecture 橋を渡る", "architecture もう 1 つの橋");
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><link rel="dragon-blocks" href="${DEFS_URL}"><script type="module" src="${LOCAL}dragon.js"></script></head><body><pre class="dragon">${escape(BARE_TEXT)}</pre><pre class="dragon">${escape(second)}</pre></body></html>`;
  // file で 1 つの Chromium を使う。後処理で閉じず、file の process の終わりに止まる (#3424)
  const context = await (await fileChromium()).newContext();
  // 上限を書かない開く操作も、Playwright の既定の 30 秒ではなく 1 つの操作の上限で切る
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  const defsRead: string[] = [];
  const outside: string[] = [];
  try {
    await context.route("**/*", async (route) => {
      const url = route.request().url();
      if (url === PAGE) return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
      if (url === DEFS_URL) {
        defsRead.push(url);
        return route.fulfill({ contentType: "text/plain; charset=utf-8", body: DEFS });
      }
      if (url.startsWith(LOCAL)) {
        const path = join(CDN, url.slice(LOCAL.length));
        return existsSync(path) ? route.fulfill({ contentType: "text/javascript", body: readFileSync(path) }) : route.fulfill({ status: 404, body: "" });
      }
      if (FONT_CSS.test(url)) return route.fulfill({ contentType: "text/css", body: "" });
      outside.push(url);
      return route.abort();
    });
    const page: Page = await context.newPage();
    await page.goto(PAGE);
    await page
      .waitForFunction(() => document.querySelectorAll("pre.dragon").length === 0 && document.querySelectorAll('[data-dragon="player"] svg').length >= 2, undefined, { timeout: 8_000 })
      .catch(() => undefined);
    const drawn = await page.evaluate(
      (d) => [...document.querySelectorAll('[data-dragon="player"] svg')].map((svg) => [...svg.querySelectorAll("path")].some((p) => p.getAttribute("d") === d)),
      BRIDGE,
    );
    const errors = await page.evaluate(() => [...document.querySelectorAll("pre.dragon-error")].map((e) => e.textContent ?? ""));
    return { built, drawn, errors, defsRead, outside };
  } finally {
    await context.close();
  }
});

describe("頁の link で読む定義 (#3399)", () => {
  it("user-block-page-link", () => {
    const { built, drawn, errors, defsRead, outside } = LINK_PAGE.get();
    expect(built, "入口の file が build されていない").toBe(true);
    expect(errors, "頁の link の定義を使えず、記法の塊が誤りになる").toEqual([]);
    expect(drawn, "頁の 2 つの記法の塊が、link の定義の形で描かれない").toEqual([true, true]);
    expect(defsRead, "定義の file を 1 度だけ読まない").toEqual([DEFS_URL]);
    expect(outside, "入口と塊と字と定義の file のほかに取りに行った物").toEqual([]);
  });
});
