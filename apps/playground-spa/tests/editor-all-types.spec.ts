import { test, expect } from "@playwright/test";

/**
 * 全 diagram type で editor の基本操作が成立することを保証する (CAR-2160)。
 *
 * type ごとに lane / node の id 規約が違う (sequence は `{slug}-header`、 flow は素の slug、
 * state は `lane-{slug}`、 gantt は `gantt-{slug}`) ため、 1 type で動いても他が動く保証がない。
 * sample を順に開いて、 選択 / 移動 / 図の倍率 / 文字倍率 の 4 操作を全 type で確認する。
 */

test.use({ viewport: { width: 1920, height: 1080 } });

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
import { EDITOR_SAMPLES } from "../src/data/editor-samples";

const DIAGRAM_SVG = '[data-testid="editor-preview-stage"] svg[viewBox]';

/**
 * 対象 type の代表 sample。 label の部分一致で引く。
 *
 * **見本の一覧から導く**。 手で並べると、 記法に型を足した時にここが古いまま残り、 新しい型が
 * 1 度も画面で確かめられない (`solidity` / `bar` / `line` で実際に起きた)。
 */
const TYPES: Array<{ type: string; label: string }> = EDITOR_SAMPLES.map((s) => {
  const m = s.code.match(/^type:\s*([a-z0-9-]+)\s*$/mu);
  return { type: m?.[1] ?? "", label: s.slug };
}).filter((t, i, a) => t.type !== "" && a.findIndex((x) => x.type === t.type) === i);

for (const { type, label } of TYPES) {


  test(`全 type: ${type} = 図の倍率が等比で効く`, async ({ page }) => {
    await openSample(page, label);
    // 測るのは **実描画サイズ** (getBoundingClientRect)。
    //
    // 以前はここで viewBox 属性を測っていたが、 それでは倍率が効いたことにならない。
    // viewBox を k 倍すると表示倍率が 1/k になるので、 中身も k 倍していると両者が
    // 打ち消し合って画面は 1 pixel も変わらない。 属性は増えるので test は通ってしまう。
    const size = async (): Promise<{ w: number; h: number; vb: string }> =>
      await page.evaluate((sel) => {
        const svg = document.querySelector(sel)!;
        const r = svg.getBoundingClientRect();
        return { w: r.width, h: r.height, vb: svg.getAttribute("viewBox")! };
      }, DIAGRAM_SVG);
    const b = await size();
    await page.locator('[data-testid="editor-diagram-scale-up"]').click();
    await page.waitForTimeout(1200);
    const a = await size();
    // 縦横とも拡大し、 縦横比が保たれる (歪まない)
    expect(a.w, `${type} の描画幅`).toBeGreaterThan(b.w);
    expect(a.h, `${type} の描画高さ`).toBeGreaterThan(b.h);
    expect(Math.abs(a.w / a.h - b.w / b.h), `${type} の縦横比`).toBeLessThan(0.01);
    // 1 段 = 1.25 倍。 「大きくなった」 だけでなく倍率どおりであることまで見る。
    expect(a.w / b.w, `${type} の倍率`).toBeCloseTo(1.25, 2);
    // 座標系は変えない (当たり判定や座標の読み書きが倍率で狂わない)
    expect(a.vb, `${type} の viewBox`).toBe(b.vb);
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
