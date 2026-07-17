import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/dragon-pr-395-screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const detailsToggle = await page.$("details.v4-editor-side-samples summary");
if (detailsToggle) {
  await detailsToggle.click();
  await page.waitForTimeout(500);
}

const targets = [
  { label: "ユーザー登録", file: "1-swimlane-hint.png" },
  { label: "認証状態遷移", file: "2-state-hint.png" },
];

for (const t of targets) {
  const buttons = await page.$$(".v4-editor-side-item");
  for (const btn of buttons) {
    const bt = await btn.textContent();
    if (bt?.trim() === t.label) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `/tmp/dragon-pr-395-screenshots/${t.file}`, fullPage: false });
  console.log(`captured ${t.label} → ${t.file}`);
}

const buttons = await page.$$(".v4-editor-side-item");
for (const btn of buttons) {
  const bt = await btn.textContent();
  if (bt?.trim() === "ログインAPI呼び出し") {
    await btn.click();
    break;
  }
}
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/dragon-pr-395-screenshots/3-clean-panel-hidden.png", fullPage: false });
console.log("captured clean sample (panel hidden) → 3-clean-panel-hidden.png");

await browser.close();
