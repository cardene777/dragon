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

/** 棒の包み (倍率) を読む */
async function 棒の倍率(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-cdl-role="chart-bar"]'))
      .map((el) => el.parentElement?.getAttribute("transform") ?? "")
      .filter((t) => t.includes("scale(")),
  );
}

/** 扇の切り抜きを読む */
async function 扇の切り抜き(page: import("@playwright/test").Page): Promise<{
  ある: boolean;
  形: string | null;
  扇の数: number;
}> {
  return page.evaluate(() => {
    // 他の kind も clipPath を使うため、円の draw 専用 id に限定する。
    const clip = document.querySelector('clipPath[id^="cdl-pie-draw-"]');
    return {
      ある: clip !== null,
      形: clip?.firstElementChild?.tagName ?? null,
      扇の数: document.querySelectorAll('[data-cdl-role="chart-pie-slice"]').length,
    };
  });
}

test.describe("棒を横軸から伸ばす (#1314)", () => {
  test("`draw: bar` を書いた見本では倍率が付き、動く", async ({ page }) => {
    await page.goto("/catalog/charts", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByText("棒グラフ", { exact: true }).first().click();
    await page.waitForTimeout(600);

    const 値 = new Set<string>();
    let 件数 = 0;
    for (let i = 0; i < 60; i++) {
      const 倍率 = await 棒の倍率(page);
      if (倍率.length > 0) {
        件数 = 倍率.length;
        for (const t of 倍率) 値.add(t);
      }
      if (値.size >= 2) break;
      await page.waitForTimeout(100);
    }
    expect(件数, "棒に包みが付いている").toBeGreaterThan(0);
    expect(値.size, `倍率が動かない (観測できた値 = ${[...値].join(" | ")})`).toBeGreaterThanOrEqual(2);
    // 足元を動かさない形 = 前後の translate が符号違いで揃う
    for (const t of 値) expect(t).toMatch(/translate\(0 ([\d.]+)\) scale\(1 [\d.]+\) translate\(0 -\1\)/);
  });

  test("`draw:` を書いていない段では倍率が付かない", async ({ page }) => {
    /*
     * 陰性対照を **同じ図の中** に取る。 見本帳の棒グラフは 1 段目にだけ `draw: bar` を
     * 書いており、2 段目には書いていない。 2 段目では包みが 1 つも付かない。
     *
     * preset 側に棒グラフの見本が無いため (`presets.ts` は円と折れ線だけ)、別の図を
     * 対照に取れない。 同じ図の段で対照を取る方が、図の違いによる差も入らない
     */
    await page.goto("/catalog/charts", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByText("棒グラフ", { exact: true }).first().click();

    let 付いた回数 = 0;
    let 付かない回数 = 0;
    for (let i = 0; i < 60; i++) {
      const 倍率 = await 棒の倍率(page);
      if (倍率.length > 0) 付いた回数 += 1;
      else 付かない回数 += 1;
      if (付いた回数 > 0 && 付かない回数 > 0) break;
      await page.waitForTimeout(100);
    }
    expect(付いた回数, "書いた段で包みが付かない").toBeGreaterThan(0);
    expect(付かない回数, "書いていない段でも包みが付いている").toBeGreaterThan(0);
  });
});

test.describe("扇を 12 時から開く (#1314)", () => {
  test("`draw: pie` を書いた見本では切り抜きが付き、形が変わる", async ({ page }) => {
    await page.goto("/catalog/charts", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByText("円グラフ", { exact: true }).first().click();
    await page.waitForTimeout(600);

    const 形 = new Set<string>();
    let 扇の数 = 0;
    let 切り抜きを見た回数 = 0;
    for (let i = 0; i < 60; i++) {
      const 見た = await 扇の切り抜き(page);
      扇の数 = 見た.扇の数;
      // 2 段目には draw が無い。再生タイミング次第で先にそちらを観測しても、
      // 1 段目へ戻るまで待って draw 中の形だけを集める。
      if (見た.ある) {
        切り抜きを見た回数 += 1;
        形.add(String(見た.形));
      }
      // 進みの途中は扇形、1 周は円。 2 種類出れば開いて閉じている
      if (形.size >= 2) break;
      await page.waitForTimeout(100);
    }
    expect(切り抜きを見た回数, "切り抜きが付いている").toBeGreaterThan(0);
    expect(扇の数, "扇の数は進みに関わらず 4 つ").toBe(4);
    expect(形.size, `切り抜きの形が変わらない (観測できた形 = ${[...形].join(", ")})`).toBeGreaterThanOrEqual(2);
  });

  test("`draw:` を書いていない円の見本には切り抜きが付かない", async ({ page }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByText("円グラフ", { exact: true }).first().click();
    await page.waitForTimeout(600);
    const 見た = await 扇の切り抜き(page);
    expect(見た.ある, "書いていない図に切り抜きが付いている").toBe(false);
    expect(見た.扇の数).toBeGreaterThan(0);
  });
});

test.describe("残り 5 種も起点から現れる (#1318)", () => {
  /**
   * 種別ごとに「動いていること」 の見え方が違う。 それぞれの図で観測できる形を 1 つ選ぶ。
   *
   * | 見本 | 観測するもの |
   * |---|---|
   * | 体験の道筋 / 放射 / 木 | `stroke-dashoffset` が 2 種類以上出る |
   * | 工程表 | 帯の包みの倍率が 2 種類以上出る |
   * | 漏斗 | 切り抜きの高さが 2 種類以上出る |
   */
  const 観測 = {
    "体験の道筋": 'document.querySelectorAll(\'[data-cdl-role="journey-line"]\')',
    "枝分かれ図": 'document.querySelectorAll(\'[data-cdl-role="mind-edge"]\')',
    "階層図": 'document.querySelectorAll(\'[data-cdl-role="tree-edge"]\')',
  } as const;

  for (const [見本, _sel] of Object.entries(観測)) {
    test(`${見本}: 枝や線の残りが動く`, async ({ page }) => {
      await page.goto("/catalog/charts", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.getByText(見本, { exact: true }).first().click();

      const 値 = new Set<string>();
      for (let i = 0; i < 60; i++) {
        const 残り = await page.evaluate((name: string) => {
          const role =
            name === "体験の道筋" ? "journey-line" : name === "枝分かれ図" ? "mind-edge" : "tree-edge";
          return Array.from(document.querySelectorAll(`[data-cdl-role="${role}"]`))
            .map((el) => el.getAttribute("stroke-dashoffset"))
            .filter((v): v is string => v !== null);
        }, 見本);
        for (const v of 残り) 値.add(v);
        if (値.size >= 2) break;
        await page.waitForTimeout(100);
      }
      expect(値.size, `残りが動かない (観測できた値 = ${[...値].join(", ")})`).toBeGreaterThanOrEqual(2);
    });
  }

  test("工程表: 帯の倍率が動く", async ({ page }) => {
    await page.goto("/catalog/charts", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByText("工程表", { exact: true }).first().click();

    const 値 = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const 倍率 = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-cdl-role="gantt-bar"]'))
          .map((el) => el.parentElement?.getAttribute("transform") ?? "")
          .filter((t) => t.includes("scale(")),
      );
      for (const t of 倍率) 値.add(t);
      if (値.size >= 2) break;
      await page.waitForTimeout(100);
    }
    expect(値.size, `倍率が動かない (観測できた値 = ${[...値].join(" | ")})`).toBeGreaterThanOrEqual(2);
  });

  test("絞り込み図: 切り抜きの高さが動く", async ({ page }) => {
    await page.goto("/catalog/charts", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByText("絞り込み図", { exact: true }).first().click();

    const 値 = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const 高さ = await page.evaluate(
        () => document.querySelector('clipPath[id^="cdl-funnel-draw-"] rect')?.getAttribute("height") ?? null,
      );
      if (高さ !== null) 値.add(高さ);
      if (値.size >= 2) break;
      await page.waitForTimeout(100);
    }
    expect(値.size, `高さが動かない (観測できた値 = ${[...値].join(", ")})`).toBeGreaterThanOrEqual(2);
  });
});

test.describe("折れ線を左から伸ばす (#1312)", () => {
  test("`draw: line` を書いた見本では dash が付き、残りが動く", async ({ page }) => {
    await page.goto("/catalog/charts", { waitUntil: "networkidle" });
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
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
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
