/**
 * 折れ線が段の進みで左から伸びることの検査 (#1312)。
 *
 * 記法の `draw: line` は、組み立てで段の `draw` 欄になり、描画側 (cdl 0.10.0 以降) が
 * `pathLength` を 1 に正規化した dash で線を伸ばす。 **記法から画面まで通っているか**を
 * ここで見る (組み立てまでは `packages/dragon/test/draw-notation.test.ts` が見る)。
 *
 * 陰性対照を同じ spec に置く。 `draw:` を書いていない見本 (`presetChartLine`) では dash の
 * 属性が 1 つも付かないことを見る = 「全ての折れ線に付いている」 形なら本検査は通っても
 * 意味を持たない。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test chart-line-draw`
 */
import { test, expect } from "@playwright/test";

/**
 * 見る先。 既定は他の spec と同じ 4323。
 *
 * 環境変数で上書きできるようにしてあるのは、**依存の版を上げた直後に既に動いている dev
 * server が古い版を配り続ける**ため (Vite は起動時に依存を最適化して抱え込む)。 別 port で
 * 立て直した server に向けて確かめられるようにする。
 */
const SPA_URL = process.env.SPA_URL ?? "http://localhost:4323";

/** 画面に出ている折れ線の dash 属性を読む */
async function 折れ線のdash(page: import("@playwright/test").Page): Promise<{
  dasharray: string | null;
  dashoffset: string | null;
  pathLength: string | null;
  points: number;
} | null> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-cdl-role="chart-line"]');
    if (!el) return null;
    return {
      dasharray: el.getAttribute("stroke-dasharray"),
      dashoffset: el.getAttribute("stroke-dashoffset"),
      pathLength: el.getAttribute("pathLength"),
      points: (el.getAttribute("points") ?? "").trim().split(/\s+/).filter(Boolean).length,
    };
  });
}

test.describe("折れ線を左から伸ばす (#1312)", () => {
  test("`draw: line` を書いた見本では dash が付き、残りが動く", async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog/charts`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByText("折れ線グラフ", { exact: true }).first().click();
    await page.waitForTimeout(600);

    const 初回 = await 折れ線のdash(page);
    expect(初回, "折れ線が画面に出ている").not.toBeNull();
    expect(初回!.pathLength, "長さを 1 に正規化している").toBe("1");
    expect(初回!.dasharray, "dash を付けている").toBe("1");

    // 残りは 0..1 の範囲に収まる (範囲の外だと線が消えるか逆向きに縮む)
    const 残り = Number(初回!.dashoffset);
    expect(Number.isFinite(残り), `残りが数として読める (got ${初回!.dashoffset})`).toBe(true);
    expect(残り).toBeGreaterThanOrEqual(0);
    expect(残り).toBeLessThanOrEqual(1);

    // 点の数は進みに関わらず datum 数のまま (点を削って伸ばしていない)
    expect(初回!.points, "5 点すべてが points に残る").toBe(5);

    // 段が進むと残りが変わる。 1 段 1.2 秒で図は繰り返し再生されるため、
    // 6 秒の間に 2 種類以上の値が出る
    const 値 = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const 今 = await 折れ線のdash(page);
      if (今?.dashoffset != null) 値.add(今.dashoffset);
      if (値.size >= 2) break;
      await page.waitForTimeout(100);
    }
    expect(値.size, `残りが動かない (観測できた値 = ${[...値].join(", ")})`).toBeGreaterThanOrEqual(2);
  });

  test("`draw:` を書いていない見本では dash が 1 つも付かない", async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog/presets`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByText("折れ線グラフ", { exact: true }).first().click();
    await page.waitForTimeout(600);

    const 見た = await 折れ線のdash(page);
    expect(見た, "折れ線が画面に出ている").not.toBeNull();
    expect(見た!.dasharray, "書いていない図に dash が付いている").toBeNull();
    expect(見た!.dashoffset, "書いていない図に残りが付いている").toBeNull();
    expect(見た!.pathLength, "書いていない図に長さの正規化が付いている").toBeNull();
    expect(見た!.points, "4 点すべてが points に残る").toBe(4);
  });
});
