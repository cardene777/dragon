/**
 * 記法の型が約束した図が実際に描かれることの検証 (#1076)。
 *
 * `type: pie` と書いても円が描かれず、480x120 の箱が縦に並ぶだけだった。
 * 割合 (`"45%"`) は箱の説明文として置かれ、枠の下端に重なって切れていた。
 *
 * 描画側には `chart-pie` の実装があり、`/catalog/presets` の「円グラフ」 では円が出ていた。
 * **記法経由の compile だけが円を使っていなかった**。
 *
 * ## 組み立て結果ではなく画面を見る
 *
 * 「`chart-pie` の node を作った」 までは単体 test が見る (`packages/dragon/test/`)。
 * 本 file は **画面に扇が描かれたか** を見る。 node の種類が正しくても、描画側が扇を出さなければ
 * 見る人にとっては直っていない。
 */
import { test, expect } from "@playwright/test";

async function openSample(page: import("@playwright/test").Page, slug: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/editor#preset=${slug}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

test("見本「言語シェア」 で円が描かれる (#1076)", async ({ page }) => {
  await openSample(page, "pie");

  const m = await page.evaluate(() => {
    const g = document.querySelector('[data-cdl-kind="chart-pie"]');
    if (!g) return null;
    const 扇 = [...g.querySelectorAll("path")].map((p) => {
      const r = p.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), d: (p.getAttribute("d") ?? "").slice(0, 8) };
    });
    return {
      扇,
      文字: [...g.querySelectorAll("text")].map((t) => (t.textContent ?? "").trim()),
    };
  });

  expect(m, "円を描く箱が画面に無い").not.toBeNull();
  // 4 項目 = 扇 4 枚。 数を見ないと、 1 枚だけ描いて残りが消えても通る
  expect(m!.扇.length, `扇の数が違う: ${JSON.stringify(m!.扇)}`).toBe(4);
  // 大きさを見ないと、 `d` が空の path が 4 つあるだけでも通る
  for (const s of m!.扇) {
    expect(s.w, `扇が潰れている (${JSON.stringify(s)})`).toBeGreaterThan(20);
    expect(s.h, `扇が潰れている (${JSON.stringify(s)})`).toBeGreaterThan(20);
  }
  // 割合が画面に出る (箱の説明文ではなく凡例として)
  expect(m!.文字.join(" "), "割合が出ていない").toContain("45.0%");
  expect(m!.文字.join(" "), "項目名が出ていない").toContain("TypeScript");
});

test("見本「スプリントロードマップ」 で帯と目盛りが描かれる (#1077)", async ({ page }) => {
  // 変更前は帯も目盛りも無く、 小さな箱が階段状に 4 つ散らばっていた
  await openSample(page, "gantt");

  const m = await page.evaluate(() => {
    const g = document.querySelector('[data-cdl-kind="gantt-timeline"]');
    if (!g) return null;
    const box = g.getBoundingClientRect();
    // 帯 = 図の幅の 1 割から 6 割に収まる矩形。 枠や背景 (ほぼ全幅) と区別する
    const 帯 = [...g.querySelectorAll("rect")]
      .map((r) => r.getBoundingClientRect())
      .filter((r) => r.width > box.width * 0.05 && r.width < box.width * 0.6 && r.height > 4)
      .map((r) => ({ w: Math.round(r.width), x: Math.round(r.x) }));
    const 文字 = [...g.querySelectorAll("text")];
    return {
      帯,
      文言: 文字.map((t) => (t.textContent ?? "").trim()),
      最小文字高: Math.min(...文字.map((t) => Math.round(t.getBoundingClientRect().height))),
    };
  });

  expect(m, "帯を描く箱が画面に無い").not.toBeNull();
  // 4 タスク = 帯 4 本。 数を見ないと、 1 本だけ描いて残りが消えても通る
  expect(m!.帯.length, `帯の数が違う: ${JSON.stringify(m!.帯)}`).toBe(4);
  // 時期がずれていれば x も動く = 4 本が同じ位置に重なっていないことを見る
  expect(new Set(m!.帯.map((b) => b.x)).size, "帯が同じ位置に重なっている").toBe(4);
  // 目盛りとタスク名が出る
  for (const 語 of ["Q1", "Q4", "設計", "リリース"]) {
    expect(m!.文言.join(" "), `${語} が出ていない`).toContain(語);
  }
  // 変更前は幅 1400 の帯を敷いていたため、 画面に合わせると文字が読めない大きさになっていた
  expect(m!.最小文字高, "文字が小さすぎる").toBeGreaterThanOrEqual(8);
});

test("見本「言語シェア」 で文字が箱からはみ出さない (#1076)", async ({ page }) => {
  // 変更前は `45%` が card の説明文として枠の下端に重なっていた。
  //
  // **`data-cdl-role='node-label'` を探しては測れない**。 円グラフの凡例は role を持たない
  // 素の `text` で、 探しても 0 件になり「はみ出しは 0 件」 として通る (Round 1 review の指摘)。
  // 円の箱の下にある `text` を直接列挙し、 測った件数も併せて見る
  await openSample(page, "pie");
  const m = await page.evaluate(() => {
    const chart = document.querySelector('[data-cdl-kind="chart-pie"]');
    if (!chart) return null;
    const body = chart.querySelector("[data-cdl-role='node-body']") ?? chart;
    const b = body.getBoundingClientRect();
    const 溢れ: string[] = [];
    let 測った = 0;
    for (const t of chart.querySelectorAll("text")) {
      const r = t.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      測った++;
      const 下 = Math.round(r.bottom - b.bottom);
      const 上 = Math.round(b.top - r.top);
      const 右 = Math.round(r.right - b.right);
      const 左 = Math.round(b.left - r.left);
      if (下 > 1 || 上 > 1 || 右 > 1 || 左 > 1) {
        溢れ.push(`${(t.textContent ?? "").trim()}(下 ${下} / 上 ${上} / 右 ${右} / 左 ${左})`);
      }
    }
    return { 溢れ, 測った };
  });

  expect(m, "円を描く箱が画面に無い").not.toBeNull();
  // 8 = 項目名 4 + 割合 4。 件数を見ないと、 文字が 1 つも取れていない状態で通る
  expect(m!.測った, "凡例の文字を 1 つも測れていない").toBeGreaterThanOrEqual(8);
  expect(m!.溢れ, `文字が箱からはみ出している: ${m!.溢れ.join(", ")}`).toEqual([]);
});
