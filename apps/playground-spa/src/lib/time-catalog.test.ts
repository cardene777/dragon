/**
 * 見本帳と編集画面に時間軸の図を載せる (#3165)。
 *
 * 見本の正は `packages/dragon/examples/finality.dragon` と `withdraw.dragon` で、題と図の形はその file を読んで取る。頁の側の見本の表は読まない。
 * 時間軸の図だけの部品は、目盛りと針 (`scale`)、印の列 (`row`)、作業の棒 (`task`、#3562)、節目 (`point`)、拡大の帯 (`zoom`) の 5 つで、
 * 部品の図は `packages/dragon/src/blocks/<名札>/gallery/<名札>.time.dragon` と英語の `.en.dragon` の記法の file。物差しは中身の帯の部品の頁の時間軸の図で見せる。
 * 時間軸の図の分類と部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PARTS } from "../catalog/parts";
import { BASE, example, partFigure, screenOf, type Site, startSite, stepLabel } from "./playground-support";

/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

/** 見本帳の図の分類の名前の並び */
const KIND_NAMES = ["時系列図", "構成図", "状態遷移図", "枝分かれの図", "時間軸の図"] as const;
/** 時間軸の図だけの部品 */
const TIME_PARTS = ["scale", "row", "point", "zoom"] as const;
/** 時間軸の図の見本 */
const TIME_SAMPLES = ["finality", "withdraw"] as const;
/** ブロックの確定の見本の段の数 */
const FINALITY_STEPS = 10;

const catalogSel = (name: string): string => `[data-catalog="${name}"]`;
const siteSel = (name: string): string => `[data-site="${name}"]`;
const sel = (name: string): string => `[data-playground="${name}"]`;

interface Source {
  kind: string;
  title: string;
  blocks: { box?: { id: string }[]; zoom?: { from: number; to: number } };
  steps: { events: { type: string; at?: number }[] }[];
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
  const path = partFigure(`${id}.time${lang === "en" ? ".en" : ""}.dragon`);
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

describe("見本帳と編集画面の時間軸の図 (#3165)", () => {
  beforeAll(async () => {
    site = await startSite();
  });

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  });

  it(
    "catalog-lists-time-with-examples",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kinds = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll('[data-catalog="section"][data-section="kinds"] [data-catalog="card"] h2')].map((h) => h.textContent?.trim() ?? ""));
      await expect
        .poll(async () => (await kinds()).slice(0, KIND_NAMES.length), { ...WAIT, message: "見本帳の図の分類が、時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図の順で始まらない" })
        .toEqual([...KIND_NAMES]);

      const titles = TIME_SAMPLES.map((key) => sample(key).title);
      const opened = await site.open({ path: `${BASE}catalog/time`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "category", "時間軸の図の頁が出ない");
      const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
      await expect.poll(items, { ...WAIT, message: "時間軸の図の頁の一覧にブロックの確定と引き出しの見本が無い" }).toEqual(expect.arrayContaining(titles));
      const finality = titles[0] ?? "";
      await opened.page.locator('[data-catalog="item"]', { hasText: finality }).click();
      await expect
        .poll(() => opened.page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: "ブロックの確定の見本を選んでも右に出ない" })
        .toBe(finality);
      await expectSteps(opened.page, catalogSel("preview"), FINALITY_STEPS, "時間軸の図の頁のブロックの確定の見本");
    },
  );

  it(
    "catalog-has-four-time-parts",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kindParts = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-catalog="section"][data-section="kind-parts"] a[data-catalog="part-card"]')].map((a) => a.dataset.part ?? ""));
      await expect.poll(kindParts, { ...WAIT, message: "図の種類だけの部品に、目盛りと針と印の列と節目と拡大の帯が無い" }).toEqual(expect.arrayContaining([...TIME_PARTS]));
      for (const id of TIME_PARTS) expect(PARTS.find((p) => p.id === id)?.kinds, `${id} が時間軸の図だけの部品でない`).toEqual(["time"]);
    },
  );

  describe.for(TIME_PARTS)("%s", (id) => {
    it("catalog-has-four-time-parts", async () => {
      for (const lang of ["ja", "en"] as const) {
        const text = snippetOf(id, lang);
        expect(text, `${id}.time${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
        const parsed = parseNotation(text ?? "", { lang });
        expect(parsed.ok && parsed.diagram.kind, `${id} の ${lang} の記法が時間軸の図として読めない`).toBe("time");
      }
      const opened = await site.open({ path: `${BASE}catalog/part/${id}`, locale: "ja-JP", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
      await expect
        .poll(() => figuresOf(opened.page), { ...WAIT, message: `${id} の頁が時間軸の図の図を 1 つ、部品の記法で描かない` })
        .toEqual([{ kind: "time", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
      await expectSteps(opened.page, `${catalogSel("part")} ${catalogSel("part-figure")}`, undefined, `${id} の時間軸の図`);
      await opened.page.locator(siteSel("lang-en")).click();
      await expect
        .poll(async () => (await figuresOf(opened.page)).map((f) => f.source), { ...WAIT, message: `${id} の頁を EN に替えても英語の記法にならない` })
        .toEqual([snippetOf(id, "en") ?? ""]);
    });
  });

  it("strip-time-figure-uses-meter", () => {
    // 中身の帯の頁の時間軸の図は物差しを使う (#3165)
    expect(snippetOf("strip", "ja") ?? "", "中身の帯の部品の時間軸の図が物差しを使わない").toContain("[meter:");
    expect(snippetOf("strip", "en") ?? "", "中身の帯の部品の英語の時間軸の図が物差しを使わない").toContain("[meter:");
  });

  it(
    "time-part-pages-link-examples",
    async () => {
      const finality = sample("finality");
      const withdraw = sample("withdraw");
      const zoomed = (d: Source) => d.blocks.zoom !== undefined;
      expect(zoomed(finality), "ブロックの確定の見本が拡大の帯を持たない").toBe(true);
      expect(zoomed(withdraw), "引き出しの見本が拡大の帯を持つ").toBe(false);
      // 部品の名札と、その頁の札が向かう見本
      const cases: [string, string[], Source][] = [
        ["zoom", ["finality"], finality],
        // 目盛りと針は時間軸の図の全ての見本が使い、工程表の見本 (`release-plan`、#3562) も並ぶ
        ["scale", ["finality", "withdraw", "release-plan"], finality],
      ];
      for (const [id, keys, first] of cases) {
        const { page } = await site.open({ path: `${BASE}catalog/part/${id}`, viewport: { width: 1440, height: 900 } });
        await onScreen(page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(() => partSamplesOf(page), { ...WAIT, message: `${id} の頁の見本の札が、時間軸の図の頁の ${keys.join(" と ")} へ向かわない` })
          .toEqual(keys.map((key) => `${BASE}catalog/time#${key}`));
        await page.locator(`${catalogSel("part-sample")}[data-sample="${keys[0]}"]`).click();
        await onScreen(page, "category", `${id} の頁の ${keys[0]} の札を押しても図の頁が出ない`);
        await expect
          .poll(() => page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), { ...WAIT, message: `${id} の頁の札で移った図の頁に ${keys[0]} の見本が出ない` })
          .toBe(first.title);
        await site.closeContexts();
      }
    },
  );

  // 工程表の棒 (#3562)。作業の棒は時間軸の図だけの部品で、部品の頁は日本語と英語の記法とその図を出し、時間軸の図の頁に工程表の見本が載る
  describe("工程表の棒 (#3562)", () => {
    it("catalog-has-task-part", async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kindParts = (): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-catalog="section"][data-section="kind-parts"] a[data-catalog="part-card"]')].map((a) => a.dataset.part ?? ""));
      await expect.poll(kindParts, { ...WAIT, message: "図の種類だけの部品に工程表の棒 (task) が無い" }).toEqual(expect.arrayContaining(["task"]));
      expect(PARTS.find((p) => (p.id as string) === "task")?.kinds, "工程表の棒が時間軸の図だけの部品でない").toEqual(["time"]);
    });

    it("catalog-has-task-part", async () => {
      for (const lang of ["ja", "en"] as const) {
        const text = snippetOf("task", lang);
        expect(text, `task.time${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
        const parsed = parseNotation(text ?? "", { lang });
        expect(parsed.ok && parsed.diagram.kind, `task の ${lang} の記法が時間軸の図として読めない`).toBe("time");
        expect(text ?? "", `task の ${lang} の記法が task の行を書かない`).toMatch(/^task\s/mu);
      }
      const opened = await site.open({ path: `${BASE}catalog/part/task`, locale: "ja-JP", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "part", "工程表の棒の部品の頁が出ない");
      await expect
        .poll(() => figuresOf(opened.page), { ...WAIT, message: "工程表の棒の頁が時間軸の図の図を 1 つ、部品の記法で描かない" })
        .toEqual([{ kind: "time", svgs: 1, source: snippetOf("task", "ja") ?? "" }]);
      await opened.page.locator(siteSel("lang-en")).click();
      await expect
        .poll(async () => (await figuresOf(opened.page)).map((f) => f.source), { ...WAIT, message: "工程表の棒の頁を EN に替えても英語の記法にならない" })
        .toEqual([snippetOf("task", "en") ?? ""]);
    });

    it("catalog-has-task-part", async () => {
      const title = sample("release-plan").title;
      const opened = await site.open({ path: `${BASE}catalog/time`, viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await onScreen(opened.page, "category", "時間軸の図の頁が出ない");
      const items = (): Promise<string[]> => opened.page.evaluate(() => [...document.querySelectorAll('[data-catalog="item"]')].map((i) => i.textContent?.trim() ?? ""));
      await expect.poll(items, { ...WAIT, message: "時間軸の図の頁の一覧に工程表の見本が無い" }).toEqual(expect.arrayContaining([title]));
    });

    it("editor-quick-reference-has-task", async () => {
      const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "editor", "編集画面が出ない");
      await page.locator(sel("shelf-tab-notation")).click();
      const lines = (): Promise<string[]> => page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [], sel("syntax-task"));
      await expect.poll(async () => (await lines()).some((l) => l.startsWith("task ")), { ...WAIT, message: "記法の早見に作業の棒を宣言する task の行が無い" }).toBe(true);
    });
  });

  it(
    "editor-shelf-has-time",
    async () => {
      const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "editor", "編集画面が出ない");
      const placed = (key: string): Promise<{ title: string; group: string } | null> =>
        page.evaluate((s) => {
          const b = document.querySelector(s);
          return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
        }, sel(`sample-${key}`));
      for (const key of TIME_SAMPLES) {
        await expect.poll(() => placed(key), { ...WAIT, message: `編集画面の棚の時間軸の図の束に ${key} が無い` }).toEqual({ title: sample(key).title, group: "時間軸の図" });
      }
      await page.locator(sel("sample-finality")).click();
      await expect.poll(() => editorValue(page), { ...WAIT, message: "棚のブロックの確定を押しても、その記法が書く欄に入らない" }).toBe(sampleText("finality")?.trimEnd());
      await expect
        .poll(() => page.evaluate((s) => document.querySelector(`${s} [data-dragon="steps"]`)?.getAttribute("aria-label") ?? "", sel("stage")), { ...WAIT, message: "棚のブロックの確定の図が描かれない" })
        .toContain(sample("finality").title);

      // 記法の早見
      await page.locator(sel("shelf-tab-notation")).click();
      const lines = (id: string): Promise<string[]> =>
        page.evaluate((s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [], sel(`syntax-${id}`));
      await expect.poll(async () => (await lines("kind")).some((l) => l.startsWith("time ")), { ...WAIT, message: "記法の早見の図の種類の行に time の頭の行が無い" }).toBe(true);
      const wants: [string, (l: string) => boolean, string][] = [
        ["scale", (l) => l.startsWith("scale "), "目盛りを宣言する scale の行"],
        ["period", (l) => l.startsWith("period "), "区切りを宣言する period の行"],
        ["row", (l) => l.startsWith("row "), "印の列を宣言する row の行"],
        ["point", (l) => l.startsWith("point "), "節目を置く point の行"],
        ["zoom", (l) => l.startsWith("zoom "), "拡大の帯の範囲の zoom の行"],
        ["now", (l) => l.trim().startsWith("now -> "), "針を進める行"],
        ["mark", (l) => l.trim().startsWith("mark "), "印の色を変える mark の行"],
        ["span", (l) => l.trim().startsWith("span "), "範囲の括弧と囲みの span の行"],
      ];
      for (const [id, want, name] of wants) {
        await expect.poll(async () => (await lines(id)).some(want), { ...WAIT, message: `記法の早見に${name}が無い` }).toBe(true);
      }
    },
  );
});
