/**
 * 宅配の 4 ひな形を一覧と詳細の両方から開けることの検査 (#2835)。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test preset-delivery`
 */
import { expect, test } from "@playwright/test";

const 宅配のひな形 = [
  { name: "荷物を届けるフローチャート", slug: "delivery-flow", diagramId: "delivery-flow-demo" },
  { name: "荷物を届ける段の箱", slug: "delivery-stages", diagramId: "delivery-stages-demo" },
  { name: "荷物を届ける路線図", slug: "delivery-metro", diagramId: "delivery-metro-demo" },
  { name: "荷物を届ける時間軸", slug: "delivery-timeline", diagramId: "delivery-timeline-demo" },
] as const;

test("一覧に宅配の 4 ひな形が出て、それぞれを押すと図が出る", async ({ page }) => {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });

  for (const item of 宅配のひな形) {
    const row = page.locator(".catalog-list-item").filter({
      has: page.locator(".catalog-list-item-name", { hasText: item.name }),
    });
    await expect(row, `${item.name} の行`).toHaveCount(1);
    await row.click();
    await expect(
      page
        .locator(`main.catalog-preview [data-cdl-diagram="${item.diagramId}"] svg[data-cdl-stage]`)
        .first(),
      `${item.name} の図`,
    ).toBeVisible();
  }
});

for (const item of 宅配のひな形) {
  test(`詳細 ${item.slug} に名前と図が出る`, async ({ page }) => {
    await page.goto(`preset/${item.slug}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1, name: item.name })).toBeVisible();
    await expect(page.locator("svg[data-cdl-stage]").first()).toBeVisible();
  });
}
