/**
 * 見た目の見本と動きの見本でコードのタブが押せることの検査 (#1373)。
 *
 * `styles` は全 10 件、`animation` は 5 件だけ記法を持つ。 残り 5 件は
 * `dyn-wave` / `dyn-arc` の箱に `shape` を渡し `readouts` を使うため記法で書けない。
 *
 * **同じページの中で押せる件と押せない件が混ざる**。 この形は他のページに無いので、
 * 「押せること」 と「押せないこと」 を両方見る。 片方だけだと、記法を全件に付け忘れた形と
 * 全件に付いた形が区別できない。
 *
 * 記法と組み立て API が同じ図になることは `src/lib/catalog-source-parity.test.tsx` が見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-styles-anim-source-tab`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, ページ: string, 名前: string): Promise<void> {
  await page.goto(`/catalog/${ページ}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar").getByText(名前, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

test.describe("見た目の見本で記法が読める (#1373)", () => {
  test("コードのタブが押せて、yaml と json の両方が出る", async ({ page }) => {
    await 開く(page, "styles", "tone-teal");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml.length, "yaml が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(yaml, "図の種別が出ていない").toContain("type: flow");
    expect(yaml, "この図の色が出ていない").toContain("(teal, solid)");

    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const json = await page.locator(".catalog-source-code").first().innerText();
    const 読んだ = JSON.parse(json) as { flow?: { tone?: string; style?: string }[] };
    expect(読んだ.flow?.[0]?.tone, "json の色が違う").toBe("teal");
    expect(読んだ.flow?.[0]?.style, "json の線種が違う").toBe("solid");
  });

  test("一覧の全件でコードが空にならない", async ({ page }) => {
    await page.goto("/catalog/styles", { waitUntil: "networkidle" });
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
});

test.describe("動きの見本で記法が読める (#1373 / #1374)", () => {
  test("記法を持つ件はコードのタブが押せる", async ({ page }) => {
    await 開く(page, "animation", "set-switch");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml, "文字列の状態が出ていない").toContain('status: "idle"');
    expect(yaml, "即時切替が出ていない").toContain("set:");
  });

  test("rich な件でも押せるようになった (#1374)", async ({ page }) => {
    /*
     * **元は陰性対照だった**。 `shape` と `readouts` を使う 5 件は記法で書けなかったため
     * 「このページでも押せない件がある」 ことを見ていた。 #1374 で記法に欄を足したので、
     * 押せる側に変わった。
     *
     * 陰性対照は `catalog-rich-source-tab.spec.ts` が `parts` で持つ (まだ記法が無いページ)。
     */
    await 開く(page, "animation", "animation-rich-pipeline-demo");
    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "rich な件でコードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);
    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml, "箱の中の図形が出ていない").toContain("shape: { kind: wave");
    expect(yaml, "値を見せる部品が出ていない").toContain("readouts:");
  });
});
