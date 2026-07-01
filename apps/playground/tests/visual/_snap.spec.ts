import { test } from "@playwright/test";
test.use({ viewport: { width: 1600, height: 1000 } });
test("flow near label", async ({ page }) => {
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
test("apply fix on er sample", async ({ page }) => {
  page.on("console", (m) => { if (m.type() !== "warning") console.log("[browser]", m.text()); });
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
    if (t.includes("ユーザーと投稿")) { await s.nth(i).click(); break; }
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "/tmp/apply-before.png", fullPage: false });
  const beforeSrc = await page.locator(".cm-content").first().innerText();
  console.log("BEFORE:", beforeSrc.replace(/\s+/g, " ").slice(0, 200));
  const applyCount = await page.locator(".v4-editor-warnings-apply").count();
  console.log("APPLY BUTTON COUNT:", applyCount);
  await page.locator(".v4-editor-warnings-apply").click();
  await page.waitForTimeout(2000);
  const afterSrc = await page.locator(".cm-content").first().innerText();
  console.log("AFTER:", afterSrc.replace(/\s+/g, " ").slice(0, 200));
  await page.screenshot({ path: "/tmp/apply-after.png", fullPage: false });
});
