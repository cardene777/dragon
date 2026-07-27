import { test, expect } from "@playwright/test";

/**
 * 全 diagram type で editor の基本操作が成立することを保証する (CAR-2160)。
 *
 * type ごとに lane / node の id 規約が違う (sequence は `{slug}-header`、 flow は素の slug、
 * state は `lane-{slug}`、 gantt は `gantt-{slug}`) ため、 1 type で動いても他が動く保証がない。
 * sample を順に開いて、 選択 / 移動 / 図の倍率 / 文字倍率 の 4 操作を全 type で確認する。
 */

const BASE_URL = process.env.AI_VERIFY_BASE_URL ?? "http://localhost:4323";
test.use({ baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } });

/** sidebar の「サンプル」 tab から slug 指定で開く。 */
async function openSample(page: import("@playwright/test").Page, slug: string): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  await page.getByRole("tab", { name: "サンプル" }).click();
  await page.waitForTimeout(300);
  const btn = page.locator(`[data-testid="editor-sample-${slug}"]`).first();
  if ((await btn.count()) === 0) throw new Error(`sample not found: ${slug}`);
  await btn.click();
  await page.waitForTimeout(1800);
}

/** 図の SVG (viewBox を持つもの) を返す。 icon の SVG を掴まないための絞り込み。 */
const DIAGRAM_SVG = '[data-testid="editor-preview-stage"] svg[viewBox]';

/** 対象 type の代表 sample。 label の部分一致で引く。 */
const TYPES: Array<{ type: string; label: string }> = [
  { type: "sequence", label: "sequence" },
  { type: "flow", label: "flow" },
  { type: "swimlane", label: "swimlane" },
  { type: "topology", label: "topology" },
  { type: "er", label: "er" },
  { type: "state", label: "state-machine" },
  { type: "class", label: "class" },
  { type: "gantt", label: "gantt" },
  { type: "mind", label: "mind" },
  { type: "pie", label: "pie" },
  { type: "c4", label: "c4" },
];

for (const { type, label } of TYPES) {
  test(`全 type: ${type} = 要素を click して選択できる`, async ({ page }) => {
    await openSample(page, label);
    const node = page.locator("[data-cdl-node]").first();
    const bb = await node.boundingBox();
    if (!bb) throw new Error(`${type}: node bbox null`);
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(350);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(await page.locator("[data-cdl-selection-ui]").count(), `${type} の選択 UI`).toBeGreaterThan(0);
  });

  test(`全 type: ${type} = 要素を drag すると DSL に座標が書かれる`, async ({ page }) => {
    await openSample(page, label);
    const before = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
    const node = page.locator("[data-cdl-node]").first();
    const bb = await node.boundingBox();
    if (!bb) throw new Error(`${type}: node bbox null`);
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(350);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width / 2 + 70, bb.y + bb.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
    expect(after, `${type} の DSL が変わる`).not.toBe(before);
    expect(after, `${type} に posX が書かれる`).toContain("posX");
  });

  test(`全 type: ${type} = 図の倍率が等比で効く`, async ({ page }) => {
    await openSample(page, label);
    const vb = async (): Promise<{ w: number; h: number }> =>
      await page.evaluate((sel) => {
        const v = document.querySelector(sel)!.getAttribute("viewBox")!.split(/\s+/).map(Number);
        return { w: v[2]!, h: v[3]! };
      }, DIAGRAM_SVG);
    const b = await vb();
    await page.locator('[data-testid="editor-diagram-scale-up"]').click();
    await page.waitForTimeout(1200);
    const a = await vb();
    // 縦横とも拡大し、 縦横比が保たれる (歪まない)
    expect(a.w, `${type} の幅`).toBeGreaterThan(b.w);
    expect(a.h, `${type} の高さ`).toBeGreaterThan(b.h);
    expect(Math.abs(a.w / a.h - b.w / b.h), `${type} の縦横比`).toBeLessThan(0.01);
  });

  test(`全 type: ${type} = 文字サイズを一律で変えられる`, async ({ page }) => {
    await openSample(page, label);
    const font = async (): Promise<number> =>
      await page.evaluate((sel) => {
        const t = document.querySelector(`${sel} text`);
        return t ? parseFloat(getComputedStyle(t).fontSize) : 0;
      }, DIAGRAM_SVG);
    const b = await font();
    expect(b, `${type} に text がある`).toBeGreaterThan(0);
    await page.locator('[data-testid="editor-font-scale-up"]').click();
    await page.waitForTimeout(700);
    expect(await font(), `${type} の文字`).toBeGreaterThan(b);
  });
}

test("sequence では縦に drag しても縦位置が変わらない (時系列軸を壊さない)", async ({ page }) => {
  await openSample(page, "sequence");
  const y = async (): Promise<number> =>
    await page.evaluate(() => document.querySelector("[data-cdl-node]")!.getBoundingClientRect().y);
  const b = await y();
  const node = page.locator("[data-cdl-node]").first();
  const bb = await node.boundingBox();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.waitForTimeout(350);
  await page.mouse.down();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2 + 120, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  // 縦の drag は無視される = 位置がほぼ変わらない
  expect(Math.abs((await y()) - b)).toBeLessThan(10);
});

test("flow では縦にも drag できる (時系列軸を持たない type)", async ({ page }) => {
  await openSample(page, "flow");
  const before = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  const node = page.locator("[data-cdl-node]").first();
  const bb = await node.boundingBox();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.waitForTimeout(350);
  await page.mouse.down();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2 + 100, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
  expect(after).not.toBe(before);
  expect(after).toContain("posY");
});
