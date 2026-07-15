import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
const OUT = "test-results/audit";
mkdirSync(OUT + "/light", { recursive: true });
mkdirSync(OUT + "/dark", { recursive: true });
mkdirSync(OUT + "/mobile", { recursive: true });

const ROUTES = [
  { path: "/", slug: "home" },
  { path: "/docs", slug: "docs" },
  { path: "/editor", slug: "editor" },
  { path: "/catalog", slug: "catalog" },
  { path: "/catalog/presets", slug: "cat-presets" },
  { path: "/catalog/text-dsl", slug: "cat-text-dsl" },
  { path: "/catalog/primitives", slug: "cat-primitives" },
  { path: "/preset/swimlane", slug: "preset-swim" },
  { path: "/release-notes", slug: "release" },
  { path: "/contribute", slug: "contribute" },
  { path: "/does-not-exist", slug: "404" },
];

for (const r of ROUTES) {
  test(`light ${r.slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(r.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/light/${r.slug}.png`, fullPage: true });
  });
  test(`dark ${r.slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => localStorage.setItem("v4-theme", "dark"));
    await page.goto(r.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/dark/${r.slug}.png`, fullPage: true });
  });
  test(`mobile ${r.slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(r.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/mobile/${r.slug}.png`, fullPage: true });
  });
}
