/**
 * 値の図の札が、その型が実際に描く中身の形に合っていること (#2708)。
 *
 * 札の大きさは `packages/dragon/src/compile/value-chart.ts` の `札の大きさ` が型ごとに持つ。
 * その数は見本帳の実描画を測って決めた値なので、**人手で書いた数が実物とずれる**。
 * ここで実際に描かせて測り直し、下限を割ったら落とす
 * (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
 *
 * 測るのは札 (`node-body`) に対する中身の外接矩形の割合で、図の題は数えない。
 * 縦が中身の大きさを決める型 (`waffle` / `pie` / `radial`) は、横を広げても絵が大きくならず
 * 左右が余白になるだけだった。 横を 640 に戻すと 57% / 59% / 63% まで落ちるので、
 * 下限 72% はその差を捉える。
 *
 * `stat` の横が低いのは欠陥ではない。 数値 1 つと名前しか描かないので、桁数が札の幅を決める。
 * 見るのは縦で、数値の級が描画側で 112 に止まるため、札を高くするほど上下が空く。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test chart-card-fill`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

/**
 * 型ごとの下限。
 *
 * 数は「今の実測より少し下」 ではなく「直す前の値より上」 に置く。
 * 直す前を跨がない下限は、札の大きさを元に戻しても落ちない = 何も守らない。
 */
const 下限: ReadonlyArray<{
  id: string;
  種: string;
  横: number;
  縦: number;
  直す前: string;
}> = [
  { id: "今月の解約件数", 種: "chart-stat", 横: 32, 縦: 52, 直す前: "22% / 43%" },
  { id: "対応済みの問い合わせ", 種: "chart-waffle", 横: 72, 縦: 80, 直す前: "57% / 86%" },
  { id: "費用の内訳", 種: "chart-pie", 横: 72, 縦: 76, 直す前: "59% / 81%" },
  { id: "機能ごとの利用率", 種: "chart-radial", 横: 72, 縦: 80, 直す前: "63% / 85%" },
  { id: "契約の内訳", 種: "chart-stacked-bar", 横: 88, 縦: 58, 直す前: "92% / 39%" },
  { id: "今期の売上進捗", 種: "chart-gauge", 横: 76, 縦: 80, 直す前: "79% / 85% (変えていない)" },
  { id: "経路別の流入", 種: "chart-bar", 横: 80, 縦: 80, 直す前: "85% / 86% (変えていない)" },
  { id: "週ごとの応答時間", 種: "chart-line", 横: 80, 縦: 74, 直す前: "85% / 79% (変えていない)" },
  { id: "経路別の申込み", 種: "chart-slope", 横: 88, 縦: 82, 直す前: "92% / 87% (変えていない)" },
];

type 実測 = { 種: string; 横: number; 縦: number; 読み切れた: boolean } | null;

/**
 * 読む間隔と、落ち着いたとみなす回数と、上限 (#2721)。
 *
 * それまでは押してから 1200 ミリ秒の 1 回だけ読んでいた。 **同じ code のまま落ちたり
 * 通ったりした** (実測 = 既定 branch で 4 回中 1 回、作業 branch で 3 回中 2 回。
 * 落ちる図も値も毎回同じで、横 92% の回と 78% の回に割れる)。
 *
 * `chart-slope` の外接を 250 ミリ秒ごとに 32 回読むと、こう動く。
 *
 * ```
 * 0.25s 78 | 0.50s 78 | 0.75s 78 | 1.00s 78 | 1.25s 92 | … | 5.75s 92 | 6.00s 78 | … | 7.25s 92
 * ```
 *
 * 段が繰り返す図で、1 巡の最初の 1.25 秒だけ名札が入っておらず 78 になる。
 * 1200 ミリ秒の 1 回読みはちょうどこの境目に当たっていた。
 *
 * **伸びなくなるまで読む** (`drawing-measure.mjs` と同じ形、#2675)。
 * 一番広がった読みを採るので、巡回して戻る図でも一番広い形で判定できる。
 *
 * **落ち着いた判定の前に最低回数を置く**。 伸びる前に平らな区間があるので、
 * 落ち着いた回数だけで止めると 78 のまま抜ける (`落ち着いた回数` を 3 にした時に実測)。
 * 最低 3 秒読んでから落ち着き判定に入る = 上の平らな区間 (1.25 秒) より長い。
 *
 * 上限まで伸び続けた図は「読み切れていない」 として別に返す。 0 件として数えると、
 * 測れなかったことが「下限を満たした」 と同じ結果になる
 * (`rules/quality.md § 判定できなかったことを値に潰さない`)。
 */
const 読む間隔 = 250;
const 最低読み回数 = 12;
const 落ち着いた回数 = 8;
const 読む上限 = 32;

type 一読み = { 種: string; 横: number; 縦: number } | null;

async function 一度読む(page: Page): Promise<一読み> {
  return page.locator("[data-cdl-stage]").first().evaluate((svg) => {
    const 箱 = svg.querySelector('[data-cdl-role="node-body"]');
    if (!箱) return null;
    const b = 箱.getBoundingClientRect();
    if (b.width <= 0 || b.height <= 0) return null;
    const 親 = 箱.parentElement ?? svg;
    const 種 = 親.closest("[data-cdl-kind]")?.getAttribute("data-cdl-kind") ?? "?";
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const el of 親.querySelectorAll("text, path, rect, circle, line, polygon, polyline")) {
      if (el === 箱) continue;
      // 図の題は札の外に出るので数えない
      if (el.getAttribute("data-cdl-role") === "figure-title") continue;
      const q = el.getBoundingClientRect();
      if (q.width <= 0 || q.height <= 0) continue;
      x0 = Math.min(x0, q.left);
      y0 = Math.min(y0, q.top);
      x1 = Math.max(x1, q.right);
      y1 = Math.max(y1, q.bottom);
    }
    if (!Number.isFinite(x0)) return null;
    return {
      種,
      横: Math.round(((x1 - x0) / b.width) * 100),
      縦: Math.round(((y1 - y0) / b.height) * 100),
    };
  });
}

/**
 * 図を押して、外接が伸びなくなるまで読む (#2721)。
 *
 * 一番広がった読みを採る。 段は繰り返すので、待てば必ず全部描かれる。
 * 「伸びなくなった」 は、一番広い値が `落ち着いた回数` だけ入れ替わらなかったことで見る。
 */
async function 測る(page: Page, id: string): Promise<実測> {
  await page
    .locator(`aside.catalog-sidebar .catalog-list-item[data-item-id="${id}"]`)
    .first()
    .click();

  type 広がり = { 種: string; 横: number; 縦: number };
  let 一番広い: 広がり | null = null;
  let 入れ替わらなかった回数 = 0;
  for (let i = 0; i < 読む上限; i += 1) {
    await page.waitForTimeout(読む間隔);
    const 今 = await 一度読む(page);
    if (今 === null) continue;
    if (一番広い === null) {
      一番広い = { 種: 今.種, 横: 今.横, 縦: 今.縦 };
      入れ替わらなかった回数 = 0;
      continue;
    }
    // 横と縦のどちらかが伸びたら採り直す。 片方だけ伸びる図があるため両方を見る
    const 広い横 = Math.max(今.横, 一番広い.横);
    const 広い縦 = Math.max(今.縦, 一番広い.縦);
    const 伸びた = 広い横 > 一番広い.横 || 広い縦 > 一番広い.縦;
    一番広い = { 種: 今.種, 横: 広い横, 縦: 広い縦 };
    if (伸びた) {
      入れ替わらなかった回数 = 0;
      continue;
    }
    入れ替わらなかった回数 += 1;
    if (i + 1 >= 最低読み回数 && 入れ替わらなかった回数 >= 落ち着いた回数) {
      return { ...一番広い, 読み切れた: true };
    }
  }
  if (一番広い === null) return null;
  return { ...一番広い, 読み切れた: false };
}

/**
 * 待ち時間 (#2721)。
 *
 * 1 図あたり最低 `読む間隔 × 最低読み回数` = 3 秒、最長 `読む間隔 × 読む上限` = 8 秒。
 * 9 図ぶんで 27 秒から 72 秒になり、既定の 30 秒を超えるので明示する。
 *
 * **判定は 1 つも緩めていない** = 見るのは使用率の下限で、待ち時間は歯止めではない。
 * 長くして失うのは、本当に固まった時に気付くまでの時間だけになる。
 */
test.describe("値の図の札が中身の形に合う (#2708)", () => {
  test("9 型すべてが下限を満たす", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("catalog/charts", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    // **1 件目で止めない**。 割った型が 1 つだけなのか全部なのかが読めないと、
    // 直す時にどこを見ればよいか判らない。 全件測ってから落とす
    const 測れた: string[] = [];
    const 違反: string[] = [];
    for (const 行 of 下限) {
      const r = await 測る(page, 行.id);
      // 測れなかったことを 0% に潰さない (`rules/quality.md § 判定できなかったことを値に潰さない`)
      if (r === null) {
        違反.push(`${行.id} (${行.種}) の札か中身を測れなかった`);
        continue;
      }
      // 上限まで伸び続けた図は「読み切れていない」。 下限を満たしたことにしない
      if (!r.読み切れた) {
        違反.push(
          `${行.id} (${行.種}) は ${読む上限} 回読んでも外接が伸び続けた (横 ${r.横}% / 縦 ${r.縦}%)。 段が長いか、上限が足りない`,
        );
        continue;
      }
      測れた.push(行.id);
      if (r.種 !== 行.種) 違反.push(`${行.id} の種別が ${r.種} になっている (期待 ${行.種})`);
      if (r.横 < 行.横) {
        違反.push(
          `${行.id} (${行.種}) の横の使用率 ${r.横}% が下限 ${行.横}% を割った。 直す前 = ${行.直す前}`,
        );
      }
      if (r.縦 < 行.縦) {
        違反.push(
          `${行.id} (${行.種}) の縦の使用率 ${r.縦}% が下限 ${行.縦}% を割った。 直す前 = ${行.直す前}`,
        );
      }
    }

    // 母数を明示する。 1 件も測らずに通る形を塞ぐ
    expect(測れた.length, `測れたのは ${測れた.length} 件で、全 ${下限.length} 件に届かない`).toBe(
      下限.length,
    );
    expect(違反, `下限を割った型が ${違反.length} 件ある`).toEqual([]);
  });
});
