/**
 * Visual regression ... 主要 preset (swimlane / flow / sequence / topology / er / state)。
 *
 * /catalog/presets ページに render される 6 preset の SVG を pixel diff で比較。
 * solidity preset は同 page 未掲載のため /visual-test-extended で別途検証 (extended.spec.ts)。
 *
 * baseline 不一致 = font / theme color / mask filter / kind shape 等の崩れ regression。
 */
import { test, expect } from "@playwright/test";

const presets = [
  { slug: "swim-demo", label: "swimlane preset" },
  { slug: "flow-demo", label: "flow preset" },
  { slug: "seq-demo", label: "sequence preset" },
  { slug: "topo-demo", label: "topology preset" },
  { slug: "er-demo", label: "er preset" },
  { slug: "fsm-demo", label: "stateMachine preset" },
];

const PAGE_URL = "/catalog/presets";

test.describe("Visual regression - main presets (/catalog/presets)", () => {
  for (const { slug, label } of presets) {
    test(`preset ${slug} (${label}) SVG snapshot`, async ({ page }) => {
      await page.goto(PAGE_URL, { waitUntil: "networkidle" });
      // 各 preset は CdlDiagramThumbnail で render される (data-cdl-diagram=slug + svg)
      await page.waitForSelector(`[data-cdl-diagram="${slug}"] svg`, { timeout: 10_000 });
      // animation がある preset (swim-demo 等) は初期 phase 表示まで少し待つ
      await page.waitForTimeout(800);
      // 同一 slug の DOM が SSR + client-hydration で 2 つあるケースあり ... .first() で安定化
      const el = page.locator(`[data-cdl-diagram="${slug}"]`).first();
      await expect(el).toHaveScreenshot(`${slug}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });
  }
});
