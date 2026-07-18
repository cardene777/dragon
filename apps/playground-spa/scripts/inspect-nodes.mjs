import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
// Get all node groups by g transform
const gs = await page.locator("[data-cdl-node-id]").evaluateAll(els =>
  els.slice(0, 12).map(el => ({
    id: el.getAttribute("data-cdl-node-id"),
    transform: el.getAttribute("transform"),
    x: el.getAttribute("data-cdl-node-x"),
    y: el.getAttribute("data-cdl-node-y"),
    w: el.getAttribute("data-cdl-node-w"),
    h: el.getAttribute("data-cdl-node-h"),
  }))
);
console.log("nodes:");
gs.forEach(g => console.log(`  ${g.id}: x=${g.x} y=${g.y} w=${g.w} h=${g.h}`));
await browser.close();
