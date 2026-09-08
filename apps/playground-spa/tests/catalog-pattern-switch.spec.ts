/**
 * 中身が違う見本を選ぶ切替 (#1696)。
 *
 * 図の上の切替が `オプション` と `パターン` の 2 群に分かれ、パターンを押すと **図に載る
 * 項目そのもの** が入れ替わることを画面で見る。
 *
 * 押しても中身が変わらない形 (図だけ替わってコードが元のまま等) を落とすのが目的。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-pattern-switch`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

async function 開く(page: Page, 名前: string, 分類 = "charts"): Promise<void> {
  await page.goto(`catalog/${分類}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText(名前, { exact: true }).first().click();
  await page.waitForTimeout(400);
}

/** 図に出ている割合の字の数 */
async function 割合の数(page: Page): Promise<number> {
  return page.locator('.catalog-preview-stage [data-cdl-role="chart-stat-share"]').count();
}

test.describe("パターンで中身を入れ替えられる (#1696)", () => {
  test("切替が オプション と パターン の 2 群に分かれて出る", async ({ page }) => {
    await 開く(page, "大きな数字");
    const 群 = page.locator(".catalog-toggle-group");
    await expect(群).toHaveCount(2);
    await expect(群.nth(0).locator(".catalog-toggle-group-label")).toHaveText("オプション");
    await expect(群.nth(1).locator(".catalog-toggle-group-label")).toHaveText("パターン");
  });

  test("パターンが 2 つ出ていて、既定は 1 件", async ({ page }) => {
    await 開く(page, "大きな数字");
    const 群 = page.getByRole("radiogroup", { name: "パターン" });
    await expect(群).toBeVisible();
    await expect(群.getByRole("radio")).toHaveCount(2);
    await expect(群.getByRole("radio", { name: "1 件" })).toHaveAttribute("aria-checked", "true");
    await expect(群.getByRole("radio", { name: "複数" })).toHaveAttribute("aria-checked", "false");
  });

  test("変種を持たない図ではパターンの群が出ない (陰性対照)", async ({ page }) => {
    /*
     * 「どの図でも出る」 形なら、上の 2 件は通っても意味を持たない。
     * 折れ線では出ないこと、そして オプション の群は出たままであることを見る。
     *
     * 折れ線を選ぶのは、engine が中身の違う形を持たない種別だから (#1698)。
     */
    await 開く(page, "折れ線グラフ");
    await expect(page.getByRole("radiogroup", { name: "パターン" })).toHaveCount(0);
    await expect(page.locator(".catalog-toggle-group")).toHaveCount(1);
    await expect(page.getByRole("radiogroup", { name: "再生速度" })).toBeVisible();
  });

  test("複数を選ぶと図に割合が出る", async ({ page }) => {
    // 割合は全件の合計に対する取り分なので、件が 1 つだと分母が自分自身になり出ない
    // (`cdl#759`)。 押した結果が絵に出ることを、役割の数で見る
    await 開く(page, "大きな数字");
    expect(await 割合の数(page)).toBe(0);

    await page.getByRole("radio", { name: "複数" }).click();
    await page.waitForTimeout(500);
    expect(await 割合の数(page)).toBeGreaterThanOrEqual(2);

    await page.getByRole("radio", { name: "1 件" }).click();
    await page.waitForTimeout(500);
    expect(await 割合の数(page)).toBe(0);
  });

  test("複数を選ぶとコードも入れ替わる", async ({ page }) => {
    // 図だけ替わって記法が元のままだと、写したコードが画面と違う図を描く
    await 開く(page, "大きな数字");
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator(".catalog-source-code").first()).toContainText("今月の解約率");

    await page.getByRole("radio", { name: "複数" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".catalog-source-code").first()).toContainText("問い合わせの内訳");
  });

  test("別の図を選ぶと 1 件へ戻る", async ({ page }) => {
    // 残すと、次に 大きな数字 を開いた時に前の選択が出て理由を見失う (#1355 と同じ形)
    await 開く(page, "大きな数字");
    await page.getByRole("radio", { name: "複数" }).click();
    await page.waitForTimeout(400);

    await page.getByText("折れ線グラフ", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await page.getByText("大きな数字", { exact: true }).first().click();
    await page.waitForTimeout(400);

    await expect(page.getByRole("radio", { name: "1 件" })).toHaveAttribute("aria-checked", "true");
    expect(await 割合の数(page)).toBe(0);
  });
});

/**
 * 前の時点を書いた図と書かない図 (#1698)。
 *
 * `previous` を書くと円グラフは輪が 2 つになり (`cdl#679`)、内訳の帯は帯が 2 本になる
 * (`cdl#551`)。 どちらも見本は片側しか無かった。
 */
test.describe("前の時点の有無をパターンで選べる (#1698)", () => {
  test("円グラフで 前と今 を選ぶと内側の輪が出る", async ({ page }) => {
    await 開く(page, "円グラフ");
    const 内側 = page.locator(
      '.catalog-preview-stage [data-cdl-role="chart-pie-slice-previous"]',
    );
    await expect(page.getByRole("radiogroup", { name: "パターン" }).getByRole("radio")).toHaveCount(2);
    await expect(page.getByRole("radio", { name: "今だけ" })).toHaveAttribute("aria-checked", "true");
    expect(await 内側.count()).toBe(0);

    await page.getByRole("radio", { name: "前と今" }).click();
    await page.waitForTimeout(900);
    expect(await 内側.count()).toBeGreaterThanOrEqual(2);
  });

  test("内訳の帯で 今だけ を選ぶと帯が 1 本になる", async ({ page }) => {
    await 開く(page, "内訳の帯");
    const 時点 = page.locator(
      '.catalog-preview-stage [data-cdl-role="chart-stacked-bar-period"]',
    );
    await expect(page.getByRole("radio", { name: "前と今" })).toHaveAttribute("aria-checked", "true");
    expect(await 時点.count()).toBeGreaterThanOrEqual(2);

    await page.getByRole("radio", { name: "今だけ" }).click();
    await page.waitForTimeout(900);
    expect(await 時点.count()).toBe(0);
  });

  test("前と今 を選ぶと円グラフの見せ方の切替が消える", async ({ page }) => {
    /*
     * engine が前の値を渡すのは `輪` だけで、`積層の弧` と `銘板` へ切り替えると
     * 内側の輪が黙って消える (#1702)。 見せられない形の切替は出さない。
     */
    await 開く(page, "円グラフ");
    const 見せ方 = page.getByRole("radiogroup", { name: "円グラフの見せ方" });
    await expect(見せ方.getByRole("radio")).toHaveCount(3);

    await page.getByRole("radio", { name: "前と今" }).click();
    await page.waitForTimeout(600);
    await expect(見せ方).toHaveCount(0);

    // 戻すと出る = 消えたままにならない
    await page.getByRole("radio", { name: "今だけ" }).click();
    await page.waitForTimeout(600);
    await expect(見せ方.getByRole("radio")).toHaveCount(3);
  });

  test("パターンを押すとコードも入れ替わる", async ({ page }) => {
    await 開く(page, "円グラフ");
    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator(".catalog-source-code").first()).not.toContainText("previous");

    await page.getByRole("radio", { name: "前と今" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".catalog-source-code").first()).toContainText("previous");
  });
});

/**
 * 中身を持つ図の切替 (#1706)。
 *
 * 図表 (`chartData`) 以外にも中身を持つ節が 7 つある。 書くと絵が変わる欄があるのに、
 * **両側が別々の行に分かれていて見比べられなかった**。 同じ見本の切替にする。
 *
 * 待ちは `toHaveCount` の再試行に任せる = 図は段を進めながら描くので、押した直後には
 * まだ出ていない。
 */
test.describe("中身つきの図でも切替で両側を見せる (#1706)", () => {
  test("階層図で 説明つき を選ぶと箱に説明が出る", async ({ page }) => {
    await 開く(page, "階層図");
    const 説明 = page.locator('.catalog-preview-stage [data-cdl-role="tree-node-subtitle"]');
    await expect(
      page.getByRole("radiogroup", { name: "パターン" }).getByRole("radio"),
    ).toHaveCount(2);
    await expect(page.getByRole("radio", { name: "見出しだけ" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(説明).toHaveCount(0);

    await page.getByRole("radio", { name: "説明つき" }).click();
    await expect(説明).not.toHaveCount(0);
  });

  test("工程表で 帯だけ を選ぶと前後の矢印が消える", async ({ page }) => {
    await 開く(page, "工程表");
    const 矢印 = page.locator('.catalog-preview-stage [data-cdl-role="gantt-arrow"]');
    await expect(page.getByRole("radio", { name: "前後つき" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(矢印).not.toHaveCount(0);

    await page.getByRole("radio", { name: "帯だけ" }).click();
    await expect(矢印).toHaveCount(0);
  });

  test("体験の道筋で 接点つき を選ぶと接点の札が出る", async ({ page }) => {
    await 開く(page, "体験の道筋");
    const 札 = page.locator('.catalog-preview-stage [data-cdl-role="journey-chip"]');
    await expect(page.getByRole("radio", { name: "気持ちだけ" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(札).toHaveCount(0);

    await page.getByRole("radio", { name: "接点つき" }).click();
    await expect(札).not.toHaveCount(0);
  });

  test("枝分かれ図で 見出しだけ を選ぶと説明が消える", async ({ page }) => {
    await 開く(page, "枝分かれ図");
    const 説明 = page.locator('.catalog-preview-stage [data-cdl-role="mind-node-subtitle"]');
    await expect(page.getByRole("radio", { name: "説明つき" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(説明).not.toHaveCount(0);

    await page.getByRole("radio", { name: "見出しだけ" }).click();
    await expect(説明).toHaveCount(0);
  });

  test("時系列のやり取りで 説明つき を選ぶと面に説明が出る", async ({ page }) => {
    await 開く(page, "テキストDSLのシーケンス", "text-dsl");
    const 説明 = page.locator('.catalog-preview-stage [data-cdl-role="sequence-actor-subtitle"]');
    await expect(page.getByRole("radio", { name: "名前だけ" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(説明).toHaveCount(0);

    await page.getByRole("radio", { name: "説明つき" }).click();
    await expect(説明).not.toHaveCount(0);
  });

  test("変種を持たない図ではパターンの群が出ない (陰性対照)", async ({ page }) => {
    // 「どの図でも出る」 形なら上の 5 件は通っても意味を持たない
    await 開く(page, "絞り込み図");
    await expect(page.getByRole("radiogroup", { name: "パターン" })).toHaveCount(0);
  });
});
