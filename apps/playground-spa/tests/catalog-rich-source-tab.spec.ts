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
  await page.goto(`catalog/${ページ}`, { waitUntil: "networkidle" });
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
      await page.goto(`catalog/${ページ}`, { waitUntil: "networkidle" });
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

  test("同じページの別の項目では別のコードが出る (空振り防止)", async ({ page }) => {
    /*
     * 「どの項目でも同じものを出す」 形なら、上の検査は通っても意味を持たない。
     *
     * **押せない側を実在のページで見る形はやめた** (#1383)。 記法を持たないページを
     * 名指しする対照は 3 度移しており (`cookbook` は #1378、`ethereum` は #1374、
     * `parts` は #1381 で記法を持った)、残る `interactive` を埋めると移し先が尽きる。
     *
     * 押せない側は `src/lib/catalog-source-tab.test.tsx` が、検査の中で組み立てた見本で
     * 見る。 片方だけ記法を持つ形は台帳が実在のデータで許さないため、ページを何枚埋めても
     * 成立しなくなることがない。
     */
    await page.goto("catalog/animation", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const 行 = page.locator("aside.catalog-sidebar .catalog-list-item");
    const 件数 = await 行.count();
    expect(件数, "一覧の行を 2 つ以上数えられていない (検査が空振りしている)").toBeGreaterThan(1);

    const コードを読む = async (i: number): Promise<string> => {
      await 行.nth(i).click();
      await page.getByRole("tab", { name: "コード" }).click();
      await page.waitForTimeout(300);
      return page.locator(".catalog-source-code").first().innerText();
    };

    const 一件目 = await コードを読む(0);
    const 二件目 = await コードを読む(1);
    expect(一件目.length, "1 件目のコードが空 (検査が空振りしている)").toBeGreaterThan(20);
    expect(二件目.length, "2 件目のコードが空 (検査が空振りしている)").toBeGreaterThan(20);
    expect(二件目, "別の項目を選んでも同じコードが出ている").not.toBe(一件目);

    // 差が無い入力でも差を検出しないことを見る (陰性対照)。 同じ項目を選び直せば
    // 同じコードが出るはずで、ここが落ちるなら「常に違う」 と判定している
    const 一件目もう一度 = await コードを読む(0);
    expect(一件目もう一度, "同じ項目を選び直したのに違うコードが出ている").toBe(一件目);
  });
});
