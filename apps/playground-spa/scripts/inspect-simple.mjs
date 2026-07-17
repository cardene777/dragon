import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
// Get svg outer html sample
const nodeHtml = await page.locator("[data-cdl-role='node-body']").first().evaluate((el) => {
  const parent = el.parentElement;
  const gpg = parent?.parentElement;
  return {
    parentTag: parent?.tagName,
    parentAttrs: Object.fromEntries(Array.from(parent?.attributes || []).map(a => [a.name, a.value])),
    grandparentTag: gpg?.tagName,
    grandparentTransform: gpg?.getAttribute("transform"),
  };
});
console.log("node-body context:", JSON.stringify(nodeHtml, null, 2));
await browser.close();
