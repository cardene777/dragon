import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const detailsToggle = await page.$("details.v4-editor-side-samples summary");
if (detailsToggle) {
  await detailsToggle.click();
  await page.waitForTimeout(500);
}

const targets = ["ユーザー登録", "認証状態遷移"];

for (const targetLabel of targets) {
  const buttons = await page.$$(".v4-editor-side-item");
  for (const btn of buttons) {
    const t = await btn.textContent();
    if (t?.trim() === targetLabel) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(2500);

  const detail = await page.evaluate(() => {
    const panel = document.querySelector(".v4-editor-warnings");
    if (!panel) return null;
    const items = Array.from(panel.querySelectorAll(".v4-editor-warnings-list li"));
    return {
      badge: panel.querySelector(".v4-editor-warnings-badge")?.textContent?.trim(),
      hint: panel.querySelector(".v4-editor-warnings-hint")?.textContent?.trim(),
      itemsRaw: items.map((li) => ({
        innerHTML: li.innerHTML.slice(0, 300),
        text: li.textContent?.trim().slice(0, 300),
      })),
    };
  });

  console.log(`\n=== ${targetLabel} ===`);
  console.log("badge:", detail?.badge);
  console.log("hint:", detail?.hint);
  detail?.itemsRaw.forEach((it, i) => {
    console.log(`item ${i}:`);
    console.log(`  text: ${it.text}`);
    console.log(`  html: ${it.innerHTML.slice(0, 150)}...`);
  });
}

await browser.close();
