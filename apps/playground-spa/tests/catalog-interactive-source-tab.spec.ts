/**
 * 動く見本でコードのタブが押せることの検査 (#1385)。
 *
 * このページは #1394 で **全件が記法を持つ** ようになった。
 *
 * 記法と組み立て API が同じ図になることは `src/lib/catalog-source-parity.test.tsx` が見る。
 * ここでは **画面から読めるか** を見る。
 *
 * ## 陰性対照はここに置かない (#1394)
 *
 * 「記法を持たない見本ではタブが押せない」 の対照は、このページに記法の無い見本が残って
 * いることを前提にしていた。 全件が埋まって成立しなくなり、移し先も尽きたため削除した
 * (移動は #1383 / #1389 / #1393 / #1394 で 4 度)。
 *
 * **同じ性質は組み立てた対照が守る**。 `src/pages/catalog-preview-tabs.test.tsx` の
 * 「記法を持たない図ではコードのタブを押せない (陰性対照)」 が、記法だけを消した見本を
 * その場で作って画面へ渡す = 実在の見本が何件記法を持っても壊れない。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-interactive-source-tab`
 */
import { test, expect } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/interactive", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await 一覧の行(page, 名前, false).click();
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

});
