import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.evaluate(() => localStorage.setItem("v4-theme", "dark")).catch(() => {});
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  document.documentElement.classList.add("dark");
  try { localStorage.setItem("v4-theme", "dark"); } catch {}
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
await page.screenshot({ path: "/tmp/editor-dark.png", fullPage: false });
console.log("screenshot saved /tmp/editor-dark.png");
// Look for any "call" text visible
const callTexts = await page.locator("text=call").allTextContents();
console.log("call text count:", callTexts.length);
// Search all elements containing "call"
const withCall = await page.locator(":has-text('call')").evaluateAll(els =>
  els.slice(0, 5).map(e => ({ tag: e.tagName, class: e.className.slice ? e.className.slice(0, 30) : e.className, text: e.textContent?.slice(0, 40) }))
);
console.log("elements with call text:", withCall.length);
withCall.forEach(e => console.log(`  ${e.tag}.${e.class}: "${e.text}"`));
await browser.close();
