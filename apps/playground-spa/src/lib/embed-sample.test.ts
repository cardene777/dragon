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
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";

import { atLoad, type Loaded } from "../../../../packages/dragon/test/at-load";
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

/** 見本の頁の記法の file */
const SAMPLE = join(app, "src/embed/sample.dragon");

/** 見本の記法の題。1 行目の図の種類の後ろの字。記法の file が無い時は空の字 */
const sampleTitleText = (): string =>
  existsSync(SAMPLE) ? (readFileSync(SAMPLE, "utf8").split("\n")[0] ?? "").replace(/^\S+\s+/u, "").trim() : "";

/** 見本の記法の題。記法の file が無い時は判定で落とす */
function sampleTitle(): string {
  expect(existsSync(SAMPLE), "見本の頁の記法 (src/embed/sample.dragon) が無い").toBe(true);
  return sampleTitleText();
}

/**
 * 1 つの頁で済ませる仕事の上限 (ms) (#3816)。
 * 読み込む段には 1 件の上限が掛からず、`page.evaluate`と文脈を閉じる仕事は Playwright の上限も持たない。
 * 止まった頁が 5 分の実行の上限までほかの仕事を待たせないよう、頁ごとにここで切る
 */
const PAGE_LIMIT_MS = 60_000;

/** `work`を`ms`ミリ秒で切る。切った時は`what`を挙げて落ちる */
async function within<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what}が ${ms}ms で終わらない`)), ms);
  });
  try {
    return await Promise.race([work, limit]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `read`を、`want`と同じ値になるか`timeout`ミリ秒が過ぎるまで 50ms ごとに読み直し、最後に読んだ値を返す。
 * `expect.poll`は件の外で使えないので、読み込む段では`expect.poll`と同じ間と上限で待つだけにし、判定は件が同じ値を`toEqual`で確かめる (#3816)。
 * 上限を過ぎた後の読みが落ちた時は、`expect.poll`と同じくその理由で落ちる
 */
async function readUntilEqual<T>(read: () => Promise<T>, want: unknown, timeout: number): Promise<T> {
  const end = Date.now() + timeout;
  for (;;) {
    const last = Date.now() >= end;
    try {
      const value = await read();
      if (last || isDeepStrictEqual(value, want)) return value;
    } catch (error) {
      if (last) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * 頁で順に回す仕事を、1 つずつ読み込む段の仕事 (`atLoad`) にする道具を作る。
 * 落ちた仕事より後の仕事は回さず、読んだ件は落ちた仕事の名前と理由で落ちる。
 * 件は前の仕事の結果を確かめてから次の仕事の結果を読むので、途中で落ちる件も落ちる前の様子を元の件と同じ順に確かめる
 */
function inOrder(): <T>(name: string, work: () => Promise<T>) => Promise<Loaded<T>> {
  let failed: Loaded<never> | undefined;
  return async <T>(name: string, work: () => Promise<T>): Promise<Loaded<T>> => {
    if (failed) return failed;
    const loaded = await atLoad(name, work);
    try {
      loaded.get();
    } catch {
      failed = loaded as Loaded<never>;
    }
    return loaded;
  };
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

// 頁を開いて組み込みの節を触ると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。
// file を読み込む段で頁を開いて節のコードと写した字と出口を読み、件はその中身を確かめる
const EMBED_SECTION = await atLoad("使い方の頁を開き、組み込みの節を読む", () =>
  withSite("docs#embed", async (page) => {
    const section = page.locator("section#embed");
    await section.waitFor({ timeout: 6000 }).catch(() => undefined);
    const shown = await section.locator('pre[data-docs="command"] code').allTextContents();
    // 囲みのコピーのボタンを押し、写した字が届くまで待つ
    await section.locator('[data-docs="copy"]').first().click({ timeout: 2000 });
    await page.waitForFunction(async () => (await navigator.clipboard.readText()) !== "", undefined, { timeout: 2000 }).catch(() => undefined);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    return { shown, copied, exit: await section.locator('[data-docs="section-cta"]').getAttribute("href") };
  }),
);

// 見本の頁を開いて 4 つの置き方の図を待つと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3816)。
// file を読み込む段で頁を開いて札と図を待ち、件は元の件と同じ順に確かめる。待つ途中で落ちても、件は落ちる前に読んだ値を先に確かめる
const FOUR_WAYS = await atLoad("見本の頁を開き、4つの置き方の札と図を読む", () =>
  within(
    withSite("embedding", async (page) => {
      const ways = (): Promise<(string | undefined)[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLElement>("[data-embed-way]")].map((card) => card.dataset.embedWay));
      const step = inOrder();
      const cards = await step("4つの置き方の札を待つ", () => readUntilEqual(ways, [...WAYS], 6000));
      // 札ごとにコードを持つ
      const codes = await step("札ごとのコードを読む", () =>
        page.evaluate(() => [...document.querySelectorAll("[data-embed-way]")].map((card) => card.querySelector("pre code")?.textContent?.trim() ?? "")),
      );
      // 4つの置き方で同じ記法の図を帯つきで置く
      const want: Framed = { buttons: BUTTONS, title: sampleTitleText(), drawn: true };
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
      const drawn = await step("4つの置き方で置いた図を待つ", () => readUntilEqual(figures, { script: want, npm: want, element: want, iframe: want }, 7000));
      return { cards, codes, figures: drawn };
    }),
    PAGE_LIMIT_MS,
    "見本の頁の仕事",
  ),
);

describe("見本帳の組み込みの説明 (#3701)", () => {
  it("docs-page-has-embed-section", () => {
    const code = readmeCode();
    expect(code.length, "README の組み込みの節のコードの数").toBeGreaterThanOrEqual(4);
    const { shown, copied, exit } = EMBED_SECTION.get();
    // 4つの置き方のコードは README の組み込みの節と同じ物
    expect(shown, "使い方の頁の組み込みの節のコード").toEqual(code);
    // 囲みのコピーのボタンでコードを写せる
    expect(copied, "コピーのボタンで写した字").toBe(code[0]);
    // 出口は見本の頁を指す
    expect(exit, "組み込みの節の出口").toBe(`${BASE}embedding`);
  });

  it("embed-sample-page-shows-four-ways", () => {
    const title = sampleTitle();
    const seen = FOUR_WAYS.get();
    expect(seen.cards.get()).toEqual([...WAYS]);
    // 札ごとにコードを持つ
    const codes = seen.codes.get();
    expect(codes.filter((text) => text === ""), "コードの無い札").toEqual([]);
    // 4つの置き方で同じ記法の図を帯つきで置く
    const want: Framed = { buttons: BUTTONS, title, drawn: true };
    expect(seen.figures.get()).toEqual({ script: want, npm: want, element: want, iframe: want });
  });
});
