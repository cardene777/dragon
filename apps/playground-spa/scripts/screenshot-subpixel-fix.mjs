import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/dragon-subpixel-screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await page.screenshot({ path: "/tmp/dragon-subpixel-screenshots/1-editor-default.png", fullPage: false });
console.log("1: default sample = ログインAPI呼び出し (sequence)");

const panelExists = await page.evaluate(() => {
  return document.querySelector(".v4-editor-warnings") !== null;
});
console.log("  panel visible:", panelExists);

await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/dragon-subpixel-screenshots/2-editor-dark.png", fullPage: false });
console.log("2: dark mode toggled");

const samples = await page.$$eval("[data-cdl-sample-slug]", (els) => els.map((e) => ({
  slug: e.getAttribute("data-cdl-sample-slug"),
  text: e.textContent?.trim().slice(0, 30),
})));
console.log("  samples available:", samples.length);

const flowSample = await page.$('[data-cdl-sample-slug="ci-pipeline-flow"]');
if (flowSample) {
  await flowSample.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/dragon-subpixel-screenshots/3-editor-flow.png", fullPage: false });
  console.log("3: flow sample loaded");
}

await browser.close();
console.log("\nscreenshots saved to /tmp/dragon-subpixel-screenshots/");
