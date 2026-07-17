import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
const nodes = await page.locator("[data-cdl-role='node-body']").evaluateAll(els =>
  els.map(el => ({
    w: el.getAttribute("width"),
    h: el.getAttribute("height"),
    transform: el.parentElement?.getAttribute("transform"),
  }))
);
console.log("node widths:");
nodes.slice(0, 6).forEach((n, i) => console.log(`  ${i}: w=${n.w} h=${n.h} at ${n.transform}`));
// Look for warnings count
const warnBadge = await page.locator(".v4-editor-warnings-badge").first().textContent();
console.log("warning badge:", warnBadge);
await browser.close();
