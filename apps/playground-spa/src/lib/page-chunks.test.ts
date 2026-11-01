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

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

/** 使い方の頁の部品が描く要素の目印 */
const DOCS_MARKS = ['"data-docs":"hero"', '"data-docs":"section"'] as const;
/** 一覧と分類と部品の頁の部品が描く要素の目印 */
const CATALOG_MARKS = ['"data-catalog":"index"', '"data-catalog":"stage"', '"data-catalog":"part-figure"'] as const;

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
  await page.route("**/assets/*.js", (route: Route) => (first.has(fileOf(route.request().url())) ? route.continue() : route.abort()));
};

describe("使い方の頁とカタログの頁を後から読む (#3280)", () => {
  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

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
    SLOW,
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
    SLOW,
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
    SLOW,
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
    SLOW,
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
    SLOW,
  );

  it(
    "unknown-catalog-routes-are-not-found",
    async () => {
      for (const path of [`${BASE}catalog/no-such-kind`, `${BASE}catalog/part/no-such-part`]) {
        const { page } = await site.open({ path });
        await onScreen(page, "not-found", `${path} で見つからない頁が出ない`);
      }
    },
    SLOW,
  );
});
