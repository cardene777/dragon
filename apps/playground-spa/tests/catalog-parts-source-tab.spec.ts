/**
 * 基本パーツの見本でコードのタブが押せることの検査 (#1381)。
 *
 * この 80 件は箱の中の図形と、値を見せる部品を組み合わせた「使い回す部品」 で、記法に
 * 3 つ足りなかったため 1 件も記法を持てなかった (部品の種類が 9 種しか無い / 場所だけを
 * 空ける見えない箱を書けない / 名前と題を切り離せない)。
 *
 * 記法と組み立て API が同じ図になることは `src/lib/catalog-source-parity.test.tsx` が見る。
 * ここでは **画面から読めるか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-parts-source-tab`
 */
import { test, expect } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/parts", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await 一覧の行(page, 名前, false).click();
  await page.waitForTimeout(300);
}

test.describe("基本パーツで記法が読める (#1381)", () => {
  test("組の並びを取る部品と、見えない箱が記法に出る", async ({ page }) => {
    await 開く(page, "parts-status-dot");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml.length, "yaml が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(yaml, "値を見せる部品が出ていない").toContain("readouts:");
    expect(yaml, "#1381 で足した部品が出ていない").toContain("kind: status-dot");
    expect(yaml, "組の並びが出ていない").toContain('map: [{ value: "online"');
    expect(yaml, "出す条件が出ていない").toContain('visibleIf: "0"');
    expect(yaml, "空の題が出ていない").toContain('title: ""');

    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const json = await page.locator(".catalog-source-code").first().innerText();
    const 読んだ = JSON.parse(json) as {
      readouts?: { kind?: string; map?: unknown[] }[];
      actors?: { visibleIf?: string; title?: string }[];
    };
    expect(
      (読んだ.readouts ?? []).map((r) => r.kind),
      "json に #1381 で足した部品が無い",
    ).toContain("status-dot");
    expect((読んだ.readouts ?? [])[0]?.map, "json に組の並びが無い").toHaveLength(3);
    expect(
      (読んだ.actors ?? []).map((a) => a.visibleIf),
      "json に出す条件が無い",
    ).toContain("0");
  });

  test("箱の中の図形を持つ見本でも押せる", async ({ page }) => {
    // 部品を使う見本と、図形を使う見本では拾い方が違う
    await 開く(page, "parts-wave-gauge");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml, "箱の中の図形が出ていない").toContain("shape: { kind: wave");
    expect(yaml, "図形の水位が状態を指していない").toContain('level: "{lv}"');
  });

  test("同じ題の箱を並べる見本で、名前と題が分かれて出る", async ({ page }) => {
    // 名前は 1 つに決まる必要があり、題は重なってよい。 分かれていないと 5 つの箱が 1 つに潰れる
    await 開く(page, "parts-rating-stars");

    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);
    const yaml = await page.locator(".catalog-source-code").first().innerText();
    const 題の数 = [...yaml.matchAll(/title: "★"/g)].length;
    expect(題の数, "同じ題の箱が並んでいない").toBeGreaterThan(1);
  });

  test("80 件すべてでコードのタブが押せる", async ({ page }) => {
    await page.goto("catalog/parts", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const 行 = page.locator("aside.catalog-sidebar .catalog-list-item");
    const 件数 = await 行.count();
    expect(件数, "一覧の行を 1 つも数えられていない").toBeGreaterThan(0);

    const タブ = page.getByRole("tab", { name: "コード" });
    for (let i = 0; i < 件数; i++) {
      await 行.nth(i).click();
      await expect(タブ, `${i + 1} 件目でコードのタブが押せない`).toBeEnabled({ timeout: 5000 });
    }
  });
});
