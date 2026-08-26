/**
 * 2 段目以降の描き方の切替 (#1359)。
 *
 * 押した側が **図とコードの両方** に出ることを画面で見る。
 * 片方だけ動く形 (図は引き直すのにコードは元のまま等) を落とすのが目的。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-redraw-toggle`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

/** コードタブに出ている段ごとの `draw` の有無を並べる */
async function コードの描く段(page: Page): Promise<boolean[]> {
  const src = await page.locator(".catalog-source-code").first().innerText();
  const 位置 = [
    ...src.matchAll(/^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+\d+(?:\.\d+)?s[ \t]*$/gm),
  ].map((m) => m.index ?? 0);
  return 位置.map((始, i) => {
    const 本体 = src.slice(始, i + 1 < 位置.length ? 位置[i + 1] : src.length);
    return /^[ \t]*draw:/m.test(本体);
  });
}

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText(名前, { exact: true }).first().click();
  await page.waitForTimeout(400);
}

test.describe("2 段目以降の描き方を切替えられる (#1359)", () => {
  test("切替が 2 つ出ていて、既定は動かすだけ", async ({ page }) => {
    await 開く(page, "折れ線グラフ");
    const 群 = page.getByRole("radiogroup", { name: "2 段目以降" });
    await expect(群).toBeVisible();
    await expect(群.getByRole("radio")).toHaveCount(2);
    await expect(群.getByRole("radio", { name: "動かすだけ" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("起点から描けない図では切替が出ない (陰性対照)", async ({ page }) => {
    /*
     * 「どの図でも出る」 形なら、上の検査は通っても意味を持たない。
     * 描けない図 (シーケンス図) では出ないことを見る。
     */
    await 開く(page, "シーケンス図");
    await expect(page.getByRole("radiogroup", { name: "2 段目以降" })).toHaveCount(0);
    // 速さの切替は出たままであることも見る = 列ごと消えたのではない
    await expect(page.getByRole("radiogroup", { name: "再生速度" })).toBeVisible();
  });

  test("描き直すに切替えるとコードの 2 段目にも描く指定が出る", async ({ page }) => {
    await 開く(page, "折れ線グラフ");
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);

    const 元 = await コードの描く段(page);
    expect(元.length, "コードに段を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(1);
    expect(元, "元は 1 段目だけが描く").toEqual([true, false]);

    await page.getByRole("radio", { name: "描き直す" }).click();
    await page.waitForTimeout(300);
    expect(await コードの描く段(page)).toEqual([true, true]);
  });

  test("動かすだけに戻すとコードも元に戻る", async ({ page }) => {
    await 開く(page, "折れ線グラフ");
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);

    const 元 = await コードの描く段(page);
    await page.getByRole("radio", { name: "描き直す" }).click();
    await page.waitForTimeout(300);
    await page.getByRole("radio", { name: "動かすだけ" }).click();
    await page.waitForTimeout(300);

    expect(await コードの描く段(page)).toEqual(元);
  });

  test("図の側にも効く (描き直すと 2 段目でも線の残りが動く)", async ({ page }) => {
    /*
     * 2 段目は本文が「実績に置き換えると…」 の段。 その段に入っている時に線の残り
     * (`stroke-dashoffset`) が付いているかを見る。
     *
     * 動かすだけの時は 2 段目に残りが付かない (属性そのものが出ない)。
     * 引き直す時は付く。 段の名前で今どの段かを判定する。
     */
    const 二段目を数える = async (page: Page): Promise<{ 残りあり: number; 見た: number }> => {
      let 残りあり = 0;
      let 見た = 0;
      for (let i = 0; i < 60; i++) {
        /*
         * **今どの段かを、線と同じ枝から読む** (#1381)。
         *
         * 段の札 (`.cdl-phase-chip`) は図とは別の枝にあり、更新が揃う保証が無い。 段が
         * 切り替わる瞬間に「札は 2 段目だが図はまだ 1 段目の残りを持っている」 状態が現れ、
         * 全件を並列で回して負荷が上がると「動かすだけ」 側が 1 を数えて落ちていた。
         *
         * #1365 では「2 回続けて 2 段目だった時だけ数える」 形でこの窓を外したが、
         * 負荷が上がると窓が 2 sample に伸びて再発した (#1381 の全件実行で実測)。
         * 窓を広げても同じことが起きるので、**窓そのものを無くす**。
         *
         * 図の枠は `data-cdl-phase-index` で今の段を持つ。 線の祖先から辿れば、段と残りが
         * 同じ描画から出た値になるため、2 つがずれることが構造的に起きない。
         */
        const 見たもの = await page.evaluate(() => {
          const el = document.querySelector('[data-cdl-role="chart-line"]');
          const 枠 = el?.closest("[data-cdl-phase-index]");
          return {
            段: 枠?.getAttribute("data-cdl-phase-index") ?? null,
            残り: el?.getAttribute("stroke-dashoffset") ?? null,
          };
        });
        if (見たもの.段 === "1") {
          見た += 1;
          if (見たもの.残り !== null) 残りあり += 1;
        }
        await page.waitForTimeout(100);
      }
      return { 残りあり, 見た };
    };

    await 開く(page, "折れ線グラフ");
    const 動かすだけ = await 二段目を数える(page);

    await page.getByRole("radio", { name: "描き直す" }).click();
    await page.waitForTimeout(400);
    const 描き直す = await 二段目を数える(page);

    // 2 段目を 1 度も見ていなければ、下の 2 つは通って当然になる
    expect(
      動かすだけ.見た,
      "動かすだけで 2 段目を 1 度も見ていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(
      描き直す.見た,
      "描き直すで 2 段目を 1 度も見ていない (検査が空振りしている)",
    ).toBeGreaterThan(0);

    expect(動かすだけ.残りあり, "動かすだけなのに 2 段目で線を引き直している").toBe(0);
    expect(描き直す.残りあり, "描き直すのに 2 段目で線を引き直していない").toBeGreaterThan(0);
  });

  test("項目を選び直すと動かすだけに戻る", async ({ page }) => {
    await 開く(page, "折れ線グラフ");
    await page.getByRole("radio", { name: "描き直す" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole("radio", { name: "描き直す" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.getByText("円グラフ", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await expect(page.getByRole("radio", { name: "動かすだけ" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
