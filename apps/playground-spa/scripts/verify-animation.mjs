// homepage vs editor 差分 + prod vs dev 比較
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();

for (const url of [
  "http://localhost:4323/editor",   // dev
  "http://localhost:5174/editor",   // prod (if running)
]) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 5000 });
    await page.waitForTimeout(5000);
    const paths = await page.locator("[data-cdl-role='edge-line']").evaluateAll((els) =>
      els.map((el) => ({
        d: el.getAttribute("d")?.slice(0, 40) ?? "?",
        active: el.closest("[data-cdl-active]")?.getAttribute("data-cdl-active"),
      }))
    );
    const phaseId = await page.locator("[data-cdl-phase-id]").first().getAttribute("data-cdl-phase-id").catch(() => null);
    console.log(`=== ${url} @5sec, phase=${phaseId}, edges=${paths.length} ===`);
    paths.forEach((p, j) => console.log(`  edge ${j + 1}: active=${p.active} d="${p.d}"`));
    console.log();
  } catch (e) {
    console.log(`=== ${url} ERROR: ${e.message} ===\n`);
  }
}
await browser.close();
