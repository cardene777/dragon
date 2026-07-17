import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
// Find the mini indicator's parent structure
const indicator = await page.evaluate(() => {
  const cdlDivs = document.querySelectorAll(".v4-editor-preview [data-cdl-diagram] > div");
  return Array.from(cdlDivs).map(d => ({
    classes: d.className.slice(0, 100),
    text: d.textContent?.slice(0, 30),
    display: getComputedStyle(d).display,
  }));
});
console.log("cdl-diagram children:");
indicator.forEach((d, i) => console.log(`  ${i}: display=${d.display} classes="${d.classes}" text="${d.text}"`));
await browser.close();
