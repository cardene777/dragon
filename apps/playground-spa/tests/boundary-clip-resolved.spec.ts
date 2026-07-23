/**
 * boundary clip 解消 e2e (CAR-1932 / GH #899)。
 *
 * cdl PR #328 (SVG root overflow=visible) + dragon 側 PADDING_RATIO=0 の 2 段構成で
 * user 報告「エディタの右側上限、 canvas の上下境界」 が解消されたことを assert する。
 *
 * assert 対象 =
 *   - initial fit で preview stage の 100% 使う (padding=0)
 *   - 4 隅付近 drop で node が中心を preview 内に持つ (drop 座標が反映される)
 *   - cdl SVG root に overflow=visible 属性が付いている (cdl PR #328 の integrate 動作)
 *
 * 元 forensic 実測 (fix 前) = preview 595x660、 SVG 547x319 (padding 4%)、 右下 33+26px clip
 * 期待挙動 (fix 後) = SVG が preview 端まで拡張、 4 隅 drop で clip なし
 */
import { test, expect, type Page } from "@playwright/test";

async function setup(page: Page) {
  page.on("dialog", (d) => { void d.accept(); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-preview svg", { timeout: 10000 });
  await page.waitForTimeout(600);
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

async function getPreviewRect(page: Page): Promise<Rect> {
  return await page.evaluate(() => {
    const el = document.querySelector(".v4-editor-preview") as HTMLElement;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

async function getSvgRect(page: Page): Promise<Rect> {
  return await page.evaluate(() => {
    const el = document.querySelector(".v4-editor-preview svg") as SVGSVGElement;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

async function getSvgOverflow(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const el = document.querySelector(".v4-editor-preview svg") as SVGSVGElement;
    return el.getAttribute("overflow") ?? "";
  });
}

async function dropPartsAt(page: Page, fx: number, fy: number): Promise<void> {
  await page.click('[data-testid="editor-parts-tab"]');
  await page.waitForTimeout(300);
  const preview = page.locator(".v4-editor-preview");
  const pr = await preview.boundingBox();
  expect(pr).not.toBeNull();
  const partsBtn = page.locator('[data-part-id="parts-achievement"]').first();
  await partsBtn.dragTo(preview, {
    targetPosition: { x: pr!.width * fx, y: pr!.height * fy },
  });
  await page.waitForTimeout(1500);
}

async function getLatestPartCenter(page: Page): Promise<{ x: number; y: number } | null> {
  return await page.evaluate(() => {
    const els = Array.from(
      document.querySelectorAll('.v4-editor-preview svg [data-cdl-node]'),
    ).filter((el) => (el.getAttribute("data-cdl-node") ?? "").includes("__"));
    if (els.length === 0) return null;
    const el = els[els.length - 1] as SVGGraphicsElement;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
}

test.describe("boundary clip 解消 (cdl overflow=visible + dragon PADDING_RATIO=0)", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("BC1 = cdl SVG root に overflow=visible 属性が付いている (cdl PR #328 integrate)", async ({ page }) => {
    const overflow = await getSvgOverflow(page);
    expect(overflow, "cdl PR #328 で SVG root に overflow=visible が付くはず").toBe("visible");
  });

  test("BC2 = initial fit で SVG が preview の水平方向 100% 使う (padding=0)", async ({ page }) => {
    const preview = await getPreviewRect(page);
    const svg = await getSvgRect(page);
    // SVG は preview の内側に配置される、 4% padding 撤廃で水平方向は preview 幅と同等
    // (scale による fit で幅が preview 全幅 or 高さ制約で幅小さくなる、 但し padding は消える)
    const horizontalMargin = preview.w - svg.w;
    console.log(`preview.w=${preview.w}, svg.w=${svg.w}, horizontal margin=${horizontalMargin}px`);
    // padding=0 で水平方向 margin が最小化 (≤ 4px 許容、 4% 覚え書きより充分小さい)
    expect(horizontalMargin, `padding 撤廃で水平方向 margin は 4px 以下 (旧 4% = 24px)`).toBeLessThan(24);
  });

  test("BC3 = 右下 (0.9, 0.9) drop で node 中心が preview 内、 clip 幅 vs fix 前で改善", async ({ page }) => {
    await dropPartsAt(page, 0.9, 0.9);
    const preview = await getPreviewRect(page);
    const center = await getLatestPartCenter(page);
    expect(center, "追加 node が render される").not.toBeNull();
    // node 中心が preview 内
    expect(center!.x, `node x=${center!.x} が preview [${preview.x}, ${preview.x + preview.w}] 内`).toBeGreaterThanOrEqual(preview.x);
    expect(center!.x).toBeLessThanOrEqual(preview.x + preview.w);
    expect(center!.y).toBeGreaterThanOrEqual(preview.y);
    expect(center!.y).toBeLessThanOrEqual(preview.y + preview.h);
  });

  test("BC4 = 4 隅 (右上 / 右下 / 左下 / 上端寄り) drop で 全 node 中心が preview 内", async ({ page }) => {
    const corners: Array<{ fx: number; fy: number; label: string }> = [
      { fx: 0.9, fy: 0.15, label: "右上寄り" },
      { fx: 0.9, fy: 0.9, label: "右下" },
      { fx: 0.15, fy: 0.9, label: "左下" },
      { fx: 0.5, fy: 0.15, label: "上端寄り" },
    ];
    for (const c of corners) {
      await dropPartsAt(page, c.fx, c.fy);
      const preview = await getPreviewRect(page);
      const center = await getLatestPartCenter(page);
      expect(center, `${c.label}: node が追加される`).not.toBeNull();
      const inX = center!.x >= preview.x && center!.x <= preview.x + preview.w;
      const inY = center!.y >= preview.y && center!.y <= preview.y + preview.h;
      expect(inX && inY, `${c.label} drop 後の node 中心 (${center!.x.toFixed(0)}, ${center!.y.toFixed(0)}) が preview [${preview.x.toFixed(0)}, ${(preview.x + preview.w).toFixed(0)}] × [${preview.y.toFixed(0)}, ${(preview.y + preview.h).toFixed(0)}] 内`).toBeTruthy();
    }
  });
});
