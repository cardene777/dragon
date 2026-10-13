/**
 * パターンが多い見本でも、図 / コードのタブの列が横へはみ出さないことの検査 (#2867)。
 *
 * 札で並べた時は、パターンを持つ 57 図のうち幅 390 で 39 図、幅 1100 で 4 図が
 * はみ出した。個数の違う 5 図を両方の幅で開き、選ぶ欄へまとめた後の実寸を見る。
 */
import { test, expect } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

const 見本 = [
  { 分類: "parts", 名前: "入ってくる量を溜めて送り出す", パターン数: 24 },
  { 分類: "parts", 名前: "部品を箱に置き何も書き換えない", パターン数: 14 },
  { 分類: "primitives", 名前: "図全体の間隔を書かない", パターン数: 8 },
  { 分類: "interactive", 名前: "interactive-readout-variety", パターン数: 3 },
  { 分類: "text-dsl", 名前: "箱の項目名を英語で書く", パターン数: 3 },
] as const;

for (const 幅 of [390, 1100] as const) {
  for (const { 分類, 名前, パターン数 } of 見本) {
    test(`${分類}/${名前} は幅 ${幅} でタブの列から横にはみ出さない`, async ({ page }) => {
      await page.setViewportSize({ width: 幅, height: 900 });
      await page.goto(`catalog/${分類}`, { waitUntil: "networkidle" });
      await 一覧の行(page, 名前, true).click();

      const select = page.getByRole("combobox", { name: "パターン" });
      await expect(select).toBeVisible();
      await expect(select.locator("option")).toHaveCount(パターン数);

      const tabs = page.locator(".catalog-preview-tabs");
      const measured = await tabs.evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }));
      expect(
        measured.scrollWidth,
        `scrollWidth ${measured.scrollWidth}px / clientWidth ${measured.clientWidth}px`,
      ).toBeLessThanOrEqual(measured.clientWidth + 1);
    });
  }
}
