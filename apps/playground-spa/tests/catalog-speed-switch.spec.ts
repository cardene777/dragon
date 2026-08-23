/**
 * 見本帳の再生速度の切替 (#1355)。
 *
 * 押した倍率が **図とコードの両方** に出ることを画面で見る。
 * 片方だけ動く形 (図は速くなったのにコードは元のまま等) を落とすのが目的。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-speed-switch`
 */
import { test, expect } from "@playwright/test";

/** コードタブに出ている段の秒数を並び順に読む */
async function コードの秒数(page: import("@playwright/test").Page): Promise<number[]> {
  const src = await page.locator(".catalog-source-code").first().innerText();
  return [...src.matchAll(/^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+(\d+(?:\.\d+)?)s[ \t]*$/gm)].map(
    (m) => Number(m[1]),
  );
}

/** 折れ線の見本を開く */
async function 折れ線を開く(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/catalog/presets", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText("折れ線グラフ", { exact: true }).first().click();
  await page.waitForTimeout(400);
}

test.describe("再生速度を切替えられる (#1355)", () => {
  test("切替が 3 つ出ていて、既定は 1x", async ({ page }) => {
    await 折れ線を開く(page);
    const 群 = page.getByRole("radiogroup", { name: "再生速度" });
    await expect(群).toBeVisible();
    await expect(群.getByRole("radio")).toHaveCount(3);
    await expect(群.getByRole("radio", { name: "1x" })).toHaveAttribute("aria-checked", "true");
  });

  test("0.5x を押すとコードの秒数が 2 倍になる", async ({ page }) => {
    await 折れ線を開く(page);
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);

    const 元 = await コードの秒数(page);
    expect(元.length, "コードに段の秒数が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);

    await page.getByRole("radio", { name: "0.5x" }).click();
    await page.waitForTimeout(300);
    const 遅い = await コードの秒数(page);

    expect(遅い.length, "段の数が変わっている").toBe(元.length);
    expect(遅い).toEqual(元.map((v) => v * 2));
  });

  test("2x を押すとコードの秒数が半分になる", async ({ page }) => {
    await 折れ線を開く(page);
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);

    const 元 = await コードの秒数(page);
    expect(元.length, "コードに段の秒数が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);

    await page.getByRole("radio", { name: "2x" }).click();
    await page.waitForTimeout(300);
    const 速い = await コードの秒数(page);

    expect(速い).toEqual(元.map((v) => v / 2));
  });

  test("1x に戻すとコードの秒数も元に戻る", async ({ page }) => {
    await 折れ線を開く(page);
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);

    const 元 = await コードの秒数(page);
    await page.getByRole("radio", { name: "0.5x" }).click();
    await page.waitForTimeout(300);
    await page.getByRole("radio", { name: "1x" }).click();
    await page.waitForTimeout(300);

    expect(await コードの秒数(page)).toEqual(元);
  });

  test("図の側にも効く (0.5x では線が伸び切るまでに時間がかかる)", async ({ page }) => {
    /*
     * 折れ線の残り (`stroke-dashoffset`) は 1 → 0 へ進む。 同じ待ち時間で観測した時、
     * 0.5x の方が **進みが小さい** (まだ伸びている途中) はず。
     *
     * 図が繰り返し再生されるため 1 点の比較では揺れる。 一定時間の観測で「残りが 0.5 を
     * 超えている回数」 を数え、遅い方が多いことを見る。
     */
    const 伸びていない回数 = async (page: import("@playwright/test").Page): Promise<number> => {
      let n = 0;
      for (let i = 0; i < 20; i++) {
        const v = await page.evaluate(() =>
          document.querySelector('[data-cdl-role="chart-line"]')?.getAttribute("stroke-dashoffset"),
        );
        if (v !== null && v !== undefined && Number(v) > 0.5) n += 1;
        await page.waitForTimeout(100);
      }
      return n;
    };

    await 折れ線を開く(page);
    await page.getByRole("radio", { name: "2x" }).click();
    await page.waitForTimeout(400);
    const 速い = await 伸びていない回数(page);

    await page.getByRole("radio", { name: "0.5x" }).click();
    await page.waitForTimeout(400);
    const 遅い = await 伸びていない回数(page);

    expect(遅い, `遅い方が伸び切るのが早い (遅い=${遅い} 速い=${速い})`).toBeGreaterThan(速い);
  });

  test("項目を選び直すと 1x に戻る", async ({ page }) => {
    await 折れ線を開く(page);
    await page.getByRole("radio", { name: "0.5x" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole("radio", { name: "0.5x" })).toHaveAttribute("aria-checked", "true");

    await page.getByText("円グラフ", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await expect(page.getByRole("radio", { name: "1x" })).toHaveAttribute("aria-checked", "true");
  });
});
