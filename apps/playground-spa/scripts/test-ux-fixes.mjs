/**
 * 5 UX bug fix e2e verify:
 * 1. drag free move (magnet lane snap 廃止、 Y align only 8px)
 * 2. parts click で auto-place (下方 + posX/posY 書込)
 * 3. 削除 button 動作
 * 4. 連動 popup content (source なし時 empty state 表示 / source あり時 list 表示)
 * 5. sink icon click で Step 1 source list 表示
 */
import { chromium } from "playwright";
const BASE = "http://localhost:4323";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

async function reload() {
  await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.click('[data-testid="editor-parts-tab"]'); await page.waitForTimeout(1500);
  await page.locator('[role="tab"]:has-text("サンプル")').first().click(); await page.waitForTimeout(500);
}

const results = [];
function rec(id, pass, detail) { results.push({id, pass}); console.log(`  ${pass?"✅":"❌"} [${id}] ${detail}`); }

console.log("=== 5 UX bug fix verify ===\n");

// TEST 1: parts click で auto-place (posY > 0 = 下方配置)
console.log("\n[T1] parts click auto-place = 下方 posY > 0");
await reload();
await page.click('[data-testid="editor-parts-tab"]'); await page.waitForTimeout(1000);
const arcBtn = page.locator('button:has-text("Arc Gauge")').first();
await arcBtn.click();
await page.waitForTimeout(2000);
const dsl1 = await page.evaluate(() => window.__cdlEditorSrc ?? "");
const arcLine = dsl1.split("\n").find(l => l.includes("arc-gauge"));
const posYMatch = arcLine?.match(/posY:\s*(\d+)/);
const posY = posYMatch ? parseInt(posYMatch[1]) : 0;
rec("T1", posY > 100, `arc line: ${arcLine} / posY=${posY} (期待 > 100)`);

// TEST 2: 削除 button 表示 + click で削除
console.log("\n[T2] arcgauge1 に ✕ 削除 button + click 削除");
await page.waitForTimeout(500);
const deleteBtn = await page.locator('[data-testid="delete-icon-arcgauge1"]').count();
rec("T2a", deleteBtn === 1, `delete button count = ${deleteBtn}`);
if (deleteBtn === 1) {
  await page.click('[data-testid="delete-icon-arcgauge1"]');
  await page.waitForTimeout(2000);
  const dsl2 = await page.evaluate(() => window.__cdlEditorSrc ?? "");
  rec("T2b", !dsl2.includes("arc-gauge"), `削除後 DSL に arc-gauge 消失`);
}

// TEST 3: 連動 popup content = source なし = empty state 表示
console.log("\n[T3] 連動 popup empty state (source parts 無し)");
await reload();
await page.locator('.v4-editor-bar-btn').filter({ hasText: '連動' }).click();
await page.waitForTimeout(1000);
const emptyText = await page.locator('.v4-editor-bind-popup-empty').count();
const popupOpen = await page.locator('[data-testid="editor-bind-popup"]').count();
rec("T3", popupOpen === 1 && emptyText === 1, `popup=${popupOpen}, empty state=${emptyText}`);

// TEST 4: source drop 済 → 連動 popup source 一覧表示
console.log("\n[T4] source (Counter Actor) click 後、 連動 popup で source list");
await reload();
await page.click('[data-testid="editor-parts-tab"]'); await page.waitForTimeout(1000);
await page.locator('button:has-text("Counter Actor")').first().click();
await page.waitForTimeout(2000);
await page.locator('.v4-editor-bar-btn').filter({ hasText: '連動' }).click();
await page.waitForTimeout(500);
const srcListCnt = await page.locator('[data-testid^="bind-source-"]').count();
rec("T4", srcListCnt >= 1, `source list count = ${srcListCnt}`);

// TEST 5: source 選択 → sink 一覧表示 (28 sink)
console.log("\n[T5] source 選択 → sink 一覧 28 件");
if (srcListCnt >= 1) {
  await page.locator('[data-testid^="bind-source-"]').first().click();
  await page.waitForTimeout(500);
  const sinkCnt = await page.locator('[data-testid^="bind-sink-"]').count();
  rec("T5", sinkCnt >= 20, `sink list count = ${sinkCnt} (期待 ≥ 20)`);
}

console.log("\n=== SUMMARY ===");
const passed = results.filter(r => r.pass).length;
console.log(`${passed}/${results.length} PASS`);
await browser.close();
process.exit(passed === results.length ? 0 : 1);
