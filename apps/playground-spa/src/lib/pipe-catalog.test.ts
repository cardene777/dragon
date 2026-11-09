/**
 * 見本帳と編集画面に配管の図を載せる (#3389)。
 *
 * 見本の正は `packages/dragon/examples/` の配管の図の見本 6 組 (`swap`、`swap-revert`、`swap-two-hops`、`swap-retry`、`vault-proxy`、`aggregator`) で、
 * 題と図の形はその file を読んで取る。頁の側の見本の表は読まない。
 * 配管の図だけの部品は、槽 (`hold`、`hold` と `move` の行)、値の札 (`write`)、呼び出しの管 (`return`)、呼び出しの種類 (`call`)、ETH の送金 (`value`)、
 * 確認 (`check`、`[fail]` の印も)、イベント (`emit`)、換算 (`calc`)、取り消し (`revert`)、畳み (`fold`) の 10 個。
 * 部品の図は `packages/dragon/src/blocks/<名札>/gallery/<名札>.pipe.dragon` と英語の `.en.dragon` の記法の file。
 * 配管の図の分類と部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PARTS } from "../catalog/parts";
import { BASE, example, partFigure, screenOf, type Site, startSite, stepLabel } from "./playground-support";

/** 頁が書き換わるのを待つ長さ。頁を開く時間と合わせて、1 件の上限 (10 秒) に収める */
const WAIT = { timeout: 6_000, interval: 100 } as const;

/** 見本帳の図の分類の名前の並び */
const KIND_NAMES = ["時系列図", "構成図", "状態遷移図", "枝分かれの図", "時間軸の図", "木の図", "列の図", "試す図", "配管の図"] as const;
/** 見本帳の一覧の札と配管の図の頁に出る、配管の図の説明 */
const PIPE_DESC =
  "1 つのトランザクションの中で、契約の呼び出しと残高と記録の値が段ごとにどう動くかを追う図。交換や取り消しのように、仮の書き換えが最後に確定するか巻き戻るかが効く仕組みを、槽の水位と管を流れるトークンで見せる。";
/** 編集画面の棚の記法の早見の、図の種類の行の説明 */
const SYNTAX_KIND_NOTE = "図の種類と題。最初の行に書く";
/** 配管の図の見本 6 組 */
const PIPE_SAMPLES = ["swap", "swap-revert", "swap-two-hops", "swap-retry", "vault-proxy", "aggregator"] as const;
/** 配管の図だけの部品の名札と、見本帳の札の名前 */
const PIPE_PARTS: readonly (readonly [string, string])[] = [
  ["hold", "槽"],
  ["write", "値の札"],
  ["return", "呼び出しの管"],
  ["call", "呼び出しの種類"],
  ["value", "ETHの送金"],
  ["check", "確認"],
  ["emit", "イベント"],
  ["calc", "換算"],
  ["revert", "取り消し"],
  ["fold", "畳み"],
  ["gist", "要点"],
];

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

/** 見本を読んだ図。file が無いか配管の図として読めなければ落とす */
function sample(key: string): Source {
  const text = sampleText(key);
  expect(text, `packages/dragon/examples/${key}.dragon が無い`).toBeDefined();
  const parsed = parseNotation(text ?? "", { lang: "ja" });
  expect(parsed.ok, `${key}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
  const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as Source;
  expect(diagram.kind, `${key}.dragon が配管の図でない`).toBe("pipe");
  return diagram;
}

/** 部品の図の記法。file が無ければ `undefined` */
const snippetOf = (id: string, lang: "ja" | "en"): string | undefined => {
  const path = partFigure(`${id}.pipe${lang === "en" ? ".en" : ""}.dragon`);
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

describe("見本帳と編集画面の配管の図 (#3389)", () => {
  beforeAll(async () => {
    site = await startSite();
  });

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  });

  it("catalog-lists-pipe-with-examples", async () => {
    const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "catalog", "見本帳の一覧が出ない");
    const kinds = (): Promise<string[]> =>
      page.evaluate(() => [...document.querySelectorAll('[data-catalog="section"][data-section="kinds"] [data-catalog="card"] h2')].map((h) => h.textContent?.trim() ?? ""));
    await expect.poll(kinds, { ...WAIT, message: `見本帳の図の分類が ${KIND_NAMES.join("、")} の 9 つでない` }).toEqual([...KIND_NAMES]);
    // 図の種類の説明は、カタログの頁と一緒に後から読む字から、今と同じ字で出る (#3565)
    const cardDesc = (): Promise<string> =>
      page.evaluate(() => document.querySelector('[data-catalog="card"][href$="/catalog/pipe"] [data-catalog="card-desc"]')?.textContent?.trim() ?? "");
    await expect.poll(cardDesc, { ...WAIT, message: "見本帳の一覧の配管の図の札の説明が今と同じ字でない" }).toBe(PIPE_DESC);

    const titles = PIPE_SAMPLES.map((key) => sample(key).title);
    const swap = sample("swap");
    const opened = await site.open({ path: `${BASE}catalog/pipe`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await onScreen(opened.page, "category", "配管の図の頁が出ない");
    const heroDesc = (): Promise<string> => opened.page.evaluate(() => document.querySelector('[data-catalog="desc"]')?.textContent?.trim() ?? "");
    await expect.poll(heroDesc, { ...WAIT, message: "配管の図の頁の説明が今と同じ字でない" }).toBe(PIPE_DESC);
    const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
    await expect.poll(items, { ...WAIT, message: "配管の図の頁の一覧に見本 6 組が無い" }).toEqual(expect.arrayContaining(titles));
    await opened.page.locator('[data-catalog="item"]', { hasText: swap.title }).click();
    await expect
      .poll(() => opened.page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: "交換の見本を選んでも右に出ない" })
      .toBe(swap.title);
    await expectSteps(opened.page, catalogSel("preview"), swap.steps.length, "配管の図の頁の交換の見本");
  });

  it("catalog-has-pipe-parts", async () => {
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
      .poll(cards, { ...WAIT, message: `図の種類だけの部品に、${PIPE_PARTS.map(([, name]) => name).join("、")} が無い` })
      .toEqual(expect.arrayContaining(PIPE_PARTS.map(([id, name]) => [id, name])));
    for (const [id] of PIPE_PARTS) expect(PARTS.find((p) => String(p.id) === id)?.kinds, `${id} が配管の図だけの部品でない`).toEqual(["pipe"]);
  });

  describe.for(PIPE_PARTS.map(([id]) => id))("%s", (id) => {
    it("catalog-has-pipe-parts", async () => {
      for (const lang of ["ja", "en"] as const) {
        const text = snippetOf(id, lang);
        expect(text, `${id}.pipe${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
        const parsed = parseNotation(text ?? "", { lang });
        expect(parsed.ok && parsed.diagram.kind, `${id} の ${lang} の記法が配管の図として読めない`).toBe("pipe");
      }
      const opened = await site.open({ path: `${BASE}catalog/part/${id}`, locale: "ja-JP", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
      await expect
        .poll(() => figuresOf(opened.page), { ...WAIT, message: `${id} の頁が配管の図の図を 1 つ、部品の記法で描かない` })
        .toEqual([{ kind: "pipe", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
      await opened.page.locator(siteSel("lang-en")).click();
      await expect
        .poll(async () => (await figuresOf(opened.page)).map((f) => f.source), { ...WAIT, message: `${id} の頁を EN に替えても英語の記法にならない` })
        .toEqual([snippetOf(id, "en") ?? ""]);
    });
  });

  it("editor-shelf-has-pipe", async () => {
    const swap = sample("swap");
    const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "editor", "編集画面が出ない");
    const placed = (key: string): Promise<{ title: string; group: string } | null> =>
      page.evaluate((s) => {
        const b = document.querySelector(s);
        return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
      }, sel(`sample-${key}`));
    await expect.poll(() => placed("swap"), { ...WAIT, message: "編集画面の棚の配管の図の束に swap が無い" }).toEqual({ title: swap.title, group: "配管の図" });
    await page.locator(sel("sample-swap")).click();
    await expect.poll(() => editorValue(page), { ...WAIT, message: "棚の交換の図を押しても、その記法が書く欄に入らない" }).toBe(sampleText("swap")?.trimEnd());
    await expect
      .poll(() => page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? "", sel("stage")), { ...WAIT, message: "棚の交換の図が描かれない" })
      .toContain(swap.title);

    // 記法の早見の図の種類の行に、配管の図の頭の行がある
    await page.locator(sel("shelf-tab-notation")).click();
    const lines = (): Promise<string[]> => page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [], sel("syntax-kind"));
    await expect.poll(async () => (await lines()).some((l) => l.startsWith("pipe ")), { ...WAIT, message: "記法の早見の図の種類の行に pipe の頭の行が無い" }).toBe(true);
    // 早見の説明は後から読む塊の字から、今と同じ字で出る (#3565)
    const note = (): Promise<string> => page.evaluate((s) => document.querySelector(`${s} .pg-entry-note`)?.textContent?.trim() ?? "", sel("syntax-kind"));
    await expect.poll(note, { ...WAIT, message: "記法の早見の図の種類の行の説明が今と同じ字でない" }).toBe(SYNTAX_KIND_NOTE);
  });
});
