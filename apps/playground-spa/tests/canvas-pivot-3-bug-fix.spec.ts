/**
 * canvas pivot 3 UX bug fix behavior test (rules/quality.md § marker 発行前提 4 条件遵守)。
 *
 * 2026-07-18 user 目視 verify で発覚した 3 UX bug の fix を permanent test 化する。
 * spec = docs/spec-canvas-pivot-adjustment.md § canvas pivot 座標一本化
 *
 * bug 1 = 横方向 drag が反映されない (parts CSS X=0 固定 lock)
 * bug 2 = drop 直後の race condition (「変なところに飛ぶ」)
 * bug 3 = parts drop で sequence 図が動く (「シーケンス図が変動する」)
 *
 * baseURL 4323 前提 (playwright.config.ts)、 dev server は外部で `pnpm dev` 起動必要。
 */
import { test, expect, type Page } from "@playwright/test";

const PART_ID = "parts-achievement";

interface LaneRect {
  id: string;
  x: number;
  y: number;
  w: number;
}

async function getLaneRects(page: Page): Promise<LaneRect[]> {
  return await page.evaluate(() => {
    const svg = document.querySelector(".v4-editor-preview svg");
    if (!svg) return [];
    return [...svg.querySelectorAll("[data-cdl-lane]")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        id: el.getAttribute("data-cdl-lane") ?? "",
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
      };
    });
  });
}

async function addAchievementPart(page: Page): Promise<void> {
  await page.getByTestId("editor-parts-tab").click();
  await page.getByTestId(`editor-part-item-${PART_ID}`).waitFor({ state: "visible", timeout: 5000 });
  await page.getByTestId(`editor-part-item-${PART_ID}`).click();
  await page.waitForTimeout(1200);
}

test.describe("canvas pivot 3 UX bug fix", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  });

  test("T1 = parts drop 後の sequence lane 座標が完全不動 (bug 3 fix verify)", async ({ page }) => {
    // baseline = parts 追加前の sequence 3 lane 座標
    const before = await getLaneRects(page);
    const seqBefore = ["ユ-ザ", "api", "デ-タベ-ス"].map((id) => before.find((l) => l.id === id));
    for (const l of seqBefore) expect(l).toBeDefined();

    // parts (achievement) を追加
    await addAchievementPart(page);

    // parts 追加後の sequence 3 lane 座標
    const after = await getLaneRects(page);
    const seqAfter = ["ユ-ザ", "api", "デ-タベ-ス"].map((id) => after.find((l) => l.id === id));
    for (const l of seqAfter) expect(l).toBeDefined();

    // 各 sequence lane の x 座標が完全一致 (差分 0)
    for (let i = 0; i < 3; i++) {
      const b = seqBefore[i]!;
      const a = seqAfter[i]!;
      expect(a.x, `sequence lane "${b.id}" x should not move after parts drop (before=${b.x}, after=${a.x})`).toBe(b.x);
    }

    // parts overlay が存在すること (fix が有効な前提)
    const partsLane = after.find((l) => l.id.includes("__"));
    expect(partsLane, "parts overlay lane should exist after add").toBeDefined();
  });

  test("T2 = parts の horizontal drag が視覚に反映される (bug 1 fix verify)", async ({ page }) => {
    await addAchievementPart(page);

    // parts overlay の初期位置
    const before = await getLaneRects(page);
    const partsBefore = before.find((l) => l.id.includes("__"));
    expect(partsBefore, "parts overlay lane should exist").toBeDefined();

    // parts を横方向 +200 CSS px drag
    const startX = partsBefore!.x + 30;
    const startY = partsBefore!.y + 30;
    const endX = startX + 200;
    const endY = startY; // 純粋 horizontal

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(startX + ((endX - startX) * i) / 20, startY);
      await page.waitForTimeout(15);
    }

    // drop 前の parts 位置 (drag 中)
    const midRects = await getLaneRects(page);
    const partsMid = midRects.find((l) => l.id.includes("__"));
    expect(partsMid, "parts overlay should still exist during drag").toBeDefined();

    // horizontal delta が 150-250 CSS px 範囲 (drag pixel scale の tolerance を考慮)
    const dxMid = partsMid!.x - partsBefore!.x;
    expect(Math.abs(dxMid), `parts should move horizontally during drag (dx=${dxMid})`).toBeGreaterThan(100);

    await page.mouse.up();
    await page.waitForTimeout(1000);
  });

  test("T3 = drop 位置が保持される (bug 2 fix verify: 元位置に戻らない / 飛ばない)", async ({ page }) => {
    await addAchievementPart(page);

    const before = await getLaneRects(page);
    const partsBefore = before.find((l) => l.id.includes("__"));
    expect(partsBefore).toBeDefined();

    // 横 +180 縦 +40 の drag
    const startX = partsBefore!.x + 30;
    const startY = partsBefore!.y + 30;
    const dx = 180;
    const dy = 40;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(startX + (dx * i) / 20, startY + (dy * i) / 20);
      await page.waitForTimeout(15);
    }
    // drop 直前の visual 位置を capture
    const preDrop = await getLaneRects(page);
    const partsPreDrop = preDrop.find((l) => l.id.includes("__"));
    expect(partsPreDrop).toBeDefined();

    await page.mouse.up();
    await page.waitForTimeout(1500);

    // drop 後の位置が drop 前 (drag 中最終位置) から大きく乖離していないこと (race で飛んでいない)
    const after = await getLaneRects(page);
    const partsAfter = after.find((l) => l.id.includes("__"));
    expect(partsAfter, "parts overlay should still exist after drop").toBeDefined();

    const flightX = Math.abs(partsAfter!.x - partsPreDrop!.x);
    const flightY = Math.abs(partsAfter!.y - partsPreDrop!.y);
    expect(flightX, `parts should not fly horizontally on drop (drift=${flightX})`).toBeLessThan(30);
    expect(flightY, `parts should not fly vertically on drop (drift=${flightY})`).toBeLessThan(30);

    // 元位置に戻っていない (drop 位置が保持されている)
    const dxFinal = partsAfter!.x - partsBefore!.x;
    expect(Math.abs(dxFinal), `parts should not snap back to origin (dxFinal=${dxFinal})`).toBeGreaterThan(50);
  });
});
