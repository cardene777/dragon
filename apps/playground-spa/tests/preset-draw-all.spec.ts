/**
 * カタログの「プリセット」 で、起点から描ける見本がすべて動くことの検査 (#1357)。
 *
 * 「図表」 のページ (`charts.cdl.ts`) は元から 8 種すべてで動いていたが、「プリセット」 は
 * 折れ線だけだった。 6 件に描く指定を入れたので、**そのページで** 動くことを見る。
 *
 * 種別ごとに「動いていること」 の見え方が違うため、図ごとに観測する形を選ぶ。
 *
 * | 見本 | 観測するもの |
 * |---|---|
 * | 折れ線 / 体験の道筋 / 枝分かれ図 / 階層図 | `stroke-dashoffset` が 2 種類以上出る |
 * | 円グラフ | 切り抜きの形が 2 種類以上出る |
 * | 工程表 | 帯の包みの倍率が 2 種類以上出る |
 * | 絞り込み図 | 切り抜きの高さが 2 種類以上出る |
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test preset-draw-all`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

/** 見本を開く */
async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText(名前, { exact: true }).first().click();
  await page.waitForTimeout(300);
}

/** 一定時間見て、観測できた状態の種類を集める */
async function 値の種類(page: Page, 読む: () => Promise<string[]>): Promise<Set<string>> {
  const 値 = new Set<string>();
  for (let i = 0; i < 80; i++) {
    // 1 回に読んだ全要素を 1 snapshot として比べる。値を個別に集めると、複数の枝や帯が
    // 同じ frame で違う値を持つだけで「動いた」と判定し、停止した animation も通ってしまう。
    const snapshot = await 読む();
    if (snapshot.length > 0) 値.add(JSON.stringify(snapshot));
    if (値.size >= 2) break;
    await page.waitForTimeout(100);
  }
  return 値;
}

/** 線の残りを読む種別 (`data-cdl-role` の値で引く) */
const 線で見る = [
  { 名前: "折れ線グラフ", role: "chart-line" },
  { 名前: "体験の道筋", role: "journey-line" },
  { 名前: "枝分かれ図", role: "mind-edge" },
  { 名前: "階層図", role: "tree-edge" },
] as const;

test.describe("プリセットの見本も起点から描かれる (#1357)", () => {
  for (const { 名前, role } of 線で見る) {
    test(`${名前}: 線の残りが動く`, async ({ page }) => {
      await 開く(page, 名前);
      const 値 = await 値の種類(page, () =>
        page.evaluate(
          (r: string) =>
            Array.from(document.querySelectorAll(`[data-cdl-role="${r}"]`))
              .map((el) => el.getAttribute("stroke-dashoffset"))
              .filter((v): v is string => v !== null),
          role,
        ),
      );
      expect(値.size, `残りが動かない (観測できた値 = ${[...値].join(", ")})`).toBeGreaterThanOrEqual(2);
    });
  }

  test("円グラフ: 切り抜きの形が変わる", async ({ page }) => {
    await 開く(page, "円グラフ");
    const 値 = await 値の種類(page, () =>
      page.evaluate(() => {
        const clip = document.querySelector('clipPath[id^="cdl-pie-draw-"]');
        return clip ? [clip.firstElementChild?.tagName ?? "?"] : [];
      }),
    );
    // 進みの途中は扇形、1 周は円。 2 種類出れば開いている
    expect(値.size, `切り抜きの形が変わらない (観測できた形 = ${[...値].join(", ")})`).toBeGreaterThanOrEqual(2);
  });

  test("工程表: 帯の倍率が動く", async ({ page }) => {
    await 開く(page, "工程表");
    const 値 = await 値の種類(page, () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-cdl-role="gantt-bar"]'))
          .map((el) => el.parentElement?.getAttribute("transform") ?? "")
          .filter((t) => t.includes("scale(")),
      ),
    );
    expect(値.size, `倍率が動かない (観測できた値 = ${[...値].join(" | ")})`).toBeGreaterThanOrEqual(2);
  });

  test("絞り込み図: 切り抜きの高さが動く", async ({ page }) => {
    await 開く(page, "絞り込み図");
    const 値 = await 値の種類(page, () =>
      page.evaluate(() => {
        const h = document
          .querySelector('clipPath[id^="cdl-funnel-draw-"] rect')
          ?.getAttribute("height");
        return h === null || h === undefined ? [] : [h];
      }),
    );
    expect(値.size, `高さが動かない (観測できた値 = ${[...値].join(", ")})`).toBeGreaterThanOrEqual(2);
  });

  test("起点から描けない見本は動かない (陰性対照)", async ({ page }) => {
    /*
     * 「全ての図で何かが動いている」 形なら、上の検査は通っても意味を持たない。
     * 起点から描けない種別 (シーケンス図) では、線の残りが 1 つも付かないことを見る。
     */
    await 開く(page, "シーケンス図");
    await page.waitForTimeout(600);
    const 残り = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[stroke-dashoffset]")).map((el) =>
        el.getAttribute("data-cdl-role"),
      ),
    );
    expect(残り, "描けない見本に起点から描く印が付いている").toEqual([]);
  });
});
