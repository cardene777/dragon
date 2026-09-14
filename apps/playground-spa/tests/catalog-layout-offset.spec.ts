/**
 * 位置のずらしの見本で、パターンを押すと箱・縦列・矢印の名前が書いた量だけ動くことの確認 (#1971)。
 *
 * **図の座標で比べる**。 画面の点で比べると、図の広さが変わる切替 (縦列を右へずらすと図が
 * 広がる) で縮尺が変わり、動いた量が書いた量と一致しなくなる。 字の中心を図の座標へ戻してから
 * ずらさない図と引き算する。
 *
 * **動かない相手も見る**。 ずらした相手が動くだけだと、図全体が一緒に動く形を見逃す。
 */
import { test, expect, type Page } from "@playwright/test";

/** 一覧の行に出る見本の id (ずらさない図の題から決まる) */
const 見本 = "位置をずらさない";

/** 字の中心の許す差。 字の幅は図の座標で測るので、描画の丸めの分だけ見る */
const 許す差 = 1.5;

type 点 = { x: number; y: number };

async function 開く(page: Page): Promise<void> {
  await page.goto("catalog/primitives", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.locator("aside.catalog-sidebar .catalog-list-item", { hasText: 見本 }).first().click();
  await page.waitForTimeout(800);
  await expect(page.locator("main.catalog-preview svg[data-cdl-stage]").first()).toBeVisible();
}

async function 押す(page: Page, 名: string): Promise<void> {
  await page
    .getByRole("radiogroup", { name: "パターン" })
    .getByRole("radio", { name: 名, exact: true })
    .click();
  await page.waitForTimeout(600);
}

/** 図に書かれた字ごとの中心 (図の座標)。 同じ字が複数あれば最初の 1 つ */
async function 字の中心(page: Page, 字たち: readonly string[]): Promise<Record<string, 点>> {
  return page
    .locator("main.catalog-preview svg[data-cdl-stage]")
    .first()
    .evaluate((svg, 探す) => {
      const 根 = svg as SVGSVGElement;
      const 逆 = 根.getScreenCTM()!.inverse();
      const 出: Record<string, { x: number; y: number }> = {};
      for (const 字 of 探す) {
        const el = [...根.querySelectorAll("text")].find((t) => t.textContent?.trim() === 字);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const p = new DOMPoint(r.x + r.width / 2, r.y + r.height / 2).matrixTransform(逆);
        出[字] = { x: p.x, y: p.y };
      }
      return 出;
    }, 字たち);
}

const 字たち = ["注文する", "受け付ける", "在庫を引く", "利用者", "受付の窓口", "注文"] as const;

/** ずらさない図と比べた、字ごとの動いた量 */
async function 動いた量(page: Page, 名: string): Promise<Record<string, 点>> {
  await 押す(page, "ずらさない");
  const 前 = await 字の中心(page, 字たち);
  expect(Object.keys(前), "字を 1 つも見つけられていない (検査が空振りしている)").toEqual([
    ...字たち,
  ]);
  await 押す(page, 名);
  const 後 = await 字の中心(page, 字たち);
  expect(Object.keys(後), `${名} で字を見失った`).toEqual([...字たち]);
  return Object.fromEntries(
    字たち.map((字) => [字, { x: 後[字]!.x - 前[字]!.x, y: 後[字]!.y - 前[字]!.y }]),
  );
}

function 動いた(量: Record<string, 点>, 字: string, 期待: 点): void {
  expect(Math.abs(量[字]!.x - 期待.x), `${字} の横の動き ${量[字]!.x}`).toBeLessThanOrEqual(許す差);
  expect(Math.abs(量[字]!.y - 期待.y), `${字} の縦の動き ${量[字]!.y}`).toBeLessThanOrEqual(許す差);
}

test.describe("位置のずらしの見本でパターンを押すと書いた量だけ動く (#1971)", () => {
  test("パターンが 4 つ出ていて、既定は ずらさない", async ({ page }) => {
    await 開く(page);
    const 群 = page.getByRole("radiogroup", { name: "パターン" });
    await expect(群.getByRole("radio")).toHaveCount(4);
    await expect(群.getByRole("radio", { name: "ずらさない" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("箱をずらす は注文するの箱だけが右へ 40、下へ 60 動く", async ({ page }) => {
    await 開く(page);
    const 量 = await 動いた量(page, "箱をずらす");
    動いた(量, "注文する", { x: 40, y: 60 });
    for (const 字 of ["受け付ける", "在庫を引く", "利用者", "受付の窓口"])
      動いた(量, 字, { x: 0, y: 0 });
  });

  test("縦列をずらす は受付の窓口の縦列と中の箱が右へ 120、下へ 40 動く", async ({ page }) => {
    await 開く(page);
    const 量 = await 動いた量(page, "縦列をずらす");
    for (const 字 of ["受付の窓口", "受け付ける", "在庫を引く"]) 動いた(量, 字, { x: 120, y: 40 });
    for (const 字 of ["利用者", "注文する"]) 動いた(量, 字, { x: 0, y: 0 });
  });

  test("矢印の名前をずらす は注文の名前だけが右へ 40、上へ 24 動く", async ({ page }) => {
    await 開く(page);
    const 量 = await 動いた量(page, "矢印の名前をずらす");
    動いた(量, "注文", { x: 40, y: -24 });
    for (const 字 of ["注文する", "受け付ける", "在庫を引く", "利用者", "受付の窓口"]) {
      動いた(量, 字, { x: 0, y: 0 });
    }
  });

  test("パターンを押すとコードも記法のずらしの欄に入れ替わる", async ({ page }) => {
    await 開く(page);
    await page.getByRole("tab", { name: "コード" }).click();
    const コード = page.locator(".catalog-source-code").first();
    await expect(コード).not.toContainText("offsetX");
    await 押す(page, "箱をずらす");
    await expect(コード).toContainText("offsetX: 40");
    await 押す(page, "矢印の名前をずらす");
    await expect(コード).toContainText("labelOffsetY: -24");
  });
});
