/**
 * 段の説明の枠が、携帯の幅でどれだけ空くかを測る (#2633)。
 *
 * 説明を出す層は全段の説明を同じ升へ重ね、いま光っている 1 つだけを見せる (#2609)。
 * **高さは最も長い説明で決まる**ので、短い説明の段ではその差のぶん枠が空のまま残る。
 *
 * ## なぜ実ブラウザで測るか
 *
 * この高さの決まり方は #2609 から一度も実測されていなかった。 jsdom は文を並べないので
 * 行数が出ず、字数を数える形も当たらない = 折り返しは器の幅と字の種類で決まる。
 *
 * ## 要素の高さでは測れない
 *
 * 升は `grid-area: 1 / 1` で重ねてあり、既定の `align-items: stretch` で **どの行も升の
 * 高さまで伸びる**。 `getBoundingClientRect()` を引くと全段が同じ値を返し、空きが常に
 * 0 という結果になる (実測でそうなった)。 **文そのものの行箱を `Range.getClientRects()` で
 * 数える**。
 *
 * ## 広い画面は測らない
 *
 * 幅 1440px では枠が 914px になり、348 件のうち 342 件が 1 行に収まる。 空きは最大 1 行で、
 * 字数の差が高さの差にならない。 空きが出るのは携帯の幅だけなので、そこだけを見る。
 *
 * ## 上限を空きに置き、枠の高さには置かない
 *
 * 全段が 4 行の図は空きが 0 行で、読み手は無駄な余白を見ない (`eth-eip1559-gas` が実例)。
 * 打ち切る形も採らない = #2609 で 4 行の説明が 2 行で切れ、後ろ半分が読めなかった。
 *
 * 上限は 3 行。 実測の分布は 0 行 180 件 / 1 行 156 件 / 2 行 12 件で、**3 行と 4 行は
 * 1 件も無い**。 直す前は `presets/class-demo` だけが 5 行 (100px) で、段 2 を見ている間
 * 枠の 5 行が空のまま残っていた。 空の帯に線を引くので、いま在る書き方は 1 件も落とさず、
 * 今日の最悪より 1 行ぶん余裕が残る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-phase-note-gap`
 */
import { test, expect } from "@playwright/test";

import { CATEGORIES } from "../src/lib/catalog";

/** 携帯の幅と高さ。 iPhone 14 の値 (`catalog-modal-readable.spec.ts` と揃える) */
const 携帯の幅 = 390;
const 携帯の高さ = 844;

/** 空のまま残してよい行数の上限 (§ 上限を空きに置き、枠の高さには置かない) */
const 空きの上限 = 3;

test("携帯の幅で段の説明の枠が空きすぎない", async ({ page }, info) => {
  info.setTimeout(30_000 + CATEGORIES.length * 60_000);
  await page.setViewportSize({ width: 携帯の幅, height: 携帯の高さ });

  const 超過: string[] = [];
  let 母数 = 0;

  for (const 分類 of CATEGORIES) {
    await page.goto(`catalog/${分類.slug}`, { waitUntil: "networkidle" });
    const 件数 = await page.locator(".catalog-list .catalog-list-item").count();
    for (let i = 0; i < 件数; i += 1) {
      const 行 = page.locator(".catalog-list .catalog-list-item").nth(i);
      const id = (await 行.getAttribute("data-item-id")) ?? `${i}`;
      await 行.click();
      // 図を差し替えると説明も差し替わる。 描き直しを待たずに測ると前の図の行数を拾う
      await page.waitForTimeout(60);

      const 測 = await page.evaluate(() => {
        const box = document.querySelector(".cdl-phase-note");
        // 段が 1 つしかない図では枠ごと出ない (`PhaseNote` の出す下限)
        if (box === null) return null;
        return [...box.querySelectorAll(".cdl-phase-note-line")].map((p) => {
          // 升に伸ばされた要素ではなく、文そのものの行箱を数える
          const r = document.createRange();
          r.selectNodeContents(p);
          return [...r.getClientRects()].filter((x) => x.height > 0).length;
        });
      });

      if (測 === null || 測.length === 0) continue;
      母数 += 1;
      const 空き = Math.max(...測) - Math.min(...測);
      if (空き <= 空きの上限) continue;
      超過.push(
        `${分類.slug}/${id} 行 [${測.join(", ")}] = 空き ${空き} 行 (${空き * 20}px)`,
      );
    }
  }

  // **0 件の報告には母数を併記する** = 枠を 1 件も開けていない状態と区別が付かなくなる
  expect(母数, "説明の枠が 1 件も出ていない (頁の走査か枠の出し方が壊れている)").toBeGreaterThan(0);
  expect(
    超過,
    `段を送ると枠が ${空きの上限} 行より多く空く図がある (母数 ${母数} 図)。` +
      ` 1 段だけが長いので、その段を短くするか内容を段へ分ける\n  ${超過.join("\n  ")}`,
  ).toHaveLength(0);
});
