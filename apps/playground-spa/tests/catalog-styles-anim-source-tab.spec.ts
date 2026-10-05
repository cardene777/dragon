/**
 * 見た目の見本と動きの見本でコードのタブが押せることの検査 (#1373)。
 *
 * `styles` は台帳に載せた見本だけ記法を持たず、それ以外は記法を持つ。
 * `animation` は全件が記法を持つ。
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
import { 一覧の行 } from "./catalog-item-pick";
import { 記法を持たない見本 } from "./helpers/catalog-items-without-notation";
import { 一覧が落ち着くまで待つ } from "./wait-for-render";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, ページ: string, 名前: string): Promise<void> {
  await page.goto(`catalog/${ページ}`, { waitUntil: "networkidle" });
  // 一覧が組み終わる前に押すと、押す側が要素の動きを待ち続けて 30 秒で落ちる (#2488)
  await 一覧が落ち着くまで待つ(page, ページ);
  await 一覧の行(page, 名前, false).click();
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

  test("一覧で台帳に応じてコードの有無が一致する", async ({ page }) => {
    await page.goto("catalog/styles", { waitUntil: "networkidle" });
    await 一覧が落ち着くまで待つ(page, "styles");

    const 行 = page.locator("aside.catalog-sidebar .catalog-list-item");
    const 件数 = await 行.count();
    expect(件数, "一覧の行を 1 つも数えられていない (検査が空振りしている)").toBeGreaterThan(0);
    const 記法なし = new Set<string>(記法を持たない見本.styles);
    const 一覧に現れた記法なし = new Set<string>();

    for (let i = 0; i < 件数; i++) {
      const 現在の行 = 行.nth(i);
      const id = await 現在の行.getAttribute("data-item-id");
      if (!id) throw new Error(`${i + 1} 件目の行に見本の id が無い`);

      await 現在の行.click();
      await page.waitForTimeout(200);
      const タブ = page.getByRole("tab", { name: "コード" });

      if (記法なし.has(id)) {
        一覧に現れた記法なし.add(id);
        await expect(タブ, `${id} は記法を持たないのにコードのタブが押せる`).toBeDisabled();
        continue;
      }

      await expect(タブ, `${i + 1} 件目でコードのタブが押せない`).toBeEnabled();
      await タブ.click();
      await page.waitForTimeout(200);
      const 本文 = await page.locator(".catalog-source-code").first().innerText();
      expect(本文.length, `${i + 1} 件目のコードが空`).toBeGreaterThan(50);
      await page.getByRole("tab", { name: "図", exact: true }).click();
      await page.waitForTimeout(100);
    }

    expect(
      [...記法なし].filter((id) => !一覧に現れた記法なし.has(id)),
      "記法を持たない見本の台帳に、styles の一覧へ現れない id がある",
    ).toEqual([]);
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
    // 見本の状態の値は #1881 で日本語にした (`idle` → `待機`)
    expect(yaml, "文字列の状態が出ていない").toContain('status: "待機"');
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
