import { test } from "@playwright/test";
test.use({ viewport: { width: 1600, height: 1000 } });
test("apply fix on proximity warn", async ({ page }) => {
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.evaluate(() => { localStorage.clear(); window.location.hash = ""; localStorage.setItem("v4-theme", "dark"); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  // er sample を選択 (proximity warn 発火)
  await page.locator(".v4-editor-side-samples-summary").click().catch(() => {});
  await page.waitForTimeout(300);
  const s = page.locator(".v4-editor-side-item");
  const n = await s.count();
  for (let i = 0; i < n; i++) {
    const t = await s.nth(i).innerText();
    if (t.includes("ユーザーと投稿")) { await s.nth(i).click(); break; }
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "/tmp/before.png", fullPage: false });
  // 一括反映 button click
  await page.locator(".v4-editor-warnings-apply").click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/after.png", fullPage: false });
});
