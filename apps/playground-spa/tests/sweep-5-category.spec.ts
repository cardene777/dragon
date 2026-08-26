import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "test-results/sweep";
mkdirSync(OUT, { recursive: true });

const CATEGORIES = ["primitives", "cookbook", "text-dsl", "animation", "styles"];

for (const slug of CATEGORIES) {
  test(`category ${slug} 目視`, async ({ page }) => {
    await page.goto(`catalog/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: `${OUT}/spa-${slug}.png`, fullPage: true });
  });
}
