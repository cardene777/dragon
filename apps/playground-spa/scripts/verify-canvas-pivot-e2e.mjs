import { chromium } from "playwright";

const DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/screenshots";
const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`PAGE_ERR: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE_ERR: ${msg.text()}`);
});

async function reload() {
  await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
}

async function dsl() {
  return await page.evaluate(() => window.__cdlEditorSrc ?? "");
}

async function line(name) {
  const t = await dsl();
  return t.split("\n").find((l) => l.trim().startsWith(`- ${name}`) && !l.includes("->")) ?? "(not found)";
}

async function dragElement(sel, dx, dy, cmd = false) {
  const el = page.locator(sel).first();
  const b = await el.boundingBox();
  if (!b) { console.log(`NO ELEM: ${sel}`); return; }
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  if (cmd) await page.keyboard.down("Meta");
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 15 });
  await page.mouse.up();
  if (cmd) await page.keyboard.up("Meta");
  await page.waitForTimeout(1500);
}

async function dropParts(partsName, dx, dy, cmd = false) {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(500);
  const parts = page.locator(`button:has-text("${partsName}")`).first();
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const pb = await parts.boundingBox();
  const sb = await stage.boundingBox();
  if (!pb || !sb) return;
  const dropX = sb.x + sb.width / 2 + dx;
  const dropY = sb.y + sb.height / 2 + dy;
  if (cmd) await page.keyboard.down("Meta");
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
  await page.mouse.down();
  await page.mouse.move(dropX, dropY, { steps: 15 });
  await page.mouse.up();
  if (cmd) await page.keyboard.up("Meta");
  await page.waitForTimeout(1500);
}

const results = [];
function log(label, pass, detail) {
  const mark = pass ? "✅" : "❌";
  results.push({ label, pass, detail });
  console.log(`  ${mark} ${label}: ${detail}`);
}

// =====================================================================
console.log("\n=== TEST GROUP A: sequence actor drag ===");
// =====================================================================

console.log("\n[A1] 小 drag (30px) → 他 lane が range 外 = 自由配置 期待 (spec 通り)");
await reload();
await dragElement('[data-cdl-node="ユ-ザ-header"]', 30, 10);
{
  const l = await line("ユーザー");
  log("A1 small drag free placement (no other lane near)", l.includes("posX"), l);
}

console.log("\n[A2] drag ユーザー onto API (X 方向大移動、 API 近く) → magnet snap 期待");
await reload();
const userB = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
const apiB = await page.locator('[data-cdl-node="api-header"]').first().boundingBox();
if (userB && apiB) {
  const dx = (apiB.x + apiB.width / 2) - (userB.x + userB.width / 2) - 20;
  await dragElement('[data-cdl-node="ユ-ザ-header"]', dx, 0);
}
{
  const l = await line("ユーザー");
  log("A2 drag onto API zone", !l.includes("posX"), l);
}

console.log("\n[A3] far drag (-500, 300) → 自由配置 期待");
await reload();
await dragElement('[data-cdl-node="ユ-ザ-header"]', -500, 300);
{
  const l = await line("ユーザー");
  log("A3 far drag free", l.includes("posX"), l);
}

console.log("\n[A4] Command + API 近く drag → bypass 期待");
await reload();
const uB4 = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
const aB4 = await page.locator('[data-cdl-node="api-header"]').first().boundingBox();
if (uB4 && aB4) {
  const dx = (aB4.x + aB4.width / 2) - (uB4.x + uB4.width / 2) - 20;
  await dragElement('[data-cdl-node="ユ-ザ-header"]', dx, 0, true);
}
{
  const l = await line("ユーザー");
  log("A4 Command bypass on near drag", l.includes("posX"), l);
}
await page.screenshot({ path: `${DIR}/e2e-A4-command-bypass.png`, fullPage: false });

// =====================================================================
console.log("\n=== TEST GROUP B: parts drop ===");
// =====================================================================

console.log("\n[B1] parts drop near ユーザー lane → magnet snap 期待");
await reload();
const userB1 = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
if (userB1) {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(500);
  const parts = page.locator('button:has-text("Achievement")').first();
  const pb = await parts.boundingBox();
  if (pb) {
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
    await page.mouse.down();
    // drop 近く ユーザー header (magnet 発火 X 方向)
    await page.mouse.move(userB1.x + userB1.width / 2 + 20, userB1.y + userB1.height / 2, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1500);
  }
}
{
  const l = await line("achievement1");
  log("B1 parts drop near lane snap", !l.includes("posX"), l);
}

console.log("\n[B2] parts drop 遠く (下方向 300px) → 自由配置 期待");
await reload();
await dropParts("Achievement", 0, 350);
{
  const l = await line("achievement1");
  log("B2 parts drop far free", l.includes("posX"), l);
}
await page.screenshot({ path: `${DIR}/e2e-B2-parts-free-drop.png`, fullPage: false });

console.log("\n[B3] Command + parts drop near lane → bypass 期待");
await reload();
const userB3 = await page.locator('[data-cdl-node="ユ-ザ-header"]').first().boundingBox();
if (userB3) {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(500);
  const parts = page.locator('button:has-text("Achievement")').first();
  const pb = await parts.boundingBox();
  if (pb) {
    await page.keyboard.down("Meta");
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
    await page.mouse.down();
    await page.mouse.move(userB3.x + userB3.width / 2 + 20, userB3.y + userB3.height / 2, { steps: 15 });
    await page.mouse.up();
    await page.keyboard.up("Meta");
    await page.waitForTimeout(1500);
  }
}
{
  const l = await line("achievement1");
  log("B3 parts drop Command bypass", l.includes("posX"), l);
}

// =====================================================================
console.log("\n=== TEST GROUP C: visual overlap / overflow ===");
// =====================================================================

console.log("\n[C1] parts drop 上部にはみ出す (posY 負) → overflow visible で描画");
await reload();
await dropParts("Achievement", 0, -400, true);  // Command で自由配置
{
  const l = await line("achievement1");
  const hasPos = l.includes("posX") && l.includes("posY");
  log("C1 far up drop with Command", hasPos, l);
}
// screenshot で trophy が描画されているか目視 verify 用
await page.screenshot({ path: `${DIR}/e2e-C1-overflow.png`, fullPage: false });

// =====================================================================
console.log("\n=== SUMMARY ===");
const passed = results.filter((r) => r.pass).length;
const total = results.length;
console.log(`${passed}/${total} PASS`);
for (const r of results) {
  console.log(`  ${r.pass ? "✅" : "❌"} ${r.label}`);
}
if (errors.length > 0) {
  console.log("\n--- JS ERRORS ---");
  for (const e of errors) console.log(e);
}

await browser.close();
process.exit(passed === total && errors.length === 0 ? 0 : 1);
