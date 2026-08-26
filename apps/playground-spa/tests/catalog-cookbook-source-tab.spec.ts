/**
 * 手引きの見本でコードのタブが押せることの検査 (#1378)。
 *
 * このページの 25 件は **もともと記法から組み立てている**。 その記法が
 * `sourceYaml__<key>` として export されていなかったため一覧が拾えず、
 * コードのタブが押せなかった。 取り出しただけで中身は変えていない。
 *
 * 記法と図が同じ source から来ることは `src/lib/catalog-source-parity.test.tsx` が見る。
 * ここでは **画面から読めるか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-cookbook-source-tab`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/cookbook", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar").getByText(名前, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

test.describe("手引きの見本で記法が読める (#1378)", () => {
  test("コードのタブが押せて、yaml と json の両方が出る", async ({ page }) => {
    await 開く(page, "api-call");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml.length, "yaml が空 (検査が空振りしている)").toBeGreaterThan(50);
    // **図種がそのまま出る**。 組み立て済みの図から出すと `flow` に変わってしまう
    expect(yaml, "図種が出ていない").toContain("type: sequence");
    expect(yaml, "この図の矢印が出ていない").toContain("GET /users/:id");
    expect(yaml.startsWith("title:"), "先頭に空行が残っている").toBe(true);

    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const json = await page.locator(".catalog-source-code").first().innerText();
    const 読んだ = JSON.parse(json) as { type?: string; flow?: { label?: string }[] };
    expect(読んだ.type, "json の図種が違う").toBe("sequence");
    expect(
      (読んだ.flow ?? []).map((f) => f.label),
      "json にこの図の矢印が出ていない",
    ).toContain("GET /users/:id");
  });

  test("一覧の全件でコードのタブが押せる", async ({ page }) => {
    await page.goto("catalog/cookbook", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const 行 = page.locator("aside.catalog-sidebar .catalog-list-item");
    const 件数 = await 行.count();
    expect(件数, "一覧の行を 1 つも数えられていない (検査が空振りしている)").toBeGreaterThan(0);

    const タブ = page.getByRole("tab", { name: "コード" });
    for (let i = 0; i < 件数; i++) {
      await 行.nth(i).click();
      await expect(タブ, `${i + 1} 件目でコードのタブが押せない`).toBeEnabled({ timeout: 5000 });
    }
  });

  test("エディタで開くが押せる", async ({ page }) => {
    await 開く(page, "api-call");
    const 開くリンク = page.getByRole("link", { name: /エディタで開く/ });
    await expect(開くリンク, "エディタで開くが出ていない").toBeVisible();
    const href = await 開くリンク.getAttribute("href");
    expect(href ?? "", "エディタへ渡す中身が空").toContain("#");
  });
});
