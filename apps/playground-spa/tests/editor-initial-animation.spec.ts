import { test, expect } from "@playwright/test";
import { 記法をURLに載せる, 矢印が伸びる記法 } from "./box-and-edge-figure";

/**
 * `/editor` の初期表示で線が最後まで描かれることを固定する (#381)。
 *
 * 症状 = 最初の message の線が点だけになり、 線が抜ける。 原因は cdl の `Timeline.destroy()` が
 * rAF を止めるだけで状態を戻さず、 React StrictMode の二重 mount で
 * 「1 回目の mount が `playing` にする → 疑似 unmount で rAF だけ止まる → 再 mount の
 * `autostart()` が `status !== "idle"` で何もしない」 となって progress 0 で固まっていた。
 *
 * cdl は `destroy()` で constructor 直後の状態を復元するようになっており、 その振る舞いは
 * cdl の unit test (`test/anim/timeline.test.ts`) が固定している。 ここで見るのは **user が
 * 実際に見た症状** = 開いた図の線が最後まで伸びること。 unit test は Timeline 単体の状態しか
 * 見ないので、 React の mount 経路を通した結果は別に要る。
 *
 * 時刻を決め打ちで待たない。 遅い環境では観測前に描き終わり、 rAF が遅れる環境では stub の
 * まま観測してしまう。 **変化を追い、 途中と完了の両方を捉えるまで待つ**。
 */

/** 描かれている線の終点 x。 progress 0 で止まると始点しか無いので `null`。 */
const endsOf = (page: import("@playwright/test").Page) =>
  page.evaluate(() => Array.from(
    document.querySelectorAll('.v4-editor-stage svg[data-cdl-stage] [data-cdl-role="edge-line"]'),
  ).map((p) => {
    const d = (p.getAttribute("d") ?? "").trim();
    if (/^M\s*[-\d.]+\s+[-\d.]+$/.test(d)) return null; // 始点だけ = 伸びていない
    const parts = d.split(/\s+/);
    const x = Number(parts.at(-2));
    return Number.isFinite(x) ? x : null;
  }));

test("editor の初期表示で線が最後まで伸びる (#381)", async ({ page }) => {
  // **既定の見本には依らない** (#1488)。 既定は順序図で、`#1466` から 1 枚の板として
  // 描かれる = 矢印が 1 本も出ないため、線を 1 つも測れない。
  // 伸びる動きは図種に依らないので、矢印を名指しする段を持つ図を開く。
  await page.goto(`editor#s=${記法をURLに載せる(矢印が伸びる記法)}`);
  // SVG の path は fill が無いと visible 判定にならないので attached で待つ。
  await page.waitForSelector('.v4-editor-stage svg[data-cdl-stage] [data-cdl-role="edge-line"]', { state: "attached", timeout: 20000 });

  // 40ms ごとに終点を記録する。 「途中の値」 と「落ち着いた値」 の両方が要る。 間隔を空けると
  // 伸びる過程 (約 1.5 秒) を跨いでしまい、 最初の観測が既に完了状態になることがある。
  const series: Array<Array<number | null>> = [];
  for (let i = 0; i < 120; i++) {
    series.push(await endsOf(page));
    const n = series.length;
    // 直近 5 回が同じなら落ち着いたとみなす。
    if (n >= 12) {
      const tail = series.slice(-10).map((s) => JSON.stringify(s));
      // `n >= 12` の枝なので直近の 1 件は必ず引ける
      const 直近 = series[n - 1];
      if (tail.every((s) => s === tail[0]) && 直近 !== undefined && !直近.includes(null)) break;
    }
    await page.waitForTimeout(40);
  }

  const last = series.at(-1)!;
  expect(last.length, "線が 1 本も無い").toBeGreaterThan(0);
  expect(last.includes(null), `始点だけの線が残っている: ${JSON.stringify(last)}`).toBe(false);

  // **伸びる過程を観測したこと**。 これが無いと「最初から静止画で全部描かれている」 図でも
  // 通り、 progress が動いた証明にならない。 1 本目について、 最終値より小さい観測が
  // 1 回以上あることを見る。
  const finalFirst = last[0]!;
  const grew = series.some((s) => s[0] === null || (s[0] !== undefined && s[0] < finalFirst));
  expect(grew, `1 本目が最初から最終値のまま (series=${JSON.stringify(series.map((s) => s[0]))})`).toBe(true);
});
