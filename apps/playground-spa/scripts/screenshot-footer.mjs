import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
await page.click("text=100%").catch(() => {});
await page.waitForTimeout(500);
const stage = await page.locator(".v4-editor-stage").first();
const box = await stage.boundingBox();
if (box) {
  // Scroll down to see footer
  await stage.hover();
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "/tmp/footer-detail.png", clip: { x: box.x, y: box.y + 300, width: 500, height: 300 } });
  console.log("saved /tmp/footer-detail.png");
}
await browser.close();
