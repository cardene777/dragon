import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "test-results/sweep";
mkdirSync(OUT, { recursive: true });

const PAGES: Array<{ path: string; slug: string }> = [
  { path: "editor", slug: "editor" },
  { path: "docs", slug: "docs" },
];

for (const p of PAGES) {
  test(`page ${p.slug} 目視`, async ({ page }) => {
    const errs: string[] = [];
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errs.push(m.text());
    });
    await page.goto(p.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/spa-${p.slug}.png`, fullPage: true });
    if (errs.length > 0) {
      console.log(`=== ${p.slug} errors ===`);
      errs.slice(0, 5).forEach((e, i) => console.log(`[${i}]`, e));
    }
    await expect(page.locator("body")).toBeVisible();
  });
}
