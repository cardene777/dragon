/**
 * 見本帳と編集画面に、読み手が値を入れて動かせる図 (試す図、`try`) を載せる (#3337)。
 *
 * 見本の正は `packages/dragon/examples/tx-block.dragon` で、題はその file を読んで取る。頁の側の見本の表は読まない。
 * 試す図だけの部品は、網 (`route`)、待ち行列 (`queue`)、機械の列 (`chain`)、入力の帯 (`ask`)、釦 (`press`) の 5 つで、
 * 部品の図は、部品と同じ名前のブロックの見本の置き場の `blocks/<名札>/gallery/<名札>.try.dragon` と英語の `.en.dragon` の記法の file (#3348)。
 * 試す図の部品がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PARTS } from "../catalog/parts";
import { BASE, example, partFigure, screenOf, type Site, startSite } from "./playground-support";

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

/** 試す図だけの部品 */
const TRY_PARTS = ["route", "queue", "chain", "ask", "press"] as const;
/** 試す図の見本 */
const TRY_SAMPLES = ["tx-block"] as const;

const siteSel = (name: string): string => `[data-site="${name}"]`;
const sel = (name: string): string => `[data-playground="${name}"]`;

interface Source {
  kind: string;
  title: string;
}

/** 見本の記法。無ければ `undefined` */
const sampleText = (key: string): string | undefined => example(`${key}.dragon`);

/** 見本を読んだ図。file が無いか読めなければ落とす */
function sample(key: string): Source {
  const text = sampleText(key);
  expect(text, `packages/dragon/examples/${key}.dragon が無い`).toBeDefined();
  const parsed = parseNotation(text ?? "");
  expect(
    parsed.ok,
    `${key}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
  ).toBe(true);
  return (parsed.ok ? parsed.diagram : {}) as unknown as Source;
}

/** 部品の図の記法。file が無ければ `undefined` */
const snippetOf = (id: string, lang: "ja" | "en"): string | undefined => {
  const path = partFigure(`${id}.try${lang === "en" ? ".en" : ""}.dragon`);
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

let site: Site;

async function onScreen(page: Page, screen: string, message: string): Promise<void> {
  await expect.poll(() => screenOf(page), { ...WAIT, message }).toBe(screen);
}

/** 部品の頁の図の塊ごとの、図の種類と、描いた図の数と、記法の本文 */
const figuresOf = (page: Page): Promise<{ kind: string; svgs: number; source: string }[]> =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-catalog="part"] [data-catalog="part-figure"]',
      ),
    ].map((block) => ({
      kind: block.dataset.kind ?? "",
      svgs: block.querySelectorAll('svg[data-dragon="figure"]').length,
      source: block.querySelector('[data-catalog="part-source"]')?.textContent?.trimEnd() ?? "",
    })),
  );

/** 書く欄の中身。書く欄が無ければ `null` */
const editorValue = (page: Page): Promise<string | null> =>
  page.evaluate(
    () =>
      document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ??
      null,
  );

describe("見本帳と編集画面の試す図 (#3337)", () => {
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
    "catalog-lists-interactive-parts",
    async () => {
      const { page } = await site.open({
        path: `${BASE}catalog`,
        viewport: { width: 1440, height: 900 },
      });
      await onScreen(page, "catalog", "見本帳の一覧が出ない");
      const kindParts = (): Promise<string[]> =>
        page.evaluate(() =>
          [
            ...document.querySelectorAll<HTMLElement>(
              '[data-catalog="section"][data-section="kind-parts"] a[data-catalog="part-card"]',
            ),
          ].map((a) => a.dataset.part ?? ""),
        );
      await expect
        .poll(kindParts, { ...WAIT, message: "図の種類だけの部品に、試す図の 5 つの部品が無い" })
        .toEqual(expect.arrayContaining([...TRY_PARTS]));
      // 部品の名札の型はまだ試す図の部品を含まないので、字で比べる
      for (const id of TRY_PARTS)
        expect(
          PARTS.find((p) => (p.id as string) === id)?.kinds,
          `${id} が試す図だけの部品でない`,
        ).toEqual(["try"]);

      for (const id of TRY_PARTS) {
        for (const lang of ["ja", "en"] as const) {
          const text = snippetOf(id, lang);
          expect(text, `${id}.try${lang === "en" ? ".en" : ""}.dragon が無い`).toBeDefined();
          const parsed = parseNotation(text ?? "", { lang });
          expect(
            parsed.ok && parsed.diagram.kind,
            `${id} の ${lang} の記法が試す図として読めない`,
          ).toBe("try");
        }
        const opened = await site.open({
          path: `${BASE}catalog/part/${id}`,
          locale: "ja-JP",
          viewport: { width: 1440, height: 900 },
          reducedMotion: "reduce",
        });
        await onScreen(opened.page, "part", `${id} の部品の頁が出ない`);
        await expect
          .poll(() => figuresOf(opened.page), {
            ...WAIT,
            message: `${id} の頁が試す図の図を 1 つ、部品の記法で描かない`,
          })
          .toEqual([{ kind: "try", svgs: 1, source: snippetOf(id, "ja") ?? "" }]);
        await opened.page.locator(siteSel("lang-en")).click();
        await expect
          .poll(async () => (await figuresOf(opened.page)).map((f) => f.source), {
            ...WAIT,
            message: `${id} の頁を EN に替えても英語の記法にならない`,
          })
          .toEqual([snippetOf(id, "en") ?? ""]);
        await site.closeContexts();
      }
    },
    SWEEP,
  );

  it(
    "shelf-starts-interactive-diagram",
    async () => {
      const { page } = await site.open({
        path: `${BASE}editor`,
        viewport: { width: 1440, height: 900 },
      });
      await onScreen(page, "editor", "編集画面が出ない");
      const placed = (key: string): Promise<{ title: string; group: string } | null> =>
        page.evaluate(
          (s) => {
            const b = document.querySelector(s);
            return b
              ? {
                  title: b.textContent?.trim() ?? "",
                  group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "",
                }
              : null;
          },
          sel(`sample-${key}`),
        );
      for (const key of TRY_SAMPLES) {
        await expect
          .poll(() => placed(key), { ...WAIT, message: `編集画面の棚の試す図の束に ${key} が無い` })
          .toEqual({ title: sample(key).title, group: "試す図" });
      }
      await page.locator(sel("sample-tx-block")).click();
      await expect
        .poll(() => editorValue(page), {
          ...WAIT,
          message: "棚の見本を押しても、その記法が書く欄に入らない",
        })
        .toBe(sampleText("tx-block")?.trimEnd());
      await expect
        .poll(
          () =>
            page.evaluate(
              (s) => document.querySelector(`${s} form[data-dragon="ask"]`) !== null,
              sel("stage"),
            ),
          { ...WAIT, message: "棚の試す図を書き始めても、入力の帯が出ない" },
        )
        .toBe(true);

      // 記法の早見
      await page.locator(sel("shelf-tab-notation")).click();
      const lines = (id: string): Promise<string[]> =>
        page.evaluate(
          (s) => document.querySelector(`${s} code`)?.textContent?.split("\n") ?? [],
          sel(`syntax-${id}`),
        );
      await expect
        .poll(async () => (await lines("kind")).some((l) => l.startsWith("try ")), {
          ...WAIT,
          message: "記法の早見の図の種類の行に try の頭の行が無い",
        })
        .toBe(true);
      for (const id of TRY_PARTS) {
        await expect
          .poll(async () => (await lines(id)).some((l) => l.trim().startsWith(`${id} `)), {
            ...WAIT,
            message: `記法の早見に ${id} の行が無い`,
          })
          .toBe(true);
      }
    },
    SLOW,
  );
});
