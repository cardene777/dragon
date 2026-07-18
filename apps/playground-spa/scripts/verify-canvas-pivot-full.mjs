import { chromium } from "playwright";

const SCREENSHOT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/screenshots";
const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

page.on("console", (msg) => {
  const t = msg.text();
  if (t.includes("error") || t.includes("Error")) console.log(`[BROWSER ${msg.type()}] ${t}`);
});

// 1) editor 起動
await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

// 2) parts tab → Achievement を drop (drop 位置は preview 中心の右下 offset)
await page.click('[data-testid="editor-parts-tab"]');
await page.waitForTimeout(500);
const partsButton = page.locator('button:has-text("Achievement")').first();
const stage = page.locator('[data-testid="editor-preview-stage"]');
const partsBox = await partsButton.boundingBox();
const stageBox = await stage.boundingBox();
if (partsBox && stageBox) {
  const dropX = stageBox.x + stageBox.width * 0.5; // 中央
  const dropY = stageBox.y + stageBox.height * 0.5; // 中央
  await page.mouse.move(partsBox.x + partsBox.width / 2, partsBox.y + partsBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(dropX, dropY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: `${SCREENSHOT_DIR}/canvas-pivot-drop-position.png`, fullPage: false });
console.log(`saved drop screenshot`);

// 3) DSL text を確認 (posX/posY が入っているか)
const dslText = await page.evaluate(() => {
  return window.__cdlEditorSrc ?? "";
});
console.log("--- DSL after drop ---");
console.log(dslText);

// 4) actor node を drag してみる (achievement1 の trophy)
const trophySelector = '[data-cdl-node^="achievement1__"], [data-cdl-lane^="achievement1__"]';
const trophyEl = page.locator(trophySelector).first();
if (await trophyEl.count() > 0) {
  const trophyBox = await trophyEl.boundingBox();
  if (trophyBox) {
    const cx = trophyBox.x + trophyBox.width / 2;
    const cy = trophyBox.y + trophyBox.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 300, cy - 200, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1500);
  }
}
await page.screenshot({ path: `${SCREENSHOT_DIR}/canvas-pivot-drag-result.png`, fullPage: false });
console.log(`saved drag screenshot`);

const dslAfterDrag = await page.evaluate(() => {
  return window.__cdlEditorSrc ?? "";
});
console.log("--- DSL after drag ---");
console.log(dslAfterDrag);

await browser.close();
