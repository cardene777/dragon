import { chromium } from "playwright";

const SCREENSHOT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/screenshots";
const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

// 1) editor 起動 → SAMPLES から sequence 選択済 (default)
// cache-bust query で force reload、 HMR が picked up されているか確認
await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);

// 2) parts tab に切替 → achievement を drag→drop で preview に append
await page.click('[data-testid="editor-parts-tab"]');
await page.waitForTimeout(500);

// achievement parts item を search
const partsButton = page.locator('button:has-text("achievement")').first();
const stage = page.locator('[data-testid="editor-preview-stage"]');

if (await partsButton.count() > 0) {
  const partsBox = await partsButton.boundingBox();
  const stageBox = await stage.boundingBox();
  if (partsBox && stageBox) {
    await page.mouse.move(partsBox.x + partsBox.width / 2, partsBox.y + partsBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
  }
}

await page.screenshot({ path: `${SCREENSHOT_DIR}/canvas-pivot-orphan-fix.png`, fullPage: false });
console.log(`saved ${SCREENSHOT_DIR}/canvas-pivot-orphan-fix.png`);

await browser.close();
