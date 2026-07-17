import { chromium } from "playwright";

const SCREENSHOT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/screenshots";
const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

// 1) editor 起動 + parts drop で pos: 付き diagram を作る
await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.click('[data-testid="editor-parts-tab"]');
await page.waitForTimeout(500);
const partsButton = page.locator('button:has-text("Achievement")').first();
const stage = page.locator('[data-testid="editor-preview-stage"]');
const partsBox = await partsButton.boundingBox();
const stageBox = await stage.boundingBox();
if (partsBox && stageBox) {
  await page.mouse.move(partsBox.x + partsBox.width / 2, partsBox.y + partsBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(stageBox.x + stageBox.width * 0.6, stageBox.y + stageBox.height * 0.4, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
}

await page.screenshot({ path: `${SCREENSHOT_DIR}/layout-toggle-manual.png`, fullPage: false });
console.log("saved manual (drop 済) screenshot");

const dslManual = await page.evaluate(() => window.__cdlEditorSrc ?? "");
console.log("--- DSL (manual = after drop) ---");
console.log(dslManual.split("\n").slice(0, 10).join("\n"));

// 2) Auto ボタンを押して posX/posY を消去
const autoBtn = page.locator('button:has-text("Auto")').first();
await autoBtn.click();
await page.waitForTimeout(1500);

await page.screenshot({ path: `${SCREENSHOT_DIR}/layout-toggle-auto.png`, fullPage: false });
console.log("saved auto (posX/posY cleared) screenshot");

const dslAuto = await page.evaluate(() => window.__cdlEditorSrc ?? "");
console.log("--- DSL (auto = after Auto click) ---");
console.log(dslAuto.split("\n").slice(0, 10).join("\n"));

await browser.close();
