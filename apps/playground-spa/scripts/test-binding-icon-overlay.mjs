/**
 * canvas pivot parts binding icon overlay E2E test。
 * user 指定 「右上らへんにアイコン」 を実装、 個別 parts 単位で ⚡ icon が表示され click で popup open + source pre-select が動作するか verify。
 */
import { chromium } from "playwright";

const DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/screenshots";
const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`PAGE_ERR: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error" && !msg.text().includes("row-gap-uniform")) {
    errors.push(`CONSOLE_ERR: ${msg.text().slice(0, 200)}`);
  }
});

const results = [];
function record(id, label, pass, detail) {
  results.push({ id, label, pass, detail });
  console.log(`  ${pass ? "✅" : "❌"} [${id}] ${label} — ${detail}`);
}

async function reload() {
  await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(1500);
  await page.locator('[role="tab"]:has-text("サンプル")').first().click();
  await page.waitForTimeout(500);
}

async function replaceSrc(text) {
  await page.click('.cm-content');
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);
  await page.keyboard.insertText(text);
  await page.waitForTimeout(2000);
}

console.log("=== Binding Icon Overlay E2E ===\n");

// TEST 1: counter parts drop → 右上に ⚡ icon 表示
await reload();
await replaceSrc(`title: "test"
type: sequence

actors:
  - user
  - api
  - counter1: { kind: counter-actor }

flow:
  - user -> api: "click"
`);
const iconCounter = await page.locator('[data-testid="bind-icon-counter1"]').count();
record("T1", "counter1 parts の右上に ⚡ icon 表示", iconCounter === 1, `icon count=${iconCounter}`);

// TEST 2: icon click で popup open + source pre-select (Step 2 直接表示)
if (iconCounter === 1) {
  await page.click('[data-testid="bind-icon-counter1"]');
  await page.waitForTimeout(500);
  const popupOpen = await page.locator('[data-testid="editor-bind-popup"]').count();
  const step2Visible = await page.locator('[data-testid^="bind-sink-"]').count();
  record("T2", "icon click で popup open + Step 2 (sink 一覧) 直接表示", popupOpen === 1 && step2Visible >= 1,
    `popup=${popupOpen}, sink count=${step2Visible}`);
  await page.screenshot({ path: `${DIR}/binding-icon-T2-popup.png`, fullPage: false });
}

// TEST 3: sink 選択 → binding 完了 → 2 番目の parts (arc1) にも icon 表示
if (iconCounter === 1) {
  await page.click('[data-testid="bind-sink-arc-gauge"]');
  await page.waitForTimeout(2000);
  const iconAll = await page.locator('[data-testid^="bind-icon-"]').count();
  const iconArc = await page.locator('[data-testid^="bind-icon-arcgauge"]').count();
  record("T3", "arc-gauge 追加後 icon 2 個 (counter1 + arcgauge1)", iconAll === 2 && iconArc === 1,
    `all icon=${iconAll}, arc icon=${iconArc}`);
  await page.screenshot({ path: `${DIR}/binding-icon-T3-after-bind.png`, fullPage: false });
}

// TEST 4: standalone parts (sequence actor 単体) には icon 表示なし (source/sink のみ表示)
{
  const iconUser = await page.locator('[data-testid="bind-icon-user"]').count();
  const iconApi = await page.locator('[data-testid="bind-icon-api"]').count();
  record("T4", "standalone actor (user/api) に icon 表示なし", iconUser === 0 && iconApi === 0,
    `user icon=${iconUser}, api icon=${iconApi}`);
}

// TEST 5: sink icon click = popup Step 1 (source 選択) 表示 (逆方向経路)
{
  await page.click('[data-testid="editor-preview-stage"]');  // popup close
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const arcIconCnt = await page.locator('[data-testid^="bind-icon-arcgauge"]').count();
  if (arcIconCnt === 1) {
    await page.locator('[data-testid^="bind-icon-arcgauge"]').first().click();
    await page.waitForTimeout(500);
    const step1Visible = await page.locator('[data-testid^="bind-source-"]').count();
    // sink 起点で popup 開いた時は source 選択画面 (Step 1) 表示、 sink 一覧 (Step 2) は非表示
    const step2Absent = await page.locator('[data-testid^="bind-sink-"]').count();
    record("T5", "sink icon click で Step 1 (source 選択) 表示", step1Visible >= 1 && step2Absent === 0,
      `step1=${step1Visible}, step2=${step2Absent}`);
  }
}

console.log("\n=== SUMMARY ===");
const passed = results.filter((r) => r.pass).length;
console.log(`${passed}/${results.length} PASS`);
for (const r of results) console.log(`  ${r.pass ? "✅" : "❌"} [${r.id}] ${r.label}`);
if (errors.length > 0) {
  console.log("\n--- JS ERRORS ---");
  for (const e of errors) console.log(e);
}

await browser.close();
process.exit(passed === results.length && errors.length === 0 ? 0 : 1);
