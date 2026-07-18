import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(`http://localhost:4323/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.click('[data-testid="editor-parts-tab"]'); await page.waitForTimeout(1500);
await page.locator('[role="tab"]:has-text("サンプル")').first().click(); await page.waitForTimeout(500);
await page.click('.cm-content'); await page.keyboard.press("Meta+A"); await page.keyboard.press("Backspace");
await page.waitForTimeout(300);
await page.keyboard.insertText(`title: "arc solo"
type: sequence

actors:
  - user
  - api
  - arcgauge1: { kind: arc-gauge }

flow:
  - user -> api: "click"
`);
await page.waitForTimeout(2500);

for (const t of [0, 800, 1600, 2400, 3200]) {
  await page.waitForTimeout(t === 0 ? 500 : 800);
  const d = await page.evaluate(() => {
    const p = document.querySelector('svg [data-cdl-node="arcgauge1__arc"] path');
    return p ? p.getAttribute('d') : null;
  });
  console.log(`  t=${t}ms: d[0..50]=${(d || '').slice(0, 50)}`);
}
await browser.close();
