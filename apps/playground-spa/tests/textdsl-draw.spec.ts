/**
 * Text DSL のページでも起点から描かれることの検査 (#1363)。
 *
 * `charts` は #1318、`presets` は #1358 で埋めたが、このページの 3 件が漏れていた。
 * 組み立てまでは `packages/dragon/test/catalog-draw-coverage-1363.test.ts` が全ページで見る。
 * ここでは **記法から画面まで通っているか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test textdsl-draw`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

/** 見本を開く */
async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/text-dsl", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar").getByText(名前, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

/**
 * 一定時間見て、観測できた状態の種類を集める。
 *
 * 1 回に読んだ全要素を 1 つの状態として比べる。 値を個別に集めると、複数の要素が同じ瞬間に
 * 違う値を持つだけで「動いた」 と判定し、止まった図も通る (#1357 の指摘)。
 *
 * 窓は 1 周より長く取る = 描く段を 2.4 秒にしたため、短いと段を跨げない (#1361 の実測)。
 */
async function 状態の種類(page: Page, 読む: () => Promise<string[]>): Promise<Set<string>> {
  const 値 = new Set<string>();
  for (let i = 0; i < 120; i++) {
    const 今 = await 読む();
    if (今.length > 0) 値.add(JSON.stringify(今));
    if (値.size >= 2) break;
    await page.waitForTimeout(100);
  }
  return 値;
}

test.describe("Text DSL の見本も起点から描かれる (#1363)", () => {
  test("ガント: 帯の倍率が動く", async ({ page }) => {
    await 開く(page, "テキストDSLのガント");
    const 値 = await 状態の種類(page, () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-cdl-role="gantt-bar"]'))
          .map((el) => el.parentElement?.getAttribute("transform") ?? "")
          .filter((t) => t.includes("scale(")),
      ),
    );
    expect(値.size, `倍率が動かない (観測できた値 = ${[...値].join(" | ")})`).toBeGreaterThanOrEqual(2);
  });

  test("円グラフ: 切り抜きの形が変わる", async ({ page }) => {
    await 開く(page, "テキストDSLの円グラフ");
    const 値 = await 状態の種類(page, () =>
      page.evaluate(() => {
        const clip = document.querySelector('clipPath[id^="cdl-pie-draw-"]');
        return clip ? [clip.firstElementChild?.tagName ?? "?"] : [];
      }),
    );
    expect(値.size, `切り抜きの形が変わらない (観測できた形 = ${[...値].join(", ")})`).toBeGreaterThanOrEqual(2);
  });

  test("マインドマップ: 枝の残りが動く", async ({ page }) => {
    await 開く(page, "テキストDSLのマインドマップ");
    const 値 = await 状態の種類(page, () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-cdl-role="mind-edge"]'))
          .map((el) => el.getAttribute("stroke-dashoffset"))
          .filter((v): v is string => v !== null),
      ),
    );
    expect(値.size, `残りが動かない (観測できた値 = ${[...値].join(", ")})`).toBeGreaterThanOrEqual(2);
  });

  test("起点から描けない見本は動かない (陰性対照)", async ({ page }) => {
    /*
     * 「このページの図はどれも何か動いている」 形なら、上の 3 件は通っても意味を持たない。
     * 起点から描けない種別 (順序図) では、起点から描く印が 1 つも付かないことを見る。
     */
    await 開く(page, "テキストDSLのシーケンス");
    await page.waitForTimeout(600);
    const 印 = await page.evaluate(() => ({
      残り: document.querySelectorAll("[stroke-dashoffset]").length,
      切り抜き: document.querySelectorAll('clipPath[id^="cdl-pie-draw-"]').length,
    }));
    expect(印, "描けない見本に起点から描く印が付いている").toEqual({ 残り: 0, 切り抜き: 0 });
  });
});
