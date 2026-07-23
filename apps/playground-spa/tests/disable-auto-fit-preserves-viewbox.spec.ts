/**
 * disableAutoFit={true} 配線後、 drag / drop で SVG viewBox 属性が固定されることを assert する e2e。
 *
 * user 明示要求「置いた場所から勝手に別の場所に移動」 の根本 fix (cdl PR #326 + 本 PR) の
 * behavior 検証。 dragon editor 経路のみ CdlDiagramView に disableAutoFit={true} を渡し、
 * mount 時の SVG viewBox が freeze される (以降 diagram 変化があっても viewBox 属性不動)。
 *
 * observation 経路 =
 *   - `data-cdl-viewbox-frozen="true"` が root div に付いていること
 *   - drag / drop 前後の SVG viewBox 属性が完全一致すること
 *
 * 元 issue = GH #897 / CAR-1925
 */
import { test, expect, type Page } from "@playwright/test";

async function setup(page: Page) {
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(600);
}

async function getSvgViewBox(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const svg = document.querySelector(".v4-editor-preview svg");
    return svg?.getAttribute("viewBox") ?? "";
  });
}

async function getFrozenFlag(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const el = document.querySelector(".v4-editor-preview [data-cdl-viewbox-frozen]");
    return el?.getAttribute("data-cdl-viewbox-frozen") ?? "";
  });
}

test.describe("disableAutoFit={true} 配線 = viewBox freeze semantics", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("F1 = mount 直後、 SVG に data-cdl-viewbox-frozen=true が付き viewBox が capture 済", async ({ page }) => {
    const frozen = await getFrozenFlag(page);
    expect(frozen, "editor 経路の CdlDiagramView は disableAutoFit={true} で mount するはず").toBe("true");

    const vb = await getSvgViewBox(page);
    expect(vb, "SVG viewBox 属性が set されている").toMatch(/^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?$/);
  });

  test("F2 = parts drop 後、 SVG viewBox 属性が mount 時の値と完全一致 (camera 静止)", async ({ page }) => {
    const before = await getSvgViewBox(page);
    expect(before).toBeTruthy();

    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(500);

    const preview = page.locator(".v4-editor-preview");
    const previewBox = await preview.boundingBox();
    expect(previewBox).not.toBeNull();

    const partsBtn = page.locator('[data-part-id="parts-achievement"]').first();
    await partsBtn.dragTo(preview, {
      targetPosition: { x: previewBox!.width * 0.6, y: previewBox!.height * 0.5 },
    });
    await page.waitForTimeout(1500);

    const after = await getSvgViewBox(page);
    expect(after, `drop 前 (${before}) と drop 後 (${after}) の viewBox は一致するはず`).toBe(before);
  });

  test("F3 = 複数回 drop でも viewBox は初期値を維持 (累積 shift ゼロ)", async ({ page }) => {
    const initial = await getSvgViewBox(page);

    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(500);
    const preview = page.locator(".v4-editor-preview");
    const previewBox = await preview.boundingBox();

    for (let i = 0; i < 3; i++) {
      const partsBtn = page.locator('[data-part-id="parts-achievement"]').first();
      await partsBtn.dragTo(preview, {
        targetPosition: {
          x: previewBox!.width * (0.3 + i * 0.15),
          y: previewBox!.height * (0.3 + i * 0.15),
        },
      });
      await page.waitForTimeout(1200);
      const vb = await getSvgViewBox(page);
      expect(vb, `drop ${i + 1} 回目後の viewBox は初期値 (${initial}) と一致するはず`).toBe(initial);
    }
  });
});
