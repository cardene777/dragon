import { test, expect } from "@playwright/test";

/**
 * Phase 2-3 = cdl 要素 selection (stage-level UI) + double click text 編集。
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

test("cdl selection 1 = client-header cdl node click で selection UI (border + handle) 表示", async ({ page }) => {
  await openEditor(page);
  const clientNode = page.locator('[data-cdl-node="client-header"]').first();
  const bbox = await clientNode.boundingBox();
  if (!bbox) throw new Error("client-header node null");
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  // hover 確立 = handleMouseMove で hoveredHandle が set される
  await page.mouse.move(cx - 10, cy - 10);
  await page.waitForTimeout(200);
  await page.mouse.move(cx, cy);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(500);
  const outlineCount = await page.locator('[data-cdl-outline]').count();
  const handleCount = await page.locator('[data-cdl-handle]').count();
  expect(outlineCount).toBeGreaterThanOrEqual(1);
  // 4 隅 handle は CAR-2292 で削除。 図の要素は個別に拡大できない (拡大は図全体の倍率で
  // のみ行う) ので、 掴める形の handle を出すと「引っ張れば大きくなる」 と読める
  expect(handleCount).toBe(0);
});

test("text edit 1 = SVG text の double click で input 表示", async ({ page }) => {
  await openEditor(page);
  // 1 つ目の SVG text (actor label 等) を狙う
  // stage 内の実際に見えている text 要素を取得
  const target = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="editor-preview-stage"]');
    if (!stage) return null;
    const texts = stage.querySelectorAll('svg text');
    for (const t of Array.from(texts)) {
      const r = t.getBoundingClientRect();
      if (r.width > 5 && r.height > 5) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: (t.textContent ?? "").trim() };
      }
    }
    return null;
  });
  if (!target) throw new Error("no visible svg text");
  const bbox = { x: target.x - 5, y: target.y - 5, width: 10, height: 10 };
  await page.mouse.dblclick(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
  await page.waitForTimeout(400);
  const input = page.locator('[data-testid="editor-text-edit-input"]');
  expect(await input.count()).toBe(1);
});

async function _selectCdlNode(page: import("@playwright/test").Page, nodeId: string): Promise<{ x: number; y: number; width: number; height: number }> {
  const node = page.locator(`[data-cdl-node="${nodeId}"]`).first();
  const bbox = await node.boundingBox();
  if (!bbox) throw new Error(`${nodeId} null`);
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  await page.mouse.move(cx - 10, cy - 10);
  await page.waitForTimeout(200);
  await page.mouse.move(cx, cy);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(500);
  return bbox;
}

// NOTE: Phase 4 cdl drag / resize test は revert (cdl core の header/spacer/footer 複合構造で分裂 bug)。
// selection UI は表示 keep = user が「何が選ばれているか」 確認可能、 実 drag/resize は overlay parts のみ現時点で対応。
// cdl drag/resize は cdl core の layout 経路 (packages/cdl/src/layout/) の再設計が別 issue で必要。

test("text edit 2 = Escape で input close (DSL 変化なし)", async ({ page }) => {
  await openEditor(page);
  const dslBefore = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  // stage 内の実際に見えている text 要素を取得
  const target = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="editor-preview-stage"]');
    if (!stage) return null;
    const texts = stage.querySelectorAll('svg text');
    for (const t of Array.from(texts)) {
      const r = t.getBoundingClientRect();
      if (r.width > 5 && r.height > 5) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: (t.textContent ?? "").trim() };
      }
    }
    return null;
  });
  if (!target) throw new Error("no visible svg text");
  const bbox = { x: target.x - 5, y: target.y - 5, width: 10, height: 10 };
  await page.mouse.dblclick(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
  await page.waitForTimeout(400);
  const input = page.locator('[data-testid="editor-text-edit-input"]');
  await input.press("Escape");
  await page.waitForTimeout(300);
  const inputAfter = await page.locator('[data-testid="editor-text-edit-input"]').count();
  expect(inputAfter).toBe(0);
  const dslAfter = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  expect(dslAfter).toBe(dslBefore);
});
