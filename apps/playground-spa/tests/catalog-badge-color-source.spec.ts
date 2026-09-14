/**
 * 読み出しの札の色の引き方をカタログで切り替え、状態を選ぶと札の色が変わること (#1974)。
 *
 * 描画側 0.63.0 までは札の `colorSource` を読まず、書いても色が変わらなかった (cdl#861)。
 * 画面で見るのは、パターンを押して状態の選択肢を変えた時に、札の字と背景色がそれぞれ
 * 何に付いて変わるか。 `colorSource` を読まない描画だと「別の状態で色を引く」 の色が変わらない。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-badge-color-source`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

const 状態の色 = {
  稼働: "rgb(31, 122, 69)",
  停止: "rgb(122, 106, 92)",
  異常: "rgb(192, 57, 43)",
} as const;

async function 開く(page: Page): Promise<void> {
  await page.goto("catalog/interactive", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText("readout表示3種の合わせ技", { exact: true }).first().click();
  await page.waitForTimeout(400);
}

const 札 = (page: Page) =>
  page.locator('.catalog-preview-stage [data-cdl-readout="tempBadge"] .cdl-ip-readout-badge-pill');

async function 状態を選ぶ(page: Page, 値: string): Promise<void> {
  await page
    .locator('.catalog-preview-stage [data-cdl-input-kind="dropdown"]')
    .filter({ hasText: "状態" })
    .locator("select")
    .selectOption(値);
}

async function 背景(page: Page): Promise<string> {
  return 札(page).evaluate((el) => (el as HTMLElement).style.background);
}

test.describe("札の色の引き方を切り替える (#1974)", () => {
  test("パターンが 3 つ出ていて、既定は 札に色を付けない", async ({ page }) => {
    await 開く(page);
    const 群 = page.getByRole("radiogroup", { name: "パターン" });
    await expect(群.getByRole("radio")).toHaveCount(3);
    await expect(群.getByRole("radio", { name: "札に色を付けない" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("札に色を付けない は、状態を変えても札に色が付かない (陰性対照)", async ({ page }) => {
    await 開く(page);
    await expect(札(page)).toHaveText("42");
    expect(await 背景(page)).toBe("");
    await 状態を選ぶ(page, "異常");
    await expect(札(page)).toHaveText("42");
    expect(await 背景(page)).toBe("");
  });

  test("札の字で色を引く は、字も色も状態に付いて変わる", async ({ page }) => {
    await 開く(page);
    await page.getByRole("radio", { name: "札の字で色を引く" }).click();
    for (const 値 of ["稼働", "停止", "異常"] as const) {
      await 状態を選ぶ(page, 値);
      await expect(札(page)).toHaveText(値);
      await expect.poll(() => 背景(page), `${値} の色`).toBe(状態の色[値]);
    }
  });

  test("別の状態で色を引く は、字は温度のまま色だけが状態に付いて変わる", async ({ page }) => {
    await 開く(page);
    await page.getByRole("radio", { name: "別の状態で色を引く" }).click();
    for (const 値 of ["異常", "停止", "稼働"] as const) {
      await 状態を選ぶ(page, 値);
      await expect(札(page)).toHaveText("42");
      await expect.poll(() => 背景(page), `${値} の色`).toBe(状態の色[値]);
    }
  });

  test("別の状態で色を引く を選ぶとコードに colorSource が出る", async ({ page }) => {
    await 開く(page);
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator(".catalog-source-code").first()).not.toContainText("colorSource");

    await page.getByRole("radio", { name: "別の状態で色を引く" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".catalog-source-code").first()).toContainText(
      'colorSource: "state"',
    );
  });
});
