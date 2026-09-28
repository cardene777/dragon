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
 * ## パターンの切替も押す (#2645)
 *
 * 見本帳の項目には「パターン」 の切替があり、押すと中身が入れ替わる (#1696)。 簡単な版と
 * 複雑な版が 1 つの行にまとまっているのはこの仕組みで、**説明が長いのは複雑な版のほう**に
 * なる。 行を押すだけの形は既定の中身しか測らず、最も空きが出やすい側を 1 件も見ていなかった。
 *
 * 押す形に変えると母数が 348 件から 415 件へ増え、そのうち 106 件がパターンの中身になる。
 * 抜けていた側から `presets/class-demo` の複雑な版が 1 件出た = **同じ項目の簡単な版は
 * #2633 で直したのに、複雑な版は測っていないので 5 行のまま残っていた**。
 *
 * file の export を直に走査する側 (`catalog-phase-note-coverage.test.ts`) は `pattern__` で
 * 始まる export も数えるため、抜けていたのは画面を動かすこちらだけだった。
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

/** パターンの切替に付く見出し (`CategoryPage.tsx` の `aria-label` と同じ字) */
const パターンの札 = "パターン";

/** パターンを持つ項目が 1 つも見つからなければ、切替を押せていない (#2645) */
const パターンの下限 = 1;

test("携帯の幅で段の説明の枠が空きすぎない", async ({ page }, info) => {
  info.setTimeout(30_000 + CATEGORIES.length * 60_000);
  await page.setViewportSize({ width: 携帯の幅, height: 携帯の高さ });

  const 超過: string[] = [];
  let 母数 = 0;
  let パターンの数 = 0;

  for (const 分類 of CATEGORIES) {
    await page.goto(`catalog/${分類.slug}`, { waitUntil: "networkidle" });
    const 件数 = await page.locator(".catalog-list .catalog-list-item").count();
    for (let i = 0; i < 件数; i += 1) {
      const 行 = page.locator(".catalog-list .catalog-list-item").nth(i);
      const id = (await 行.getAttribute("data-item-id")) ?? `${i}`;
      await 行.click();
      // 図を差し替えると説明も差し替わる。 描き直しを待たずに測ると前の図の行数を拾う
      await page.waitForTimeout(60);

      // **パターンを持つ項目は中身の数だけ測る** (§ パターンの切替も押す)。 持たない項目は
      // 切替そのものが出ないので、`0` を 1 回に読み替えて既定の中身だけを測る
      const 切替 = page.locator(`[role="radiogroup"][aria-label="${パターンの札}"] button`);
      const 中身の数 = await 切替.count();
      for (let j = 0; j < Math.max(中身の数, 1); j += 1) {
        let 中身 = "既定";
        if (中身の数 > 0) {
          中身 = ((await 切替.nth(j).textContent()) ?? `${j}`).trim();
          await 切替.nth(j).click();
          // 切替も図を差し替えるので、行を押した時と同じだけ描き直しを待つ
          await page.waitForTimeout(60);
        }

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
        if (中身の数 > 0) パターンの数 += 1;
        const 空き = Math.max(...測) - Math.min(...測);
        if (空き <= 空きの上限) continue;
        超過.push(
          `${分類.slug}/${id}/${中身} 行 [${測.join(", ")}] = 空き ${空き} 行 (${空き * 20}px)`,
        );
      }
    }
  }

  // **0 件の報告には母数を併記する** = 枠を 1 件も開けていない状態と区別が付かなくなる
  expect(母数, "説明の枠が 1 件も出ていない (頁の走査か枠の出し方が壊れている)").toBeGreaterThan(0);
  // **母数だけでは切替を押せたか判らない** = 切替の探し方が壊れても、既定の中身だけで
  // 母数は埋まる。 パターンの中身を別に数えて、0 件なら落とす
  expect(
    パターンの数,
    `パターンの中身を 1 件も測っていない (切替の探し方が壊れている、母数 ${母数} 枠)`,
  ).toBeGreaterThanOrEqual(パターンの下限);
  expect(
    超過,
    `段を送ると枠が ${空きの上限} 行より多く空く図がある (母数 ${母数} 枠 / うちパターンの中身 ${パターンの数} 枠)。` +
      ` 1 段だけが長いので、その段を短くするか内容を段へ分ける\n  ${超過.join("\n  ")}`,
  ).toHaveLength(0);
});
