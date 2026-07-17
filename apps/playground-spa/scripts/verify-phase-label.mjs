import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  document.documentElement.classList.add("dark");
  try { localStorage.setItem("v4-theme", "dark"); } catch {}
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const texts = await page.locator("svg text").evaluateAll((els) =>
  els.map((el) => ({
    text: el.textContent,
    x: el.getAttribute("x"),
    y: el.getAttribute("y"),
    role: el.getAttribute("data-cdl-role") ?? el.parentElement?.getAttribute("data-cdl-role") ?? null,
    parentClass: el.parentElement?.getAttribute("class")?.slice(0, 30) ?? null,
  }))
);
console.log("SVG text nodes:");
texts.filter(t => t.text && t.text.trim()).slice(0, 20).forEach(t => console.log(`  "${t.text}" @ (${t.x}, ${t.y}) role=${t.role}`));
await browser.close();
