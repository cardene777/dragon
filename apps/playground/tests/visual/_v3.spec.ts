import { test } from "@playwright/test";
test.use({ viewport: { width: 1600, height: 1000 } });
async function pick(page, keyword) {
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
    if (t.includes(keyword)) { await s.nth(i).click(); return; }
  }
}
test("flow", async ({ page }) => { await pick(page, "CIパイプライン"); await page.waitForTimeout(2500); await page.screenshot({ path: "/tmp/v3-flow.png" }); });
test("swim", async ({ page }) => { await pick(page, "ユーザー登録"); await page.waitForTimeout(2500); await page.screenshot({ path: "/tmp/v3-swim.png" }); });
test("topo", async ({ page }) => { await pick(page, "システム構成"); await page.waitForTimeout(2500); await page.screenshot({ path: "/tmp/v3-topo.png" }); });
test("er", async ({ page }) => { await pick(page, "ユーザーと投稿"); await page.waitForTimeout(2500); await page.screenshot({ path: "/tmp/v3-er.png" }); });
