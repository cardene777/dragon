import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
// Take screenshot at 100% zoom
await page.click("text=100%").catch(() => {});
await page.waitForTimeout(1000);
// Screenshot top-left of stage
const stage = await page.locator(".v4-editor-stage").first();
const box = await stage.boundingBox();
if (box) {
  await page.screenshot({ 
    path: "/tmp/header-detail.png",
    clip: { x: box.x, y: box.y, width: Math.min(500, box.width), height: 200 }
  });
  console.log("saved /tmp/header-detail.png");
}
await browser.close();
