/**
 * 宅配の 4 ひな形を一覧から開けることの検査 (#2835)。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test preset-delivery`
 */
import { expect, test } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

const 宅配のひな形 = [
  { name: "荷物を届けるフローチャート", diagramId: "delivery-flow-demo" },
  { name: "荷物を届ける段の箱", diagramId: "delivery-stages-demo" },
  { name: "荷物を届ける路線図", diagramId: "delivery-metro-demo" },
  { name: "荷物を届ける時間軸", diagramId: "delivery-timeline-demo" },
] as const;

test("一覧に宅配の 4 ひな形が出て、それぞれを押すと図が出る", async ({ page }) => {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });

  for (const item of 宅配のひな形) {
    const row = 一覧の行(page, item.diagramId);
    await expect(row, `${item.name} の行`).toBeVisible();
    await row.click();
    await expect(
      page
        .locator(`main.catalog-preview [data-cdl-diagram="${item.diagramId}"] svg[data-cdl-stage]`)
        .first(),
      `${item.name} の図`,
    ).toBeVisible();
  }
});
