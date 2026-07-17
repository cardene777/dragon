import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/dragon-subpixel-screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await page.screenshot({ path: "/tmp/dragon-subpixel-screenshots/1-editor-default.png", fullPage: false });

await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/dragon-subpixel-screenshots/2-editor-dark.png", fullPage: false });

const editorArea = await page.$(".v4-editor-preview");
if (editorArea) {
  const bb = await editorArea.boundingBox();
  if (bb) {
    await page.screenshot({
      path: "/tmp/dragon-subpixel-screenshots/3-editor-preview-zoom.png",
      clip: { x: bb.x, y: bb.y, width: bb.width, height: bb.height },
    });
  }
}

await browser.close();
console.log("screenshots saved");
