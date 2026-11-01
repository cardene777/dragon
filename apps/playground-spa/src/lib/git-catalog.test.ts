/**
 * 見本帳と編集画面に枝分かれの図を載せる (#3164)。
 *
 * 見本の正は `packages/dragon/examples/rebase.dragon` と `merge.dragon` で、題と図の形はその file を読んで取る。頁の側の見本の表は読まない。
 * 枝分かれの図だけの部品は、枝 (`branch`)、commit (`commit`)、当て直し (`copy`)、merge commit (`merge`) の 4 つで、
 * 部品の図は `catalog/parts/<名札>.git.dragon` と英語の `.en.dragon` の記法の file。札の動きは共通の線の部品が受け持つ。
 * 枝分かれの図の分類と部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { isCommon, PARTS } from "../catalog/parts";
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
const KIND_NAMES = ["時系列図", "構成図", "状態遷移図", "枝分かれの図"] as const;
/** 枝分かれの図だけの部品 */
const GIT_PARTS = ["branch", "commit", "copy", "merge"] as const;
/** 枝分かれの図の見本 */
const GIT_SAMPLES = ["rebase", "merge"] as const;
/** rebase の見本の段の数 */
const REBASE_STEPS = 11;

const catalogSel = (name: string): string => `[data-catalog="${name}"]`;
const siteSel = (name: string): string => `[data-site="${name}"]`;
const sel = (name: string): string => `[data-playground="${name}"]`;

interface Source {
  kind: string;
  title: string;
  steps: { events: { type: string; copy?: string; merge?: string }[] }[];
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
  const path = join(app, "src/catalog/parts", `${id}.git${lang === "en" ? ".en" : ""}.dragon`);
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

describe("見本帳と編集画面の枝分かれの図 (#3164)", () => {
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
    "catalog-lists-git-with-examples",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kinds = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll('[data-catalog="section"][data-section="kinds"] [data-catalog="card"] h2')].map((h) => h.textContent?.trim() ?? ""));
      await expect
        .poll(async () => (await kinds()).slice(0, KIND_NAMES.length), { ...WAIT, message: "見本帳の図の分類が、時系列図、構成図、状態遷移図、枝分かれの図の順で始まらない" })
        .toEqual([...KIND_NAMES]);

      const titles = GIT_SAMPLES.map((key) => sample(key).title);
      const opened = await site.open({ path: `${BASE}catalog/git`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "category", "枝分かれの図の頁が出ない");
      const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
      await expect.poll(items, { ...WAIT, message: "枝分かれの図の頁の一覧に rebase と merge の見本が無い" }).toEqual(expect.arrayContaining(titles));
      const rebase = titles[0] ?? "";
      await opened.page.locator('[data-catalog="item"]', { hasText: rebase }).click();
      await expect
        .poll(() => opened.page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: "rebase の見本を選んでも右に出ない" })
        .toBe(rebase);
      await expectSteps(opened.page, catalogSel("preview"), REBASE_STEPS, "枝分かれの図の頁の rebase の見本");
    },
    SLOW,
  );

  it(
    "catalog-has-four-git-parts",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kindParts = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-catalog="section"][data-section="kind-parts"] a[data-catalog="part-card"]')].map((a) => a.dataset.part ?? ""));
      await expect.poll(kindParts, { ...WAIT, message: "図の種類だけの部品に、枝と commit と当て直しと merge commit が無い" }).toEqual(expect.arrayContaining([...GIT_PARTS]));
      for (const id of GIT_PARTS) expect(PARTS.find((p) => p.id === id)?.kinds, `${id} が枝分かれの図だけの部品でない`).toEqual(["git"]);

      for (const id of GIT_PARTS) {
        for (const lang of ["ja", "en"] as const) {
          const text = snippetOf(id, lang);
          expect(text, `${id}.git${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
          const parsed = parseNotation(text ?? "", { lang });
          expect(parsed.ok && parsed.diagram.kind, `${id} の ${lang} の記法が枝分かれの図として読めない`).toBe("git");
        }
        const opened = await site.open({ path: `${BASE}catalog/part/${id}`, locale: "ja-JP", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
        await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(() => figuresOf(opened.page), { ...WAIT, message: `${id} の頁が枝分かれの図の図を 1 つ、部品の記法で描かない` })
          .toEqual([{ kind: "git", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
        await expectSteps(opened.page, `${catalogSel("part")} ${catalogSel("part-figure")}`, undefined, `${id} の枝分かれの図`);
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
    "common-parts-draw-git",
    async () => {
      const common = PARTS.filter(isCommon).map((p) => p.id);
      expect(common.length, "どの図でも使う部品の数").toBe(12);
      for (const id of common) {
        const { page } = await site.open({ path: `${BASE}catalog/part/${id}`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
        await onScreen(page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(async () => (await figuresOf(page)).filter((f) => f.kind === "git"), { ...WAIT, message: `${id} の頁に枝分かれの図で描いた図が無い` })
          .toEqual([{ kind: "git", svgs: 1, source: snippetOf(id, "ja") ?? `(${id}.git.dragon が無い)` }]);
        await expectSteps(page, `${catalogSel("part")} ${catalogSel("part-figure")}[data-kind="git"]`, undefined, `${id} の枝分かれの図`);
        await site.closeContexts();
      }
    },
    SWEEP,
  );

  it(
    "git-part-pages-link-examples",
    async () => {
      const rebase = sample("rebase");
      const merge = sample("merge");
      const events = (d: Source) => d.steps.flatMap((s) => s.events);
      expect(events(rebase).some((e) => e.type === "commit" && e.copy !== undefined), "rebase の見本が当て直しを持たない").toBe(true);
      expect(events(merge).some((e) => e.type === "commit" && e.merge !== undefined), "merge の見本が merge commit を持たない").toBe(true);
      // 部品の名札と、その頁の札が向かう見本
      const cases: [string, string, Source][] = [
        ["copy", "rebase", rebase],
        ["merge", "merge", merge],
      ];
      for (const [id, key, d] of cases) {
        const { page } = await site.open({ path: `${BASE}catalog/part/${id}`, viewport: { width: 1440, height: 900 } });
        await onScreen(page, "part", `${id} の部品の頁が出ない`);
        await expect.poll(() => partSamplesOf(page), { ...WAIT, message: `${id} の頁の見本の札が、枝分かれの図の頁の ${key} へ向かう 1 枚でない` }).toEqual([`${BASE}catalog/git#${key}`]);
        await page.locator(`${catalogSel("part-sample")}[data-sample="${key}"]`).click();
        await onScreen(page, "category", `${id} の頁の ${key} の札を押しても図の頁が出ない`);
        await expect
          .poll(() => page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: `${id} の頁の札で移った図の頁に ${key} の見本が出ない` })
          .toBe(d.title);
        await site.closeContexts();
      }
    },
    SLOW,
  );

  it(
    "editor-shelf-has-git",
    async () => {
      const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "editor", "編集画面が出ない");
      const placed = (key: string): Promise<{ title: string; group: string } | null> =>
        page.evaluate((s) => {
          const b = document.querySelector(s);
          return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
        }, sel(`sample-${key}`));
      for (const key of GIT_SAMPLES) {
        await expect.poll(() => placed(key), { ...WAIT, message: `編集画面の棚の枝分かれの図の束に ${key} が無い` }).toEqual({ title: sample(key).title, group: "枝分かれの図" });
      }
      await page.locator(sel("sample-rebase")).click();
      await expect.poll(() => editorValue(page), { ...WAIT, message: "棚の rebase を押しても、その記法が書く欄に入らない" }).toBe(sampleText("rebase")?.trimEnd());
      await expect
        .poll(() => page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? "", sel("stage")), { ...WAIT, message: "棚の rebase の図が描かれない" })
        .toContain(sample("rebase").title);

      // 記法の早見
      await page.locator(sel("shelf-tab-notation")).click();
      const lines = (id: string): Promise<string[]> =>
        page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [], sel(`syntax-${id}`));
      await expect.poll(async () => (await lines("kind")).some((l) => l.startsWith("git ")), { ...WAIT, message: "記法の早見の図の種類の行に git の頭の行が無い" }).toBe(true);
      const wants: [string, (l: string) => boolean, string][] = [
        ["branch", (l) => l.startsWith("branch "), "枝を宣言する branch の行"],
        ["branch", (l) => l.includes(" from "), "枝を切る from の行"],
        ["commit", (l) => l.trim().startsWith("commit ") && l.includes(" on "), "commit を積む行"],
        ["copy", (l) => l.trim().startsWith("commit ") && l.includes(" copy "), "当て直す copy の行"],
        ["merge", (l) => l.trim().startsWith("commit ") && l.includes(" merge "), "merge commit の行"],
        ["ref", (l) => l.includes(" -> "), "札を動かす行"],
      ];
      for (const [id, want, name] of wants) {
        await expect.poll(async () => (await lines(id)).some(want), { ...WAIT, message: `記法の早見に${name}が無い` }).toBe(true);
      }
    },
    SLOW,
  );
});
