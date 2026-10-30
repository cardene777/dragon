/**
 * 見本帳と編集画面に木の図を載せる (#3233)。
 *
 * 見本の正は `packages/dragon/examples/merkle.dragon` で、題と図の形はその file を読んで取る。頁の側の見本の表は読まない。
 * 木の図だけの部品は、葉と札 (`leaf`) と組んだ親 (`node`) の 2 つで、
 * 部品の図は `catalog/parts/<名札>.tree.dragon` と英語の `.en.dragon` の記法の file。
 * 木の図の分類と部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
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

/** 見本帳の図の分類の名前の並び */
const KIND_NAMES = ["時系列図", "構成図", "状態遷移図", "枝分かれの図", "時間軸の図", "木の図"] as const;
/** 木の図だけの部品 */
const TREE_PARTS = ["leaf", "node"] as const;
/** 木の図の見本 */
const TREE_SAMPLES = ["merkle"] as const;
/** Merkle の見本の段の数 */
const MERKLE_STEPS = 8;

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
  const path = join(app, "src/catalog/parts", `${id}.tree${lang === "en" ? ".en" : ""}.dragon`);
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

describe("見本帳と編集画面の木の図 (#3233)", () => {
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
    "catalog-lists-tree-with-examples",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kinds = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll('[data-catalog="section"][data-section="kinds"] [data-catalog="card"] h2')].map((h) => h.textContent?.trim() ?? ""));
      await expect.poll(kinds, { ...WAIT, message: "見本帳の図の分類が、時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図の 6 つでない" }).toEqual([...KIND_NAMES]);

      const titles = TREE_SAMPLES.map((key) => sample(key).title);
      const opened = await site.open({ path: `${BASE}catalog/tree`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "category", "木の図の頁が出ない");
      const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
      await expect.poll(items, { ...WAIT, message: "木の図の頁の一覧に Merkle の見本が無い" }).toEqual(expect.arrayContaining(titles));
      const merkle = titles[0] ?? "";
      await opened.page.locator('[data-catalog="item"]', { hasText: merkle }).click();
      await expect
        .poll(() => opened.page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: "Merkle の見本を選んでも右に出ない" })
        .toBe(merkle);
      await expectSteps(opened.page, catalogSel("preview"), MERKLE_STEPS, "木の図の頁の Merkle の見本");
    },
    SLOW,
  );

  it(
    "catalog-has-two-tree-parts",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kindParts = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-catalog="section"][data-section="kind-parts"] a[data-catalog="part-card"]')].map((a) => a.dataset.part ?? ""));
      await expect.poll(kindParts, { ...WAIT, message: "図の種類だけの部品に、葉と札と組んだ親が無い" }).toEqual(expect.arrayContaining([...TREE_PARTS]));
      for (const id of TREE_PARTS) expect(PARTS.find((p) => p.id === id)?.kinds, `${id} が木の図だけの部品でない`).toEqual(["tree"]);

      for (const id of TREE_PARTS) {
        for (const lang of ["ja", "en"] as const) {
          const text = snippetOf(id, lang);
          expect(text, `${id}.tree${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
          const parsed = parseNotation(text ?? "", { lang });
          expect(parsed.ok && parsed.diagram.kind, `${id} の ${lang} の記法が木の図として読めない`).toBe("tree");
        }
        const opened = await site.open({ path: `${BASE}catalog/part/${id}`, locale: "ja-JP", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
        await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(() => figuresOf(opened.page), { ...WAIT, message: `${id} の頁が木の図の図を 1 つ、部品の記法で描かない` })
          .toEqual([{ kind: "tree", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
        await expectSteps(opened.page, `${catalogSel("part")} ${catalogSel("part-figure")}`, undefined, `${id} の木の図`);
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
    "common-parts-draw-tree",
    async () => {
      const common = PARTS.filter(isCommon).map((p) => p.id);
      expect(common.length, "どの図でも使う部品が無い").toBeGreaterThan(0);
      for (const id of common) {
        const { page } = await site.open({ path: `${BASE}catalog/part/${id}`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
        await onScreen(page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(async () => (await figuresOf(page)).filter((f) => f.kind === "tree"), { ...WAIT, message: `${id} の頁に木の図で描いた図が無い` })
          .toEqual([{ kind: "tree", svgs: 1, source: snippetOf(id, "ja") ?? `(${id}.tree.dragon が無い)` }]);
        await expectSteps(page, `${catalogSel("part")} ${catalogSel("part-figure")}[data-kind="tree"]`, undefined, `${id} の木の図`);
        await site.closeContexts();
      }
    },
    SWEEP,
  );

  it(
    "tree-part-pages-link-examples",
    async () => {
      const merkle = sample("merkle");
      for (const id of TREE_PARTS) {
        const { page } = await site.open({ path: `${BASE}catalog/part/${id}`, viewport: { width: 1440, height: 900 } });
        await onScreen(page, "part", `${id} の部品の頁が出ない`);
        await expect.poll(() => partSamplesOf(page), { ...WAIT, message: `${id} の頁の見本の札が、木の図の頁の merkle へ向かわない` }).toEqual([`${BASE}catalog/tree#merkle`]);
        await page.locator(`${catalogSel("part-sample")}[data-sample="merkle"]`).click();
        await onScreen(page, "category", `${id} の頁の merkle の札を押しても図の頁が出ない`);
        await expect
          .poll(() => page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: `${id} の頁の札で移った図の頁に Merkle の見本が出ない` })
          .toBe(merkle.title);
        await site.closeContexts();
      }
    },
    SLOW,
  );

  it(
    "editor-shelf-has-tree",
    async () => {
      const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "editor", "編集画面が出ない");
      const placed = (key: string): Promise<{ title: string; group: string } | null> =>
        page.evaluate((s) => {
          const b = document.querySelector(s);
          return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
        }, sel(`sample-${key}`));
      for (const key of TREE_SAMPLES) {
        await expect.poll(() => placed(key), { ...WAIT, message: `編集画面の棚の木の図の束に ${key} が無い` }).toEqual({ title: sample(key).title, group: "木の図" });
      }
      await page.locator(sel("sample-merkle")).click();
      await expect.poll(() => editorValue(page), { ...WAIT, message: "棚の Merkle を押しても、その記法が書く欄に入らない" }).toBe(sampleText("merkle")?.trimEnd());
      await expect
        .poll(() => page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? "", sel("stage")), { ...WAIT, message: "棚の Merkle の図が描かれない" })
        .toContain(sample("merkle").title);

      // 記法の早見
      await page.locator(sel("shelf-tab-notation")).click();
      const lines = (id: string): Promise<string[]> =>
        page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [], sel(`syntax-${id}`));
      await expect.poll(async () => (await lines("kind")).some((l) => l.startsWith("tree ")), { ...WAIT, message: "記法の早見の図の種類の行に tree の頭の行が無い" }).toBe(true);
      const wants: [string, (l: string) => boolean, string][] = [
        ["leaf", (l) => l.trim().startsWith("leaf "), "葉を出す leaf の行"],
        ["node", (l) => l.trim().startsWith("node ") && l.includes(" of "), "子から親を組む node の行"],
      ];
      for (const [id, want, name] of wants) {
        await expect.poll(async () => (await lines(id)).some(want), { ...WAIT, message: `記法の早見に${name}が無い` }).toBe(true);
      }
    },
    SLOW,
  );
});
