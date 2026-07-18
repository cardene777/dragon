import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
// Find all SVG text nodes containing "call"
const found = await page.locator("[data-cdl-diagram] text, [data-cdl-diagram] tspan").evaluateAll(els =>
  els.map(el => ({
    text: el.textContent,
    x: el.getAttribute("x"),
    y: el.getAttribute("y"),
    parentTag: el.parentElement?.tagName,
    fontSize: el.getAttribute("font-size"),
    fill: el.getAttribute("fill"),
    className: el.getAttribute("class"),
  })).filter(e => e.text && e.text.includes("cal"))
);
console.log("SVG text with 'cal':", JSON.stringify(found, null, 2));
// Also check for foreignObject / divs
const divs = await page.locator("[data-cdl-diagram] div:has-text('call')").evaluateAll(els =>
  els.slice(0, 5).map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 40), style: el.getAttribute("style")?.slice(0, 100) }))
);
console.log("divs with 'call':", JSON.stringify(divs, null, 2));
await browser.close();
