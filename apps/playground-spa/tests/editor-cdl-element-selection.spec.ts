import { test, expect } from "@playwright/test";

/**
 * user 指摘 Task #79 = cdl SVG 内要素 (Client / API / DB / arrow / label) の個別選択 UX を実測。
 *
 * user 苦情「1つずつをパーツとしても扱って」「シーケンス図全体で囲うのではなく」 の再現条件検証。
 * 想定 = hover / click で個別要素の周りに tight 選択枠 (点線 border + 4 隅 handle) 表示。
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";

test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

test("cdl 要素 1 = Client lane header 上 hover で 選択枠 (4 隅 handle) 表示", async ({ page }) => {
  await openEditor(page);
  const clientNode = page.locator('[data-cdl-node="client-header"]').first();
  const bb = await clientNode.boundingBox();
  if (!bb) throw new Error("client-header null");
  await page.mouse.move(50, 50); // hover reset
  await page.waitForTimeout(300);
  const before = await page.locator('[data-corner]').count();
  expect(before).toBe(0);
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(400);
  const after = await page.locator('[data-corner]').count();
  expect(after).toBe(4);
});

test("cdl 要素 2 = 選択枠が Client 単独範囲 (SVG 全体を囲わない)", async ({ page }) => {
  await openEditor(page);
  const clientNode = page.locator('[data-cdl-node="client-header"]').first();
  const bb = await clientNode.boundingBox();
  if (!bb) throw new Error("client-header null");
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(400);
  // 選択枠 (点線 border div) の bbox を測定
  const outline = page.locator('div[style*="dashed"]').first();
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
  const handleCount = await page.locator('[data-corner]').count();
  expect(handleCount).toBe(4);
  // 選択枠が label 単独 (edge path 全体を囲わない = width < 300px)
  const outline = page.locator('div[style*="dashed"]').first();
  const outlineBB = await outline.boundingBox();
  if (!outlineBB) throw new Error("outline null");
  expect(outlineBB.width).toBeLessThan(300);
});

test("cdl 要素 4 = 各 lane header (Client / API / DB) が独立選択可能", async ({ page }) => {
  await openEditor(page);
  for (const nodeId of ["client-header", "api-header", "db-header"]) {
    const node = page.locator(`[data-cdl-node="${nodeId}"]`).first();
    const bb = await node.boundingBox();
    if (!bb) throw new Error(`${nodeId} null`);
    await page.mouse.move(50, 50);
    await page.waitForTimeout(300);
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(400);
    const count = await page.locator('[data-corner]').count();
    expect(count, `${nodeId} で 4 隅 handle 表示`).toBe(4);
  }
});
