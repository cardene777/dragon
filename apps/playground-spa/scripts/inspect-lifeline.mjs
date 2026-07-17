import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
// Get lifeline coordinates
const lifelines = await page.locator("[data-cdl-role='lane-lifeline']").evaluateAll(els =>
  els.map(el => ({
    x1: el.getAttribute("x1"),
    y1: el.getAttribute("y1"),
    x2: el.getAttribute("x2"),
    y2: el.getAttribute("y2"),
  }))
);
console.log("lifelines:");
lifelines.forEach((l, i) => console.log(`  ${i}: y1=${l.y1} y2=${l.y2}`));
// Get header/footer node y coordinates
const nodes = await page.locator("[data-cdl-role='node-body']").evaluateAll(els =>
  els.slice(0, 10).map(el => ({
    id: el.closest("[data-cdl-node-id]")?.getAttribute("data-cdl-node-id") ?? "?",
    y: el.getAttribute("y") ?? el.closest("[data-cdl-node-id]")?.getAttribute("data-cdl-node-y"),
    h: el.getAttribute("h") ?? el.closest("[data-cdl-node-id]")?.getAttribute("data-cdl-node-h"),
  }))
);
console.log("first 10 nodes:");
nodes.forEach(n => console.log(`  ${n.id}: y=${n.y} h=${n.h}`));
await browser.close();
