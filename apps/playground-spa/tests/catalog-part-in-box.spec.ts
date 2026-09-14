/**
 * 部品を箱に使う見本が、カタログの画面と編集画面で同じ絵になることの確認 (#1973)。
 *
 * `state-indicator` は円の外枠と、状態 `lvl` の割合で半径が決まる塗りの円を描く。 画面の円の
 * 半径と塗りの色で、状態の上書き・倍率・色番号が効いたかを見る。
 *
 * **編集画面でも同じ円を描くかを見る**。 見本の頁は部品ごと組み立てた図を出すが、編集画面の
 * 本文欄は部品を本文から抜いて図の上に重ねる。 2 つの形を見る。
 *
 * | 形 | 壊れていた時の絵 |
 * |---|---|
 * | 部品だけの本文 (見本の頁から開く形) | 抜いた後の図が空で組み立てに落ち、「読み込み中」 のまま |
 * | 箱と並べた部品 | 重ねた部品が既定の値 (塗り 0 と緑) のまま |
 */
import { test, expect, type Page } from "@playwright/test";

const 見本 = "部品を箱に置き何も書き換えない";

async function 開く(page: Page): Promise<void> {
  await page.goto("catalog/parts", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator("aside.catalog-sidebar .catalog-list-item", { hasText: 見本 }).first().click();
  await page.waitForTimeout(800);
  await expect(page.locator("main.catalog-preview svg[data-cdl-stage]").first()).toBeVisible();
}

async function 押す(page: Page, 名: string): Promise<void> {
  await page
    .getByRole("radiogroup", { name: "パターン" })
    .getByRole("radio", { name: 名, exact: true })
    .click();
  await page.waitForTimeout(800);
}

/** 図の中の円を、外枠 (塗り無し) と塗りに分けて返す */
async function 円(
  page: Page,
  図: string,
): Promise<{ 外枠: number[]; 塗り: { r: number; fill: string }[] }> {
  return page
    .locator(図)
    .first()
    .evaluate((svg) => {
      const 円たち = [...svg.querySelectorAll("circle")].map((c) => ({
        r: Number(c.getAttribute("r")),
        fill: c.getAttribute("fill") ?? "",
      }));
      return {
        外枠: 円たち.filter((c) => c.fill === "none").map((c) => c.r),
        塗り: 円たち.filter((c) => c.fill.startsWith("#")),
      };
    });
}

const カタログの図 = "main.catalog-preview svg[data-cdl-stage]";

test.describe("部品を箱に使う見本 (#1973)", () => {
  test("部品の頁に並び、切替が 4 つ出る", async ({ page }) => {
    await 開く(page);
    await expect(page.getByRole("radiogroup", { name: "パターン" }).getByRole("radio")).toHaveCount(
      4,
    );
  });

  test("切替ごとに円の大きさと塗りの色が書いた欄のとおりに変わる", async ({ page }) => {
    await 開く(page);
    const 書かない = await 円(page, カタログの図);
    expect(書かない.外枠, "部品の円を描いていない (検査が空振りしている)").toEqual([140]);
    expect(書かない.塗り.map((c) => c.fill)).toEqual(["#22c55e"]);

    await 押す(page, "状態を上書き");
    // 部品の段を外したので、待っても 4 割のまま動かない
    await page.waitForTimeout(1500);
    expect(await 円(page, カタログの図)).toEqual({
      外枠: [140],
      塗り: [{ r: 56, fill: "#22c55e" }],
    });

    await 押す(page, "倍率を変える");
    expect((await 円(page, カタログの図)).外枠).toEqual([84]);

    await 押す(page, "色番号を変える");
    expect((await 円(page, カタログの図)).塗り.map((c) => c.fill)).toEqual(["#d9534f"]);
  });

  test("コードの yaml と json に書き換えた欄が出る", async ({ page }) => {
    await 開く(page);
    await 押す(page, "状態を上書き");
    await page.getByRole("tab", { name: "コード" }).click();
    const コード = page.locator(".catalog-source-code").first();
    await expect(コード).toContainText("state: { lvl: 0.4, phase: false }");
    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const 読んだ = JSON.parse(await コード.innerText()) as {
      actors?: { kind?: string; state?: Record<string, unknown> }[];
    };
    expect(読んだ.actors?.[0]).toEqual({
      name: "設備の稼働",
      kind: "state-indicator",
      state: { lvl: 0.4, phase: false },
    });
  });

  test("編集画面で開くと、カタログと同じ円を描く", async ({ page }) => {
    await 開く(page);
    await 押す(page, "状態を上書き");
    const リンク = page.getByRole("link", { name: /編集画面で開く/ });
    await expect(リンク).toBeVisible();
    const href = await リンク.getAttribute("href");
    expect(href ?? "", "編集画面へ渡す中身が空").toContain("#");
    await リンク.click();
    await page.waitForSelector(".v4-editor-stage svg[data-cdl-stage]", { timeout: 15000 });
    await expect
      .poll(async () => await 円(page, ".v4-editor-stage svg[data-cdl-stage]"), { timeout: 10000 })
      .toEqual({ 外枠: [140], 塗り: [{ r: 56, fill: "#22c55e" }] });
  });

  test("編集画面で箱と並べた部品も、書いた状態と色番号で重ねて描く", async ({ page }) => {
    // 箱がある本文では、部品を図から抜いて上に重ねる。 重ねる側にも上書きが届くかを見る
    const 本文 = [
      'title: "受付と稼働"',
      "type: flow",
      "",
      "actors:",
      "  - 受付: { kind: card }",
      '  - 印: { kind: state-indicator, color: "#d9534f", state: { lvl: 0.4, phase: false } }',
      "",
    ].join("\n");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`editor#s=${Buffer.from(本文, "utf8").toString("base64")}`);
    await page.waitForLoadState("networkidle");
    const 重ねた部品 = '.v4-editor-stage [data-overlay-part="印"] svg';
    await page.waitForSelector(重ねた部品, { timeout: 15000 });
    await expect(page.locator(".v4-editor-stage svg[data-cdl-stage]").first()).toContainText(
      "受付",
    );
    await expect
      .poll(async () => await 円(page, 重ねた部品), { timeout: 10000 })
      .toEqual({ 外枠: [140], 塗り: [{ r: 56, fill: "#d9534f" }] });
  });
});
