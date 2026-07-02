/**
 * Visual regression ... catalog index page (/catalog) の hero + category card 一覧。
 *
 * catalog は各 preset / pattern subcategory への入口 hub、 category card grid の layout /
 * icon / label / hover state を含む視覚 regression を担保する。
 * diagram は 0 件 (link only page) なので fonts.ready のみ待ってから撮影する。
 *
 * baseline 不一致 = category card grid / icon / label / navbar / font rendering の崩れ。
 */
import { test, expect } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

test.describe("Visual regression - catalog index (/catalog)", () => {
  test("catalog index hero + card grid SVG snapshot", async ({ page }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    // waitForAllCdlDiagrams は 0 件許容 fallback を持つため fonts.ready のみ実行される
    await waitForAllCdlDiagrams(page);
    // v4-cat-hero (Hero) + v4-cat-card grid を含む main を撮影
    const main = page.locator("main").first();
    await expect(main).toHaveScreenshot("catalog-index.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});
