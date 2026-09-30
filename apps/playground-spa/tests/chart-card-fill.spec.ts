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
  { id: "今月の解約率", 種: "chart-stat", 横: 32, 縦: 52, 直す前: "22% / 43%" },
  { id: "対応済みの問い合わせ", 種: "chart-waffle", 横: 72, 縦: 80, 直す前: "57% / 86%" },
  { id: "費用の内訳", 種: "chart-pie", 横: 72, 縦: 76, 直す前: "59% / 81%" },
  { id: "機能ごとの利用率", 種: "chart-radial", 横: 72, 縦: 80, 直す前: "63% / 85%" },
  { id: "契約の内訳", 種: "chart-stacked-bar", 横: 88, 縦: 58, 直す前: "92% / 39%" },
  { id: "今期の売上進捗", 種: "chart-gauge", 横: 76, 縦: 80, 直す前: "79% / 85% (変えていない)" },
  { id: "経路別の流入", 種: "chart-bar", 横: 80, 縦: 80, 直す前: "85% / 86% (変えていない)" },
  { id: "週ごとの応答時間", 種: "chart-line", 横: 80, 縦: 74, 直す前: "85% / 79% (変えていない)" },
  { id: "経路別の申込み", 種: "chart-slope", 横: 88, 縦: 82, 直す前: "92% / 87% (変えていない)" },
];

type 実測 = { 種: string; 横: number; 縦: number } | null;

async function 測る(page: Page, id: string): Promise<実測> {
  await page
    .locator(`aside.catalog-sidebar .catalog-list-item[data-item-id="${id}"]`)
    .first()
    .click();
  await page.waitForTimeout(1200);
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

test.describe("値の図の札が中身の形に合う (#2708)", () => {
  test("9 型すべてが下限を満たす", async ({ page }) => {
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
