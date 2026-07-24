import { test, expect } from "@playwright/test";

/**
 * AI 自身が verify する spec (Task #65、 user 依頼「confirm もできないのに渡すな」 対応)。
 *
 * 検証項目 (全 pass を条件に user に渡す):
 * 1. /editor で SVG cdl 経路が default (html-canvas-viewport が **不在**、 CdlDiagramView の SVG が visible)
 * 2. ログイン API sample が初期表示、 lane 3 個 (Client / API / DB) の [data-cdl-lane] element が render
 * 3. edge path.d を初回取得
 * 4. Client lane を 200px 右へ drag、 CSS transform で lane 位置が移動 (drop 位置に留まる)
 * 5. drop 後の edge path.d が初回と完全一致 = arrow 静止 (Miro-like 挙動、 user 意図)
 * 6. 他 lane (API / DB) の CSS transform 位置が drag 前後で不変 (自動調整 off)
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://127.0.0.1:5173";

test.use({ baseURL: BASE_URL });

test("SVG cdl default + drag → arrow 静止 + lane 留まる + 他 lane 不動", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");

  // 1. SVG cdl 経路 default verify (html-canvas-viewport が不在)
  await expect(page.locator(".html-canvas-viewport")).toHaveCount(0);
  const cdlSvg = page.locator(".v4-editor-stage svg").first();
  await expect(cdlSvg).toBeVisible({ timeout: 10000 });

  // viewport が完全 settle するまで待機 (cdl は viewport size 依存で layout するため
  // initial fit + re-fit の 2 pass 完了を確保、 network idle 直後は不完全)
  await page.waitForTimeout(2000);

  // 2. lane 3 個 verify (Client / API / DB)
  const lanes = page.locator("[data-cdl-lane]");
  await expect(lanes.first()).toBeVisible();
  const laneCount = await lanes.count();
  expect(laneCount).toBeGreaterThanOrEqual(3);

  // 3. edge path.d を初回取得 (data-cdl-edge attribute で edge を絞込)
  const edgePaths = page.locator("[data-cdl-edge] path[d]");
  const initialEdgeCount = await edgePaths.count();
  expect(initialEdgeCount).toBeGreaterThan(0);
  const initialDs = await edgePaths.evaluateAll((els) => els.map((el) => el.getAttribute("d")));

  // 他 lane の初回 transform を取得 (drag 前後で不変を assert)
  const initialLaneTransforms = await lanes.evaluateAll((els) =>
    els.map((el) => ({
      slug: el.getAttribute("data-cdl-lane"),
      transform: (el as SVGGraphicsElement).style.transform || (el as SVGGraphicsElement).getAttribute("transform") || "",
    })),
  );

  // 4. Client lane を 200px 右へ drag
  // Client lane 特定 = data-cdl-lane="client" (slugify で lowercase)
  const clientLane = page.locator('[data-cdl-lane="client"]').first();
  await expect(clientLane).toBeVisible();
  const beforeBox = await clientLane.boundingBox();
  if (!beforeBox) throw new Error("Client lane boundingBox null");

  // debug = drag 前の CodeMirror src length を取得
  const cmSrcBefore = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  console.log(`[DEBUG] cm-src before drag length=${cmSrcBefore.length}, sample=${cmSrcBefore.slice(0, 80)}`);
  console.log(`[DEBUG] initial edge d[0]=${initialDs[0]}`);

  await page.mouse.move(beforeBox.x + beforeBox.width / 2, beforeBox.y + beforeBox.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(beforeBox.x + beforeBox.width / 2 + i * 20, beforeBox.y + beforeBox.height / 2, { steps: 2 });
  }
  await page.mouse.up();
  await page.waitForTimeout(500);

  const cmSrcAfter = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  console.log(`[DEBUG] cm-src after drag length=${cmSrcAfter.length}, changed=${cmSrcBefore !== cmSrcAfter}`);
  const debugAfterDs = await edgePaths.evaluateAll((els) => els.map((el) => el.getAttribute("d")));
  console.log(`[DEBUG] after edge d[0]=${debugAfterDs[0]}`);

  // Client lane の drop 後位置 verify (100px+ 右へ移動していれば OK、 SVG world 座標 → screen px scale あり)
  const afterBox = await clientLane.boundingBox();
  if (!afterBox) throw new Error("Client lane afterBox null");
  const shift = afterBox.x - beforeBox.x;
  expect(shift).toBeGreaterThan(50); // drag 200px screen、 SVG scale で減衰、 最低 50px は動いてほしい

  // 5. edge path.d が drop 後も不変 = arrow 静止 verify
  const afterDs = await edgePaths.evaluateAll((els) => els.map((el) => el.getAttribute("d")));
  expect(afterDs.length).toBe(initialDs.length);
  for (let i = 0; i < initialDs.length; i++) {
    expect(afterDs[i]).toBe(initialDs[i]);
  }

  // 6. 他 lane の transform が drag 前後で不変 (自動調整 off = 他 lane も動かない)
  const afterLaneTransforms = await lanes.evaluateAll((els) =>
    els.map((el) => ({
      slug: el.getAttribute("data-cdl-lane"),
      transform: (el as SVGGraphicsElement).style.transform || (el as SVGGraphicsElement).getAttribute("transform") || "",
    })),
  );
  expect(afterLaneTransforms.length).toBe(initialLaneTransforms.length);
  for (let i = 0; i < initialLaneTransforms.length; i++) {
    const initial = initialLaneTransforms[i]!;
    const after = afterLaneTransforms[i]!;
    if (initial.slug === "client") continue; // drag 対象 lane は変化する = skip
    expect(after.transform).toBe(initial.transform);
  }
});
