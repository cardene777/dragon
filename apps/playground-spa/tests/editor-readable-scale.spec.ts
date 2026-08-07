/**
 * 開いた時の図の文字が読める大きさであることの検証 (#1084)。
 *
 * 変更前は「画面に収める」 計算が枠に対する比だけで決まっていた。 横長の図では幅が上限を
 * 決めるため、 縦の空白を残したまま極端に縮む (実測 = 見本「Client登録」 が 23%、 絵の枠の
 * 高さ 840 のうち 97 しか使わず文字が 4.6px)。
 *
 * ## 倍率ではなく「画面上の文字の大きさ」 を見る
 *
 * 倍率を見ると図ごとに正解が変わる (文字を大きく持つ図は低い倍率でも読める)。 読めるかどうかは
 * 画面上の文字の大きさで決まるので、 そちらを直接測る。
 */
import { test, expect } from "@playwright/test";

/** 画面上でこれを下回ると本文として読めない (`src/lib/readable-scale.ts` と同じ値)。 */
const MIN_PX = 10;

/**
 * 3 件だけ回す。 8 見本の総当たりは要らないが、 2 件では足りない (Round 2 review の指摘)。
 *
 * 世界座標の最小文字が種別ごとに違うため、 **下限がどこで決まるかが変わる**。 3 件は
 * その分かれ目を 1 つずつ踏む。
 *
 * | 見本 | 世界座標の最小文字 | 下限 | 何を踏むか |
 * |---|---|---|---|
 * | swimlane | 20 | 50% | 下限が倍率を決める (収める倍率 23% を上書き) |
 * | flow | 22 | 45% | 下限が効かない (収める倍率 60% の方が大きい) |
 * | pie | 11 | 91% | 100% の頭打ちのすぐ手前 |
 *
 * `pie` を落とすと上限を下げる変異 (100% → 80%) を見逃す (実測で確認)。 swimlane と flow の
 * 下限は 50% / 45% で、 どちらも 80% を下回るため上限に触れない。
 *
 * 残りの 5 見本 (sequence 20 / topology 17 / c4 17 / mind 24 / gantt 11) は上の 3 件と同じ
 * 分かれ目に落ちるので回さない。 文字の出し方 (箱の中か外か / 大きさを計算値から取れるか /
 * 隠れた文字があるか) は 8 種とも同じであることを実測で確認した。
 *
 * | 見本 | 世界座標の最小文字 | 変更前 | 変更後 |
 * |---|---|---|---|
 * | swimlane | 20 | 4.6px | 10.0px |
 * | sequence | 20 | 7.1px | 10.0px |
 * | gantt / pie | 11 | 8.0 / 8.6px | 10.0px |
 * | c4 / topology | 17 | 9.5 / 10.2px | 10.0 / 10.2px |
 * | mind | 24 | 9.9px | 10.0px |
 * | flow | 22 | 13.3px | 13.3px (下限が効かない) |
 */
const SAMPLES = ["swimlane", "flow", "pie"];

async function 測る(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const host = document.querySelector(".v4-editor-preview");
    const svg = host?.querySelector<SVGSVGElement>("svg[data-cdl-stage]");
    if (!svg) return null;
    // 画面上の倍率 = svg の実 px 幅 / 図の枠の幅 (図そのものの倍率と表示倍率の積)
    const vb = svg.viewBox.baseVal;
    const scale = svg.getBoundingClientRect().width / vb.width;
    const rows = [...svg.querySelectorAll("text")]
      .filter((t) => (t.textContent ?? "").trim().length > 0)
      // 画面に出ていない文字は測らない。 実装 (`src/lib/readable-scale.ts`) が数えないものを
      // 検査が数えると、 正しい状態を「文字が小さい」 として落とす。 ここでは実際に枠を持つか
      // で見る = 実ブラウザなので、 隠し方の種類 (display / visibility / 透明度) に依らない
      .filter((t) => {
        const r = t.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .map((t) => ({
        px: Math.round(Number.parseFloat(getComputedStyle(t).fontSize) * scale * 10) / 10,
        s: (t.textContent ?? "").trim().slice(0, 10),
      }))
      .filter((x) => Number.isFinite(x.px));
    rows.sort((a, b) => a.px - b.px);
    return { 最小: rows[0], 件数: rows.length, 倍率: Math.round(scale * 1000) / 1000 };
  });
}

for (const slug of SAMPLES) {
  test(`見本 ${slug} を開くと文字が ${MIN_PX}px 以上で出る (#1084)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/editor#preset=${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);

    const m = await 測る(page);
    expect(m, "図が画面に無い").not.toBeNull();
    // 件数を見ないと、 文字を 1 つも測れていない状態で「最小は無い」 として通る
    expect(m!.件数, "文字を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(
      m!.最小.px,
      `文字が小さすぎる: ${m!.最小.s} が ${m!.最小.px}px (倍率 ${m!.倍率})`,
    ).toBeGreaterThanOrEqual(MIN_PX);
  });
}

test("収めるを押した後も文字が読める大きさに戻る (#1084)", async ({ page }) => {
  // 下限は開いた時だけでなく「収める」 経路そのものに入っている。 縮めてから押し直しても効く
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor#preset=swimlane");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  await page.locator('[data-testid="editor-zoom-out"]').click();
  await page.locator('[data-testid="editor-zoom-out"]').click();
  await page.waitForTimeout(400);
  const 縮めた後 = await 測る(page);
  expect(縮めた後!.最小.px, "縮める操作が効いていない (検査が空振りしている)").toBeLessThan(MIN_PX);

  await page.locator('[data-testid="editor-fit"]').click();
  await page.waitForTimeout(600);
  const 戻した後 = await 測る(page);
  expect(
    戻した後!.最小.px,
    `収めた後も文字が小さい: ${戻した後!.最小.px}px (倍率 ${戻した後!.倍率})`,
  ).toBeGreaterThanOrEqual(MIN_PX);
});

test("画面に出ていない文字は下限を決めない (#1084)", async ({ page }) => {
  // Round 1 review の指摘。 見本「プロジェクト構想」 には `display: none` の 20 の文字があり、
  // 数えると見えている最小 (24) ではなくそちらが下限を決める = 42% で足りるところが 50% になる。
  // 誰も読まない文字のために図が大きくなり、 横に動かす量も増える
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor#preset=mind");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const m = await 測る(page);
  expect(m!.件数, "文字を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  // 下限が倍率を決める図なので、 見えている最小文字はちょうど 10px に張り付く。
  // 隠れた文字を数えると 12px になる (実測)
  expect(
    m!.最小.px,
    `下限より大きく描かれている (隠れた文字を数えた疑い): ${m!.最小.px}px (倍率 ${m!.倍率})`,
  ).toBeLessThan(11);
  expect(m!.最小.px, `文字が小さすぎる: ${m!.最小.px}px`).toBeGreaterThanOrEqual(10);
});

test("枠に余裕がある図では倍率を上げない (#1084)", async ({ page }) => {
  // 下限は「小さすぎるのを止める」 床であって、 実寸より大きく見せる仕組みではない。
  // 縦長で元から読める見本 (トリガー) は、 下限を入れる前と同じ倍率のままになる
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor#preset=flow");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const m = await 測る(page);
  expect(m!.倍率, `倍率が動いた: ${m!.倍率}`).toBeGreaterThan(0.55);
  expect(m!.倍率, `倍率が上がった: ${m!.倍率}`).toBeLessThan(0.65);
});
