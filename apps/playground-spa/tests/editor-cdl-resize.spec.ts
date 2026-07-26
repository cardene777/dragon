import { test, expect } from "@playwright/test";

/**
 * cdl 要素 (Client / API / DB header、 arrow label) の選択 UI 実測。
 *
 * 2026-07-26 CAR-2158 consistency fix = 現行 spec に追従。
 * Phase 1 (eb7b9be) で hover UI から handle 削除、 Phase 4 revert (4523bf9) で cdl の実 drag/resize を
 * 撤去 (cdl actor の header/spacer/footer 複合構造で分裂する root cause、 CAR-2156 で core 再設計待ち)。
 *
 * 現行 spec:
 *   - hover = 薄 blue dashed border のみ (handle なし)
 *   - click 選択 = 濃 dashed border + 4 隅 handle (`[data-cdl-handle]`、 pointerEvents: none = 表示のみ)
 *   - 実 drag/resize は overlay parts のみ対応、 cdl 要素は CAR-2156 完了後に復元
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

async function selectCdlNode(page: import("@playwright/test").Page, nodeId: string): Promise<{ x: number; y: number; width: number; height: number }> {
  const node = page.locator(`[data-cdl-node="${nodeId}"]`).first();
  const bb = await node.boundingBox();
  if (!bb) throw new Error(`${nodeId} null`);
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(400);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
  return bb;
}

test("selection 1 = Client lane header click 選択で 4 隅 handle 表示 (実 resize は CAR-2156 待ち)", async ({ page }) => {
  await openEditor(page);
  await selectCdlNode(page, "client-header");
  // 選択 UI = outline 1 + handle 4
  const outlineCount = await page.locator('[data-cdl-outline]').count();
  const handleCount = await page.locator('[data-cdl-handle]').count();
  expect(outlineCount).toBe(1);
  expect(handleCount).toBe(4);
  // 4 隅 handle の corner 属性が全て揃う
  for (const corner of ["nw", "ne", "sw", "se"]) {
    expect(await page.locator(`[data-cdl-handle="${corner}"]`).count()).toBe(1);
  }
});

test("selection 2 = 選択枠が Client 単独 bbox に追従 (SVG 全体を囲わない)", async ({ page }) => {
  await openEditor(page);
  const nodeBB = await selectCdlNode(page, "client-header");
  const outline = page.locator('[data-cdl-outline]').first();
  const outlineBB = await outline.boundingBox();
  if (!outlineBB) throw new Error("outline null");
  // 選択枠が対象 node の bbox に近い (誤差 25px 以内 = rAF measure lag 許容)
  expect(Math.abs(outlineBB.x - nodeBB.x)).toBeLessThan(25);
  expect(Math.abs(outlineBB.y - nodeBB.y)).toBeLessThan(25);
  expect(Math.abs(outlineBB.width - nodeBB.width)).toBeLessThan(25);
});

test("selection 3 = arrow label hover で 薄 border、 click で 4 隅 handle", async ({ page }) => {
  await openEditor(page);
  const labels = await page.locator('.v4-editor-preview svg text').evaluateAll((els) =>
    els.map((el) => ({ content: (el.textContent ?? "").slice(0, 20), r: el.getBoundingClientRect() })).filter((l) => l.content.includes("ログイン")),
  );
  if (labels.length === 0) throw new Error("ログイン要求 label not found");
  const l = labels[0]!;
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);
  // hover = 薄 border indicator (handle なし)
  await page.mouse.move(l.r.x + l.r.width / 2, l.r.y + l.r.height / 2);
  await page.waitForTimeout(400);
  expect(await page.locator('div[style*="dashed"]').count()).toBeGreaterThanOrEqual(1);
  expect(await page.locator('[data-cdl-handle]').count()).toBe(0);
  // click 選択 = 4 隅 handle 表示
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await page.locator('[data-cdl-handle]').count()).toBe(4);
});
