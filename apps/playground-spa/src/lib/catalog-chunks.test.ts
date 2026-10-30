/**
 * 見本と部品の図の記法を、頁が最初に読む script から外して後から読む (#3246)。
 *
 * 最初に読む script は、build した頁の `index.html` が名指す script と CSS (`firstLoadFiles`)。
 * 後から読む塊は、見本の記法を持つ塊と部品の図の記法を持つ塊の 2 つで、最初の画面を描いた後に裏で読み始め、一度読んだら持ち続ける。
 * 概要の頁の 3 つの見本と編集画面の最初の見本は、待たずに出すため最初に読む script に残す。
 * 記法が script の中にあるかは、記法の file の中身が script の字の並び (字の並びの書き方 2 通りのどちらか) として現れるかで決める。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page, Route } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { toHash } from "../share";
import { app, BASE, firstLoadFiles, root, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

/** 概要の頁の用例と編集画面の最初の見本。最初に読む script に残す */
const FIRST_SCREEN_EXAMPLES = ["intro", "oauth", "ccip"] as const;

const EXAMPLES = join(root, "packages/dragon/examples");
const PARTS = join(app, "src/catalog/parts");

interface Notation {
  /** repo の root からの path */
  path: string;
  text: string;
}

const notationsIn = (dir: string, keep: (name: string) => boolean): Notation[] =>
  readdirSync(dir)
    .filter((name) => name.endsWith(".dragon") && keep(name))
    .sort()
    .map((name) => ({ path: join(dir, name).slice(root.length + 1), text: readFileSync(join(dir, name), "utf8") }));

const isFirstScreen = (name: string): boolean => FIRST_SCREEN_EXAMPLES.some((key) => name === `${key}.dragon` || name === `${key}.en.dragon`);
/** 後から読む見本の記法 */
const laterExamples = (): Notation[] => notationsIn(EXAMPLES, (name) => !isFirstScreen(name));
/** 最初に読む見本の記法 */
const firstExamples = (): Notation[] => notationsIn(EXAMPLES, isFirstScreen);
/** 部品の図の記法 */
const partNotations = (): Notation[] => notationsIn(PARTS, () => true);

/** 記法が script の中で取りうる字の並び。build は字の並びを `` ` `` の囲みか `"` の囲みで書く */
function literalForms(text: string): string[] {
  const body = text.trimEnd();
  return [body.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${"), JSON.stringify(body).slice(1, -1)];
}

const carries = (code: string, notation: Notation): boolean => literalForms(notation.text).some((form) => code.includes(form));

let site: Site;

const assets = (): string => join(site.built.dir, "assets");
const scriptsOf = (names: string[]): string => names.map((name) => readFileSync(join(assets(), name), "utf8")).join("\n");
const firstScripts = (): string[] => firstLoadFiles(site.built.dir).filter((name) => name.endsWith(".js"));
/** 後から読む塊。build した script のうち、最初に読む script でない物 */
const laterScripts = (): string[] => {
  const first = new Set(firstLoadFiles(site.built.dir));
  return readdirSync(assets())
    .filter((name) => name.endsWith(".js") && !first.has(name))
    .sort();
};

/** 後から読む塊のうち、見本の記法を持つ塊と部品の図の記法を持つ塊 */
function notationChunks(): { examples: string[]; parts: string[] } {
  const later = laterScripts().map((name) => ({ name, code: scriptsOf([name]) }));
  const examples = laterExamples();
  const parts = partNotations();
  return {
    examples: later.filter((chunk) => examples.some((n) => carries(chunk.code, n))).map((chunk) => chunk.name),
    parts: later.filter((chunk) => parts.some((n) => carries(chunk.code, n))).map((chunk) => chunk.name),
  };
}

/** 見本の塊と部品の図の塊の名前。どちらかが 1 つでなければ落とす */
function twoChunks(): { examples: string; parts: string } {
  const { examples, parts } = notationChunks();
  expect(examples, "後から読む塊のうち、見本の記法を持つ塊").toHaveLength(1);
  expect(parts, "後から読む塊のうち、部品の図の記法を持つ塊").toHaveLength(1);
  return { examples: examples[0] ?? "", parts: parts[0] ?? "" };
}

const fileOf = (url: string): string => new URL(url).pathname.split("/").pop() ?? "";

const screenOf = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector("[data-site-screen]")?.getAttribute("data-site-screen") ?? null);

async function onScreen(page: Page, screen: string, message: string): Promise<void> {
  await expect.poll(() => screenOf(page), { ...WAIT, message }).toBe(screen);
}

const figures = (page: Page, scope: string): Promise<number> => page.locator(`${scope} svg[data-dragon="figure"]`).count();

/** 最初に読む script でない script の読み込みを全て止める */
const blockLater = async (page: Page): Promise<void> => {
  const first = new Set(firstLoadFiles(site.built.dir));
  await page.route("**/assets/*.js", (route: Route) => (first.has(fileOf(route.request().url())) ? route.continue() : route.abort()));
};

describe("見本と部品の図の記法を後から読む (#3246)", () => {
  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

  it("first-load-carries-no-catalog-notation", () => {
    const code = scriptsOf(firstScripts());
    expect(code, "build した頁が最初に読む script が無い").not.toBe("");
    const notations = [...laterExamples(), ...partNotations()];
    expect(notations.length, "見本と部品の図の記法の file の数").toBeGreaterThan(0);
    expect(
      notations.filter((n) => carries(code, n)).map((n) => n.path),
      "最初に読む script が持つ、後から読むはずの見本と部品の図の記法",
    ).toEqual([]);
  });

  it("catalog-notation-in-two-chunks", () => {
    const { examples, parts } = twoChunks();
    expect(examples, "見本の記法と部品の図の記法が同じ塊に入っている").not.toBe(parts);
    const exampleCode = scriptsOf([examples]);
    const partCode = scriptsOf([parts]);
    expect(laterExamples().filter((n) => !carries(exampleCode, n)).map((n) => n.path), "見本の塊に無い見本の記法").toEqual([]);
    expect(partNotations().filter((n) => !carries(partCode, n)).map((n) => n.path), "部品の図の塊に無い部品の図の記法").toEqual([]);
  });

  it("first-load-keeps-home-examples", () => {
    const code = scriptsOf(firstScripts());
    const examples = firstExamples();
    expect(examples.map((n) => n.path.split("/").pop()), "概要の頁と編集画面の最初の見本の file").toHaveLength(FIRST_SCREEN_EXAMPLES.length * 2);
    expect(examples.filter((n) => !carries(code, n)).map((n) => n.path), "最初に読む script に無い、概要の頁と編集画面の最初の見本の記法").toEqual([]);
  });

  it(
    "site-prefetches-catalog-notation",
    async () => {
      const chunks = twoChunks();
      const requested: string[] = [];
      const { page } = await site.open({
        path: BASE,
        prepare: async (p) => {
          p.on("request", (request) => requested.push(fileOf(request.url())));
        },
      });
      await onScreen(page, "home", "概要の頁が出ない");
      await expect.poll(() => figures(page, '[data-home="use"]'), { ...WAIT, message: "概要の頁の用例の図が 3 つ描かれない" }).toBe(3);
      await expect
        .poll(() => [chunks.examples, chunks.parts].filter((name) => !requested.includes(name)), { ...WAIT, message: "概要の頁を描いた後に読み始めない塊" })
        .toEqual([]);
      expect(await screenOf(page), "塊を読む間に概要の頁から移った").toBe("home");
    },
    SLOW,
  );

  it(
    "catalog-notation-read-once",
    async () => {
      const chunks = twoChunks();
      const requested: string[] = [];
      const { page } = await site.open({
        path: `${BASE}catalog`,
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
        prepare: async (p) => {
          p.on("request", (request) => requested.push(fileOf(request.url())));
        },
      });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      await page.locator(`a[data-catalog="card"][href="${BASE}catalog/tree"]`).click();
      await onScreen(page, "category", "木の図の頁が出ない");
      await expect.poll(() => figures(page, '[data-catalog="stage"]'), { ...WAIT, message: "木の図の頁の見本が描かれない" }).toBeGreaterThan(0);
      await page.locator(`a[href^="${BASE}catalog/part/"]`).first().click();
      await onScreen(page, "part", "部品の頁が出ない");
      await expect.poll(() => figures(page, '[data-catalog="part"]'), { ...WAIT, message: "部品の頁の図が描かれない" }).toBeGreaterThan(0);
      await page.goBack();
      await onScreen(page, "category", "戻っても木の図の頁が出ない");
      await page.goBack();
      await onScreen(page, "catalog", "戻っても見本帳の一覧が出ない");
      await page.locator(`a[data-catalog="card"][href="${BASE}catalog/lineup"]`).click();
      await onScreen(page, "category", "列の図の頁が出ない");
      await expect.poll(() => figures(page, '[data-catalog="stage"]'), { ...WAIT, message: "列の図の頁の見本が描かれない" }).toBeGreaterThan(0);
      expect(
        [chunks.examples, chunks.parts].map((name) => [name, requested.filter((r) => r === name).length]),
        "見本帳の頁を移り歩いた間に塊を読んだ回数",
      ).toEqual([
        [chunks.examples, 1],
        [chunks.parts, 1],
      ]);
    },
    SLOW,
  );

  it(
    "catalog-holds-figure-size-until-notation-arrives",
    async () => {
      const chunks = twoChunks();
      let held = false;
      let release: () => void = () => {};
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const { page } = await site.open({
        path: `${BASE}catalog/tree`,
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
        prepare: async (p) => {
          await p.route(`**/assets/${chunks.examples}`, async (route) => {
            held = true;
            await gate;
            await route.continue();
          });
        },
      });
      await onScreen(page, "category", "木の図の頁が出ない");
      await expect.poll(() => held, { ...WAIT, message: "見本の塊を読みに行かない" }).toBe(true);
      const stage = page.locator('[data-catalog="stage"]');
      await expect.poll(() => stage.count(), { ...WAIT, message: "見本の塊が届く前に図の枠が無い" }).toBe(1);
      const before = await stage.evaluate((el) => el.getBoundingClientRect().height);
      expect(before, "見本の塊が届く前の図の枠の高さ").toBeGreaterThan(0);
      expect(await figures(page, '[data-catalog="stage"]'), "見本の塊が届く前に図を描いた").toBe(0);
      release();
      await expect.poll(() => figures(page, '[data-catalog="stage"]'), { ...WAIT, message: "見本の塊が届いても図を描かない" }).toBeGreaterThan(0);
      const after = await stage.evaluate((el) => el.getBoundingClientRect().height);
      expect(after, "見本の塊が届く前と後で図の枠の高さが変わる").toBeCloseTo(before, 0);
    },
    SLOW,
  );

  it(
    "catalog-offers-reload-when-notation-fails",
    async () => {
      const chunks = twoChunks();
      const { page } = await site.open({
        path: `${BASE}catalog/tree`,
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
        prepare: async (p) => {
          await p.route(`**/assets/${chunks.examples}`, (route) => route.abort());
        },
      });
      await onScreen(page, "category", "木の図の頁が出ない");
      const reload = page.locator('[data-catalog="stage"] button[data-catalog="reload"]');
      await expect.poll(() => reload.count(), { ...WAIT, message: "見本の塊を読めない時に図の枠に読み直す button が出ない" }).toBe(1);
      expect((await reload.textContent())?.trim(), "読み直す button の字").toBe("読み直す");
      await page.evaluate(() => {
        (window as unknown as { __kept?: boolean }).__kept = true;
      });
      await page.waitForTimeout(1_500);
      expect(await page.evaluate(() => (window as unknown as { __kept?: boolean }).__kept === true), "button を押す前に頁を読み直した").toBe(true);
      await Promise.all([page.waitForEvent("load"), reload.click()]);
      expect(await page.evaluate(() => (window as unknown as { __kept?: boolean }).__kept === true), "button を押しても頁を読み直さない").toBe(false);
    },
    SLOW,
  );

  it(
    "first-screens-draw-without-catalog-notation",
    async () => {
      const home = await site.open({ path: BASE, prepare: blockLater });
      await onScreen(home.page, "home", "後から読む塊を止めると概要の頁が出ない");
      await expect.poll(() => figures(home.page, '[data-home="use"]'), { ...WAIT, message: "後から読む塊を止めると概要の頁の用例の図が 3 つ描かれない" }).toBe(3);

      const editor = await site.open({ path: `${BASE}editor`, prepare: blockLater });
      await onScreen(editor.page, "editor", "後から読む塊を止めると編集画面が出ない");
      await expect.poll(() => figures(editor.page, '[data-playground="figure"]'), { ...WAIT, message: "後から読む塊を止めると編集画面の最初の図が描かれない" }).toBeGreaterThan(0);

      const shared = ["sequence 共有の図", "", "box a as 甲", "box b as 乙", "", "step 送る", "  say 甲が乙へ送る。", "  a -> b: 送る"].join("\n");
      const link = await site.open({ path: `${BASE}editor${toHash(shared)}`, prepare: blockLater });
      await onScreen(link.page, "editor", "後から読む塊を止めると共有の link で編集画面が出ない");
      await expect.poll(() => figures(link.page, '[data-playground="figure"]'), { ...WAIT, message: "後から読む塊を止めると共有の link の図が描かれない" }).toBeGreaterThan(0);
      expect(
        await link.page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null),
        "共有の link で開いた書く欄の中身",
      ).toBe(shared);
    },
    SLOW,
  );
});
