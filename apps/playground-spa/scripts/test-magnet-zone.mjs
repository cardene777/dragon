import { chromium } from "playwright";

const BASE = "http://localhost:4323";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

async function drag(fromSel, dx, dy, useCmd = false) {
  const el = page.locator(fromSel).first();
  const box = await el.boundingBox();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  if (useCmd) await page.keyboard.down("Meta");
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 12 });
  await page.mouse.up();
  if (useCmd) await page.keyboard.up("Meta");
  await page.waitForTimeout(1500);
}

async function reload() {
  await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
}

async function getLine(name) {
  const dsl = await page.evaluate(() => window.__cdlEditorSrc ?? "");
  return dsl.split("\n").find((l) => l.trim().startsWith(`- ${name}`) && !l.includes("->")) ?? "(not found)";
}

// === TEST 1 = ユーザー を API の近くまで drag (80px 以内) → snap 期待 ===
console.log("--- TEST 1: ユーザー → API 近くまで drag (magnet snap 期待) ---");
const userB = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
const apiB = await page.locator('[data-cdl-node="api-header"]').first().boundingBox();
if (userB && apiB) {
  const dx = (apiB.x + apiB.width / 2) - (userB.x + userB.width / 2) - 30; // API center 30px 手前
  const dy = 0;
  await drag('[data-cdl-node="ユ-ザ-header"]', dx, dy);
}
const line1 = await getLine("ユーザー");
console.log(`ユーザー line: ${line1}`);
console.log(`snap 成功 (posX 未書込) = ${!line1.includes("posX") ? "YES ✅" : "NO ❌"}`);

// === TEST 2 = ユーザー を遠くに drag (他 lane から 200px 以上) → 自由配置 期待 ===
await reload();
console.log("\n--- TEST 2: ユーザー を遠くに drag (自由配置 期待) ---");
await drag('[data-cdl-node="ユ-ザ-header"]', -500, 300);
const line2 = await getLine("ユーザー");
console.log(`ユーザー line: ${line2}`);
console.log(`自由配置 成功 (posX 書込) = ${line2.includes("posX") ? "YES ✅" : "NO ❌"}`);

// === TEST 3 = Command + ユーザー を API の近くまで drag → bypass 期待 ===
await reload();
console.log("\n--- TEST 3: Command + ユーザー → API 近く drag (magnet skip 期待) ---");
const userB3 = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
const apiB3 = await page.locator('[data-cdl-node="api-header"]').first().boundingBox();
if (userB3 && apiB3) {
  const dx = (apiB3.x + apiB3.width / 2) - (userB3.x + userB3.width / 2) - 30;
  const dy = 0;
  await drag('[data-cdl-node="ユ-ザ-header"]', dx, dy, true);
}
const line3 = await getLine("ユーザー");
console.log(`ユーザー line: ${line3}`);
console.log(`Command bypass 成功 (posX 書込) = ${line3.includes("posX") ? "YES ✅" : "NO ❌"}`);

await browser.close();
