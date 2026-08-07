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

test("見本「言語シェア」 で文字が箱からはみ出さない (#1076)", async ({ page }) => {
  // 変更前は `45%` が card の説明文として枠の下端に重なっていた
  await openSample(page, "pie");
  const 溢れ = await page.evaluate(() => {
    const out: string[] = [];
    for (const body of document.querySelectorAll("svg [data-cdl-role='node-body']")) {
      const g = body.closest("g");
      const label = g?.querySelector("[data-cdl-role='node-label']");
      if (!label) continue;
      const b = body.getBoundingClientRect();
      const t = label.getBoundingClientRect();
      if (b.height < 1 || t.height < 1) continue;
      if (t.bottom - b.bottom > 1 || b.top - t.top > 1) {
        out.push(`${(label.textContent ?? "").trim()}(下 ${Math.round(t.bottom - b.bottom)})`);
      }
    }
    return out;
  });
  expect(溢れ, `文字が箱からはみ出している: ${溢れ.join(", ")}`).toEqual([]);
});
