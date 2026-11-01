/**
 * 見本帳に載せる時系列図の見本 4 つ (#3167)。
 *
 * 見本の正は `packages/dragon/examples` の記法の file で、題はその file を読んで取る。頁の側の見本の表は読まない。
 * 時系列図の頁の一覧の並び、`#<見本>` を付けた経路で開いた時に選ぶ見本、概要の頁の使いどころの札、編集画面の棚を確かめる。
 * 見本の file が無い間も、この file を読み込んだ所で落とさず、題が無いと名指して落とす。
 */
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { type Lang, TEXT } from "../text";
import { BASE, example, screenOf, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

/** 時系列図の頁の見本の並び。足す 4 つは入門と OAuth の間に、易しい順に置く */
const SEQUENCE_ORDER = ["intro", "api", "retry", "payment", "wallet", "oauth"] as const;
/** 足す見本 */
const ADDED = ["api", "retry", "payment", "wallet"] as const;
/** 概要の頁の使いどころに並べる見本。見本を足しても替えない */
const HOME_USES = ["intro", "oauth", "ccip"] as const;

/** 見本の記法の file の中身。無ければ `undefined` */
const notationOf = (key: string, lang: Lang): string | undefined => example(`${key}${lang === "en" ? ".en" : ""}.dragon`);

/** 見本の題。file が無いか読めなければ、それと分かる字 */
const titleOf = (key: string, lang: Lang = "ja"): string => {
  const text = notationOf(key, lang);
  if (text === undefined) return `(${key} の見本が無い)`;
  const parsed = parseNotation(text);
  return parsed.ok ? parsed.diagram.title : `(${key} の見本が読めない)`;
};

let site: Site;

async function onScreen(page: Page, screen: string, message: string): Promise<void> {
  await expect.poll(() => screenOf(page), { ...WAIT, message }).toBe(screen);
}

/** 図の頁の一覧の見本の題と、右に出ている見本の題と、一覧で選ばれている見本の題 */
const categoryOf = (page: Page): Promise<{ items: string[]; title: string; current: string[] }> =>
  page.evaluate(() => {
    const items = [...document.querySelectorAll<HTMLElement>('[data-catalog="item"]')];
    return {
      items: items.map((i) => i.textContent?.trim() ?? ""),
      title: document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? "",
      current: items.filter((i) => i.getAttribute("aria-current") === "true").map((i) => i.textContent?.trim() ?? ""),
    };
  });

/** 書く欄の中身。書く欄が無ければ `null` */
const editorValue = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null);

describe("時系列図の見本 4 つを見本帳に載せる (#3167)", () => {
  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

  it(
    "catalog-sequence-lists-added-examples",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "category", "時系列図の頁が出ない");
      const want = SEQUENCE_ORDER.map((key) => titleOf(key));
      await expect
        .poll(async () => (await categoryOf(page)).items, { ...WAIT, message: "時系列図の頁の一覧が、入門、足した 4 つ、OAuth の順に並ばない" })
        .toEqual(want);
      // どの見本を選んでも、右にその見本が出る
      for (const [i, title] of want.entries()) {
        await page.locator('[data-catalog="item"]').nth(i).click();
        await expect.poll(async () => (await categoryOf(page)).title, { ...WAIT, message: `「${title}」を選んでも右に出ない` }).toBe(title);
      }
    },
    SLOW,
  );

  it(
    "category-opens-sample-from-hash",
    async () => {
      // `#` の後ろの見本を選んだ状態で開く。表に無い名前なら最初の見本を出す
      const cases: [string, string][] = [
        ["payment", titleOf("payment")],
        ["oauth", titleOf("oauth")],
        ["nothing", titleOf(SEQUENCE_ORDER[0])],
      ];
      for (const [hash, title] of cases) {
        const { page } = await site.open({ path: `${BASE}catalog/sequence#${hash}`, viewport: { width: 1440, height: 900 } });
        await onScreen(page, "category", `#${hash} を付けた時系列図の頁が出ない`);
        await expect
          .poll(async () => {
            const c = await categoryOf(page);
            return { title: c.title, current: c.current };
          }, { ...WAIT, message: `#${hash} を付けて開いた時系列図の頁が「${title}」を選ばない` })
          .toEqual({ title, current: [title] });
        await site.closeContexts();
      }
    },
    SLOW,
  );

  it(
    "home-uses-stay-three",
    async () => {
      const { page } = await site.open({ path: BASE, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "home", "概要の頁が出ない");
      const uses = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll('[data-home="use"] h3')].map((h) => h.textContent?.trim() ?? ""));
      await expect
        .poll(uses, { ...WAIT, message: "概要の頁の使いどころが、入門、OAuth、CCIP の 3 つの札でない" })
        .toEqual(HOME_USES.map((key) => titleOf(key)));
    },
    SLOW,
  );

  it(
    "editor-shelf-lists-added-examples",
    async () => {
      const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "editor", "編集画面が出ない");
      const sequenceName = TEXT.ja.shelf.kinds.sequence;
      for (const key of ADDED) {
        const button = `[data-playground="sample-${key}"]`;
        const placed = (): Promise<{ title: string; group: string } | null> =>
          page.evaluate((s) => {
            const b = document.querySelector(s);
            return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
          }, button);
        await expect
          .poll(placed, { ...WAIT, message: `編集画面の棚の時系列図の見本の一覧に ${key} が無い` })
          .toEqual({ title: titleOf(key), group: sequenceName });
        await page.locator(button).click();
        await expect.poll(() => editorValue(page), { ...WAIT, message: `棚の ${key} を押しても、その記法が記法の欄に入らない` }).toBe(notationOf(key, "ja"));
      }
    },
    SLOW,
  );
});
