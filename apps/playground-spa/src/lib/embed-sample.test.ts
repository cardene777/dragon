/**
 * 見本帳の組み込みの説明 (#3701)。
 *
 * 使い方の頁の組み込みの節は、scriptの1行、npmの関数、Web Component、iframe の4つの置き方ごとに、
 * package の README の組み込みの節と同じコードを囲みで出し、囲みのコピーのボタンでコードを写せる。出口は見本の頁を指す。
 * 見本の頁 (`/embedding`) は、4つの置き方で同じ記法 (`src/embed/sample.dragon`) の図を帯つきで置く。
 * scriptの1行は見本帳に写した本物の入口 (`script/cdn/dragon.js`) を読む頁をiframeで開き、npmの関数は`mountDragon`で、
 * Web Componentは`<dragon-diagram>`で、iframeは埋め込みの頁で置く。
 *
 * build した見本帳を`http://localhost/dragon/`に置き、GitHub Pagesと同じく拡張子の無い経路に同じ名前の`.html`を返す。
 * 入口が読む字の CSS は jsDelivr へ取りに行かず、空の CSS を返す。
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { fileChromium } from "../../../../packages/dragon/test/page-needs";
import { codeBlocks, sectionOf } from "../../../../packages/dragon/test/markdown-sections";
import { app, BASE, builtDir, root } from "./playground-support";

/** 頁と、iframeの中の頁。見本帳は Playwright を依存に持たないので、型は Chromium を起こす関数から引く */
type Page = Awaited<ReturnType<Awaited<ReturnType<typeof fileChromium>>["newPage"]>>;
type Frame = ReturnType<Page["mainFrame"]>;

/** 見本帳の置き場 */
const SITE = `http://localhost${BASE}`;
/** エディタとdragonの印が開く公開した見本帳 */
const GALLERY = "https://cardene777.github.io/dragon/";
/** 4つの置き方。見本の頁の札の`data-embed-way`と同じ並び */
const WAYS = ["script", "npm", "element", "iframe"] as const;
/** 帯のボタンの並び */
const BUTTONS = ["code", "editor", "copy", "export", "expand"];

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

/** README の組み込みの節のコード */
const readmeCode = (): string[] => codeBlocks(sectionOf(readFileSync(join(root, "packages/dragon/README.ja.md"), "utf8"), "## 他のツールに組み込む"));

/** 見本の記法の題。1 行目の図の種類の後ろの字 */
function sampleTitle(): string {
  const path = join(app, "src/embed/sample.dragon");
  expect(existsSync(path), "見本の頁の記法 (src/embed/sample.dragon) が無い").toBe(true);
  if (!existsSync(path)) return "";
  return (readFileSync(path, "utf8").split("\n")[0] ?? "").replace(/^\S+\s+/u, "").trim();
}

/** build した見本帳の`path`を日本語の端末で開いて`run`を回す。頁は file で 1 つの Chromium の文脈ごとに開いて閉じる */
async function withSite<T>(path: string, run: (page: Page) => Promise<T>): Promise<T> {
  const dir = builtDir();
  expect(existsSync(join(dir, "index.html")), "build した見本帳の index.html が無い").toBe(true);
  const context = await (await fileChromium()).newContext({ viewport: { width: 1280, height: 1600 }, locale: "ja-JP" });
  try {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost" });
    await context.route(`${GALLERY}**`, (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><title>gallery</title>" }));
    await context.route("https://cdn.jsdelivr.net/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
    await context.route("http://localhost/**", (route) => {
      const url = decodeURIComponent(new URL(route.request().url()).pathname);
      if (!url.startsWith(BASE)) return route.fulfill({ status: 404 });
      const rel = url.slice(BASE.length);
      const file = resolve(dir, rel === "" ? "index.html" : rel);
      if (!file.startsWith(`${dir}/`)) return route.fulfill({ status: 404 });
      const found = existsSync(file) && statSync(file).isFile() ? file : existsSync(`${file}.html`) ? `${file}.html` : undefined;
      if (found) return route.fulfill({ contentType: TYPES[extname(found)] ?? "application/octet-stream", body: readFileSync(found) });
      return route.fulfill({ status: 404, contentType: TYPES[".html"], body: readFileSync(join(dir, "404.html")) });
    });
    const page = await context.newPage();
    await page.goto(`${SITE}${path}`);
    return await run(page);
  } finally {
    await context.close();
  }
}

/** 帯つきの図の帯のボタンと題と、図を描いたか。`host`の下で最初の帯つきの図を見る */
interface Framed {
  buttons: (string | undefined)[];
  title: string;
  drawn: boolean;
}
const framedIn = (frame: Frame | Page, selector: string): Promise<Framed> =>
  frame.evaluate((query) => {
    const host = document.querySelector(query);
    const place = host?.shadowRoot ?? host;
    const root = (place?.querySelector(".dragon-frame") ?? null)?.shadowRoot ?? null;
    return {
      buttons: root ? [...root.querySelectorAll<HTMLElement>(".dg-header-actions > [data-action]")].map((el) => el.dataset.action) : [],
      title: root?.querySelector(".dg-header-title")?.textContent?.trim() ?? "",
      drawn: root?.querySelector('[data-dragon="player"] svg') != null,
    };
  }, selector);

/** 札`way`の中のiframeの中の頁 */
async function cardFrame(page: Page, way: string): Promise<Frame | undefined> {
  const handle = await page.locator(`[data-embed-way="${way}"] iframe`).first().elementHandle({ timeout: 1000 }).catch(() => null);
  return (await handle?.contentFrame()) ?? undefined;
}

describe("見本帳の組み込みの説明 (#3701)", () => {
  it("docs-page-has-embed-section", async () => {
    const code = readmeCode();
    expect(code.length, "README の組み込みの節のコードの数").toBeGreaterThanOrEqual(4);
    await withSite("docs#embed", async (page) => {
      const section = page.locator("section#embed");
      await section.waitFor({ timeout: 6000 }).catch(() => undefined);
      // 4つの置き方のコードは README の組み込みの節と同じ物
      const shown = await section.locator('pre[data-docs="command"] code').allTextContents();
      expect(shown, "使い方の頁の組み込みの節のコード").toEqual(code);
      // 囲みのコピーのボタンでコードを写せる
      await section.locator('[data-docs="copy"]').first().click({ timeout: 2000 });
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()), { timeout: 2000 }).toBe(code[0]);
      // 出口は見本の頁を指す
      expect(await section.locator('[data-docs="section-cta"]').getAttribute("href"), "組み込みの節の出口").toBe(`${BASE}embedding`);
    });
  });

  it("embed-sample-page-shows-four-ways", async () => {
    const title = sampleTitle();
    await withSite("embedding", async (page) => {
      const ways = (): Promise<(string | undefined)[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLElement>("[data-embed-way]")].map((card) => card.dataset.embedWay));
      await expect.poll(ways, { timeout: 6000 }).toEqual([...WAYS]);
      // 札ごとにコードを持つ
      const codes = await page.evaluate(() => [...document.querySelectorAll("[data-embed-way]")].map((card) => card.querySelector("pre code")?.textContent?.trim() ?? ""));
      expect(codes.filter((text) => text === ""), "コードの無い札").toEqual([]);
      // 4つの置き方で同じ記法の図を帯つきで置く
      const want: Framed = { buttons: BUTTONS, title, drawn: true };
      const figures = async (): Promise<Record<string, Framed | undefined>> => {
        const script = await cardFrame(page, "script");
        const iframe = await cardFrame(page, "iframe");
        return {
          script: script ? await framedIn(script, ".dragon-figure") : undefined,
          npm: await framedIn(page, '[data-embed-way="npm"] [data-embed="figure"]'),
          element: await framedIn(page, '[data-embed-way="element"] dragon-diagram'),
          iframe: iframe ? await framedIn(iframe, "#root") : undefined,
        };
      };
      await expect.poll(figures, { timeout: 7000 }).toEqual({ script: want, npm: want, element: want, iframe: want });
    });
  });
});
