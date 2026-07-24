import { test, expect } from "@playwright/test";

/**
 * Layer 4 = visual regression。 Playwright `toHaveScreenshot` で pixel diff。
 *
 * 4 baseline snapshot を初回実行時に保存、 以後 実行で pixel diff。 diff threshold 内なら pass。
 * animation は disable (animations: "disabled") で決定的比較を担保。
 *
 * snapshot:
 *   1. 初期 (achievement drop 前) editor stage 全体
 *   2. achievement drop 直後
 *   3. achievement 右 200px drag 後
 *   4. achievement SE corner drag で 1.5x resize 後
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";

test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

// visual regression では animation を止めて決定的スナップショット
test.beforeEach(async ({ page }) => {
  await page.addStyleTag({ content: "* { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }" });
});

async function openEditorStable(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
  await page.addStyleTag({ content: "* { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }" });
  await page.waitForTimeout(500);
}

test("visual 1 = 初期 editor stage", async ({ page }) => {
  await openEditorStable(page);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  await expect(stage).toHaveScreenshot("01-init.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});

test("visual 2 = achievement drop 直後", async ({ page }) => {
  await openEditorStable(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(500);
  const part = page.locator('[data-testid="editor-part-item-parts-achievement"]');
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error("stage null");
  await part.dragTo(stage, { targetPosition: { x: stageBox.width * 0.5, y: stageBox.height * 0.5 } });
  await page.waitForTimeout(1200);
  await page.mouse.move(10, 10); // hover clear
  await page.waitForTimeout(300);
  await expect(stage).toHaveScreenshot("02-drop.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});

test("visual 3 = achievement 右 200px drag 後", async ({ page }) => {
  await openEditorStable(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(500);
  const part = page.locator('[data-testid="editor-part-item-parts-achievement"]');
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error("stage null");
  await part.dragTo(stage, { targetPosition: { x: stageBox.width * 0.4, y: stageBox.height * 0.5 } });
  await page.waitForTimeout(1000);
  const overlay = page.locator('[data-overlay-part]').first();
  const box = await overlay.boundingBox();
  if (!box) throw new Error("overlay null");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  await page.mouse.move(10, 10);
  await page.waitForTimeout(300);
  await expect(stage).toHaveScreenshot("03-drag.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});

test("visual 4 = SE corner drag で 1.5x resize", async ({ page }) => {
  await openEditorStable(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(500);
  const part = page.locator('[data-testid="editor-part-item-parts-achievement"]');
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error("stage null");
  await part.dragTo(stage, { targetPosition: { x: stageBox.width * 0.5, y: stageBox.height * 0.5 } });
  await page.waitForTimeout(1000);
  const overlay = page.locator('[data-overlay-part]').first();
  const box = await overlay.boundingBox();
  if (!box) throw new Error("overlay null");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  const seHandle = page.locator('[data-overlay-handle="se"]');
  const seBox = await seHandle.boundingBox();
  if (!seBox) throw new Error("se null");
  await page.mouse.move(seBox.x + seBox.width / 2, seBox.y + seBox.height / 2);
  await page.mouse.down();
  const deltaResize = Math.round(box.width * 0.5);
  await page.mouse.move(seBox.x + seBox.width / 2 + deltaResize, seBox.y + seBox.height / 2 + deltaResize, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  await page.mouse.move(10, 10);
  await page.waitForTimeout(300);
  await expect(stage).toHaveScreenshot("04-resize.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.02,
  });
});
