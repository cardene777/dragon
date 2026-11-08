/**
 * 使い方の頁とカタログの頁を、頁が最初に読む script から外して後から読む (#3280)。
 *
 * 最初に読む script は、build した頁の `index.html` が名指す script と CSS (`firstLoadFiles`)。
 * 頁の部品が script の中にあるかは、部品が描く要素の目印 (build が `"data-docs":"hero"` の形で残す) が現れるかで決める。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page, Route } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { SECTIONS } from "../docs/content";
import { BASE, firstLoadFiles, screenOf, type Site, startSite } from "./playground-support";

/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

/** 使い方の頁の部品が描く要素の目印 */
const DOCS_MARKS = ['"data-docs":"hero"', '"data-docs":"section"'] as const;
/** 一覧と分類と部品の頁の部品が描く要素の目印 */
const CATALOG_MARKS = ['"data-catalog":"index"', '"data-catalog":"stage"', '"data-catalog":"part-figure"'] as const;
/** Tabler の表の塊の目印。表の鍵と path の対 (#3505) */
const TABLER_MARK = /"building-bridge-2":"M/u;
/** 後から読む見本の記法の塊の目印。橋の見本ではない見本 (swap) の題の行 */
const LATER_EXAMPLE_MARK =
  readFileSync(new URL("../../../../packages/dragon/examples/swap.en.dragon", import.meta.url), "utf8")
    .split("\n")
    .find((line) => line.startsWith("pipe ")) ?? "";

let site: Site;

const assets = (): string => join(site.built.dir, "assets");
const read = (name: string): string => readFileSync(join(assets(), name), "utf8");
const firstScripts = (): string[] => firstLoadFiles(site.built.dir).filter((name) => name.endsWith(".js"));
const laterScripts = (): string[] => {
  const first = new Set(firstLoadFiles(site.built.dir));
  return readdirSync(assets())
    .filter((name) => name.endsWith(".js") && !first.has(name))
    .sort();
};

/** 目印のうち、渡した script のどれにも無い物 */
const missingFrom = (names: string[], marks: readonly string[]): string[] => {
  const code = names.map(read).join("\n");
  return marks.filter((mark) => !code.includes(mark));
};
/** 目印を持つ後から読む塊 */
const laterHolding = (marks: readonly string[]): string[] => laterScripts().filter((name) => marks.some((mark) => read(name).includes(mark)));

const fileOf = (url: string): string => new URL(url).pathname.split("/").pop() ?? "";

async function onScreen(page: Page, screen: string, message: string): Promise<void> {
  await expect.poll(() => screenOf(page), { ...WAIT, message }).toBe(screen);
}

const countOf = (page: Page, selector: string): Promise<number> => page.locator(selector).count();

async function shows(page: Page, selector: string, message: string): Promise<void> {
  await expect.poll(() => countOf(page, selector), { ...WAIT, message }).toBeGreaterThan(0);
}

/** 最初に読む script でない script の読み込みを全て止める */
const blockLater = async (page: Page): Promise<void> => {
  const first = new Set(firstLoadFiles(site.built.dir));
  await page.route("**/assets/*.js", (route: Route) => (first.has(fileOf(route.request().url())) ? route.fallback() : route.abort()));
};

describe("使い方の頁とカタログの頁を後から読む (#3280)", () => {
  beforeAll(async () => {
    site = await startSite();
  });

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  });

  it("first-load-carries-no-docs-page", () => {
    const first = firstScripts();
    expect(first.length, "build した頁が最初に読む script が無い").toBeGreaterThan(0);
    expect(missingFrom(first, DOCS_MARKS), "最初に読む script に残っている使い方の頁の目印").toEqual([...DOCS_MARKS]);
    expect(missingFrom(laterScripts(), DOCS_MARKS), "後から読む塊に無い使い方の頁の目印").toEqual([]);
  });

  it("first-load-carries-no-catalog-pages", () => {
    const first = firstScripts();
    expect(first.length, "build した頁が最初に読む script が無い").toBeGreaterThan(0);
    expect(missingFrom(first, CATALOG_MARKS), "最初に読む script に残っているカタログの頁の目印").toEqual([...CATALOG_MARKS]);
    expect(missingFrom(laterScripts(), CATALOG_MARKS), "後から読む塊に無いカタログの頁の目印").toEqual([]);
  });

  it(
    "page-chunks-start-after-first-screen",
    async () => {
      const chunks = [...laterHolding(DOCS_MARKS), ...laterHolding(CATALOG_MARKS)];
      expect(chunks.length, "使い方の頁とカタログの頁を持つ後から読む塊が無い").toBeGreaterThan(0);
      const requested: string[] = [];
      const { page } = await site.open({
        path: `${BASE}editor`,
        prepare: (p) => {
          p.on("request", (request) => requested.push(fileOf(request.url())));
        },
      });
      await onScreen(page, "editor", "編集画面が出ない");
      await expect.poll(() => chunks.filter((name) => !requested.includes(name)), { ...WAIT, message: "編集画面を描いた後に読み始めない塊" }).toEqual([]);
      expect(await screenOf(page), "塊を読む間に編集画面から移った").toBe("editor");
    },
  );

  it(
    "home-skips-tabler-table",
    async () => {
      // 橋の見本を開かない人に、Tabler の表の塊 (gzip で約 225KB) を読ませない (#3505)
      const tabler = laterScripts().filter((name) => TABLER_MARK.test(read(name)));
      expect(tabler.length, "Tabler の表の塊を build の結果から見つけられない (走査の空振り)").toBe(1);
      expect(LATER_EXAMPLE_MARK, "後から読む見本の題の行を読めない").not.toBe("");
      const examples = laterScripts().filter((name) => read(name).includes(LATER_EXAMPLE_MARK));
      expect(examples.length, "後から読む見本の記法の塊を見つけられない (走査の空振り)").toBeGreaterThan(0);
      const requested: string[] = [];
      const { page } = await site.open({
        path: BASE,
        prepare: (p) => {
          p.on("request", (request) => requested.push(fileOf(request.url())));
        },
      });
      await onScreen(page, "home", "概要の頁が出ない");
      await expect.poll(() => examples.filter((name) => !requested.includes(name)), { ...WAIT, message: "概要の頁を描いた後に、後から読む見本の塊を読み始めない" }).toEqual([]);
      // 見本の塊が届いた後に、見本が使う読み方の塊を読み終えて通信が止まるまで待つ
      await page.waitForLoadState("networkidle");
      expect(requested.filter((name) => tabler.includes(name)), "概要の頁で Tabler の表の塊を読んだ").toEqual([]);
      expect(await screenOf(page), "塊を読む間に概要の頁から移った").toBe("home");
    },
  );

  it(
    "page-chunk-failure-offers-reload",
    async () => {
      const pages = [
        { path: `${BASE}docs`, screen: "docs", body: '[data-docs="hero"]' },
        { path: `${BASE}catalog`, screen: "catalog", body: '[data-catalog="index"]' },
      ];
      for (const { path, screen, body } of pages) {
        const { page } = await site.open({ path, prepare: blockLater });
        await onScreen(page, screen, `${path} の画面が出ない`);
        await shows(page, `[data-site-screen="${screen}"] [data-catalog="reload"]`, `${path} の塊を読めない時に読み直す釦が出ない`);
        expect(await countOf(page, body), `${path} の塊を読めないのに本文が出た`).toBe(0);
        expect(await countOf(page, '[data-site="header"]'), `${path} の塊を読めない時に上の帯が消えた`).toBe(1);
      }
    },
  );

  /** 頁を読み込んだ回数を数える。`blocked` が真の回は後から読む塊を読ませない */
  const countLoads = (blocked: (load: number) => boolean): { loads: () => number; prepare: (page: Page) => Promise<void> } => {
    let load = 0;
    return {
      loads: () => load,
      prepare: async (page) => {
        const first = new Set(firstLoadFiles(site.built.dir));
        page.on("request", (request) => {
          if (request.isNavigationRequest() && request.frame() === page.mainFrame()) load += 1;
        });
        await page.route("**/assets/*.js", (route: Route) => (first.has(fileOf(route.request().url())) || !blocked(load) ? route.fallback() : route.abort()));
      },
    };
  };

  it(
    "page-chunk-failure-reloads-once",
    async () => {
      for (const { path, body } of [
        { path: `${BASE}docs`, body: '[data-docs="hero"]' },
        { path: `${BASE}catalog`, body: '[data-catalog="index"]' },
      ]) {
        const { loads, prepare } = countLoads((load) => load === 1);
        const { page } = await site.open({ path, prepare });
        await shows(page, body, `${path} の塊が 1 度だけ読めなかった時に、読み直しても本文が出ない`);
        expect(loads(), `${path} を読み込んだ回数`).toBe(2);
        expect(await countOf(page, '[data-site-screen] > [data-catalog="later-failed"]'), `${path} の本文が出たのに読み直す釦が残った`).toBe(0);
        await site.closeContexts();
      }
    },
  );

  it(
    "page-chunk-reload-stops-after-one",
    async () => {
      const { loads, prepare } = countLoads(() => true);
      const { page } = await site.open({ path: `${BASE}docs`, prepare });
      await shows(page, '[data-site-screen="docs"] > [data-catalog="later-failed"]', "読み直しても読めない時に読み直す釦が出ない");
      await page.waitForTimeout(1_000);
      expect(loads(), "読み直しても読めない時に頁を読み込んだ回数").toBe(2);
      expect(await countOf(page, '[data-site="header"]'), "読み直しても読めない時に上の帯が消えた").toBe(1);
    },
  );

  it(
    "page-chunk-reload-allowed-again",
    async () => {
      const { loads, prepare } = countLoads((load) => load === 1 || load === 3);
      const { page } = await site.open({ path: `${BASE}docs`, prepare });
      await shows(page, '[data-docs="hero"]', "1 度目の読み直しで本文が出ない");
      expect(loads(), "1 度目の読み直しの後に頁を読み込んだ回数").toBe(2);
      await page.reload();
      await shows(page, '[data-docs="hero"]', "本文が出た後にまた読めなくなった時に、読み直しても本文が出ない");
      expect(loads(), "2 度目の読み直しの後に頁を読み込んだ回数").toBe(4);
    },
  );

  it(
    "pages-work-without-session-storage",
    async () => {
      // 印の置き場を使えない端末でも、読めた頁は描け、読めない時は読み直しを繰り返さず釦を出す
      const noStorage = async (page: Page): Promise<void> => {
        await page.addInitScript(() => {
          Object.defineProperty(window, "sessionStorage", {
            get: () => {
              throw new Error("使えない置き場");
            },
          });
        });
      };
      const fine = await site.open({ path: `${BASE}docs`, prepare: noStorage });
      await shows(fine.page, '[data-docs="hero"]', "印の置き場を使えない端末で本文が出ない");
      const { loads, prepare } = countLoads(() => true);
      const blocked = await site.open({
        path: `${BASE}docs`,
        prepare: async (p) => {
          await noStorage(p);
          await prepare(p);
        },
      });
      await shows(blocked.page, '[data-site-screen="docs"] > [data-catalog="later-failed"]', "印の置き場を使えない端末で読み直す釦が出ない");
      expect(loads(), "印の置き場を使えない端末で頁を読み直した").toBe(1);
    },
  );

  it(
    "page-chunk-failure-names-the-page",
    async () => {
      for (const { locale, text } of [
        { locale: "ja-JP", text: "頁を読み込めませんでした" },
        { locale: "en-US", text: "Could not load the page" },
      ]) {
        const { prepare } = countLoads(() => true);
        const { page } = await site.open({ path: `${BASE}docs`, locale, prepare });
        const failed = '[data-site-screen="docs"] > [data-catalog="later-failed"]';
        await shows(page, failed, `${locale} で読み直す釦が出ない`);
        expect(await page.locator(failed).innerText(), `${locale} の釦の文が頁を読み込めなかったと言わない`).toContain(text);
      }
    },
  );

  it(
    "editor-keeps-text-when-page-chunks-fail",
    async () => {
      const { loads, prepare } = countLoads(() => true);
      const written = "sequence\nA -> B: 残す記法";
      const failedChunks: string[] = [];
      const { page } = await site.open({
        path: `${BASE}editor`,
        prepare: async (p) => {
          p.on("requestfailed", (request) => failedChunks.push(fileOf(request.url())));
          await prepare(p);
        },
      });
      await onScreen(page, "editor", "編集画面が出ない");
      await page.locator('[data-playground="editor"]').fill(written);
      const chunks = laterScripts().filter((name) => name.startsWith("Docs-") || name.startsWith("pages-"));
      expect(chunks.length, "頁の塊が見つからない").toBeGreaterThan(0);
      await expect.poll(() => chunks.filter((name) => !failedChunks.includes(name)), { ...WAIT, message: "裏で読む頁の塊を読みに行かない" }).toEqual([]);
      await page.waitForTimeout(1_000);
      expect(loads(), "編集画面で頁の塊が読めなかった時に頁を読み直した").toBe(1);
      expect(await page.locator('[data-playground="editor"]').inputValue(), "書いた記法が消えた").toBe(written);
    },
  );

  it(
    "pages-open-directly",
    async () => {
      const docs = await site.open({ path: `${BASE}docs` });
      await shows(docs.page, '[data-docs="hero"]', "使い方の頁を直接開いても本文が出ない");
      const catalog = await site.open({ path: `${BASE}catalog` });
      await shows(catalog.page, '[data-catalog="index"]', "カタログの一覧を直接開いても本文が出ない");
      const category = await site.open({ path: `${BASE}catalog/tree` });
      await shows(category.page, '[data-catalog="stage"] svg[data-dragon="figure"]', "分類の頁を直接開いても見本の図が出ない");
      await shows(category.page, `a[href^="${BASE}catalog/part/"]`, "分類の頁に部品の頁への道が無い");
      const href = await category.page.locator(`a[href^="${BASE}catalog/part/"]`).first().getAttribute("href");
      const part = await site.open({ path: href ?? "" });
      await shows(part.page, '[data-catalog="part-figure"]', "部品の頁を直接開いても図の枠が出ない");
    },
  );

  it(
    "docs-hash-opens-the-section",
    async () => {
      const last = SECTIONS.at(-1);
      const { page } = await site.open({ path: `${BASE}docs#${last}` });
      await shows(page, `[id="${last}"]`, "使い方の頁に最後の節が出ない");
      await expect
        .poll(() => page.evaluate((id) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) < innerHeight / 2, last ?? ""), {
          ...WAIT,
          message: "# 付きの URL で開いても節まで移らない",
        })
        .toBe(true);
    },
  );

  it(
    "editor-to-docs-and-back",
    async () => {
      const { page } = await site.open({ path: `${BASE}editor` });
      await shows(page, '[data-site-screen="editor"] svg[data-dragon="figure"]', "編集画面に図が出ない");
      await page.locator(`[data-site="nav"] a[href="${BASE}docs"]`).click();
      await onScreen(page, "docs", "使い方の頁へ移れない");
      await shows(page, '[data-docs="hero"]', "編集画面から移った使い方の頁に本文が出ない");
      await page.goBack();
      await onScreen(page, "editor", "戻っても編集画面が出ない");
      await shows(page, '[data-site-screen="editor"] svg[data-dragon="figure"]', "編集画面へ戻っても図が出ない");
    },
  );

  it(
    "unknown-catalog-routes-are-not-found",
    async () => {
      for (const path of [`${BASE}catalog/no-such-kind`, `${BASE}catalog/part/no-such-part`]) {
        const { page } = await site.open({ path });
        await onScreen(page, "not-found", `${path} で見つからない頁が出ない`);
      }
    },
  );
});
