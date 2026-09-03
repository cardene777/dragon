/**
 * 行の縞が 2 行以上の箱にだけ出ることの検証 (#1567)。
 *
 * 縞の役目は「隣り合う行を見分ける」 こと。 1 行しか無い箱には見分ける相手が居ないので、
 * 敷くとその 1 行が「主役」 に見える (実測 = クラス図の `Auditable` で強調に読めた)。
 *
 * 判定は描き手 (cdl の `STRIPE_MIN_ROWS`) が持つ。 ここで見るのは、その判定が **画面まで
 * 届いているか**。
 *
 * ## 両側を数える
 *
 * 1 行の箱に出ないことだけを見ると、全ての箱から縞が消えた形でも通る。
 * 2 行以上の箱で出ることを併せて数える。
 *
 * ## 配色を書いた図だけを見る
 *
 * 縞の色は配色から取る (`--cdl-row-stripe`)。 配色を書かない図では箱の面と同じ色に落ちて
 * 見えないが、`data-cdl-role="node-row-stripe"` の要素自体は出る = DOM で数える本検査は
 * 配色の有無に依らない。 それでも配色を書いた図を選ぶのは、目で見て確かめられる図に
 * 合わせるため。
 */
import { test, expect, type Page } from "@playwright/test";

/** 縞を持つ見本。 配色を書いた図から選ぶ */
const 見本 = [
  { slug: "presets", id: "class-demo" },
  { slug: "presets", id: "er-demo" },
] as const;

async function 開く(page: Page, slug: string, id: string): Promise<void> {
  await page.goto(`catalog/${slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
  await page.locator(".catalog-list-item").filter({ hasText: id }).first().click();
  await page.waitForSelector(`[data-cdl-diagram="${id}"]`, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
}

/** 箱ごとの「行の数」 と「縞の数」 を画面から数える */
async function 箱ごとに数える(
  page: Page,
  id: string,
): Promise<Array<{ box: string; rows: number; stripes: number }>> {
  return await page.evaluate((diagramId) => {
    const 図 = document.querySelector(`[data-cdl-diagram="${diagramId}"]`);
    if (!図) return [];
    return [...図.querySelectorAll("[data-cdl-node]")].map((n) => ({
      box: n.getAttribute("data-cdl-node") ?? "",
      // 行は名前と型で 2 要素出るので、行の番号で畳んでから数える
      rows: new Set(
        [...n.querySelectorAll('[data-cdl-role="node-row"]')].map((r) =>
          r.getAttribute("data-cdl-row-index"),
        ),
      ).size,
      stripes: n.querySelectorAll('[data-cdl-role="node-row-stripe"]').length,
    }));
  }, id);
}

for (const { slug, id } of 見本) {
  test(`${id} の縞は 2 行以上の箱にだけ出る (#1567)`, async ({ page }) => {
    await 開く(page, slug, id);
    const 箱 = await 箱ごとに数える(page, id);

    // 0 件だと下の照合が「対象なし」 で素通りする
    expect(箱.length, `${id} の箱を 1 つも数えられていない (探し方が画面と噛み合っていない)`).toBeGreaterThan(0);

    const 行あり = 箱.filter((b) => b.rows > 0);
    expect(行あり.length, `${id} に行を持つ箱が 1 つも無い`).toBeGreaterThan(0);

    for (const b of 行あり) {
      if (b.rows < 2) {
        expect(b.stripes, `${id} の ${b.box} は ${b.rows} 行なのに縞がある`).toBe(0);
      } else {
        // 2 行以上なら必ず 1 本以上。 出ない側だけを見ると、全ての箱から縞が消えても通る
        expect(b.stripes, `${id} の ${b.box} は ${b.rows} 行なのに縞が無い`).toBeGreaterThan(0);
      }
    }
  });
}

test("1 行の箱と 2 行以上の箱を両方見ている (#1567)", async ({ page }) => {
  /*
   * 上の検査は、対象に 1 行の箱が 1 つも無ければ「出ない側」 を 1 度も見ない。
   * 見本が変わって 1 行の箱が消えた時に、それを検知する。
   */
  let 一行 = 0;
  let 二行以上 = 0;
  for (const { slug, id } of 見本) {
    await 開く(page, slug, id);
    for (const b of await 箱ごとに数える(page, id)) {
      if (b.rows === 1) 一行 += 1;
      if (b.rows >= 2) 二行以上 += 1;
    }
  }
  expect(一行, "1 行の箱が見本に 1 つも無い (出ない側を検査できていない)").toBeGreaterThan(0);
  expect(二行以上, "2 行以上の箱が見本に 1 つも無い (出る側を検査できていない)").toBeGreaterThan(0);
});
