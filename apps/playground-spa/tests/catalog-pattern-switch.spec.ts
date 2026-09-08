/**
 * 中身が違う見本を選ぶ切替 (#1696)。
 *
 * 図の上の切替が `オプション` と `パターン` の 2 群に分かれ、パターンを押すと **図に載る
 * 項目そのもの** が入れ替わることを画面で見る。
 *
 * 押しても中身が変わらない形 (図だけ替わってコードが元のまま等) を落とすのが目的。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-pattern-switch`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/charts", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText(名前, { exact: true }).first().click();
  await page.waitForTimeout(400);
}

/** 図に出ている割合の字の数 */
async function 割合の数(page: Page): Promise<number> {
  return page.locator('.catalog-preview-stage [data-cdl-role="chart-stat-share"]').count();
}

test.describe("パターンで中身を入れ替えられる (#1696)", () => {
  test("切替が オプション と パターン の 2 群に分かれて出る", async ({ page }) => {
    await 開く(page, "大きな数字");
    const 群 = page.locator(".catalog-toggle-group");
    await expect(群).toHaveCount(2);
    await expect(群.nth(0).locator(".catalog-toggle-group-label")).toHaveText("オプション");
    await expect(群.nth(1).locator(".catalog-toggle-group-label")).toHaveText("パターン");
  });

  test("パターンが 2 つ出ていて、既定は 1 件", async ({ page }) => {
    await 開く(page, "大きな数字");
    const 群 = page.getByRole("radiogroup", { name: "パターン" });
    await expect(群).toBeVisible();
    await expect(群.getByRole("radio")).toHaveCount(2);
    await expect(群.getByRole("radio", { name: "1 件" })).toHaveAttribute("aria-checked", "true");
    await expect(群.getByRole("radio", { name: "複数" })).toHaveAttribute("aria-checked", "false");
  });

  test("変種を持たない図ではパターンの群が出ない (陰性対照)", async ({ page }) => {
    /*
     * 「どの図でも出る」 形なら、上の 2 件は通っても意味を持たない。
     * 円グラフでは出ないこと、そして オプション の群は出たままであることを見る。
     */
    await 開く(page, "円グラフ");
    await expect(page.getByRole("radiogroup", { name: "パターン" })).toHaveCount(0);
    await expect(page.locator(".catalog-toggle-group")).toHaveCount(1);
    await expect(page.getByRole("radiogroup", { name: "再生速度" })).toBeVisible();
  });

  test("複数を選ぶと図に割合が出る", async ({ page }) => {
    // 割合は全件の合計に対する取り分なので、件が 1 つだと分母が自分自身になり出ない
    // (`cdl#759`)。 押した結果が絵に出ることを、役割の数で見る
    await 開く(page, "大きな数字");
    expect(await 割合の数(page)).toBe(0);

    await page.getByRole("radio", { name: "複数" }).click();
    await page.waitForTimeout(500);
    expect(await 割合の数(page)).toBeGreaterThanOrEqual(2);

    await page.getByRole("radio", { name: "1 件" }).click();
    await page.waitForTimeout(500);
    expect(await 割合の数(page)).toBe(0);
  });

  test("複数を選ぶとコードも入れ替わる", async ({ page }) => {
    // 図だけ替わって記法が元のままだと、写したコードが画面と違う図を描く
    await 開く(page, "大きな数字");
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator(".catalog-source-code").first()).toContainText("今月の解約率");

    await page.getByRole("radio", { name: "複数" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".catalog-source-code").first()).toContainText("問い合わせの内訳");
  });

  test("別の図を選ぶと 1 件へ戻る", async ({ page }) => {
    // 残すと、次に 大きな数字 を開いた時に前の選択が出て理由を見失う (#1355 と同じ形)
    await 開く(page, "大きな数字");
    await page.getByRole("radio", { name: "複数" }).click();
    await page.waitForTimeout(400);

    await page.getByText("円グラフ", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await page.getByText("大きな数字", { exact: true }).first().click();
    await page.waitForTimeout(400);

    await expect(page.getByRole("radio", { name: "1 件" })).toHaveAttribute("aria-checked", "true");
    expect(await 割合の数(page)).toBe(0);
  });
});
