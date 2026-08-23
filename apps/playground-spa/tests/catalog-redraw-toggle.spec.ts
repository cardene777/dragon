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
  await page.goto("/catalog/presets", { waitUntil: "networkidle" });
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
    const 二段目で残りが付いた回数 = async (page: Page): Promise<number> => {
      let n = 0;
      let 前も2段目 = false;
      for (let i = 0; i < 60; i++) {
        const 見た = await page.evaluate(() => {
          const 札 = document.querySelector(".cdl-phase-chip")?.textContent ?? "";
          const el = document.querySelector('[data-cdl-role="chart-line"]');
          return { 札, 残り: el?.getAttribute("stroke-dashoffset") ?? null };
        });
        // 1 段目の名前は「計画」。 それ以外の段に居る時だけ数える
        const 今2段目 = !見た.札.includes("計画");
        /*
         * **2 回続けて 2 段目だった時だけ数える** (#1365 で実測)。
         *
         * 段の札と図は別々に更新されるため、段が切り替わる瞬間に「札は 2 段目だが図はまだ
         * 1 段目の dash を持っている」 状態が 1 sample だけ現れる。 全件を並列で回して負荷が
         * 上がると再現し、「動かすだけ」 側が 1 を数えて落ちていた。
         *
         * 続けて 2 回見れば切り替わりの瞬間は外れる。 2 段目は 0.9 秒あって 9 sample 取れるので、
         * 引き直している時は依然として何度も数えられる。
         */
        if (今2段目 && 前も2段目 && 見た.残り !== null) n += 1;
        前も2段目 = 今2段目;
        await page.waitForTimeout(100);
      }
      return n;
    };

    await 開く(page, "折れ線グラフ");
    const 動かすだけ = await 二段目で残りが付いた回数(page);

    await page.getByRole("radio", { name: "描き直す" }).click();
    await page.waitForTimeout(400);
    const 描き直す = await 二段目で残りが付いた回数(page);

    expect(動かすだけ, "動かすだけなのに 2 段目で線を引き直している").toBe(0);
    expect(描き直す, "描き直すのに 2 段目で線を引き直していない").toBeGreaterThan(0);
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
