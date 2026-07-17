import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
const rects = await page.locator("[data-cdl-role='node-body']").evaluateAll(els =>
  els.slice(0, 12).map(el => {
    const bbox = el.getBoundingClientRect ? el.getBBox?.() : null;
    return {
      tag: el.tagName,
      attrs: Object.fromEntries(Array.from(el.attributes || []).map(a => [a.name, a.value])),
      bbox: bbox ? { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height } : null,
    };
  })
);
console.log("node-body rects:");
rects.slice(0, 6).forEach(r => console.log(`  ${r.tag} attrs=${JSON.stringify(r.attrs).slice(0, 100)} bbox=${JSON.stringify(r.bbox)}`));
await browser.close();
