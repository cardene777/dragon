/**
 * 字の `@font-face` を最初の CSS から外し、初めて開く端末では最初の画面を描いた後に読む (#3292)。
 *
 * 2 度目からは最初の画面を描く前に読むので、字の file が cache に在る端末は端末の字を挟まない。
 * 字の CSS は、build した頁の CSS のうち `@font-face` を持つ file で、最初に読む CSS は `index.html` が名指す file (`firstLoadFiles`)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page, Route } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { firstLoadFiles, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;
/** 字の CSS を止めている間に、最初の画面が出てこないことを確かめる長さ */
const HOLD = 500;

/** 字の CSS を読んだ端末の印の名前 (`site/fonts.ts` と同じ) */
const SEEN = "dragon-fonts-seen";
const HEADER = '[data-site="header"]';
const HERO = '[data-home="hero"]';
const SANS = "Noto Sans JP Variable";

let site: Site;

const read = (name: string): string => readFileSync(join(site.built.dir, "assets", name), "utf8");
const holdsFontFace = (name: string): boolean => read(name).includes("@font-face");
const fontCss = (): string[] => readdirSync(join(site.built.dir, "assets")).filter((name) => name.endsWith(".css") && holdsFontFace(name));
const fileOf = (url: string): string => new URL(url).pathname.split("/").pop() ?? "";

const countOf = (page: Page, selector: string): Promise<number> => page.locator(selector).count();

async function shows(page: Page, selector: string, message: string): Promise<void> {
  await expect.poll(() => countOf(page, selector), { ...WAIT, message }).toBeGreaterThan(0);
}

/** 字の CSS の読み込みを `handle` に渡す。ほかの CSS はそのまま読ませる */
const onFontCss = async (page: Page, handle: (route: Route) => Promise<void>): Promise<void> => {
  const names = new Set(fontCss());
  await page.route("**/assets/*.css", (route) => (names.has(fileOf(route.request().url())) ? handle(route) : route.continue()));
};

const seenMark = (page: Page): Promise<string | null> => page.evaluate((key) => localStorage.getItem(key), SEEN);

/** 読み終えた字の family */
const loadedFamilies = (page: Page): Promise<string[]> =>
  page.evaluate(() => [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family.replace(/["']/gu, "")));

describe("字の CSS を最初の画面の後に読む (#3292)", () => {
  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

  it("first-load-css-carries-no-font-face", () => {
    const first = firstLoadFiles(site.built.dir).filter((name) => name.endsWith(".css"));
    expect(first.length, "build した頁が最初に読む CSS が無い").toBeGreaterThan(0);
    expect(first.filter(holdsFontFace), "最初に読む CSS に @font-face が残っている").toEqual([]);
    expect(fontCss().length, "後から読む CSS に @font-face が無い").toBeGreaterThan(0);
  });

  it(
    "first-visit-reads-font-css-after-first-screen",
    async () => {
      const drawn: boolean[] = [];
      await site.open({
        prepare: (page) =>
          onFontCss(page, async (route) => {
            drawn.push((await countOf(page, HEADER)) > 0);
            await route.continue();
          }),
      });
      await expect.poll(() => drawn.length, { ...WAIT, message: "字の CSS を読まない" }).toBeGreaterThan(0);
      expect(drawn, "最初の画面を描く前に字の CSS を読み始めた").not.toContain(false);
    },
    SLOW,
  );

  it(
    "second-visit-reads-font-css-before-first-screen",
    async () => {
      const { page } = await site.open();
      await expect.poll(() => seenMark(page), { ...WAIT, message: "字の CSS を読んだ印が残らない" }).not.toBeNull();

      let release = (): void => undefined;
      const gate = new Promise<void>((done) => {
        release = done;
      });
      let reached = false;
      await onFontCss(page, async (route) => {
        reached = true;
        await gate;
        await route.continue();
      });
      await page.reload({ waitUntil: "commit" });
      await expect.poll(() => reached, { ...WAIT, message: "2 度目に開いた時に字の CSS を読まない" }).toBe(true);
      await page.waitForTimeout(HOLD);
      expect(await countOf(page, HEADER), "字の CSS を読み終える前に最初の画面を描いた").toBe(0);
      release();
      await shows(page, HEADER, "字の CSS が届いた後に最初の画面が出ない");
    },
    SLOW,
  );

  it(
    "font-css-failure-still-draws-first-screen",
    async () => {
      for (const seen of [false, true]) {
        const { page } = await site.open({
          prepare: async (p) => {
            if (seen) await p.addInitScript((key) => localStorage.setItem(key, "1"), SEEN);
            await onFontCss(p, (route) => route.abort());
          },
        });
        await shows(page, HERO, `字の CSS を読めない時に最初の画面が出ない (2 度目の端末=${seen})`);
        const display = await page.locator(".site").evaluate((element) => getComputedStyle(element).display);
        expect(display, `字の CSS を読めない時に頁の CSS が効いていない (2 度目の端末=${seen})`).toBe("flex");
      }
    },
    SLOW,
  );

  it(
    "font-faces-reach-the-page",
    async () => {
      const { page } = await site.open();
      await expect.poll(() => loadedFamilies(page), { ...WAIT, message: "字を読み終えない" }).toContain(SANS);
    },
    SLOW,
  );

  it(
    "no-storage-still-draws-first-screen",
    async () => {
      const { page } = await site.open({
        prepare: async (p) => {
          await p.addInitScript(() => {
            Object.defineProperty(window, "localStorage", {
              get() {
                throw new Error("保存を止めた browser");
              },
            });
          });
        },
      });
      await shows(page, HERO, "localStorage を使えない時に最初の画面が出ない");
      await expect.poll(() => loadedFamilies(page), { ...WAIT, message: "localStorage を使えない時に字を読み終えない" }).toContain(SANS);
    },
    SLOW,
  );

  it(
    "font-css-respects-csp",
    async () => {
      const { page, violations } = await site.open();
      await expect.poll(() => loadedFamilies(page), { ...WAIT, message: "字を読み終えない" }).toContain(SANS);
      expect(await violations(), "字の CSS を読む時に CSP の違反が出た").toEqual([]);
    },
    SLOW,
  );
});
