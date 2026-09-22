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
import { 一覧の行 } from "./catalog-item-pick";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/text-dsl", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await 一覧の行(page, 名前, false).click();
  await page.waitForTimeout(300);
}

test.describe("Text DSL のページで記法が読める (#1365)", () => {
  test("コードのタブが押せて、記法が出る", async ({ page }) => {
    await 開く(page, "テキスト記法の工程表");

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
    await 開く(page, "テキスト記法の工程表");
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

  test("選ぶ項目を変えるとコードも変わる (空振り防止)", async ({ page }) => {
    /*
     * 「どの項目でも同じものを出す」 形なら、上の検査は通っても意味を持たない。
     * 別の項目を選ぶと別の記法が出ることを見る = 画面が選んだ項目の記法を読んでいる。
     *
     * **押せない側を実在のページで見る形はやめた** (#1383)。 記法を持たないページを
     * 名指しする対照は 3 度移しており (`cookbook` は #1378、`ethereum` は #1374、
     * `parts` は #1381 で記法を持った)、残る `interactive` を埋めると移し先が尽きる。
     * 対照が「まだ埋めていないページがある」 ことに依存しているのが誤りだった。
     *
     * 押せない側は `src/lib/catalog-source-tab.test.tsx` が、検査の中で組み立てた見本で
     * 見る。 片方だけ記法を持つ形は台帳が実在のデータで許さないため、ページを何枚埋めても
     * 成立しなくなることがない。
     */
    await page.goto("catalog/text-dsl", { waitUntil: "networkidle" });
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
