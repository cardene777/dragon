import { test, expect } from "@playwright/test";

/**
 * user 指摘 Task #79 = cdl SVG 内要素 (Client / API / DB / arrow / label) の個別選択 UX を実測。
 *
 * user 苦情「1つずつをパーツとしても扱って」「シーケンス図全体で囲うのではなく」 の再現条件検証。
 *
 * 2026-07-26 CAR-2158 consistency fix = 現行 spec に合わせて更新。
 * Phase 1 (eb7b9be) で hover UI から 4 隅 handle を削除 (Miro/Figma 相当の 薄 border indicator のみ)、
 * handle は click 選択時のみ表示する spec に変更した。 本 spec の期待値もそれに追従する。
 *
 * 現行 spec:
 *   - hover = 薄 blue dashed border のみ (`[data-cdl-hover-outline]`)、 handle なし
 *   - click 選択 = 濃 dashed border + 4 隅 handle (`[data-cdl-handle]`)
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";

test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

test("cdl 要素 1 = Client lane header hover で 薄 border、 click 選択で 4 隅 handle", async ({ page }) => {
  await openEditor(page);
  const clientNode = page.locator('[data-cdl-node="client-header"]').first();
  const bb = await clientNode.boundingBox();
  if (!bb) throw new Error("client-header null");
  await page.mouse.move(50, 50); // hover reset
  await page.waitForTimeout(300);
  // hover 前 = 選択 UI なし
  expect(await page.locator('[data-cdl-handle]').count()).toBe(0);
  // hover = 薄 border indicator のみ (handle なし)
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(400);
  // semantic hook で hover outline を特定 (inline style の substring 検索は対象非限定で誤検出する)
  expect(await page.locator('[data-cdl-hover-outline]').count()).toBe(1);
  expect(await page.locator('[data-cdl-handle]').count()).toBe(0);
  // click 選択 = 4 隅 handle 表示
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await page.locator('[data-cdl-handle]').count()).toBe(4);
});

test("cdl 要素 2 = 選択枠が Client 単独範囲 (SVG 全体を囲わない)", async ({ page }) => {
  await openEditor(page);
  const clientNode = page.locator('[data-cdl-node="client-header"]').first();
  const bb = await clientNode.boundingBox();
  if (!bb) throw new Error("client-header null");
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(400);
  // 選択枠 (点線 border div) の bbox を測定
  const outline = page.locator('[data-cdl-hover-outline]').first();
  const outlineBB = await outline.boundingBox();
  if (!outlineBB) throw new Error("outline null");
  const svg = await page.locator('.v4-editor-preview svg').boundingBox();
  if (!svg) throw new Error("svg null");
  // 選択枠が SVG 全体の 20% 以内 (= Client 単独範囲、 全体を囲うのでない)
  const outlineArea = outlineBB.width * outlineBB.height;
  const svgArea = svg.width * svg.height;
  const ratio = outlineArea / svgArea;
  expect(ratio).toBeLessThan(0.2);
});

test("cdl 要素 3 = arrow label (ログイン要求) hover で label だけ 選択枠", async ({ page }) => {
  await openEditor(page);
  // arrow label text を探す
  const labels = await page.locator('.v4-editor-preview svg text').evaluateAll((els) =>
    els.map((el) => ({
      content: el.textContent ?? "",
      x: el.getBoundingClientRect().x,
      y: el.getBoundingClientRect().y,
      w: el.getBoundingClientRect().width,
      h: el.getBoundingClientRect().height,
    })),
  );
  const loginLabel = labels.find((l) => l.content.includes("ログイン要求"));
  if (!loginLabel) throw new Error("ログイン要求 label が SVG に存在しない");
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);
  await page.mouse.move(loginLabel.x + loginLabel.w / 2, loginLabel.y + loginLabel.h / 2);
  await page.waitForTimeout(400);
  // hover = 薄 border indicator (handle は click 選択時のみ、 CAR-2158 で spec 更新)
  expect(await page.locator('[data-cdl-hover-outline]').count()).toBe(1);
  // 選択枠が label 単独 (edge path 全体を囲わない = width < 300px)
  const outline = page.locator('[data-cdl-hover-outline]').first();
  const outlineBB = await outline.boundingBox();
  if (!outlineBB) throw new Error("outline null");
  expect(outlineBB.width).toBeLessThan(300);
  // click 選択で 4 隅 handle 表示
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await page.locator('[data-cdl-handle]').count()).toBe(4);
});

test("cdl 要素 4 = 各 lane header (Client / API / DB) が独立選択可能", async ({ page }) => {
  await openEditor(page);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error("stage null");
  // stage 内の確実な空白座標 (右下寄り = 図の描画領域外)。
  // 2026-07-26 CAR-2158 fix = 旧 test は (50,50) を背景 click に使っていたが、 viewport 1920 では
  // 260px sidebar 内で stage の handler に届かず、 背景 clear が実行されていなかった。
  const emptyX = stageBox.x + stageBox.width - 40;
  const emptyY = stageBox.y + stageBox.height - 40;

  for (const nodeId of ["client-header", "api-header", "db-header"]) {
    const node = page.locator(`[data-cdl-node="${nodeId}"]`).first();
    const bb = await node.boundingBox();
    if (!bb) throw new Error(`${nodeId} null`);
    // 背景 click で selection clear + clear されたことを検証 (旧 test は clear 未検証で偽陽性だった)
    await page.mouse.move(emptyX, emptyY);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(400);
    expect(await page.locator('[data-cdl-handle]').count(), `${nodeId} 前の背景 click で clear`).toBe(0);
    expect(await page.locator('[data-cdl-outline]').count(), `${nodeId} 前の背景 click で outline も clear`).toBe(0);
    // hover → click 選択 = 4 隅 handle 表示 (CAR-2158 で spec 更新、 hover は border のみ)
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(400);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(400);
    expect(await page.locator('[data-cdl-handle]').count(), `${nodeId} で 4 隅 handle 表示`).toBe(4);
    // 選択枠が当該 node の bbox に対応している (別 node の枠が残っていない)
    const outlineBB = await page.locator('[data-cdl-outline]').first().boundingBox();
    if (!outlineBB) throw new Error("outline null");
    expect(Math.abs(outlineBB.x - bb.x), `${nodeId} の outline が node に対応`).toBeLessThan(5);
    expect(Math.abs(outlineBB.y - bb.y)).toBeLessThan(5);
  }
});
