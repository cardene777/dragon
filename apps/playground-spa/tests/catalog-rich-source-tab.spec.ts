/**
 * 動きの豊かな見本でコードのタブが押せることの検査 (#1374)。
 *
 * この 9 件 (`animation` の rich 5 件 / `ethereum` 4 件) は `dyn-wave` / `dyn-arc` の箱に
 * 図形を渡し、値を見せる部品を使う。 記法にその 2 つを書く欄が無かったため、
 * 見本帳で最も動きが豊かなページだけコードのタブが押せなかった。
 *
 * 記法と組み立て API が同じ図になることは `src/lib/catalog-source-parity.test.tsx` が見る。
 * ここでは **画面から読めるか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-rich-source-tab`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, ページ: string, 名前: string): Promise<void> {
  await page.goto(`/catalog/${ページ}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar").getByText(名前, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

test.describe("動きの豊かな見本で記法が読める (#1374)", () => {
  test("箱の中の図形と、値を見せる部品が記法に出る", async ({ page }) => {
    await 開く(page, "animation", "animation-rich-pipeline-demo");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml.length, "yaml が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(yaml, "値を見せる部品が出ていない").toContain("readouts:");
    expect(yaml, "割合の輪が出ていない").toContain("kind: percent-ring");
    expect(yaml, "箱の中の図形が出ていない").toContain("shape: { kind: wave");
    expect(yaml, "図形の水位が状態を指していない").toContain('level: "{s1}"');

    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const json = await page.locator(".catalog-source-code").first().innerText();
    const 読んだ = JSON.parse(json) as {
      readouts?: { kind?: string }[];
      actors?: { shape?: { kind?: string } }[];
    };
    expect(
      (読んだ.readouts ?? []).map((r) => r.kind),
      "json に割合の輪が無い",
    ).toContain("percent-ring");
    expect(
      (読んだ.actors ?? []).map((a) => a.shape?.kind),
      "json に箱の中の図形が無い",
    ).toContain("wave");
  });

  test("Ethereum の見本でも押せる", async ({ page }) => {
    // ページが違うと拾い方も違う。 1 ページだけ見ても両方に効いたことは分からない
    await 開く(page, "ethereum", "eth-erc20-transfer");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml, "数え上げの部品が出ていない").toContain("kind: countup");
    expect(yaml, "箱の中の図形が出ていない").toContain("shape: { kind: wave");
  });

  test("2 ページの全件でコードのタブが押せる", async ({ page }) => {
    for (const ページ of ["animation", "ethereum"]) {
      await page.goto(`/catalog/${ページ}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);

      const 行 = page.locator("aside.catalog-sidebar .catalog-list-item");
      const 件数 = await 行.count();
      expect(件数, `${ページ} の一覧の行を 1 つも数えられていない`).toBeGreaterThan(0);

      const タブ = page.getByRole("tab", { name: "コード" });
      for (let i = 0; i < 件数; i++) {
        await 行.nth(i).click();
        await expect(タブ, `${ページ} の ${i + 1} 件目でコードのタブが押せない`).toBeEnabled({
          timeout: 5000,
        });
      }
    }
  });

  test("記法を持たないページではまだ押せない (陰性対照)", async ({ page }) => {
    /*
     * 「どのページでも押せる」 形なら上の検査は通っても意味を持たない。
     * 残る 2 ページ (`parts` / `interactive`) は記法をまだ書いていないので押せない。
     */
    await page.goto("/catalog/parts", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("tab", { name: "コード" }),
      "記法を持たないページでタブが押せる",
    ).toBeDisabled();
  });
});
