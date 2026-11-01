/**
 * 見本帳と編集画面に列の図を載せる (#3239)。
 *
 * 見本の正は `packages/dragon/examples/auction.dragon` で、題と図の形はその file を読んで取る。頁の側の見本の表は読まない。
 * 列の図だけの部品は、チップ (`item`)、列の並び (`line`)、封 (`seal`)、選ぶ (`pick`)、札 (`stamp`) の 5 つで、
 * 部品の図は `catalog/parts/<名札>.lineup.dragon` と英語の `.en.dragon` の記法の file。
 * 列の図の分類と部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PARTS } from "../catalog/parts";
import { app, BASE, example, screenOf, type Site, startSite, stepLabel } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** 部品の頁を全部開くのに許す時間 */
const SWEEP = 300_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

/** 見本帳の図の分類の名前の並び */
const KIND_NAMES = ["時系列図", "構成図", "状態遷移図", "枝分かれの図", "時間軸の図", "木の図", "列の図"] as const;
/** 列の図だけの部品 */
const LINEUP_PARTS = ["item", "line", "seal", "pick", "stamp"] as const;
/** 入札の見本の段の数 */
const AUCTION_STEPS = 7;

const catalogSel = (name: string): string => `[data-catalog="${name}"]`;
const siteSel = (name: string): string => `[data-site="${name}"]`;
const sel = (name: string): string => `[data-playground="${name}"]`;

interface Source {
  kind: string;
  title: string;
  steps: { events: { type: string }[] }[];
}

/** 見本の記法。無ければ `undefined` */
const sampleText = (key: string, lang: "ja" | "en" = "ja"): string | undefined => example(`${key}${lang === "en" ? ".en" : ""}.dragon`);

/** 見本を読んだ図。file が無いか読めなければ落とす */
function sample(key: string): Source {
  const text = sampleText(key);
  expect(text, `packages/dragon/examples/${key}.dragon が無い`).toBeDefined();
  const parsed = parseNotation(text ?? "");
  expect(parsed.ok, `${key}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
  return (parsed.ok ? parsed.diagram : {}) as unknown as Source;
}

/** 部品の図の記法。file が無ければ `undefined` */
const snippetOf = (id: string, lang: "ja" | "en"): string | undefined => {
  const path = join(app, "src/catalog/parts", `${id}.lineup${lang === "en" ? ".en" : ""}.dragon`);
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

let site: Site;

async function onScreen(page: Page, screen: string, message: string): Promise<void> {
  await expect.poll(() => screenOf(page), { ...WAIT, message }).toBe(screen);
}

/** 部品の頁の図の塊ごとの、図の種類と、描いた図の数と、記法の本文 */
const figuresOf = (page: Page): Promise<{ kind: string; svgs: number; source: string }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-catalog="part"] [data-catalog="part-figure"]')].map((block) => ({
      kind: block.dataset.kind ?? "",
      svgs: block.querySelectorAll('svg[data-dragon="figure"]').length,
      source: block.querySelector('[data-catalog="part-source"]')?.textContent?.trimEnd() ?? "",
    })),
  );

/** `scope` の中の再生の部品の段を最後まで 1 つずつ送り、段が `count` あって 1 段ずつ進むかを確かめる */
async function expectSteps(page: Page, scope: string, count: number | undefined, label: string): Promise<void> {
  const items = page.locator(`${scope} [data-dragon="steps"] > li`);
  await expect.poll(() => items.count(), { ...WAIT, message: `${label} に送れる段が無い` }).toBeGreaterThan(count === undefined ? 1 : count - 1);
  const n = await items.count();
  if (count !== undefined) expect(n, `${label} の段の数`).toBe(count);
  const no = (): Promise<string | null> => page.locator(`${scope} [data-dragon="step-no"]`).textContent();
  await expect.poll(no, { ...WAIT, message: `${label} が 1 段目から始まらない` }).toBe(stepLabel(0, n));
  for (let s = 1; s < n; s++) {
    await page.locator(`${scope} [data-dragon="next"]`).click();
    await expect.poll(no, { ...WAIT, message: `${label} の段を送っても ${s + 1} 段目にならない` }).toBe(stepLabel(s, n));
  }
}

/** 部品の頁の見本の札の行き先 */
const partSamplesOf = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="part"] [data-catalog="part-samples"] a[data-catalog="part-sample"]')].map(
      (a) => `${new URL(a.href).pathname}${new URL(a.href).hash}`,
    ),
  );

/** 書く欄の中身。書く欄が無ければ `null` */
const editorValue = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null);

describe("見本帳と編集画面の列の図 (#3239)", () => {
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
    "catalog-lists-lineup-with-examples",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kinds = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll('[data-catalog="section"][data-section="kinds"] [data-catalog="card"] h2')].map((h) => h.textContent?.trim() ?? ""));
      await expect.poll(kinds, { ...WAIT, message: "見本帳の図の分類が、時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図、列の図の 7 つでない" }).toEqual([...KIND_NAMES]);

      const auction = sample("auction").title;
      const opened = await site.open({ path: `${BASE}catalog/lineup`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "category", "列の図の頁が出ない");
      const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
      await expect.poll(items, { ...WAIT, message: "列の図の頁の一覧に入札の見本が無い" }).toEqual(expect.arrayContaining([auction]));
      await opened.page.locator('[data-catalog="item"]', { hasText: auction }).click();
      await expect
        .poll(() => opened.page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: "入札の見本を選んでも右に出ない" })
        .toBe(auction);
      await expectSteps(opened.page, catalogSel("preview"), AUCTION_STEPS, "列の図の頁の入札の見本");
    },
    SLOW,
  );

  it(
    "catalog-has-lineup-parts",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kindParts = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-catalog="section"][data-section="kind-parts"] a[data-catalog="part-card"]')].map((a) => a.dataset.part ?? ""));
      await expect.poll(kindParts, { ...WAIT, message: "図の種類だけの部品に、チップ、列の並び、封、選ぶ、札が無い" }).toEqual(expect.arrayContaining([...LINEUP_PARTS]));
      for (const id of LINEUP_PARTS) expect(PARTS.find((p) => p.id === id)?.kinds, `${id} が列の図だけの部品でない`).toEqual(["lineup"]);

      for (const id of LINEUP_PARTS) {
        for (const lang of ["ja", "en"] as const) {
          const text = snippetOf(id, lang);
          expect(text, `${id}.lineup${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
          const parsed = parseNotation(text ?? "", { lang });
          expect(parsed.ok && parsed.diagram.kind, `${id} の ${lang} の記法が列の図として読めない`).toBe("lineup");
        }
        const opened = await site.open({ path: `${BASE}catalog/part/${id}`, locale: "ja-JP", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
        await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(() => figuresOf(opened.page), { ...WAIT, message: `${id} の頁が列の図の図を 1 つ、部品の記法で描かない` })
          .toEqual([{ kind: "lineup", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
        await expectSteps(opened.page, `${catalogSel("part")} ${catalogSel("part-figure")}`, undefined, `${id} の列の図`);
        await opened.page.locator(siteSel("lang-en")).click();
        await expect
          .poll(async () => (await figuresOf(opened.page)).map((f) => f.source), { ...WAIT, message: `${id} の頁を EN に替えても英語の記法にならない` })
          .toEqual([snippetOf(id, "en") ?? ""]);
        await site.closeContexts();
      }
    },
    SWEEP,
  );

  it(
    "lineup-part-pages-link-examples",
    async () => {
      const auction = sample("auction");
      for (const id of LINEUP_PARTS) {
        const { page } = await site.open({ path: `${BASE}catalog/part/${id}`, viewport: { width: 1440, height: 900 } });
        await onScreen(page, "part", `${id} の部品の頁が出ない`);
        await expect.poll(() => partSamplesOf(page), { ...WAIT, message: `${id} の頁の見本の札が、列の図の頁の auction へ向かわない` }).toEqual([`${BASE}catalog/lineup#auction`]);
        await page.locator(`${catalogSel("part-sample")}[data-sample="auction"]`).click();
        await onScreen(page, "category", `${id} の頁の auction の札を押しても図の頁が出ない`);
        await expect
          .poll(() => page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: `${id} の頁の札で移った図の頁に入札の見本が出ない` })
          .toBe(auction.title);
        await site.closeContexts();
      }
    },
    SLOW,
  );

  it(
    "editor-shelf-has-lineup",
    async () => {
      const auction = sample("auction");
      const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "editor", "編集画面が出ない");
      const placed = (key: string): Promise<{ title: string; group: string } | null> =>
        page.evaluate((s) => {
          const b = document.querySelector(s);
          return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
        }, sel(`sample-${key}`));
      await expect.poll(() => placed("auction"), { ...WAIT, message: "編集画面の棚の列の図の束に auction が無い" }).toEqual({ title: auction.title, group: "列の図" });
      await page.locator(sel("sample-auction")).click();
      await expect.poll(() => editorValue(page), { ...WAIT, message: "棚の入札の図を押しても、その記法が書く欄に入らない" }).toBe(sampleText("auction")?.trimEnd());
      await expect
        .poll(() => page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? "", sel("stage")), { ...WAIT, message: "棚の入札の図が描かれない" })
        .toContain(auction.title);

      // 記法の早見
      await page.locator(sel("shelf-tab-notation")).click();
      const lines = (id: string): Promise<string[]> =>
        page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [], sel(`syntax-${id}`));
      await expect.poll(async () => (await lines("kind")).some((l) => l.startsWith("lineup ")), { ...WAIT, message: "記法の早見の図の種類の行に lineup の頭の行が無い" }).toBe(true);
      const wants: [string, (l: string) => boolean, string][] = [
        ["item", (l) => l.trim().startsWith("item "), "チップを宣言する item の行"],
        ["line", (l) => l.trim().startsWith("line ") && l.includes(":"), "列の並びを書く line の行"],
        ["seal", (l) => l.trim().startsWith("seal "), "封をする seal の行"],
        ["open", (l) => l.trim().startsWith("open "), "封を開ける open の行"],
        ["pick", (l) => l.trim().startsWith("pick "), "列を選ぶ pick の行"],
        ["stamp", (l) => l.trim().startsWith("stamp ") && l.includes(":"), "札を押す stamp の行"],
      ];
      for (const [id, want, name] of wants) {
        await expect.poll(async () => (await lines(id)).some(want), { ...WAIT, message: `記法の早見に${name}が無い` }).toBe(true);
      }
    },
    SLOW,
  );
});
