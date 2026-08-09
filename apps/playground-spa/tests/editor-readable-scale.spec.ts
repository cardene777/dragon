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

/**
 * 見本ごとの下限 (`#1102`)。 `#1084` の時点では 10px の 1 つだったが、 **10px では箱が枠から
 * 出る図に限り 8px まで譲る** 形になった。 譲っても収まらないなら譲らない。
 *
 * どの見本がどちらに落ちるかは `readable-floor.ts` が持つ (`editor-preview-width.spec.ts` と
 * 共有)。 それぞれの file に書くと、 片方だけ直しても両方が独立した期待値で通ってしまう。
 */
import { 下限 } from "./readable-floor";

/**
 * 検査は 2 層に分ける。
 *
 * ## 層 1 = 下限の計算 (3 件)
 *
 * 世界座標の最小文字が種別ごとに違うため、 **下限がどこで決まるかが変わる**。 その分かれ目を
 * 1 つずつ踏む。
 *
 * | 見本 | 世界座標の最小文字 | 下限 | 何を踏むか |
 * |---|---|---|---|
 * | swimlane | 20 | 40% (8px) | 下限が倍率を決める。 かつ **譲る側** (#1102) |
 * | flow | 22 | 45% (10px) | 下限が効かない (収める倍率 60% の方が大きい) |
 * | pie | 11 | 91% (10px) | 100% の頭打ちのすぐ手前 |
 *
 * `pie` を落とすと上限を下げる変異 (100% → 80%) を見逃す (実測で確認)。 swimlane と flow の
 * 下限は 40% / 45% で、 どちらも 80% を下回るため上限に触れない。
 *
 * `#1102` で swimlane は譲る側に落ちた (10px では箱が枠から出るため 8px まで下げる)。 40% は
 * その結果で、 譲る前は 50% だった。
 *
 * ## 層 2 = 描画側の出力 (全 12 見本を 1 件で回す)
 *
 * 下限は `smallestFontWorld` が読んだ文字の大きさから決まる。 その読み取りは
 * `getComputedStyle` に依存しており、 **描画側 (cdl、 別 repo) が大きさを計算値から読めない形で
 * 出すと、 その文字だけ下限の計算から漏れてその見本の下限を割る**。 描画は種別ごとに別なので、
 * これは層 1 の 3 件では捕まらない (Round 2 review の指摘)。
 *
 * 12 件を別々の検査にすると 12 件分の立ち上げ時間がかかるので、 1 件の中で回す。
 *
 * 実測 (全 12 見本) では 12 種とも大きさを計算値から読めており、 属性しか持たない文字も
 * 読めない文字も 0 件だった。 この検査はその状態が崩れた時に落ちる。
 *
 * 割ったかどうかは **見本ごとの下限** で見る (`readable-floor.ts`)。 一律 10px で見ると、
 * `#1102` で 8px まで譲った 3 件が常に落ちる。
 *
 * | 見本 | 世界座標の最小文字 | `#1084` 前 | `#1084` 後 | `#1102` 後 |
 * |---|---|---|---|---|
 * | swimlane | 20 | 4.6px | 10.0px | 8.0px (譲る) |
 * | er | 22 | — | 10.0px | 8.0px (譲る) |
 * | state-machine | 20 | — | 10.0px | 8.0px (譲る) |
 * | sequence | 20 | 7.1px | 10.0px | 10.0px |
 * | gantt / pie | 11 | 8.0 / 8.6px | 10.0px | 10.0 / 10.5px |
 * | c4 / topology | 17 | 9.5 / 10.2px | 10.0 / 10.2px | 11.6 / 10.2px |
 * | mind | 24 | 9.9px | 10.0px | 12.0px |
 * | flow | 22 | 13.3px | 13.3px (下限が効かない) | 13.3px |
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
  test(`見本 ${slug} を開くと文字が ${下限(slug)}px 以上で出る (#1084)`, async ({ page }) => {
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
    ).toBeGreaterThanOrEqual(下限(slug));
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
  expect(縮めた後!.最小.px, "縮める操作が効いていない (検査が空振りしている)").toBeLessThan(
    下限("swimlane"),
  );

  await page.locator('[data-testid="editor-fit"]').click();
  await page.waitForTimeout(600);
  const 戻した後 = await 測る(page);
  expect(
    戻した後!.最小.px,
    `収めた後も文字が小さい: ${戻した後!.最小.px}px (倍率 ${戻した後!.倍率})`,
  ).toBeGreaterThanOrEqual(下限("swimlane"));
});

test("画面に出ていない文字は下限を決めない (#1084)", async ({ page }) => {
  // 見本「Client・投稿・コメントのスキーマ」 には `display: none` の 20 の文字があり、 数えると
  // 見えている最小 (22) ではなくそちらが下限を決める = 45.5% で足りるところが 50% になる。
  // 誰も読まない文字のために図が大きくなり、 横に動かす量も増える。
  //
  // **下限が倍率を決める見本を選ぶ**。 枠に余裕がある見本では下限が効かず、 隠れた文字を数えても
  // 倍率が変わらないため検査が空振りする。 `#1100` で絵の枠を 852px に広げた時、 元々使っていた
  // 「プロジェクト構想」 は枠に収まるようになり (倍率 50.9% > 下限 41.7%) この検査が意味を
  // 失った。 実測で下限が決める見本に付け替えた。
  //
  // `#1102` で `er` は譲った下限 (8px) 側に落ちたが、 下限が倍率を決める点は変わらないため
  // この見本のままでよい。 見る値だけ 8px 基準に直した
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor#preset=er");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);

  const m = await 測る(page);
  expect(m!.件数, "文字を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  // 下限が倍率を決めているので、 見えている最小文字はちょうど 8px に張り付く。
  // 隠れた 20 の文字を数えると下限が 36.4% → 40% に上がり、 文字は 8.8px になる
  expect(
    m!.最小.px,
    `下限より大きく描かれている (隠れた文字を数えた疑い): ${m!.最小.px}px (倍率 ${m!.倍率})`,
  ).toBeLessThan(8.7);
  expect(m!.最小.px, `文字が小さすぎる: ${m!.最小.px}px`).toBeGreaterThanOrEqual(8);
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

test("全 12 見本で描画側の文字が下限の計算に載る (#1084)", async ({ page }) => {
  // 層 2 (file 冒頭の説明を参照)。 下限は `smallestFontWorld` が読んだ文字の大きさから決まり、
  // その読み取りは `getComputedStyle` に依存する。 描画側 (cdl、 別 repo) が大きさを計算値から
  // 読めない形で出すと、 その文字だけ計算から漏れてその見本の下限 (`readable-floor.ts`) を
  // 割る。 描画は種別ごとに別なので層 1 の 3 件では捕まらない。
  //
  // 12 件を別々の検査にすると立ち上げ時間が 12 回かかるので、 1 件の中で回す
  // 見本ごとの「画面に出ている文字の数」 を下限として記録する。 描画側が文字を隠す形に変わると
  // この数が減る = 図から言葉が黙って消える (Round 2 review 3 巡目の指摘)。
  //
  // 下限にするのは、 見本に中身を足した時に落とさないため。 減る方向だけを見る。
  // 実測値 (2026-08-08) は下の数そのもので、 隠れている文字は別に 1-4 件ある (種別ごとの
  // 重複した名前で、 描画側が意図して隠している)。
  //
  // `#1102` で 2 件を下方修正した。 いずれも見本から登場人物を 1 つ外した分で、 内訳も一致する。
  //
  // | 見本 | 変更前 | 変更後 | 減った言葉 |
  // |---|---|---|---|
  // | `swimlane` | 8 | 6 | `DB` / `Client保存` (レーンを 1 本外した) |
  // | `state-machine` | 10 | 8 | `失敗` / `認証失敗` / `再試行` が消え `認証失敗・再試行` が増えた |
  const 見本: ReadonlyArray<readonly [string, number]> = [
    ["sequence", 10], ["sequence-checkout", 9], ["flow", 7], ["swimlane", 6],
    ["topology", 11], ["er", 25], ["state-machine", 8], ["class", 19],
    ["gantt", 8], ["mind", 5], ["pie", 8], ["c4", 11],
  ];
  const 問題: string[] = [];

  for (const [slug, 見える下限] of 見本) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/editor#preset=${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1600);

    const m = await page.evaluate(() => {
      const svg = document.querySelector<SVGSVGElement>(".v4-editor-preview svg[data-cdl-stage]");
      if (!svg) return null;
      const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      let 読めない = 0;
      let 最小 = Number.POSITIVE_INFINITY;
      let 測った = 0;
      let 見える = 0;
      for (const t of svg.querySelectorAll("text")) {
        if ((t.textContent ?? "").trim().length === 0) continue;
        const cs = getComputedStyle(t);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        見える += 1;
        const size = Number.parseFloat(cs.fontSize);
        // 大きさを計算値から読めない文字。 `smallestFontWorld` はこれを飛ばすので、
        // 下限の計算に載らないまま画面に出る
        if (!Number.isFinite(size) || size <= 0) {
          読めない += 1;
          continue;
        }
        測った += 1;
        最小 = Math.min(最小, size * k);
      }
      return { 読めない, 最小: Number.isFinite(最小) ? Math.round(最小 * 10) / 10 : -1, 測った, 見える };
    });

    if (m === null) {
      問題.push(`${slug}: 図が画面に無い`);
      continue;
    }
    if (m.測った === 0) 問題.push(`${slug}: 文字を 1 つも測れていない`);
    if (m.読めない > 0) 問題.push(`${slug}: 大きさを読めない文字 ${m.読めない} 件`);
    if (m.最小 > 0 && m.最小 < 下限(slug)) 問題.push(`${slug}: 最小文字 ${m.最小}px`);
    // 画面に出ている文字が減った = 図から言葉が黙って消えた
    if (m.見える < 見える下限) 問題.push(`${slug}: 見える文字が ${m.見える} 件 (${見える下限} 件あったはず)`);
  }

  expect(問題, `描画側の文字が下限の計算に載っていない: ${問題.join(" / ")}`).toEqual([]);
});
