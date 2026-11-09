/**
 * 見本帳と編集画面に量の図を載せる (#3560)。
 *
 * 見本の正は `packages/dragon/examples/` の量の図の見本 2 組 (ドーナツの `os-share` と横棒の `tickets`) で、題と図の形はその file を読んで取る。頁の側の見本の表は読まない。
 * 量の図だけの部品は、項目 (`chart-item`、最初の `step` より前の `item` の行)、値 (`chart-set`、段の中の `set` の行)、見た目 (`chart-shape`、頭の行の `[shape: ]`) の 3 つ。
 * 部品の図は `packages/dragon/src/blocks/<名札>/gallery/<名札>.chart.dragon` と英語の `.en.dragon` の記法の file。
 * 量の図の分類と部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PARTS } from "../catalog/parts";
import { BASE, example, partFigure, screenOf, type Site, startSite, stepLabel } from "./playground-support";

/** 頁が書き換わるのを待つ長さ。頁を開く時間と合わせて、1 件の上限 (10 秒) に収める */
const WAIT = { timeout: 6_000, interval: 100 } as const;

/** 見本帳の図の分類の名前の並び。量の図は 10 番目に並ぶ */
const KIND_NAMES = ["時系列図", "構成図", "状態遷移図", "枝分かれの図", "時間軸の図", "木の図", "列の図", "試す図", "配管の図", "量の図"] as const;
/** 量の図の見本 2 組。ドーナツと横棒 */
const CHART_SAMPLES = ["os-share", "tickets"] as const;
/** 量の図だけの部品の名札と、見本帳の札の名前 */
const CHART_PARTS: readonly (readonly [string, string])[] = [
  ["chart-item", "項目"],
  ["chart-set", "値"],
  ["chart-shape", "見た目"],
];

const catalogSel = (name: string): string => `[data-catalog="${name}"]`;
const siteSel = (name: string): string => `[data-site="${name}"]`;
const sel = (name: string): string => `[data-playground="${name}"]`;

interface Source {
  kind: string;
  title: string;
  chart?: { shape: string };
  steps: { events: { type: string }[] }[];
}

/** 見本の記法。無ければ `undefined` */
const sampleText = (key: string, lang: "ja" | "en" = "ja"): string | undefined => example(`${key}${lang === "en" ? ".en" : ""}.dragon`);

/** 見本を読んだ図。file が無いか量の図として読めなければ落とす */
function sample(key: string): Source {
  const text = sampleText(key);
  expect(text, `packages/dragon/examples/${key}.dragon が無い`).toBeDefined();
  const parsed = parseNotation(text ?? "", { lang: "ja" });
  expect(parsed.ok, `${key}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
  const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as Source;
  expect(diagram.kind, `${key}.dragon が量の図でない`).toBe("chart");
  return diagram;
}

/** 部品の図の記法。file が無ければ `undefined` */
const snippetOf = (id: string, lang: "ja" | "en"): string | undefined => {
  const path = partFigure(`${id}.chart${lang === "en" ? ".en" : ""}.dragon`);
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
async function expectSteps(page: Page, scope: string, count: number, label: string): Promise<void> {
  const items = page.locator(`${scope} [data-dragon="steps"] > li`);
  await expect.poll(() => items.count(), { ...WAIT, message: `${label} に送れる段が無い` }).toBe(count);
  const no = (): Promise<string | null> => page.locator(`${scope} [data-dragon="step-no"]`).textContent();
  await expect.poll(no, { ...WAIT, message: `${label} が 1 段目から始まらない` }).toBe(stepLabel(0, count));
  for (let s = 1; s < count; s++) {
    await page.locator(`${scope} [data-dragon="next"]`).click();
    await expect.poll(no, { ...WAIT, message: `${label} の段を送っても ${s + 1} 段目にならない` }).toBe(stepLabel(s, count));
  }
}

/** 書く欄の中身。書く欄が無ければ `null` */
const editorValue = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null);

describe("見本帳と編集画面の量の図 (#3560)", () => {
  beforeAll(async () => {
    site = await startSite();
  });

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  });

  it("catalog-lists-chart-with-examples", async () => {
    const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "catalog", "見本帳の一覧が出ない");
    const kinds = (): Promise<string[]> =>
      page.evaluate(() => [...document.querySelectorAll('[data-catalog="section"][data-section="kinds"] [data-catalog="card"] h2')].map((h) => h.textContent?.trim() ?? ""));
    await expect.poll(kinds, { ...WAIT, message: `見本帳の図の分類が ${KIND_NAMES.join("、")} の 10 でない` }).toEqual([...KIND_NAMES]);

    const samples = CHART_SAMPLES.map((key) => sample(key));
    expect(
      samples.map((s) => s.chart?.shape),
      "量の図の見本がドーナツと横棒の 2 つでない",
    ).toEqual(["donut", "bar"]);
    const opened = await site.open({ path: `${BASE}catalog/chart`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await onScreen(opened.page, "category", "量の図の頁が出ない");
    const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
    await expect.poll(items, { ...WAIT, message: "量の図の頁の一覧にドーナツと横棒の見本が無い" }).toEqual(expect.arrayContaining(samples.map((s) => s.title)));
    for (const [k, chosen] of samples.entries()) {
      await opened.page.locator('[data-catalog="item"]', { hasText: chosen.title }).click();
      await expect
        .poll(() => opened.page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), {
          ...WAIT,
          message: `${CHART_SAMPLES[k]} の見本を選んでも右に出ない`,
        })
        .toBe(chosen.title);
      await expectSteps(opened.page, catalogSel("preview"), chosen.steps.length, `量の図の頁の ${CHART_SAMPLES[k]} の見本`);
    }
  });

  it("catalog-has-chart-parts", async () => {
    const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "catalog", "見本帳の一覧が出ない");
    const cards = (): Promise<[string, string][]> =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-catalog="section"][data-section="kind-parts"] a[data-catalog="part-card"]')].map((a): [string, string] => [
          a.dataset.part ?? "",
          a.querySelector(".catalog-part-card-name")?.textContent?.trim() ?? "",
        ]),
      );
    await expect
      .poll(cards, { ...WAIT, message: `図の種類だけの部品に、${CHART_PARTS.map(([, name]) => name).join("、")} が無い` })
      .toEqual(expect.arrayContaining(CHART_PARTS.map(([id, name]) => [id, name])));
    for (const [id] of CHART_PARTS) expect(PARTS.find((p) => String(p.id) === id)?.kinds, `${id} が量の図だけの部品でない`).toEqual(["chart"]);
  });

  describe.for(CHART_PARTS.map(([id]) => id))("%s", (id) => {
    it("catalog-has-chart-parts", async () => {
      for (const lang of ["ja", "en"] as const) {
        const text = snippetOf(id, lang);
        expect(text, `${id}.chart${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
        const parsed = parseNotation(text ?? "", { lang });
        expect(parsed.ok && parsed.diagram.kind, `${id} の ${lang} の記法が量の図として読めない`).toBe("chart");
      }
      const opened = await site.open({ path: `${BASE}catalog/part/${id}`, locale: "ja-JP", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
      await expect
        .poll(() => figuresOf(opened.page), { ...WAIT, message: `${id} の頁が量の図の図を 1 つ、部品の記法で描かない` })
        .toEqual([{ kind: "chart", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
      await opened.page.locator(siteSel("lang-en")).click();
      await expect
        .poll(async () => (await figuresOf(opened.page)).map((f) => f.source), { ...WAIT, message: `${id} の頁を EN に替えても英語の記法にならない` })
        .toEqual([snippetOf(id, "en") ?? ""]);
    });
  });

  it("editor-shelf-has-chart", async () => {
    const samples = CHART_SAMPLES.map((key) => sample(key));
    const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "editor", "編集画面が出ない");
    const placed = (key: string): Promise<{ title: string; group: string } | null> =>
      page.evaluate((s) => {
        const b = document.querySelector(s);
        return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
      }, sel(`sample-${key}`));
    for (const [k, key] of CHART_SAMPLES.entries()) {
      await expect.poll(() => placed(key), { ...WAIT, message: `編集画面の棚の量の図の束に ${key} が無い` }).toEqual({ title: samples[k]?.title, group: "量の図" });
    }
    for (const [k, key] of CHART_SAMPLES.entries()) {
      await page.locator(sel(`sample-${key}`)).click();
      await expect.poll(() => editorValue(page), { ...WAIT, message: `棚の ${key} の図を押しても、その記法が書く欄に入らない` }).toBe(sampleText(key)?.trimEnd());
      await expect
        .poll(() => page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? "", sel("stage")), {
          ...WAIT,
          message: `棚の ${key} の図が描かれない`,
        })
        .toContain(samples[k]?.title);
    }

    // 記法の早見の図の種類の行に量の図の頭の行と [shape: ] があり、項目の item の行と値の set の行がある
    await page.locator(sel("shelf-tab-notation")).click();
    const lines = (id: string): Promise<string[]> =>
      page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [], sel(`syntax-${id}`));
    await expect
      .poll(async () => (await lines("kind")).some((l) => l.startsWith("chart ") && l.includes("[shape: ")), { ...WAIT, message: "記法の早見の図の種類の行に [shape: ] を付けた chart の頭の行が無い" })
      .toBe(true);
    const wants: [string, (l: string) => boolean, string][] = [
      ["chart-item", (l) => /^item \S+ as \S/u.test(l.trim()), "項目を宣言する item の行"],
      ["chart-set", (l) => /^set \S+: \S/u.test(l.trim()), "項目の値を書く set の行"],
    ];
    for (const [id, want, name] of wants) {
      await expect.poll(async () => (await lines(id)).some(want), { ...WAIT, message: `記法の早見に量の図の${name}が無い` }).toBe(true);
    }
  });
});
