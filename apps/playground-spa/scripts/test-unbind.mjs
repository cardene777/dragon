import { chromium } from "playwright";
const BASE = "http://localhost:4323";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const results = [];
function rec(id, pass, detail) { results.push({id, pass}); console.log(`  ${pass?"✅":"❌"} [${id}] ${detail}`); }

await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.click('[data-testid="editor-parts-tab"]'); await page.waitForTimeout(1500);
await page.locator('[role="tab"]:has-text("サンプル")').first().click(); await page.waitForTimeout(500);
await page.click('.cm-content'); await page.keyboard.press("Meta+A"); await page.keyboard.press("Backspace");
await page.waitForTimeout(300);
await page.keyboard.insertText(`title: "test"
type: sequence

actors:
  - u
  - a
  - c1: { kind: counter-actor }
  - arc1: { kind: arc-gauge, bind: c1.n }

flow:
  - u -> a: "click"
`);
await page.waitForTimeout(2500);

// T1: bound sink の icon が ⛓ 表示
const arcIcon = await page.locator('[data-testid="bind-icon-arc1"]').textContent();
rec("T1", arcIcon === "⛓", `arc1 icon text = "${arcIcon}" (期待 "⛓")`);

// T2: icon click で popup、 「現在の連動一覧」 に arc1 表示
await page.click('[data-testid="bind-icon-arc1"]');
await page.waitForTimeout(500);
const existingCnt = await page.locator('[data-testid="bind-existing-arc1"]').count();
rec("T2", existingCnt === 1, `popup に arc1 の連動表示 count=${existingCnt}`);

// T3: × button click で unbind → DSL から bind 消失 → icon が ⚡ に戻る
await page.click('[data-testid="bind-unbind-arc1"]');
await page.waitForTimeout(2000);
const dsl = await page.evaluate(() => window.__cdlEditorSrc);
const arcLine = dsl.split("\n").find((l) => l.includes("arc1"));
rec("T3", !arcLine.includes("bind"), `unbind 後 DSL: ${arcLine}`);

// T4: icon が ⚡ に戻る (bound state 解除)
await page.waitForTimeout(1000);
const arcIconAfter = await page.locator('[data-testid="bind-icon-arc1"]').textContent();
rec("T4", arcIconAfter === "⚡", `unbind 後 icon = "${arcIconAfter}" (期待 "⚡")`);

console.log("\n=== SUMMARY ===");
const passed = results.filter(r => r.pass).length;
console.log(`${passed}/${results.length} PASS`);
await browser.close();
process.exit(passed === results.length ? 0 : 1);
