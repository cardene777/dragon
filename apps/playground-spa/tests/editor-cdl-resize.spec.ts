import { test, expect } from "@playwright/test";

/**
 * cdl 要素 (Client / API / DB header、 arrow label) の corner drag resize 実測。
 * user 「全てのパーツや要素のサイズ変更や選択ができるように」 の実装 verify。
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

async function hoverAndGetCorner(page: import("@playwright/test").Page, targetLocator: string, corner: "nw" | "ne" | "sw" | "se"): Promise<{ x: number; y: number } | null> {
  const target = page.locator(targetLocator).first();
  const bb = await target.boundingBox();
  if (!bb) return null;
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(400);
  // hover 4 隅 handle は fixed 位置に描画 (pointer-events: none だが座標算出用)
  const handleBB = await page.locator(`[data-corner="${corner}"]`).first().boundingBox();
  if (!handleBB) return null;
  return { x: handleBB.x + handleBB.width / 2, y: handleBB.y + handleBB.height / 2 };
}

test("resize 1 = Client lane header の SE corner drag でサイズ変わる", async ({ page }) => {
  await openEditor(page);
  const target = '[data-cdl-node="client-header"]';
  const bb0 = await page.locator(target).first().boundingBox();
  if (!bb0) throw new Error("client-header null");
  const seCorner = await hoverAndGetCorner(page, target, "se");
  if (!seCorner) throw new Error("se corner null");
  await page.mouse.move(seCorner.x, seCorner.y);
  await page.mouse.down();
  await page.mouse.move(seCorner.x + 80, seCorner.y + 80, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  const bb1 = await page.locator(target).first().boundingBox();
  if (!bb1) throw new Error("bb1 null");
  // 拡大されていれば OK
  console.log(`[SE drag] Client bbox: ${bb0.width}x${bb0.height} → ${bb1.width}x${bb1.height}`);
  expect(bb1.width).toBeGreaterThan(bb0.width + 20);
});

test("resize 2 = arrow label hover で 選択枠表示 (resize 本体は cdl spec 拡張後の別 issue)", async ({ page }) => {
  await openEditor(page);
  const labels = await page.locator('.v4-editor-preview svg text').evaluateAll((els) =>
    els.map((el) => ({ content: (el.textContent ?? "").slice(0, 20), r: el.getBoundingClientRect() })).filter((l) => l.content.includes("ログイン")),
  );
  if (labels.length === 0) throw new Error("ログイン要求 label not found");
  const l = labels[0]!;
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);
  await page.mouse.move(l.r.x + l.r.width / 2, l.r.y + l.r.height / 2);
  await page.waitForTimeout(400);
  // hover 発火 = 4 隅 handle 表示までは 実装済 (Task #79 で fix)
  const cornerCount = await page.locator('[data-corner]').count();
  expect(cornerCount).toBe(4);
  // 実 resize (corner drag で label 幅変更) は cdl 側 spec に label.fontSize / label.scale field
  // を追加する後続 issue で対応。 現状は hover 選択枠表示のみが期待挙動。
});
