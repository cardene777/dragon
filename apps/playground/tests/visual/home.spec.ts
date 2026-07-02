/**
 * Visual regression ... home page (/) の hero + demo diagram + CTA。
 *
 * user が最初に触れる entry point、 hero copy / CTA button / showcase diagram の視覚 regression を担保。
 * home page は 1 diagram (hero-demo 内 SVG showcase) を mount するため、 waitForAllCdlDiagrams で
 * hydration 完了を待ってから撮影する。
 *
 * baseline 不一致 = hero layout / CTA button / showcase SVG / navbar / font rendering の崩れ。
 */
import { test, expect } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

test.describe("Visual regression - home (/)", () => {
  test("home hero + showcase SVG snapshot", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await waitForAllCdlDiagrams(page);
    // hero section を撮影 (navbar は含めない、 layout 影響を最小化)
    const hero = page.locator(".hero").first();
    await expect(hero).toHaveScreenshot("home-hero.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});
