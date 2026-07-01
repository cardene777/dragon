import { test } from "@playwright/test";
test.use({ viewport: { width: 1600, height: 1000 } });
test("flow label", async ({ page }) => {
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.evaluate(() => { localStorage.clear(); window.location.hash = ""; localStorage.setItem("v4-theme", "dark"); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.locator(".v4-editor-side-samples-summary").click().catch(() => {});
  await page.waitForTimeout(300);
  const s = page.locator(".v4-editor-side-item");
  const n = await s.count();
  for (let i = 0; i < n; i++) {
    const t = await s.nth(i).innerText();
    if (t.includes("CIパイプライン")) { await s.nth(i).click(); break; }
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/flow.png", fullPage: false });
});
