/**
 * 見本帳と編集画面に手順の図を載せる (#3561)。
 *
 * 見本の正は `packages/dragon/examples/login-check.dragon` (ログインの判断) で、題と段の数はその file を読んで取る。頁の側の見本の表は読まない。
 * 手順の図だけの部品は判断 (`choice`) の 1 つ。部品の図は `packages/dragon/src/blocks/choice/gallery/choice.flow.dragon` と英語の `.en.dragon` の記法の file。
 * 図の種類の数は数えない。ほかの図の種類が後から足されても、手順の図が並ぶことだけを確かめる。
 * 手順の図の分類と部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PARTS } from "../catalog/parts";
import { BASE, example, partFigure, screenOf, type Site, startSite, stepLabel } from "./playground-support";

/** 頁が書き換わるのを待つ長さ。頁を開く時間と合わせて、1 件の上限 (10 秒) に収める */
const WAIT = { timeout: 6_000, interval: 100 } as const;

/** 見本帳の手順の図の分類の名前 */
const FLOW_NAME = "手順の図";
/** 手順の図の見本 */
const FLOW_SAMPLE = "login-check";
/** 手順の図だけの部品の名札と、見本帳の札の名前 */
const FLOW_PARTS: readonly (readonly [string, string])[] = [["choice", "判断"]];

const catalogSel = (name: string): string => `[data-catalog="${name}"]`;
const siteSel = (name: string): string => `[data-site="${name}"]`;
const sel = (name: string): string => `[data-playground="${name}"]`;

interface Source {
  kind: string;
  title: string;
  steps: { events: { type: string }[] }[];
}

/** 見本の記法。無ければ `undefined` */
const sampleText = (lang: "ja" | "en" = "ja"): string | undefined => example(`${FLOW_SAMPLE}${lang === "en" ? ".en" : ""}.dragon`);

/** 見本を読んだ図。file が無いか手順の図として読めなければ落とす */
function sample(): Source {
  const text = sampleText();
  expect(text, `packages/dragon/examples/${FLOW_SAMPLE}.dragon が無い`).toBeDefined();
  const parsed = parseNotation(text ?? "", { lang: "ja" });
  expect(parsed.ok, `${FLOW_SAMPLE}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
  const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as Source;
  expect(diagram.kind, `${FLOW_SAMPLE}.dragon が手順の図でない`).toBe("flow");
  return diagram;
}

/** 部品の図の記法。file が無ければ `undefined` */
const snippetOf = (id: string, lang: "ja" | "en"): string | undefined => {
  const path = partFigure(`${id}.flow${lang === "en" ? ".en" : ""}.dragon`);
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

describe("見本帳と編集画面の手順の図 (#3561)", () => {
  beforeAll(async () => {
    site = await startSite();
  });

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  });

  it("catalog-lists-flow-with-examples", async () => {
    const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "catalog", "見本帳の一覧が出ない");
    const kinds = (): Promise<string[]> =>
      page.evaluate(() => [...document.querySelectorAll('[data-catalog="section"][data-section="kinds"] [data-catalog="card"] h2')].map((h) => h.textContent?.trim() ?? ""));
    await expect.poll(kinds, { ...WAIT, message: `見本帳の図の分類に${FLOW_NAME}が無い` }).toContain(FLOW_NAME);

    const login = sample();
    const opened = await site.open({ path: `${BASE}catalog/flow`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await onScreen(opened.page, "category", "手順の図の頁が出ない");
    const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
    await expect.poll(items, { ...WAIT, message: "手順の図の頁の一覧にログインの判断の見本が無い" }).toEqual(expect.arrayContaining([login.title]));
    await opened.page.locator('[data-catalog="item"]', { hasText: login.title }).click();
    await expect
      .poll(() => opened.page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: "ログインの判断の見本を選んでも右に出ない" })
      .toBe(login.title);
    await expectSteps(opened.page, catalogSel("preview"), login.steps.length, "手順の図の頁のログインの判断の見本");
  });

  it("catalog-lists-all-paths-example", async () => {
    // 判断から両方の道へ同時に走る見本 (#3579) が、今の見本と並んで載る
    const text = example("login-all-paths.dragon");
    expect(text, "packages/dragon/examples/login-all-paths.dragon が無い").toBeDefined();
    const parsed = parseNotation(text ?? "", { lang: "ja" });
    const title = parsed.ok ? (parsed.diagram as unknown as Source).title : "";
    const { page } = await site.open({ path: `${BASE}catalog/flow`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await onScreen(page, "category", "手順の図の頁が出ない");
    const items = (): Promise<string[]> => page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
    await expect.poll(items, { ...WAIT, message: "手順の図の頁の一覧に全ての道の見本が無い" }).toEqual(expect.arrayContaining([sample().title, title]));
  });

  it("catalog-has-flow-parts", async () => {
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
      .poll(cards, { ...WAIT, message: `図の種類だけの部品に、${FLOW_PARTS.map(([, name]) => name).join("、")} が無い` })
      .toEqual(expect.arrayContaining(FLOW_PARTS.map(([id, name]) => [id, name])));
    for (const [id] of FLOW_PARTS) expect(PARTS.find((p) => String(p.id) === id)?.kinds, `${id} が手順の図だけの部品でない`).toEqual(["flow"]);
  });

  describe.for(FLOW_PARTS.map(([id]) => id))("%s", (id) => {
    it("catalog-has-flow-parts", async () => {
      for (const lang of ["ja", "en"] as const) {
        const text = snippetOf(id, lang);
        expect(text, `${id}.flow${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
        const parsed = parseNotation(text ?? "", { lang });
        expect(parsed.ok && parsed.diagram.kind, `${id} の ${lang} の記法が手順の図として読めない`).toBe("flow");
      }
      const opened = await site.open({ path: `${BASE}catalog/part/${id}`, locale: "ja-JP", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
      await expect
        .poll(() => figuresOf(opened.page), { ...WAIT, message: `${id} の頁が手順の図の図を 1 つ、部品の記法で描かない` })
        .toEqual([{ kind: "flow", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
      await opened.page.locator(siteSel("lang-en")).click();
      await expect
        .poll(async () => (await figuresOf(opened.page)).map((f) => f.source), { ...WAIT, message: `${id} の頁を EN に替えても英語の記法にならない` })
        .toEqual([snippetOf(id, "en") ?? ""]);
    });
  });

  it("editor-shelf-has-flow", async () => {
    const login = sample();
    const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "editor", "編集画面が出ない");
    const placed = (key: string): Promise<{ title: string; group: string } | null> =>
      page.evaluate((s) => {
        const b = document.querySelector(s);
        return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
      }, sel(`sample-${key}`));
    await expect.poll(() => placed(FLOW_SAMPLE), { ...WAIT, message: `編集画面の棚の手順の図の束に ${FLOW_SAMPLE} が無い` }).toEqual({ title: login.title, group: FLOW_NAME });
    await page.locator(sel(`sample-${FLOW_SAMPLE}`)).click();
    await expect.poll(() => editorValue(page), { ...WAIT, message: "棚のログインの判断の図を押しても、その記法が書く欄に入らない" }).toBe(sampleText()?.trimEnd());
    await expect
      .poll(() => page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? "", sel("stage")), { ...WAIT, message: "棚のログインの判断の図が描かれない" })
      .toContain(login.title);

    // 記法の早見の図の種類の行に、手順の図の頭の行と判断の行がある
    await page.locator(sel("shelf-tab-notation")).click();
    const lines = (): Promise<string[]> => page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [], sel("syntax-kind"));
    await expect.poll(async () => (await lines()).some((l) => l.startsWith("flow ")), { ...WAIT, message: "記法の早見の図の種類の行に flow の頭の行が無い" }).toBe(true);
    await expect.poll(async () => (await lines()).some((l) => l.trimStart().startsWith("choice ")), { ...WAIT, message: "記法の早見の図の種類の行に choice の行が無い" }).toBe(true);
  });
});
