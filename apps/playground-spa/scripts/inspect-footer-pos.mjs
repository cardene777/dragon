import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
// Get all node-body rect positions with parent transform
const nodePositions = await page.locator("[data-cdl-role='node-body']").evaluateAll(els =>
  els.map(el => {
    const parent = el.parentElement;
    const gpg = parent?.parentElement;
    return {
      w: el.getAttribute("width"),
      h: el.getAttribute("height"),
      parentTransform: parent?.getAttribute("transform"),
      grandparentTransform: gpg?.getAttribute("transform"),
    };
  })
);
console.log("all node-body positions:");
nodePositions.slice(0, 20).forEach((n, i) => console.log(`  ${i}: transform=${n.parentTransform} size=${n.w}x${n.h}`));
// Lifeline
const lifelines = await page.locator("[data-cdl-role='lane-lifeline']").evaluateAll(els =>
  els.map(el => ({ y1: el.getAttribute("y1"), y2: el.getAttribute("y2") }))
);
console.log("lifelines:");
lifelines.forEach((l, i) => console.log(`  ${i}: y1=${l.y1} y2=${l.y2}`));
await browser.close();
