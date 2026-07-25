import { test, expect } from "@playwright/test";

/**
 * Step 6-9 = Miro 相当 UX (rubber band / keyboard / group drag / snap) の E2E test。
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

async function drop(page: import("@playwright/test").Page, partId: string, position: { x: number; y: number }): Promise<void> {
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  await page.locator(`[data-testid="editor-part-item-${partId}"]`).dragTo(stage, { targetPosition: position });
  await page.waitForTimeout(1000);
}

test("rubber band = 背景 drag で area 内 全 overlay 選択", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await drop(page, "parts-arc-gauge", { x: 500, y: 300 });
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const stageBB = await stage.boundingBox();
  if (!stageBB) throw new Error("stage null");
  // 背景左上端から overlay 両方を含む 右下まで drag
  await page.mouse.move(stageBB.x + 10, stageBB.y + 10);
  await page.mouse.down();
  await page.mouse.move(stageBB.x + stageBB.width - 10, stageBB.y + stageBB.height - 10, { steps: 15 });
  // drag 中 rubber band 表示
  const rubberBandVisible = await page.locator('[data-rubber-band="1"]').count();
  expect(rubberBandVisible).toBeGreaterThan(0);
  await page.mouse.up();
  await page.waitForTimeout(300);
  // 両 overlay が selected
  const selected = await page.locator('[data-overlay-part][data-selected="1"]').count();
  expect(selected).toBeGreaterThanOrEqual(2);
});

test("keyboard Escape = selection clear", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const box = await overlay.boundingBox();
  if (!box) throw new Error("null");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await page.locator('[data-overlay-part][data-selected="1"]').count()).toBe(1);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  expect(await page.locator('[data-overlay-part][data-selected="1"]').count()).toBe(0);
});

test("keyboard Cmd+A = 全 overlay select", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await drop(page, "parts-arc-gauge", { x: 500, y: 300 });
  await page.keyboard.press("Meta+a");
  await page.waitForTimeout(200);
  expect(await page.locator('[data-overlay-part][data-selected="1"]').count()).toBe(2);
});

test("keyboard 矢印 = 1px nudge (shift で 10px)", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const b0 = await overlay.boundingBox();
  if (!b0) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(300);
  const b1 = await overlay.boundingBox();
  if (!b1) throw new Error("null");
  const dx = Math.round(b1.x - b0.x);
  expect(dx).toBeGreaterThan(15);
});

test("keyboard Delete = selection 削除", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  expect(await page.locator('[data-overlay-part]').count()).toBe(1);
  const overlay = page.locator('[data-overlay-part]').first();
  const b = await overlay.boundingBox();
  if (!b) throw new Error("null");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(200);
  await page.keyboard.press("Delete");
  await page.waitForTimeout(500);
  expect(await page.locator('[data-overlay-part]').count()).toBe(0);
});

test("snap to grid = drag 後 posX が 20px 倍数に揃う", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const b0 = await overlay.boundingBox();
  if (!b0) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.move(b0.x + b0.width / 2 + 137, b0.y + b0.height / 2, { steps: 10 }); // 半端な 137px
  await page.mouse.up();
  await page.waitForTimeout(600);
  // DSL 側 posX が 20 倍数に snap されているか確認
  const dsl = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  const posXMatch = dsl.match(/achievement1:.*?posX:\s*(-?\d+)/);
  if (posXMatch) {
    const posX = parseInt(posXMatch[1]!, 10);
    console.log(`[snap] achievement1 posX = ${posX}, mod 20 = ${posX % 20}`);
    expect(posX % 20).toBe(0);
  }
});
