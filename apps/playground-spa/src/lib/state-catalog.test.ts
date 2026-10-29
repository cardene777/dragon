/**
 * 見本帳と編集画面に状態遷移図を載せる (#3163)。
 *
 * 見本の正は `packages/dragon/examples/order.dragon` で、題と図の形はその file を読んで取る。頁の側の見本の表は読まない。
 * 状態遷移図だけの部品は「始まりと終わり」(`start-finish`) と「通らない道」(`side-path`) の 2 つで、
 * 部品の図は `catalog/parts/<名札>.state.dragon` と英語の `.en.dragon` の記法の file。
 * 状態遷移図の分類と部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { isCommon, PARTS } from "../catalog/parts";
import { app, BASE, example, type Site, startSite, stepLabel } from "./playground-support";

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

/** 見本帳の図の分類のうち、状態遷移図までに並ぶ名前。分類の数は図の種類を足すたびに増えるので、数は足した課題の検査が持つ (#3164) */
const KIND_NAMES = ["時系列図", "構成図", "状態遷移図"] as const;
/** 状態遷移図だけの部品 */
const STATE_PARTS = ["start-finish", "side-path"] as const;
/** 注文の見本の段の数 */
const ORDER_STEPS = 10;

const catalogSel = (name: string): string => `[data-catalog="${name}"]`;
const siteSel = (name: string): string => `[data-site="${name}"]`;
const sel = (name: string): string => `[data-playground="${name}"]`;

interface Source {
  kind: string;
  title: string;
  steps: { events: { type: string; from?: string; to?: string }[] }[];
  state?: { paths: unknown[] };
}

/** 注文の見本の記法。無ければ `undefined` */
const orderText = (lang: "ja" | "en" = "ja"): string | undefined => example(`order${lang === "en" ? ".en" : ""}.dragon`);

/** 注文の見本を読んだ図。file が無いか読めなければ落とす */
function order(): Source {
  const text = orderText();
  expect(text, "packages/dragon/examples/order.dragon が無い").toBeDefined();
  const parsed = parseNotation(text ?? "");
  expect(parsed.ok, `order.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
  return (parsed.ok ? parsed.diagram : {}) as unknown as Source;
}

/** 部品の図の記法。file が無ければ `undefined` */
const snippetOf = (id: string, lang: "ja" | "en"): string | undefined => {
  const path = join(app, "src/catalog/parts", `${id}.state${lang === "en" ? ".en" : ""}.dragon`);
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

let site: Site;

const screenOf = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector("[data-site-screen]")?.getAttribute("data-site-screen") ?? null);

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

describe("見本帳と編集画面の状態遷移図 (#3163)", () => {
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
    "catalog-lists-state-with-order",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kinds = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll('[data-catalog="section"][data-section="kinds"] [data-catalog="card"] h2')].map((h) => h.textContent?.trim() ?? ""));
      await expect
        .poll(async () => (await kinds()).slice(0, KIND_NAMES.length), { ...WAIT, message: "見本帳の図の分類が、時系列図、構成図、状態遷移図の順で始まらない" })
        .toEqual([...KIND_NAMES]);

      const title = order().title;
      const opened = await site.open({ path: `${BASE}catalog/state`, viewport: { width: 1440, height: 900 } });
      await opened.page.emulateMedia({ reducedMotion: "reduce" });
      await onScreen(opened.page, "category", "状態遷移図の頁が出ない");
      const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
      await expect.poll(items, { ...WAIT, message: "状態遷移図の頁の一覧に注文の見本が無い" }).toContain(title);
      await opened.page.locator('[data-catalog="item"]', { hasText: title }).click();
      await expect
        .poll(() => opened.page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: "注文の見本を選んでも右に出ない" })
        .toBe(title);
      await expectSteps(opened.page, catalogSel("preview"), ORDER_STEPS, "状態遷移図の頁の注文の見本");
    },
    SLOW,
  );

  it(
    "catalog-has-two-state-parts",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kindParts = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-catalog="section"][data-section="kind-parts"] a[data-catalog="part-card"]')].map((a) => a.dataset.part ?? ""));
      await expect.poll(kindParts, { ...WAIT, message: "図の種類だけの部品に、始まりと終わりと通らない道が無い" }).toEqual(expect.arrayContaining([...STATE_PARTS]));

      for (const id of STATE_PARTS) {
        for (const lang of ["ja", "en"] as const) {
          const text = snippetOf(id, lang);
          expect(text, `${id}.state${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
          const parsed = parseNotation(text ?? "");
          expect(parsed.ok && parsed.diagram.kind, `${id} の ${lang} の記法が状態遷移図として読めない`).toBe("state");
        }
        const opened = await site.open({ path: `${BASE}catalog/part/${id}`, locale: "ja-JP", viewport: { width: 1440, height: 900 } });
        await opened.page.emulateMedia({ reducedMotion: "reduce" });
        await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(() => figuresOf(opened.page), { ...WAIT, message: `${id} の頁が状態遷移図の図を 1 つ、部品の記法で描かない` })
          .toEqual([{ kind: "state", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
        await expectSteps(opened.page, `${catalogSel("part")} ${catalogSel("part-figure")}`, undefined, `${id} の状態遷移図`);
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
    "common-parts-draw-state",
    async () => {
      const common = PARTS.filter(isCommon).map((p) => p.id);
      expect(common.length, "どの図でも使う部品の数").toBe(12);
      for (const id of common) {
        const { page } = await site.open({ path: `${BASE}catalog/part/${id}`, viewport: { width: 1440, height: 900 } });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await onScreen(page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(async () => (await figuresOf(page)).filter((f) => f.kind === "state"), { ...WAIT, message: `${id} の頁に状態遷移図で描いた図が無い` })
          .toEqual([{ kind: "state", svgs: 1, source: snippetOf(id, "ja") ?? `(${id}.state.dragon が無い)` }]);
        await expectSteps(page, `${catalogSel("part")} ${catalogSel("part-figure")}[data-kind="state"]`, undefined, `${id} の状態遷移図`);
        await site.closeContexts();
      }
    },
    SWEEP,
  );

  it(
    "state-part-pages-link-order",
    async () => {
      const d = order();
      const edges = d.steps.flatMap((s) => s.events.filter((e) => e.type === "edge"));
      expect(edges.some((e) => e.from === "start" || e.to === "finish"), "注文の見本が start か finish の線を持たない").toBe(true);
      expect((d.state?.paths ?? []).length, "注文の見本が最初の段より前に線を書かない").toBeGreaterThan(0);
      for (const id of STATE_PARTS) {
        const { page } = await site.open({ path: `${BASE}catalog/part/${id}`, viewport: { width: 1440, height: 900 } });
        await onScreen(page, "part", `${id} の部品の頁が出ない`);
        await expect.poll(() => partSamplesOf(page), { ...WAIT, message: `${id} の頁の見本の札が、状態遷移図の頁の注文へ向かう 1 枚でない` }).toEqual([`${BASE}catalog/state#order`]);
        await page.locator(`${catalogSel("part-sample")}[data-sample="order"]`).click();
        await onScreen(page, "category", `${id} の頁の注文の札を押しても図の頁が出ない`);
        await expect
          .poll(() => page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: `${id} の頁の札で移った図の頁に注文の見本が出ない` })
          .toBe(d.title);
        await site.closeContexts();
      }
    },
    SLOW,
  );

  it(
    "editor-shelf-has-state",
    async () => {
      const d = order();
      const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "editor", "編集画面が出ない");
      const placed = (): Promise<{ title: string; group: string } | null> =>
        page.evaluate((s) => {
          const b = document.querySelector(s);
          return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
        }, sel("sample-order"));
      await expect.poll(placed, { ...WAIT, message: "編集画面の棚の状態遷移図の束に注文が無い" }).toEqual({ title: d.title, group: "状態遷移図" });
      await page.locator(sel("sample-order")).click();
      await expect.poll(() => editorValue(page), { ...WAIT, message: "棚の注文を押しても、その記法が書く欄に入らない" }).toBe(orderText()?.trimEnd());
      await expect
        .poll(() => page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? "", sel("stage")), { ...WAIT, message: "棚の注文の図が描かれない" })
        .toContain(d.title);

      // 記法の早見
      await page.locator(sel("shelf-tab-notation")).click();
      const lines = (id: string): Promise<string[] | null> =>
        page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? null, sel(`syntax-${id}`));
      await expect.poll(async () => ((await lines("kind")) ?? []).some((l) => l.startsWith("state ")), { ...WAIT, message: "記法の早見の図の種類の行に state の頭の行が無い" }).toBe(true);
      await expect
        .poll(async () => {
          const shown = (await lines("start-finish")) ?? [];
          return [shown.some((l) => l.includes("start ->")), shown.some((l) => l.includes("-> finish"))];
        }, { ...WAIT, message: "記法の早見に start と finish の線の行が無い" })
        .toEqual([true, true]);
      await expect
        .poll(async () => ((await lines("path")) ?? []).some((l) => l.includes("->") && !/^\s/u.test(l)), { ...WAIT, message: "記法の早見に、最初の段より前に字下げせず書く通らない道の行が無い" })
        .toBe(true);
    },
    SLOW,
  );
});
