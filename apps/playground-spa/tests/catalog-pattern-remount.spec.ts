/**
 * パターンを切り替えると、切り替えた先の図の既定値で入力の部品が始まることの確認 (#1969)。
 *
 * 描画側の入力の部品は既定値 (時間の速さの番号など) を部品を作った時にしか読まない。
 * カタログが図の部品を使い回していた間、`速さを選ぶ` の変種 (既定を 3 番目の 3 倍にした) へ
 * 切り替えても速さの釦は前の図の `1倍` のままだった。
 *
 * **両方向で見る**。 切り替えた先で変わるだけだと、戻した時に変種の値が残る形を見逃す。
 */
import { test, expect, type Page, type Locator } from "@playwright/test";

const ITEM_LABEL = "時間の信号で図形2種を動かす";

async function open(page: Page): Promise<Locator> {
  await page.goto("catalog/interactive", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page
    .locator("aside.catalog-sidebar")
    .getByText(ITEM_LABEL, { exact: false })
    .first()
    .click();
  await page.waitForTimeout(800);
  const preview = page.locator("main.catalog-preview");
  await expect(preview.locator("svg[data-cdl-stage]").first()).toBeVisible();
  return preview;
}

/** パターンの切替を押す */
async function choose(page: Page, 名: string): Promise<void> {
  await page
    .getByRole("radio", { name: 名, exact: true })
    .or(page.getByRole("button", { name: 名, exact: true }))
    .first()
    .click();
  await page.waitForTimeout(500);
}

test.describe("パターンの切替で入力の部品が作り直される (#1969)", () => {
  test("速さの既定を変えた変種へ切り替えると、その速さで始まり、戻すと元の速さに戻る", async ({
    page,
  }) => {
    const preview = await open(page);
    const 速さ = preview.locator(".cdl-ip-timeline-speed").first();
    await expect(速さ, "元の図が 1 倍で始まっていない (比べる起点が違う)").toHaveText(/1倍/);

    await choose(page, "速さを選ぶ");
    await expect(速さ, "切り替えた先の既定の速さが出ていない").toHaveText(/3倍/);

    await choose(page, "既定の速さ");
    await expect(速さ, "戻した後に変種の速さが残っている").toHaveText(/1倍/);
  });
});
