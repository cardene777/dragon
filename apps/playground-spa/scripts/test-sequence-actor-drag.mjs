import { chromium } from "playwright";

const BASE = "http://localhost:4323";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`PAGE ERROR: ${e.message}`));
page.on("console", (msg) => {
  const t = msg.text();
  if (t.includes("drag-debug") || msg.type() === "error") console.log(`[${msg.type()}] ${t}`);
});

await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

// Fit で preview 全体を stage に収める
const btnFit = page.locator('button:has-text("フィット")').first();
await btnFit.click();
await page.waitForTimeout(1000);

// ユーザー header box を click + drag
const userHeader = page.locator('[data-cdl-node="ユ-ザ-header"]').first();
const cnt = await userHeader.count();
console.log(`ユーザー header count = ${cnt}`);
if (cnt === 0) {
  console.log("NO ユーザー header found");
  await browser.close();
  process.exit(0);
}
const box = await userHeader.boundingBox();
console.log(`ユーザー header box = ${JSON.stringify(box)}`);
if (box) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  // 該当 click point の実 DOM element を確認
  const info = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    const stack = [];
    for (let e = el; e; e = e.parentElement) {
      stack.push(`${e.tagName}${e.getAttribute("data-cdl-node") ? `[node=${e.getAttribute("data-cdl-node")}]` : ""}${e.getAttribute("data-cdl-lane") ? `[lane=${e.getAttribute("data-cdl-lane")}]` : ""}${e.className ? `.${typeof e.className === "string" ? e.className.split(" ")[0] : ""}` : ""}`);
      if (stack.length >= 5) break;
    }
    return stack;
  }, { x: cx, y: cy });
  console.log(`element stack at (${cx}, ${cy}):`);
  for (const s of info) console.log(`  ${s}`);
  console.log(`drag start (${cx}, ${cy}) → (${cx + 100}, ${cy + 50})`);
  await page.mouse.move(cx, cy);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.move(cx + 100, cy + 50, { steps: 15 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(1500);
}

const dsl = await page.evaluate(() => window.__cdlEditorSrc ?? "");
console.log("--- DSL after drag ---");
console.log(dsl);

console.log("--- errors ---");
for (const e of errors) console.log(e);

await browser.close();
