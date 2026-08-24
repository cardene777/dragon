/**
 * 動く見本でコードのタブが押せることの検査 (#1385)。
 *
 * このページは **全件が記法を持つわけではない**。 つまみ (`inputs`) は記法で書けるが、
 * 式や押下、巻き上げで値が変わる仕掛け (`formulas` / `eventBindings` / `scrollTriggers`) などは、
 * 記法が図を書くためのものなのでまだ書けない。
 *
 * 記法と組み立て API が同じ図になることは `src/lib/catalog-source-parity.test.tsx` が見る。
 * ここでは **画面から読めるか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-interactive-source-tab`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("/catalog/interactive", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar").getByText(名前, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

test.describe("動く見本で記法が読める (#1385)", () => {
  test("生成した表で足した部品が記法に出る", async ({ page }) => {
    await 開く(page, "interactive-exemplar-payment-flow");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml.length, "yaml が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(yaml, "値を見せる部品が出ていない").toContain("readouts:");
    // 生成した表で足った種類 (元の 16 種には無い)
    expect(yaml, "生成した表で足した部品が出ていない").toContain("kind: traffic-light");

    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const json = await page.locator(".catalog-source-code").first().innerText();
    const 読んだ = JSON.parse(json) as { readouts?: { kind?: string }[] };
    expect((読んだ.readouts ?? []).length, "json に部品が無い").toBeGreaterThan(0);
  });

  test("矢印がどの辺から出るかが記法に出る", async ({ page }) => {
    // `side:` は #1385 で足した欄。 これを書く見本で実際に出ることを見る
    await 開く(page, "interactive-ab-test");

    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);
    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml, "矢印がどの辺から出るかが出ていない").toContain("side:");
  });

  test("記法を持たない見本ではタブが押せない", async ({ page }) => {
    /*
     * **これは実在ページ依存の対照ではない** (#1383)。 このページは記法を持つ見本と持たない
     * 見本が同居するのが仕様で、埋め終わっても解消しない = 図の値が動く仕掛けの一部は
     * 記法で書けない。
     *
     * 「どの見本でも押せる」 形なら上の検査は通っても意味を持たないので、押せない側を
     * 同じページの中で見る。
     *
     * **対象はつまみを使う見本ではない** (#1389)。 つまみ (`inputs:`) は記法で書けるように
     * なったため、それだけを使う見本はコードのタブが押せる側へ移った。 巻き上げ
     * (`scrollTriggers`) を使うこの見本は記法に書く項目が無く、押せない側に残る。
     */
    await 開く(page, "interactive-scroll-narrative");
    await expect(
      page.getByRole("tab", { name: "コード" }),
      "巻き上げを使う見本でコードのタブが押せる",
    ).toBeDisabled();
  });

  test("押せる見本と押せない見本の両方が実在する", async ({ page }) => {
    // 上の 2 件は 1 件ずつしか見ないので、ページ全体での内訳も数える
    await page.goto("/catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const 行 = page.locator("aside.catalog-sidebar .catalog-list-item");
    const 件数 = await 行.count();
    expect(件数, "一覧の行を 1 つも数えられていない").toBeGreaterThan(0);

    const タブ = page.getByRole("tab", { name: "コード" });
    let 押せる = 0;
    let 押せない = 0;
    for (let i = 0; i < 件数; i++) {
      await 行.nth(i).click();
      await page.waitForTimeout(60);
      if (await タブ.isEnabled()) 押せる += 1;
      else 押せない += 1;
    }
    expect(押せる, "押せる見本が 1 件も無い").toBeGreaterThan(0);
    expect(押せない, "押せない見本が 1 件も無い (このページは両方あるはず)").toBeGreaterThan(0);
    expect(押せる + 押せない, "数えた件数が一覧と合わない").toBe(件数);
  });
});
