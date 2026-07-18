import { chromium } from "playwright";

const BASE = "http://localhost:4323";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

page.on("console", (msg) => {
  console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
});
await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

// parts tab に切替 → achievement を drag→drop
await page.click('[data-testid="editor-parts-tab"]');
await page.waitForTimeout(500);
const partsButton = page.locator('button:has-text("Achievement")').first();
const stage = page.locator('[data-testid="editor-preview-stage"]');
const partsBox = await partsButton.boundingBox();
const stageBox = await stage.boundingBox();
if (partsBox && stageBox) {
  await page.mouse.move(partsBox.x + partsBox.width / 2, partsBox.y + partsBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
}

// SVG 内の text 要素を全部拾って中身を出す
const texts = await page.$$eval("svg text", (nodes) =>
  nodes.map((n) => ({
    text: n.textContent,
    x: n.getAttribute("x"),
    y: n.getAttribute("y"),
    parent: n.parentElement?.tagName,
    parentClass: n.parentElement?.getAttribute("class"),
  })).filter((t) => t.text && t.text.trim().length > 0),
);
console.log("=== SVG text 要素 ===");
for (const t of texts) {
  console.log(JSON.stringify(t));
}

await browser.close();
