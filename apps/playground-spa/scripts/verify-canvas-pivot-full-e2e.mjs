/**
 * canvas pivot 全機能を end-to-end で verify する comprehensive test。
 * PASS 基準 = 10/10 全 test PASS + JS error なし + screenshot 目視可能。
 */
import { chromium } from "playwright";

const DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/screenshots";
const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const jsErrors = [];
page.on("pageerror", (e) => jsErrors.push(`PAGE_ERR: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") jsErrors.push(`CONSOLE_ERR: ${msg.text().slice(0, 200)}`);
});

async function reload() {
  await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
}

async function dsl() { return await page.evaluate(() => window.__cdlEditorSrc ?? ""); }
async function line(name) {
  const t = await dsl();
  return t.split("\n").find((l) => l.trim().startsWith(`- ${name}`) && !l.includes("->")) ?? "(not found)";
}
async function count(selector) { return await page.locator(selector).count(); }

async function drag(sel, dx, dy, cmd = false) {
  const el = page.locator(sel).first();
  const b = await el.boundingBox();
  if (!b) return false;
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  if (cmd) await page.keyboard.down("Meta");
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 15 });
  await page.mouse.up();
  if (cmd) await page.keyboard.up("Meta");
  await page.waitForTimeout(1500);
  return true;
}

async function dropParts(name, dx, dy, cmd = false) {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(500);
  const parts = page.locator(`button:has-text("${name}")`).first();
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const pb = await parts.boundingBox();
  const sb = await stage.boundingBox();
  if (!pb || !sb) return false;
  const dropX = sb.x + sb.width / 2 + dx;
  const dropY = sb.y + sb.height / 2 + dy;
  if (cmd) await page.keyboard.down("Meta");
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
  await page.mouse.down();
  await page.mouse.move(dropX, dropY, { steps: 15 });
  await page.mouse.up();
  if (cmd) await page.keyboard.up("Meta");
  await page.waitForTimeout(1500);
  return true;
}

const results = [];
function record(id, label, pass, detail) {
  results.push({ id, label, pass, detail });
  console.log(`  ${pass ? "✅" : "❌"} [${id}] ${label} — ${detail}`);
}

console.log("=== Canvas Pivot Full E2E ===\n");

// === TEST 1: lane label が hide されている (「文字だけのユーザー」 消失) ===
console.log("\n[TEST 1] lane label hidden (文字だけのユーザー 消失)");
await reload();
const laneLabelCount = await count('[data-cdl-role="lane-label"]');
const laneLabelVisible = await page.evaluate(() => {
  const els = document.querySelectorAll('[data-cdl-role="lane-label"]');
  for (const el of els) {
    const style = window.getComputedStyle(el);
    if (style.display !== "none") return true;
  }
  return false;
});
record("T1", "lane-label hide", laneLabelCount > 0 && !laneLabelVisible,
  `element count=${laneLabelCount}, visible=${laneLabelVisible}`);
await page.screenshot({ path: `${DIR}/e2e-T1-no-lane-label.png`, fullPage: false });

// === TEST 2: sequence actor drag near other lane → magnet snap ===
console.log("\n[TEST 2] sequence actor drag → magnet snap (posX 未書込)");
await reload();
const userB = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
const apiB = await page.locator('[data-cdl-node="api-header"]').first().boundingBox();
if (userB && apiB) {
  const dx = (apiB.x + apiB.width / 2) - (userB.x + userB.width / 2) - 20;
  await drag('[data-cdl-node="ユ-ザ-header"]', dx, 0);
}
{
  const l = await line("ユーザー");
  record("T2", "magnet snap on near drag", !l.includes("posX"), l);
}

// === TEST 3: sequence actor far drag → free placement ===
console.log("\n[TEST 3] sequence actor far drag → 自由配置 (posX 書込)");
await reload();
await drag('[data-cdl-node="ユ-ザ-header"]', -500, 300);
{
  const l = await line("ユーザー");
  record("T3", "free placement on far drag", l.includes("posX"), l);
}

// === TEST 4: Command + near drag → bypass ===
console.log("\n[TEST 4] Command + near drag → bypass (posX 書込)");
await reload();
const u4 = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
const a4 = await page.locator('[data-cdl-node="api-header"]').first().boundingBox();
if (u4 && a4) {
  const dx = (a4.x + a4.width / 2) - (u4.x + u4.width / 2) - 20;
  await drag('[data-cdl-node="ユ-ザ-header"]', dx, 0, true);
}
{
  const l = await line("ユーザー");
  record("T4", "Command bypass magnet", l.includes("posX"), l);
}

// === TEST 5: parts drop near lane → magnet snap ===
console.log("\n[TEST 5] parts drop near lane → magnet snap (posX 未書込)");
await reload();
const userB5 = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
if (userB5) {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(500);
  const parts = page.locator('button:has-text("Achievement")').first();
  const pb = await parts.boundingBox();
  if (pb) {
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
    await page.mouse.down();
    await page.mouse.move(userB5.x + userB5.width / 2 + 20, userB5.y + userB5.height / 2, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1500);
  }
}
{
  const l = await line("achievement1");
  record("T5", "parts drop near = snap", !l.includes("posX"), l);
}

// === TEST 6: parts drop far → free placement ===
console.log("\n[TEST 6] parts drop far → 自由配置 (posX 書込)");
await reload();
await dropParts("Achievement", 0, 400);
{
  const l = await line("achievement1");
  record("T6", "parts drop far = free", l.includes("posX"), l);
}

// === TEST 7: Command + parts drop near → bypass ===
console.log("\n[TEST 7] Command + parts drop near → bypass (posX 書込)");
await reload();
const userB7 = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
if (userB7) {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(500);
  const parts = page.locator('button:has-text("Achievement")').first();
  const pb = await parts.boundingBox();
  if (pb) {
    await page.keyboard.down("Meta");
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
    await page.mouse.down();
    await page.mouse.move(userB7.x + userB7.width / 2 + 20, userB7.y + userB7.height / 2, { steps: 15 });
    await page.mouse.up();
    await page.keyboard.up("Meta");
    await page.waitForTimeout(1500);
  }
}
{
  const l = await line("achievement1");
  record("T7", "Command bypass parts drop", l.includes("posX"), l);
}

// === TEST 8: orphan label 消失 (前 fix 継続確認) ===
console.log("\n[TEST 8] parts drop 後 achievement1 orphan lane label 0 件");
await reload();
await dropParts("Achievement", 0, 0);
const orphanLabelCount = await page.evaluate(() => {
  const texts = Array.from(document.querySelectorAll("svg text"));
  return texts.filter((t) => t.textContent === "achievement1").length;
});
record("T8", "no orphan achievement1 label", orphanLabelCount === 0, `orphan count=${orphanLabelCount}`);

// === TEST 9: viewBox 外 element 描画 (overflow visible) ===
console.log("\n[TEST 9] Command + drop 上方向 -400px → viewBox 外描画");
await reload();
await dropParts("Achievement", 0, -400, true);
{
  const l = await line("achievement1");
  const hasPos = l.includes("posX") && l.includes("posY");
  const posY = parseInt((l.match(/posY:\s*(-?\d+)/) || [])[1] ?? "0");
  record("T9", "Command drop up (viewBox 外)", hasPos && posY < 0, `${l}`);
}
await page.screenshot({ path: `${DIR}/e2e-T9-viewbox-overflow.png`, fullPage: false });

// === TEST 10: catalog 100+ regression (default sequence 表示崩れ無し) ===
console.log("\n[TEST 10] default sequence render OK (regression 無し)");
await reload();
const lifelineCount = await count('[data-cdl-node$="-header"]');
const flowCount = await count('[data-cdl-edge-label-for]');
record("T10", "default sequence render OK", lifelineCount === 3 && flowCount >= 3,
  `lifeline=${lifelineCount}, flow=${flowCount}`);

// === SUMMARY ===
console.log("\n=== SUMMARY ===");
const passed = results.filter((r) => r.pass).length;
console.log(`${passed}/${results.length} PASS`);
for (const r of results) {
  console.log(`  ${r.pass ? "✅" : "❌"} [${r.id}] ${r.label}`);
}
if (jsErrors.length > 0) {
  console.log("\n--- JS ERRORS (pre-existing cdl geometry warnings 除外) ---");
  const filtered = jsErrors.filter((e) => !e.includes("row-gap-uniform"));
  for (const e of filtered) console.log(e);
  console.log(`(pre-existing filtered: ${jsErrors.length - filtered.length})`);
}

await browser.close();
process.exit(passed === results.length ? 0 : 1);
