import { test } from "@playwright/test";

/**
 * AI debug spec = 「該当の場所に落ちない + 決まった軌道で動く」 の root cause 実測。
 * drag 中の mouse client 座標と lane element bounding box を step 毎に取得、 mismatch を print。
 */
const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://127.0.0.1:5173";

test.use({ baseURL: BASE_URL });

test("debug drag trajectory: mouse 位置 vs lane bbox の diff step 毎に測定", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const clientLane = page.locator('[data-cdl-lane="client"]').first();
  const before = await clientLane.boundingBox();
  if (!before) throw new Error("client lane bbox null");
  const startX = before.x + before.width / 2;
  const startY = before.y + before.height / 2;
  console.log(`[DEBUG] start mouse=(${startX.toFixed(1)}, ${startY.toFixed(1)}), lane center=(${(before.x + before.width / 2).toFixed(1)}, ${(before.y + before.height / 2).toFixed(1)})`);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // 斜め 45 度 に 300px 動かす (水平/垂直両方 verify)
  for (let step = 1; step <= 15; step++) {
    const dx = step * 20;
    const dy = step * 15;
    await page.mouse.move(startX + dx, startY + dy, { steps: 2 });
    await page.waitForTimeout(30);
    const bb = await clientLane.boundingBox();
    if (bb) {
      const laneCenterX = bb.x + bb.width / 2;
      const laneCenterY = bb.y + bb.height / 2;
      const mouseX = startX + dx;
      const mouseY = startY + dy;
      const diffX = laneCenterX - mouseX;
      const diffY = laneCenterY - mouseY;
      console.log(`[DEBUG] step ${step}: mouse=(${mouseX.toFixed(1)}, ${mouseY.toFixed(1)}), lane center=(${laneCenterX.toFixed(1)}, ${laneCenterY.toFixed(1)}), diff=(${diffX.toFixed(1)}, ${diffY.toFixed(1)})`);
    }
  }
  await page.mouse.up();
  await page.waitForTimeout(500);

  const after = await clientLane.boundingBox();
  if (after) {
    const finalCenterX = after.x + after.width / 2;
    const finalCenterY = after.y + after.height / 2;
    const finalMouseX = startX + 15 * 20;
    const finalMouseY = startY + 15 * 15;
    console.log(`[DEBUG] FINAL: mouse=(${finalMouseX.toFixed(1)}, ${finalMouseY.toFixed(1)}), lane center=(${finalCenterX.toFixed(1)}, ${finalCenterY.toFixed(1)}), diff=(${(finalCenterX - finalMouseX).toFixed(1)}, ${(finalCenterY - finalMouseY).toFixed(1)})`);
    console.log(`[DEBUG] lane shift dx=${(finalCenterX - (before.x + before.width / 2)).toFixed(1)}, dy=${(finalCenterY - (before.y + before.height / 2)).toFixed(1)} (期待 dx=300, dy=225)`);
  }
});
