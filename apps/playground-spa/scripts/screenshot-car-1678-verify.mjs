import { chromium } from "playwright";

const SCREENSHOT_DIR = "/Users/cardene/Desktop/projects/dragon/.context/verify/screenshots";
const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

async function activeTab() {
  return await page.evaluate(() => window.__cdlEditorActiveTab ?? "unknown");
}

async function setYaml(text) {
  await page.locator('[data-testid="editor-code-body-yaml"] .cm-content').click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.type(text);
  await page.waitForTimeout(700);
}

// 1) CDL tab active (default 起動)
await page.goto(`${BASE}/editor`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const tab1 = await activeTab();
console.log(`state 1: activeTab=${tab1}`);
await page.screenshot({ path: `${SCREENSHOT_DIR}/car-1678-cdl-tab.png`, fullPage: false });
console.log(`saved ${SCREENSHOT_DIR}/car-1678-cdl-tab.png`);

// 2) YAML tab active (URL param format=yaml)
await page.goto(`${BASE}/editor?format=yaml`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const tab2 = await activeTab();
console.log(`state 2: activeTab=${tab2}`);
await page.screenshot({ path: `${SCREENSHOT_DIR}/car-1678-yaml-tab.png`, fullPage: false });
console.log(`saved ${SCREENSHOT_DIR}/car-1678-yaml-tab.png`);

// 3) YAML parse error (invalid YAML を入力)
await setYaml("title: broken\nactors:\n  - id: a1\n    kind: person\n  - broken indent oops");
await page.waitForTimeout(1000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/car-1678-yaml-error.png`, fullPage: false });
console.log(`saved ${SCREENSHOT_DIR}/car-1678-yaml-error.png`);

await browser.close();
console.log("done");
