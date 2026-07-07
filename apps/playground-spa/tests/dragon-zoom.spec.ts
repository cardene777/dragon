import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "test-results/zoom";
mkdirSync(OUT, { recursive: true });

// 全 category (7) の代表 diagram を各 category 1 個 = 7 個 zoom
const TARGETS = [
  { path: "/catalog/presets", article: "presetSwimlane", slug: "presets-swimlane" },
  { path: "/catalog/presets", article: "presetClassDiagram", slug: "presets-class" },
  { path: "/catalog/presets", article: "presetSequence", slug: "presets-sequence" },
  { path: "/catalog/patterns", article: "patternFanOut", slug: "patterns-fan-out" },
  { path: "/catalog/patterns", article: "patternPassthrough", slug: "patterns-passthrough" },
  { path: "/catalog/cookbook", article: "apiCall", slug: "cookbook-api-call" },
  { path: "/catalog/cookbook", article: "jwtAuth", slug: "cookbook-jwt-auth" },
  { path: "/catalog/text-dsl", article: "textDslClass", slug: "text-dsl-class" },
  { path: "/catalog/text-dsl", article: "textDslSequence", slug: "text-dsl-sequence" },
  { path: "/catalog/primitives", article: "kindActor", slug: "primitives-actor" },
  { path: "/catalog/primitives", article: "kindFunction", slug: "primitives-function" },
  { path: "/catalog/animation", article: "tweenSimple", slug: "animation-tween" },
  { path: "/catalog/animation", article: "badgePerPhase", slug: "animation-badge" },
  { path: "/catalog/styles", article: "styleSolid", slug: "styles-solid" },
  { path: "/catalog/styles", article: "toneAccent", slug: "styles-tone-accent" },
];

for (const t of TARGETS) {
  test(`zoom ${t.slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(t.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    // 拡大 button クリックで modal 展開 → modal 内 SVG を screenshot
    const cards = page.locator('article').filter({ hasText: t.article });
    const count = await cards.count();
    if (count === 0) {
      // fallback = card article を直接 screenshot
      await page.screenshot({ path: `${OUT}/${t.slug}-notfound.png`, fullPage: false });
      return;
    }
    await cards.first().locator('button[aria-label*="拡大"]').click();
    await page.waitForTimeout(2000);
    const dialog = page.locator('[role="dialog"]');
    await dialog.screenshot({ path: `${OUT}/${t.slug}.png` });
  });
}
