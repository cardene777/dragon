/**
 * 構成の見本のページでコードのタブが押せることの検査 (#1371)。
 *
 * このページの 12 件は組み立て API だけで書かれていて、記法が画面に出ていなかった =
 * 「コード」 のタブが押せず「編集画面で開く」 も出なかった。
 *
 * 記法と組み立て API が同じ図になることは `src/lib/catalog-source-parity.test.tsx` が見る。
 * ここでは **画面から読めるか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-patterns-source-tab`
 */
import { test, expect } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/patterns", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await 一覧の行(page, 名前, false).click();
  await page.waitForTimeout(300);
}

test.describe("構成の見本で記法が読める (#1371)", () => {
  test("コードのタブが押せて、yaml と json の両方が出る", async ({ page }) => {
    await 開く(page, "pattern-fan-out");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml.length, "yaml が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(yaml, "題が出ていない").toContain("title:");
    expect(yaml, "図の種別が出ていない").toContain("type: flow");
    expect(yaml, "縦列が出ていない").toContain("lanes:");
    expect(yaml, "この図の箱が出ていない").toContain("配り手");

    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const json = await page.locator(".catalog-source-code").first().innerText();
    // **JSON として読めること**。 文字列に含まれるかだけを見ると、yaml をそのまま出しても通る
    const 読んだ = JSON.parse(json) as { type?: string; actors?: { name?: string }[] };
    expect(読んだ.type, "json の図の種別が違う").toBe("flow");
    expect(
      (読んだ.actors ?? []).map((a) => a.name),
      "json にこの図の箱が出ていない",
    ).toContain("配り手");
  });

  test("一覧の全件でコードが空にならない", async ({ page }) => {
    /*
     * 1 件だけ見ても「その 1 件に書いた」 ことしか分からない。 一覧を順に押して全件を見る。
     * 記法を書き忘れた見本があれば、そこでタブが押せずに落ちる。
     */
    await page.goto("catalog/patterns", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const 行 = page.locator("aside.catalog-sidebar .catalog-list-item");
    const 件数 = await 行.count();
    expect(件数, "一覧の行を 1 つも数えられていない (検査が空振りしている)").toBeGreaterThan(0);

    for (let i = 0; i < 件数; i++) {
      await 行.nth(i).click();
      await page.waitForTimeout(200);
      const タブ = page.getByRole("tab", { name: "コード" });
      await expect(タブ, `${i + 1} 件目でコードのタブが押せない`).toBeEnabled();
      await タブ.click();
      await page.waitForTimeout(200);
      const 本文 = await page.locator(".catalog-source-code").first().innerText();
      expect(本文.length, `${i + 1} 件目のコードが空`).toBeGreaterThan(50);
      await page.getByRole("tab", { name: "図", exact: true }).click();
      await page.waitForTimeout(100);
    }
  });

  test("編集画面で開くが押せる", async ({ page }) => {
    // 記法があると図をエディタへ渡せる。 記法を足した目的の 1 つがこれ
    await 開く(page, "pattern-fan-out");
    const 開くリンク = page.getByRole("link", { name: /編集画面で開く/ });
    await expect(開くリンク, "編集画面で開くが出ていない").toBeVisible();
    const href = await 開くリンク.getAttribute("href");
    expect(href ?? "", "エディタへ渡す中身が空").toContain("#");
  });
});
