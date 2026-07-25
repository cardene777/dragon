import { test, expect } from "@playwright/test";

/**
 * AI verify = achievement drop + drag の実挙動を record。
 * 2 axis 判定:
 *   axis 1 = pan mode 発火判定 (pan container transform が drag 中変化しないか)
 *   axis 2 = 他 lane (Client) が同時に動かないか (画面全体 pan なら Client も追従)
 *
 * 追加 axis (root cause 追跡用):
 *   axis 3 = hover 点線枠発火 (achievement 領域 hover で hoveredHandle が set されるか)
 *   axis 4 = drop 直後 vs finalize 後の pan transform 差分内訳
 *   axis 5 = mouse.down 直後 pan transform (drag mode 突入時点で pan していないか)
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://127.0.0.1:5173";

test.use({
  baseURL: BASE_URL,
  video: { mode: "on", size: { width: 1920, height: 1080 } },
  viewport: { width: 1920, height: 1080 },
});

async function panTransform(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate(() => {
    const pan = document.querySelector(".v4-editor-pan") as HTMLElement | null;
    return pan ? pan.style.transform : null;
  });
}

async function edgeDs(page: import("@playwright/test").Page): Promise<Array<{ id: string; d: string }>> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll("[data-cdl-edge] path")).map((el) => ({
      id: (el.parentElement as SVGElement | null)?.getAttribute("data-cdl-edge") ?? "",
      d: el.getAttribute("d") ?? "",
    }));
  });
}

async function textPositions(page: import("@playwright/test").Page): Promise<Array<{ parent: string; content: string; x: string; y: string }>> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll(".v4-editor-preview svg text")).map((t) => {
      const el = t as SVGTextElement;
      const parent = el.parentElement as SVGElement | null;
      return {
        parent: parent?.getAttribute("data-cdl-edge") ?? parent?.getAttribute("data-cdl-lane") ?? parent?.getAttribute("data-cdl-node") ?? "",
        content: (el.textContent ?? "").slice(0, 20),
        x: el.getAttribute("x") ?? "",
        y: el.getAttribute("y") ?? "",
      };
    });
  });
}

async function elementOrder(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll(".v4-editor-preview svg [data-cdl-node], .v4-editor-preview svg [data-cdl-lane]"))
      .map((el) => el.getAttribute("data-cdl-node") ?? el.getAttribute("data-cdl-lane") ?? "");
  });
}

async function laneClients(page: import("@playwright/test").Page): Promise<Array<{ id: string; bbox: any }>> {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll("[data-cdl-lane]:not([data-cdl-node]):not([data-cdl-edge])"))
      .filter((el) => !(el.getAttribute("data-cdl-lane") ?? "").includes("__"))
      .map((el) => {
        const r = (el as SVGGraphicsElement).getBoundingClientRect();
        return { id: el.getAttribute("data-cdl-lane") ?? "", bbox: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
      });
  });
}

test("achievement drop + trophy 中心 drag、 pan container 不変 + 他 lane 静止 verify", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(500);
  const firstPart = page.locator('[data-testid^="editor-part-item-"]').first();
  await expect(firstPart).toBeVisible({ timeout: 15000 });

  const stage = page.locator('[data-testid="editor-preview-stage"]');
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error("stage bbox null");

  const clientLaneInit = await page.locator('[data-cdl-lane="client"]').first().boundingBox();
  const panInit = await panTransform(page);
  console.log(`[INIT] Client lane:`, JSON.stringify(clientLaneInit));
  console.log(`[INIT] pan transform: ${panInit}`);

  // achievement drop
  await firstPart.dragTo(stage, {
    targetPosition: { x: stageBox.width * 0.5, y: stageBox.height * 0.5 },
  });
  await page.waitForTimeout(2000);

  const panAfterDrop = await panTransform(page);
  const clientAfterDrop = await page.locator('[data-cdl-lane="client"]').first().boundingBox();
  console.log(`[AFTER-DROP] Client lane:`, JSON.stringify(clientAfterDrop));
  console.log(`[AFTER-DROP] pan transform: ${panAfterDrop}`);

  // trophy 中心 = achievement parts merge の実 shape hit point
  const trophyNode = page.locator('[data-cdl-node^="achievement1__"]').first();
  const trophyBox = await trophyNode.boundingBox();
  if (!trophyBox) throw new Error("trophy bbox null");
  console.log(`[TROPHY] bbox:`, JSON.stringify(trophyBox));

  // hover 検証 axis 3 = achievement 領域 hover で 4 隅 handle が現れるか
  const hoverX = trophyBox.x + trophyBox.width / 2;
  const hoverY = trophyBox.y + trophyBox.height / 2;
  // まず canvas の左上端 (achievement から遠い場所) に move して hover state を reset
  await page.mouse.move(100, 100);
  await page.waitForTimeout(400);
  const handleBefore = await page.locator('[data-corner]').count();
  console.log(`[HOVER-RESET] 遠地 hover での handle count: ${handleBefore} (期待 = 0)`);
  await page.mouse.move(hoverX, hoverY);
  await page.waitForTimeout(400);
  const handleVisible = await page.locator('[data-corner]').count();
  console.log(`[HOVER] 4-corner handle count: ${handleVisible} (期待 = 4 で hover 発火)`);
  // hover 空領域 = trophy 中心ではなく achievement lane 上部 (label 領域外の透明部) にも当ててみる
  const achievementLane = page.locator('[data-cdl-lane^="achievement1"]').first();
  const laneBox = await achievementLane.boundingBox();
  if (laneBox) {
    const bodyX = laneBox.x + laneBox.width / 2;
    const bodyY = laneBox.y + laneBox.height + 100; // lane label 下の透明領域
    await page.mouse.move(bodyX, bodyY);
    await page.waitForTimeout(300);
    const handleCountBody = await page.locator('[data-corner]').count();
    console.log(`[HOVER-BODY] 空領域 hover での 4-corner handle count: ${handleCountBody}`);
    // 再度 trophy 上に戻して drag 開始点として使う
    await page.mouse.move(hoverX, hoverY);
    await page.waitForTimeout(200);
  }

  // drag 前 client / pan snapshot + 全 lane + 全 arrow + text + element order
  const clientBeforeDrag = await page.locator('[data-cdl-lane="client"]').first().boundingBox();
  const panBeforeDrag = await panTransform(page);
  const lanesBeforeDrag = await laneClients(page);
  const edgesBeforeDrag = await edgeDs(page);
  const textsBeforeDrag = await textPositions(page);
  const orderBeforeDrag = await elementOrder(page);
  console.log(`[BEFORE-DRAG] Client:`, JSON.stringify(clientBeforeDrag));
  console.log(`[BEFORE-DRAG] pan: ${panBeforeDrag}`);
  console.log(`[BEFORE-DRAG] lanes:`, JSON.stringify(lanesBeforeDrag));
  console.log(`[BEFORE-DRAG] edges:`, JSON.stringify(edgesBeforeDrag));
  console.log(`[BEFORE-DRAG] text count: ${textsBeforeDrag.length}`);
  console.log(`[BEFORE-DRAG] order last 3: ${orderBeforeDrag.slice(-3).join(", ")}`);

  // mouse.down 直後 pan transform (drag mode 突入時点で pan していないか)
  await page.mouse.down();
  await page.waitForTimeout(200);
  const panAfterDown = await panTransform(page);
  console.log(`[AFTER-DOWN] pan: ${panAfterDown}`);

  // drag 中間 = mouse.move 5 回目時点で pan transform 測定
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(hoverX + i * 40, hoverY + i * 30, { steps: 3 });
    await page.waitForTimeout(60);
  }
  const panMid = await panTransform(page);
  const clientMid = await page.locator('[data-cdl-lane="client"]').first().boundingBox();
  console.log(`[DRAG-MID] pan: ${panMid}`);
  console.log(`[DRAG-MID] Client:`, JSON.stringify(clientMid));

  for (let i = 6; i <= 10; i++) {
    await page.mouse.move(hoverX + i * 40, hoverY + i * 30, { steps: 3 });
    await page.waitForTimeout(60);
  }

  await page.mouse.up();
  await page.waitForTimeout(1500);

  const panAfterUp = await panTransform(page);
  const clientAfterDrag = await page.locator('[data-cdl-lane="client"]').first().boundingBox();
  const trophyAfterDrag = await trophyNode.boundingBox();
  const lanesAfterUp = await laneClients(page);
  const edgesAfterUp = await edgeDs(page);
  console.log(`[AFTER-UP] pan: ${panAfterUp}`);
  console.log(`[AFTER-UP] Client:`, JSON.stringify(clientAfterDrag));
  console.log(`[AFTER-UP] Trophy:`, JSON.stringify(trophyAfterDrag));
  console.log(`[AFTER-UP] lanes:`, JSON.stringify(lanesAfterUp));
  console.log(`[AFTER-UP] edges:`, JSON.stringify(edgesAfterUp));
  // 全 lane / 全 arrow の delta を機械判定
  console.log(`[LANE-CHECK]`);
  for (const before of lanesBeforeDrag) {
    const after = lanesAfterUp.find((l) => l.id === before.id);
    if (!after) { console.log(`  ${before.id} = REMOVED (NG)`); continue; }
    const dx = Math.abs(after.bbox.x - before.bbox.x);
    const dy = Math.abs(after.bbox.y - before.bbox.y);
    const dw = Math.abs(after.bbox.w - before.bbox.w);
    const dh = Math.abs(after.bbox.h - before.bbox.h);
    const total = dx + dy + dw + dh;
    console.log(`  ${before.id} dx=${dx} dy=${dy} dw=${dw} dh=${dh} total=${total} ${total < 2 ? "✓" : "NG"}`);
  }
  console.log(`[ARROW-CHECK]`);
  for (let i = 0; i < edgesBeforeDrag.length; i++) {
    const before = edgesBeforeDrag[i];
    const after = edgesAfterUp[i];
    if (!before || !after) continue;
    const same = before.d === after.d;
    console.log(`  ${before.id} ${same ? "✓ unchanged" : `NG ${before.d} → ${after.d}`}`);
  }

  // 判定 axis
  const clientShift = clientBeforeDrag && clientAfterDrag
    ? Math.abs(clientAfterDrag.x - clientBeforeDrag.x)
    : NaN;
  console.log(`[AXIS-2] Client shift during drag: ${clientShift.toFixed(1)}px (0=OK、 >50=NG pan fallback)`);

  const panMidChanged = panBeforeDrag !== panMid;
  const panFinalChanged = panBeforeDrag !== panAfterUp;
  console.log(`[AXIS-1a] pan MID vs before-drag changed: ${panMidChanged}`);
  console.log(`[AXIS-1b] pan FINAL vs before-drag changed: ${panFinalChanged}`);
  console.log(`[AXIS-4] pan finalize delta (before → after up): ${panBeforeDrag} → ${panAfterUp}`);

  if (trophyBox && trophyAfterDrag) {
    const trophyShift = trophyAfterDrag.x - trophyBox.x;
    console.log(`[TROPHY-SHIFT] x shift = ${trophyShift.toFixed(1)}px (期待 = 400 相当)`);
  }
  const textsAfterUp = await textPositions(page);
  console.log(`[TEXT-CHECK]`);
  let textDiff = 0;
  for (let i = 0; i < Math.min(textsBeforeDrag.length, textsAfterUp.length); i++) {
    const before = textsBeforeDrag[i];
    const after = textsAfterUp[i];
    if (!before || !after) continue;
    if (before.x !== after.x || before.y !== after.y) {
      textDiff++;
      if (textDiff <= 5) console.log(`  NG "${before.content}" (${before.parent}) x=${before.x}→${after.x} y=${before.y}→${after.y}`);
    }
  }
  console.log(`  ${textDiff === 0 ? "✓ all texts unchanged" : `NG ${textDiff}/${textsBeforeDrag.length} texts moved`}`);
  const orderAfterUp = await elementOrder(page);
  const orderChanged = JSON.stringify(orderBeforeDrag) !== JSON.stringify(orderAfterUp);
  console.log(`[ORDER-CHECK] ${orderChanged ? "NG order changed" : "✓ order unchanged"} (last 3: ${orderAfterUp.slice(-3).join(" | ")})`);
});
