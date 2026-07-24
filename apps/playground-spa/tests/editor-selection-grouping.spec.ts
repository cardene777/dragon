import { test, expect } from "@playwright/test";

/**
 * Step 2-4 = multi selection / multi drag / grouping の E2E test。
 * Miro 相当 UX の core scenario を verify。
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

test("selection 1 = overlay click で単一 selection、 data-selected 付く", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const box = await overlay.boundingBox();
  if (!box) throw new Error("overlay null");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  const selectedCount = await page.locator('[data-overlay-part][data-selected="1"]').count();
  expect(selectedCount).toBe(1);
});

test("selection 2 = 背景 click で selection clear", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 400, y: 400 });
  const overlay = page.locator('[data-overlay-part]').first();
  const box = await overlay.boundingBox();
  if (!box) throw new Error("overlay null");
  // 選択
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect(await page.locator('[data-overlay-part][data-selected="1"]').count()).toBe(1);
  // 背景 click (canvas 左上端 = overlay も cdl 要素も無い場所)
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const stageBB = await stage.boundingBox();
  if (!stageBB) throw new Error("stage null");
  await page.mouse.move(stageBB.x + 30, stageBB.y + 30);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect(await page.locator('[data-overlay-part][data-selected="1"]').count()).toBe(0);
});

test("selection 3 = shift+click で 2 個 selection", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await drop(page, "parts-arc-gauge", { x: 600, y: 300 });
  const overlays = page.locator('[data-overlay-part]');
  const count = await overlays.count();
  expect(count).toBe(2);
  const b0 = await overlays.nth(0).boundingBox();
  const b1 = await overlays.nth(1).boundingBox();
  if (!b0 || !b1) throw new Error("overlay bbox null");
  // 1 個目 click
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  // 2 個目 shift+click
  await page.keyboard.down("Shift");
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await page.waitForTimeout(300);
  const selectedCount = await page.locator('[data-overlay-part][data-selected="1"]').count();
  expect(selectedCount).toBe(2);
});

test("multi-drag = 2 個 selection の 1 個を drag、 両方が同 delta で移動", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await drop(page, "parts-arc-gauge", { x: 600, y: 300 });
  const overlays = page.locator('[data-overlay-part]');
  const b0Before = await overlays.nth(0).boundingBox();
  const b1Before = await overlays.nth(1).boundingBox();
  if (!b0Before || !b1Before) throw new Error("null");
  // 1 個目 click
  await page.mouse.move(b0Before.x + b0Before.width / 2, b0Before.y + b0Before.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  // 2 個目 shift+click
  await page.keyboard.down("Shift");
  await page.mouse.move(b1Before.x + b1Before.width / 2, b1Before.y + b1Before.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await page.waitForTimeout(300);
  // 1 個目 drag (150px 右) → 2 個目も 150px shift 期待
  await page.mouse.move(b0Before.x + b0Before.width / 2, b0Before.y + b0Before.height / 2);
  await page.mouse.down();
  await page.mouse.move(b0Before.x + b0Before.width / 2 + 150, b0Before.y + b0Before.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  const b0After = await overlays.nth(0).boundingBox();
  const b1After = await overlays.nth(1).boundingBox();
  if (!b0After || !b1After) throw new Error("null after");
  const dx0 = Math.round(b0After.x - b0Before.x);
  const dx1 = Math.round(b1After.x - b1Before.x);
  console.log(`[multi-drag] p0 dx=${dx0}, p1 dx=${dx1}`);
  // 両方 同じ量 shift (10px 誤差許容)
  expect(Math.abs(dx0 - dx1)).toBeLessThan(15);
  // 実際に 150px 近く shift
  expect(Math.abs(dx0 - 150)).toBeLessThan(30);
});

test("grouping = 2 個 selection + Cmd+G で group 化、 group border 表示", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  await drop(page, "parts-arc-gauge", { x: 600, y: 300 });
  const overlays = page.locator('[data-overlay-part]');
  const b0 = await overlays.nth(0).boundingBox();
  const b1 = await overlays.nth(1).boundingBox();
  if (!b0 || !b1) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.down("Shift");
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await page.waitForTimeout(200);
  // Cmd+G で group 作成
  await page.keyboard.press("Meta+g");
  await page.waitForTimeout(300);
  const groupCount = await page.locator('[data-group]').count();
  expect(groupCount).toBe(1);
});
