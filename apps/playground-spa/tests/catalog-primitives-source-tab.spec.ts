/**
 * 基本パーツの見本でコードのタブが押せることの検査 (#1376)。
 *
 * このページは 110 件あり、記法を持つのは 30 件だけだった。 残る 80 件はコードのタブが
 * 押せず、「編集画面で開く」 も出なかった。
 *
 * **先にあった 30 件も図とずれていた**。 縦列の幅と見出し、箱の上の小見出し、段の札が
 * 落ちていて、コードのタブに別の図になる記法が出ていた。 110 件とも出し直した。
 *
 * 記法と組み立て API が同じ図になることは `src/lib/catalog-source-parity.test.tsx` が見る。
 * ここでは **画面から読めるか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-primitives-source-tab`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/primitives", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar").getByText(名前, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

test.describe("基本パーツの見本で記法が読める (#1376)", () => {
  test("コードのタブが押せて、yaml と json の両方が出る", async ({ page }) => {
    await 開く(page, "shape-file");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml.length, "yaml が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(yaml, "この図の種別が出ていない").toContain("kind: shape-file");
    expect(yaml, "箱の上の小見出しが出ていない").toContain("eyebrow:");

    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const json = await page.locator(".catalog-source-code").first().innerText();
    const 読んだ = JSON.parse(json) as { actors?: { kind?: string; eyebrow?: string }[] };
    expect(読んだ.actors?.[0]?.kind, "json の種別が違う").toBe("shape-file");
    expect(読んだ.actors?.[0]?.eyebrow, "json に小見出しが無い").toBeTruthy();
  });

  test("先にあった 30 件も図に合わせて出し直されている", async ({ page }) => {
    /*
     * 出し直す前は縦列の見出しと箱の小見出しと段の札が落ちていた。
     * 図に出ている要素が記法にも出ることを 1 件で確かめる。
     */
    await 開く(page, "scene-crypto-transfer");
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    // 見本の仮置きの字は #1894 で日本語にした (`wallet` → `財布`)
    expect(yaml, "箱の上の小見出しが落ちている").toContain('eyebrow: "財布"');
    expect(yaml, "段の札が落ちている").toContain('badge: "財布"');
    expect(yaml, "縦列の幅が書かれていない").toContain("width: 440");
  });

  test("一覧の全件でコードのタブが押せる", async ({ page }) => {
    /*
     * 1 件だけ見ても「その 1 件に書いた」 ことしか分からない。 110 件を順に押して全件を見る。
     * 記法を書き忘れた見本があれば、そこでタブが押せずに落ちる。
     */
    test.setTimeout(180_000);
    await page.goto("catalog/primitives", { waitUntil: "networkidle" });
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
});
