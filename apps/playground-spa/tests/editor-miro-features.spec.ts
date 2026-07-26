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

test("keyboard 矢印 nudge = DSL に永続化される (CAR-2158 correctness fix)", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const b0 = await overlay.boundingBox();
  if (!b0) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  const dslBefore = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  const posXBefore = parseInt(dslBefore.match(/posX:\s*(-?\d+)/)?.[1] ?? "0", 10);
  // shift+右 5 回 = world 50px 相当の移動
  for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(500);
  const dslAfter = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  const posXAfter = parseInt(dslAfter.match(/posX:\s*(-?\d+)/)?.[1] ?? "0", 10);
  console.log(`[nudge persist] posX: ${posXBefore} → ${posXAfter}`);
  // DSL の posX が nudge 分だけ増えている = state だけでなく DSL にも書き出された
  expect(posXAfter).toBeGreaterThan(posXBefore + 40);
});

test("keyboard 矢印 nudge = キーリピート連打でも全押下が積算される (CAR-2158 race detector)", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const b0 = await overlay.boundingBox();
  if (!b0) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  const dslBefore = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  const posXBefore = parseInt(dslBefore.match(/posX:\s*(-?\d+)/)?.[1] ?? "0", 10);

  // await を挟まず連続 dispatch = キーリピート相当。 sequential await だと 1 押下ごとに commit が
  // 挟まるため、 base を stale に読む bug (5 連打で 10px しか進まない) を検出できない。
  await page.evaluate(() => {
    for (let i = 0; i < 5; i += 1) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }));
    }
  });
  await page.waitForTimeout(700);

  const dslAfter = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  const posXAfter = parseInt(dslAfter.match(/posX:\s*(-?\d+)/)?.[1] ?? "0", 10);
  console.log(`[nudge burst] posX: ${posXBefore} -> ${posXAfter} (delta ${posXAfter - posXBefore})`);
  // shift+右 5 回 = 50px。 stale base だと 10px にしかならない
  expect(posXAfter - posXBefore).toBe(50);
});

test("nudge → drag → nudge = 巻き戻らない (CAR-2158 Round 3 detector)", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 300, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const b0 = await overlay.boundingBox();
  if (!b0) throw new Error("null");
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);

  const readPosX = async (): Promise<number> => {
    const dsl = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
    return parseInt(dsl.match(/posX:\s*(-?\d+)/)?.[1] ?? "0", 10);
  };

  // 1) nudge で右に動かす
  for (let i = 0; i < 3; i += 1) await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(500);
  const afterNudge1 = await readPosX();

  // 2) overlay 本体を drag (stopPropagation する経路 = stage の mousedown に届かない)
  const b1 = await overlay.boundingBox();
  if (!b1) throw new Error("null");
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
  await page.mouse.down();
  await page.mouse.move(b1.x + b1.width / 2 + 200, b1.y + b1.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  const afterDrag = await readPosX();
  expect(afterDrag).toBeGreaterThan(afterNudge1); // drag が効いている

  // 3) 再度 nudge = drag 後の位置から進むべき (古い base に巻き戻ってはいけない)
  for (let i = 0; i < 2; i += 1) await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(500);
  const afterNudge2 = await readPosX();
  console.log(`[nudge-drag-nudge] ${afterNudge1} -> drag ${afterDrag} -> nudge ${afterNudge2}`);
  // drag 後の位置 + 20px が期待値。 base が stale だと drag 分を失って巻き戻る
  expect(afterNudge2).toBe(afterDrag + 20);
});

test("Cmd+D duplicate = rotate / bg を引き継ぐ (CAR-2158 correctness fix)", async ({ page }) => {
  await openEditor(page);
  await drop(page, "parts-achievement", { x: 400, y: 300 });
  const overlay = page.locator('[data-overlay-part]').first();
  const b = await overlay.boundingBox();
  if (!b) throw new Error("null");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  // 色変更 (bg 付与)
  await page.locator('[data-overlay-toolbar-btn="color"]').first().click();
  await page.waitForTimeout(200);
  await page.locator('[data-overlay-color-swatch="#8b5cf6"]').click();
  await page.waitForTimeout(500);
  // 回転を付ける (Alt + corner drag) = rotate 継承も検証対象にする
  const seHandle = page.locator('[data-overlay-handle="se"]').first();
  const seBB = await seHandle.boundingBox();
  if (!seBB) throw new Error("se handle null");
  await page.keyboard.down("Alt");
  await page.mouse.move(seBB.x + seBB.width / 2, seBB.y + seBB.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 - 80, b.y + b.height / 2 + 80, { steps: 12 });
  await page.mouse.up();
  await page.keyboard.up("Alt");
  await page.waitForTimeout(600);
  // 再選択して Cmd+D
  const b2 = await page.locator('[data-overlay-part]').first().boundingBox();
  if (!b2) throw new Error("null");
  await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  await page.keyboard.press("Meta+d");
  await page.waitForTimeout(600);
  const dsl = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  // bg が 2 箇所 (original + duplicate) に存在 = 複製で色が引き継がれた
  const bgCount = (dsl.match(/bg:\s*"#8b5cf6"/g) ?? []).length;
  // rotate も 2 箇所に存在 = 回転が引き継がれた (旧実装は rotate を捨てていた)
  const rotateCount = (dsl.match(/rotate:\s*-?\d/g) ?? []).length;
  console.log(`[duplicate] bg 出現数 = ${bgCount}, rotate 出現数 = ${rotateCount}`);
  expect(bgCount).toBe(2);
  expect(rotateCount).toBe(2);
  expect(await page.locator('[data-overlay-part]').count()).toBe(2);
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
