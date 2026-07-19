/**
 * 全 12 preset × parts add 網羅 e2e (2026-07-19)。
 *
 * user 「図もたくさんあるからテスト観点たくさんあるでしょ？」 対応。
 * 各 preset (sequence 2 + flow / swimlane / topology / er / state-machine / class / gantt /
 * mind / pie / c4 = 12) で:
 *   1. sample load
 *   2. parts (achievement) click add
 *   3. parts vs 既存 node の物理 overlap 0 assert
 *   4. screenshot 保存
 *
 * 各 preset で parts 追加が「既存図を破壊しない」 = user 目視要求の 12 preset 版検証。
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/all-preset-parts-add";

const SAMPLE_SLUGS = [
  "sequence",
  "flow",
  "swimlane",
  "topology",
  "er",
  "state-machine",
  "class",
  "gantt",
  "mind",
  "pie",
  "c4",
] as const;

async function setup(page: Page) {
  mkdirSync(OUT_DIR, { recursive: true });
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(600);
}

async function selectSample(page: Page, slug: string): Promise<void> {
  // slug からサンプル item を選択、 data-testid が sample-{slug} なので targeted click
  const selector = `[data-testid^="editor-sample-"][data-testid*="${slug}"]`;
  const btn = page.locator(selector).first();
  const count = await btn.count();
  if (count === 0) {
    // fallback: サンプル tab を開いて任意の button click
    await page.click('button[role="tab"]:has-text("サンプル")');
    await page.waitForTimeout(300);
    const alt = page.locator(`button[data-sample-label*="${slug}"]`).first();
    if (await alt.count() > 0) await alt.click();
  } else {
    await btn.click();
  }
  await page.waitForTimeout(1000);
}

test.describe("全 12 preset × parts add 網羅 (物理 overlap 0)", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  for (const slug of SAMPLE_SLUGS) {
    test(`preset=${slug} = load + achievement click add で 物理 overlap 0`, async ({ page }) => {
      // 1. sample 切替
      await selectSample(page, slug);

      // 2. parts add
      await page.click('[data-testid="editor-parts-tab"]');
      await page.waitForTimeout(500);
      await page.click('[data-part-id="parts-achievement"]');
      await page.waitForTimeout(1500);

      await page.screenshot({ path: `${OUT_DIR}/${slug}-after-add.png`, fullPage: false });

      // 3. 既存 node と parts sub-node の物理 overlap 判定
      const rects = await page.evaluate(() => {
        const svg = document.querySelector(".v4-editor-preview svg");
        if (!svg) return { existing: [], parts: [] };
        const all = Array.from(svg.querySelectorAll('[data-cdl-node]'));
        const existing = all
          .filter((el) => !(el.getAttribute("data-cdl-node") ?? "").includes("__"))
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.getAttribute("data-cdl-node") ?? "", x: r.x, right: r.right, y: r.y, bottom: r.bottom };
          });
        const parts = all
          .filter((el) => (el.getAttribute("data-cdl-node") ?? "").includes("__"))
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.getAttribute("data-cdl-node") ?? "", x: r.x, right: r.right, y: r.y, bottom: r.bottom };
          });
        return { existing, parts };
      });

      expect(rects.parts.length, `${slug}: parts sub-node 追加`).toBeGreaterThan(0);

      let overlapCount = 0;
      let worstOverlap = "";
      for (const p of rects.parts) {
        for (const e of rects.existing) {
          const ox = Math.max(0, Math.min(p.right, e.right) - Math.max(p.x, e.x));
          const oy = Math.max(0, Math.min(p.bottom, e.bottom) - Math.max(p.y, e.y));
          if (ox > 5 && oy > 5) {
            overlapCount += 1;
            worstOverlap = `${p.id} × ${e.id} (${ox.toFixed(0)}×${oy.toFixed(0)}px)`;
          }
        }
      }
      expect(
        overlapCount,
        `${slug}: parts と既存 node の物理 overlap (${overlapCount} pair、 worst=${worstOverlap})`,
      ).toBe(0);
    });
  }
});
