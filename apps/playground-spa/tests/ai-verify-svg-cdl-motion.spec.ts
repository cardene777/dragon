import { test, expect } from "@playwright/test";

/**
 * AI verify motion spec = drag 挙動を video 録画で目視確認 (Task #65)。
 * user 報告「マウスと関係ないところに飛ぶ」 の実挙動を Playwright motion project (video on) で record。
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://127.0.0.1:5173";

test.use({ baseURL: BASE_URL, video: { mode: "on", size: { width: 1280, height: 720 } }, viewport: { width: 1280, height: 720 } });

test("motion record = Client lane を斜め drag、 video で目視 verify", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const clientLane = page.locator('[data-cdl-lane="client"]').first();
  await expect(clientLane).toBeVisible();
  const bb = await clientLane.boundingBox();
  if (!bb) throw new Error("client lane bbox null");

  // lane 中心を掴んで斜め 45 度に 400px ゆっくり drag
  const startX = bb.x + bb.width / 2;
  const startY = bb.y + bb.height / 2;
  await page.mouse.move(startX, startY);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.waitForTimeout(300);
  for (let step = 1; step <= 20; step++) {
    await page.mouse.move(startX + step * 20, startY + step * 15, { steps: 3 });
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(500);
  await page.mouse.up();
  await page.waitForTimeout(1500);
});
