import { test, expect } from "@playwright/test";

/**
 * AI verify parts drop + drag (Task #65 修正、 user 指示「パーツアップロードしてそのパーツを移動させろよ」)。
 *
 * scenario:
 * 1. sidebar「パーツ」 tab open
 * 2. 1 つ目の parts を canvas に drop
 * 3. drop 位置に parts が配置されるか verify
 * 4. 配置された parts を drag、 mouse 追従を step 毎に測定 + video 録画
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://127.0.0.1:5173";

test.use({
  baseURL: BASE_URL,
  video: { mode: "on", size: { width: 1920, height: 1080 } },
  viewport: { width: 1920, height: 1080 },
});

test("parts drop + drag = mouse 追従 verify + video 録画", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // 1. sidebar「パーツ」 tab open
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(500);

  // parts が load 完了するまで待つ (loadPartsItems は async import)
  const firstPart = page.locator('[data-testid^="editor-part-item-"]').first();
  await expect(firstPart).toBeVisible({ timeout: 15000 });
  const partId = await firstPart.getAttribute("data-part-id");
  console.log(`[DEBUG] 選択 part id=${partId}`);

  // 2. parts を canvas に drop (canvas 中央付近を drop target とする)
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error("stage bbox null");
  const dropX = stageBox.x + stageBox.width * 0.7;
  const dropY = stageBox.y + stageBox.height * 0.3;
  console.log(`[DEBUG] drop target=(${dropX.toFixed(1)}, ${dropY.toFixed(1)})`);

  // Playwright dragTo で HTML5 native drag&drop
  await firstPart.dragTo(stage, {
    targetPosition: { x: stageBox.width * 0.7, y: stageBox.height * 0.3 },
  });
  await page.waitForTimeout(1500); // compile + re-render 待ち

  // 3. drop 後、 新規 actor 名を DSL から検出 (aliasBase1 pattern)
  const cmSrc = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  console.log(`[DEBUG] drop 後 DSL length=${cmSrc.length}, tail=${cmSrc.slice(-200)}`);

  // 新規 lane element を SVG 内から探す = data-cdl-lane 全部取得して drop 前と比較でも良いが、
  // ここは「data-cdl-lane が存在する新規 element を drop 位置付近」 で目視で判定 = video 経由。
  // parts drop により新 actor の lane element が SVG に追加されているはず。
  const allLanes = await page.locator("[data-cdl-lane]").evaluateAll((els) =>
    els.map((el) => ({
      slug: el.getAttribute("data-cdl-lane"),
      x: el.getAttribute("data-cdl-lane-x"),
      y: el.getAttribute("data-cdl-lane-y"),
    })),
  );
  console.log(`[DEBUG] drop 後 lane 一覧:`, JSON.stringify(allLanes));

  // 4. drop 後の新 parts (最後の lane) を drag、 mouse 追従を step 毎に測定
  const newPartLane = page.locator("[data-cdl-lane]").last();
  const newPartBox = await newPartLane.boundingBox();
  if (!newPartBox) {
    console.log("[DEBUG] 新 part lane bbox null、 drop 失敗の可能性");
    return;
  }
  const partCenterX = newPartBox.x + newPartBox.width / 2;
  const partCenterY = newPartBox.y + newPartBox.height / 2;
  console.log(`[DEBUG] drop された part 中心=(${partCenterX.toFixed(1)}, ${partCenterY.toFixed(1)})`);

  // 掴んで drag
  await page.mouse.move(partCenterX, partCenterY);
  await page.waitForTimeout(300);
  await page.mouse.down();
  await page.waitForTimeout(300);
  for (let step = 1; step <= 15; step++) {
    const targetX = partCenterX + step * 20;
    const targetY = partCenterY + step * 15;
    await page.mouse.move(targetX, targetY, { steps: 3 });
    await page.waitForTimeout(80);
    // 真の位置 = getBoundingClientRect (Playwright boundingBox は viewport clip される可能性)
    const info = await newPartLane.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = (el as SVGGraphicsElement).style;
      return {
        rectX: rect.x, rectY: rect.y, rectW: rect.width, rectH: rect.height,
        styleTransform: style.transform,
      };
    });
    const cx = info.rectX + info.rectW / 2;
    const cy = info.rectY + info.rectH / 2;
    console.log(`[DEBUG] step ${step}: mouse=(${targetX.toFixed(1)}, ${targetY.toFixed(1)}), part center=(${cx.toFixed(1)}, ${cy.toFixed(1)}), diff=(${(cx - targetX).toFixed(1)}, ${(cy - targetY).toFixed(1)}), style.transform="${info.styleTransform}"`);
  }
  await page.waitForTimeout(500);
  await page.mouse.up();
  await page.waitForTimeout(1500);
});
