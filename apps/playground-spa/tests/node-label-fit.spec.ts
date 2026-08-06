/**
 * 名札の文字が箱の中に収まっていることの検証 (#1058)。
 *
 * この不変条件を見ている検査がどこにも無かった。
 *
 * 既存の幾何検査 (`kind-geometry-check.spec.ts`) は card の subtitle が **横** にはみ出さない
 * ことだけを `/catalog/presets` で見ており、 縦のはみ出しも、 title も、 エディタも対象外だった。
 * pixel 比較 (`editor-visual.spec.ts`) は差分を検出していたが、 閾値 `maxDiffPixelRatio: 0.005`
 * (= 4743 px) の下に隠れた (実測 = この崩れは 2462 px)。
 *
 * pixel の許容量に依存せず、 はみ出しを直接測る。
 */
import { test, expect } from "@playwright/test";

/** 箱と名札の位置を測る。 描画の座標系ではなく画面上の矩形で見る。 */
async function labelFits(page: import("@playwright/test").Page): Promise<
  { title: string; overflowBottom: number; overflowTop: number }[]
> {
  return await page.evaluate(() => {
    const out: { title: string; overflowBottom: number; overflowTop: number }[] = [];
    for (const body of document.querySelectorAll("svg [data-cdl-role='node-body']")) {
      const g = body.closest("g");
      const label = g?.querySelector("[data-cdl-role='node-label']");
      if (!label) continue;
      const b = body.getBoundingClientRect();
      const t = label.getBoundingClientRect();
      // 大きさを持たない要素 (spacer 等) は測る意味が無い
      if (b.height < 1 || t.height < 1) continue;
      out.push({
        title: (label.textContent ?? "").trim().slice(0, 20),
        overflowBottom: Math.round(t.bottom - b.bottom),
        overflowTop: Math.round(b.top - t.top),
      });
    }
    return out;
  });
}

test("エディタの既定サンプルで名札の文字が箱に収まる", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const nodes = await labelFits(page);
  expect(nodes.length, "名札が 1 つも測れていない (選択子が実装とずれた)").toBeGreaterThan(0);

  // 1px の許容は文字の輪郭の丸めのため。 8px 級のはみ出し (実測値) は通さない
  const 溢れ = nodes.filter((n) => n.overflowBottom > 1 || n.overflowTop > 1);
  expect(
    溢れ,
    `名札が箱からはみ出している: ${溢れ.map((n) => `${n.title}(下 ${n.overflowBottom} / 上 ${n.overflowTop})`).join(", ")}`,
  ).toEqual([]);
});

test("カタログでも名札の文字が箱に収まる", async ({ page }) => {
  // エディタだけを見ると、 別経路で組み立てた図の崩れを取り逃がす
  await page.goto("/catalog/patterns");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const nodes = await labelFits(page);
  expect(nodes.length, "名札が 1 つも測れていない").toBeGreaterThan(0);

  const 溢れ = nodes.filter((n) => n.overflowBottom > 1 || n.overflowTop > 1);
  expect(
    溢れ,
    `名札が箱からはみ出している: ${溢れ.map((n) => `${n.title}(下 ${n.overflowBottom} / 上 ${n.overflowTop})`).join(", ")}`,
  ).toEqual([]);
});
