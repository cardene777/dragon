/**
 * Visual regression ... animation 5 case (tween / set / badge / mixed)。
 *
 * /catalog/animation ページの 5 case 全部。 animation は時間で変化するので
 * `animations: "disabled"` で初期 phase の static render を比較する。
 *
 * baseline 不一致 = phase 初期表示の崩れ / badge 位置 / tween 起点 state / kind shape
 *   の regression。
 */
import { test, expect } from "@playwright/test";
import { waitForCdlDiagram } from "./helpers/wait-for-cdl";

const cases = [
  { slug: "tween-simple", label: "Tween 単 phase 線形補間" },
  { slug: "tween-chain", label: "Tween 連続 phase 累積" },
  { slug: "set-switch", label: "Set 即時切替" },
  { slug: "badge-per-phase", label: "Badge phase ごと切替" },
  { slug: "mixed-tween-set", label: "Tween + Set 併用" },
];

const PAGE_URL = "/catalog/animation";

test.describe("Visual regression - animation cases (/catalog/animation)", () => {
  for (const { slug, label } of cases) {
    test(`animation ${slug} (${label}) SVG snapshot`, async ({ page }) => {
      await page.goto(PAGE_URL, { waitUntil: "networkidle" });
      await waitForCdlDiagram(page, slug);
      const el = page.locator(`[data-cdl-diagram="${slug}"]`).first();
      await expect(el).toHaveScreenshot(`animation-${slug}.png`, {
        maxDiffPixelRatio: 0.02, // animation 系は initial phase render に若干のブレを許容
        animations: "disabled",
      });
    });
  }
});
