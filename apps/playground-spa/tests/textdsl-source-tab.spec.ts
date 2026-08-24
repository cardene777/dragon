/**
 * 「Text DSL」 のページでコードのタブが押せることの検査 (#1365)。
 *
 * このページは「記法で書くと図になる」 ことを見せる場所なのに、記法が画面に出ていなかった。
 * 組み立てまでは `packages/dragon/test/textdsl-source-1365.test.ts` が見る。
 * ここでは **タブが押せて記法が読めるか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test textdsl-source-tab`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("/catalog/text-dsl", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar").getByText(名前, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

test.describe("Text DSL のページで記法が読める (#1365)", () => {
  test("コードのタブが押せて、記法が出る", async ({ page }) => {
    await 開く(page, "テキストDSLのガント");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const 本文 = await page.locator(".catalog-source-code").first().innerText();
    expect(本文.length, "コードが空 (検査が空振りしている)").toBeGreaterThan(50);
    // 記法の骨格が読める
    expect(本文, "題が出ていない").toContain("title:");
    expect(本文, "図の種別が出ていない").toContain("type: gantt");
    expect(本文, "段が出ていない").toContain("animation:");
    // 画面の動きを決めている行も読める (#1364 で足した指定)
    expect(本文, "描く指定が出ていない").toContain("draw: gantt");
  });

  test("速度を変えるとコードの秒数も変わる (既にある仕組みが効く)", async ({ page }) => {
    /*
     * 記法を出すようにした以上、速度の切替 (#1356) がこのページでも効く必要がある。
     * 出す経路が同じ (`SourceTabs`) なので効くはずだが、確かめていないと分からない。
     */
    await 開く(page, "テキストDSLのガント");
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);

    const 秒 = async (): Promise<number[]> => {
      const src = await page.locator(".catalog-source-code").first().innerText();
      return [
        ...src.matchAll(/^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+(\d+(?:\.\d+)?)s[ \t]*$/gm),
      ].map((m) => Number(m[1]));
    };

    const 元 = await 秒();
    expect(元.length, "段の秒数を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);

    await page.getByRole("radio", { name: "0.5x" }).click();
    await page.waitForTimeout(300);
    expect(await 秒()).toEqual(元.map((v) => v * 2));
  });

  test("記法を登録していないページではタブが押せない (陰性対照)", async ({ page }) => {
    /*
     * 「どのページでも押せる」 形なら、上の検査は通っても意味を持たない。
     * 記法を 1 件も登録していないページでは従来どおり押せない。
     *
     * **対象は `interactive` に移した** (#1381)。 元は `cookbook` (#1378 で移す前) →
     * `parts` (#1378) と辿っており、どちらも後から記法を持って対照でなくなった。
     * 記法を持たないページは `interactive` だけになったので、次に埋める時は実在のページで
     * 対照を取る形そのものを変える。
     */
    await page.goto("/catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("tab", { name: "コード" }),
      "記法を登録していないページでタブが押せる",
    ).toBeDisabled();
  });
});
