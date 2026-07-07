import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "test-results/regression";
mkdirSync(OUT, { recursive: true });

// 全 10 route + 404
const ROUTES: Array<{ path: string; slug: string; expectSelector?: string }> = [
  { path: "/", slug: "home", expectSelector: "h1" },
  { path: "/docs", slug: "docs", expectSelector: "h1" },
  { path: "/editor", slug: "editor", expectSelector: ".v4-editor, main" },
  { path: "/catalog", slug: "catalog-index", expectSelector: "h1" },
  { path: "/catalog/presets", slug: "catalog-presets", expectSelector: "h1" },
  { path: "/catalog/cookbook", slug: "catalog-cookbook", expectSelector: "h1" },
  { path: "/catalog/patterns", slug: "catalog-patterns", expectSelector: "h1" },
  { path: "/catalog/primitives", slug: "catalog-primitives", expectSelector: "h1" },
  { path: "/catalog/animation", slug: "catalog-animation", expectSelector: "h1" },
  { path: "/catalog/styles", slug: "catalog-styles", expectSelector: "h1" },
  { path: "/catalog/text-dsl", slug: "catalog-text-dsl", expectSelector: "h1" },
  { path: "/compare", slug: "compare", expectSelector: "h1" },
  { path: "/preset/swimlane", slug: "preset-swimlane", expectSelector: "h1" },
  { path: "/release-notes", slug: "release-notes", expectSelector: "h1" },
  { path: "/contribute", slug: "contribute", expectSelector: "h1" },
  { path: "/does-not-exist", slug: "404", expectSelector: ".v4-404-code" },
];

for (const r of ROUTES) {
  test(`route ${r.slug}`, async ({ page }) => {
    const errs: string[] = [];
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errs.push(m.text());
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(r.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/${r.slug}.png`, fullPage: false });
    if (r.expectSelector) {
      await expect(page.locator(r.expectSelector).first()).toBeVisible();
    }
    if (errs.length > 0) {
      console.log(`=== ${r.slug} errors ===`);
      errs.slice(0, 5).forEach((e, i) => console.log(`[${i}]`, e));
    }
    expect(errs.length, `console/pageerror on ${r.slug}: ${errs.slice(0,3).join(" | ")}`).toBeLessThan(3);
  });
}
