import { expect, test } from "@playwright/test";

import { 開く口, 開いた状態ごとに } from "./phone-openers";

/*
 * 開く口の選び方が実物と合っていることを見る (#2545)。
 *
 * `phone-openers.ts` の一覧は導く元を持たない (画面の中の部品で、押すと何が出るかは実装ごと)。
 * 選び方が古くなると `count()` が 0 になり、押す処理は **黙って何もしなくなる**。
 * それを呼ぶ 2 本の検査 (はみ出しと的の大きさ) は落ちず、閉じた状態だけを測って通る。
 *
 * ここが唯一「一覧が生きているか」 を見る場所になる。
 */

const 携帯 = { width: 390, height: 844 };
const 卓上 = { width: 1400, height: 950 };

/** 出ている押せるものの数。 開く口が本当に何かを出したかの目安にする */
const 押せる数 = (page: import("@playwright/test").Page): Promise<number> =>
  page.evaluate(() =>
    [...document.querySelectorAll('a[href], button, [role="button"]')].filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
    }).length,
  );

test("一覧が空になっていない (空振り検知)", () => {
  expect(開く口.length, "開く口の一覧が空").toBeGreaterThan(1);
  for (const 口 of 開く口) {
    expect(口.選び方.length, `${口.名} の選び方が空`).toBeGreaterThan(0);
    expect(口.出る道筋.length, `${口.名} の出る道筋が空`).toBeGreaterThan(0);
  }
});

for (const 口 of 開く口) {
  test(`${口.名} が携帯の幅で 1 つ出ていて、押すと中身が増える`, async ({ page }) => {
    await page.setViewportSize(携帯);
    await page.goto(口.出る道筋);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    expect(
      await page.locator(口.選び方).count(),
      `${口.名} が ${口.出る道筋} に無い (選び方が古い)`,
    ).toBe(1);
    await expect(page.locator(口.選び方), `${口.名} が見えていない`).toBeVisible();

    /*
     * **押した効果まで見る**。 選び方が生きていても、押しても何も出ない形に変わったら
     * 呼ぶ側は閉じた状態と同じものを 2 度測ることになり、やはり落ちずに通る。
     */
    const 前 = await 押せる数(page);
    await page.locator(口.選び方).first().click();
    await page.waitForTimeout(700);
    const 後 = await 押せる数(page);
    expect(後 - 前, `${口.名}を押しても押せるものが増えない (前 ${前} / 後 ${後})`).toBeGreaterThan(
      3,
    );
  });
}

test("開いた状態ごとに が口の数だけ測り、押し戻して終わる", async ({ page }) => {
  // 編集画面は 2 つとも出る唯一の画面。 ここで 2 回測れることを見る
  await page.setViewportSize(携帯);
  await page.goto("editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const 閉じている数 = await 押せる数(page);
  const 結果 = await 開いた状態ごとに(page, () => 押せる数(page));

  expect(結果.map((x) => x.名), "編集画面で 2 つとも開けていない").toEqual(開く口.map((x) => x.名));
  for (const x of 結果) {
    expect(x.値, `${x.名}を開いた時に押せるものが増えていない`).toBeGreaterThan(閉じている数);
  }
  // 押し戻して終わる = 次の測定に前の状態を持ち越さない
  expect(await 押せる数(page), "最後の口を押し戻していない").toBe(閉じている数);
});

test("広い幅では帯の折りたたみを開かない (対照)", async ({ page }) => {
  // 見えない口を押そうとして時間切れで落ちないことを見る。 広い幅では帯の行き先が並ぶので
  // 折りたたみは出ない (`header.css` の 720px)
  await page.setViewportSize(卓上);
  await page.goto("catalog/presets");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  const 結果 = await 開いた状態ごとに(page, () => 押せる数(page));
  expect(結果.map((x) => x.名), "広い幅で帯の折りたたみを開いている").not.toContain(
    "帯の折りたたみ",
  );
});
