/**
 * 縦列の組の見本で、組の枠が束ねた縦列の名札と箱を囲んで見えることの確認 (#1972)。
 *
 * 組み立てが枠を束ねた縦列から離れた右端に描いていた間、図の上では「組を書いたのに囲まれない」
 * 形になっていた。 画面の点で、枠の矩形が字の矩形を含むかを見る。
 *
 * **囲まない相手も見る**。 枠が図全体に広がる形は、囲むべき字を含むだけでは見逃す。
 */
import { test, expect, type Page } from "@playwright/test";

/** 一覧の行に出る見本の id (組を書かない図の題から決まる) */
const 見本 = "縦列を組で束ねない";

type 矩形 = { x: number; y: number; 右: number; 下: number };

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

/** 組の枠 (`group-*` の囲い) と、図に書かれた字の画面上の矩形 */
async function 測る(
  page: Page,
  字たち: readonly string[],
): Promise<{ 枠: Record<string, 矩形>; 字: Record<string, 矩形> }> {
  return page
    .locator("main.catalog-preview svg[data-cdl-stage]")
    .first()
    .evaluate((svg, 探す) => {
      const 矩形に = (r: DOMRect) => ({ x: r.left, y: r.top, 右: r.right, 下: r.bottom });
      const 枠: Record<string, { x: number; y: number; 右: number; 下: number }> = {};
      for (const el of svg.querySelectorAll('[data-cdl-role="lane-container"]')) {
        const id =
          el.closest("[data-cdl-lane]")?.getAttribute("data-cdl-lane") ??
          el.getAttribute("data-cdl-lane");
        if (id?.startsWith("group-")) 枠[id] = 矩形に(el.getBoundingClientRect());
      }
      const 字: Record<string, { x: number; y: number; 右: number; 下: number }> = {};
      for (const 名 of 探す) {
        const t = [...svg.querySelectorAll("text")].find((x) => x.textContent?.trim() === 名);
        if (t) 字[名] = 矩形に(t.getBoundingClientRect());
      }
      return { 枠, 字 };
    }, 字たち);
}

const 含む = (外: 矩形, 内: 矩形): boolean =>
  外.x <= 内.x && 外.y <= 内.y && 外.右 >= 内.右 && 外.下 >= 内.下;

const 字たち = ["受付の層", "処理の層", "保存の層", "利用者", "注文の処理", "注文の台帳"] as const;

test.describe("縦列の組の見本で枠が束ねた縦列を囲む (#1972)", () => {
  test("パターンが 3 つ出ていて、組を書かない図には枠が無い", async ({ page }) => {
    await 開く(page);
    await expect(page.getByRole("radiogroup", { name: "パターン" }).getByRole("radio")).toHaveCount(
      3,
    );
    const { 枠, 字 } = await 測る(page, 字たち);
    expect(Object.keys(字), "字を 1 つも見つけられていない (検査が空振りしている)").toEqual([
      ...字たち,
    ]);
    expect(Object.keys(枠)).toEqual([]);
  });

  test("縦列を束ねる は社内の網の枠が処理と保存の層と箱を囲み、受付の層を囲まない", async ({
    page,
  }) => {
    await 開く(page);
    await 押す(page, "縦列を束ねる");
    const { 枠, 字 } = await 測る(page, 字たち);
    expect(Object.keys(枠), "組の枠を見つけられていない (検査が空振りしている)").toEqual([
      "group-inside",
    ]);
    const 内 = 枠["group-inside"]!;
    for (const 名 of ["処理の層", "保存の層", "注文の処理", "注文の台帳"]) {
      expect(含む(内, 字[名]!), `${名} が枠の外にある`).toBe(true);
    }
    for (const 名 of ["受付の層", "利用者"])
      expect(含む(内, 字[名]!), `${名} が枠の中にある`).toBe(false);
  });

  test("2つの組 は社外の枠が受付の層を、社内の網の枠が残りを囲む", async ({ page }) => {
    await 開く(page);
    await 押す(page, "2つの組");
    const { 枠, 字 } = await 測る(page, 字たち);
    expect(Object.keys(枠).sort()).toEqual(["group-front", "group-inside"]);
    for (const 名 of ["受付の層", "利用者"]) {
      expect(含む(枠["group-front"]!, 字[名]!), `${名} が社外の枠の外にある`).toBe(true);
      expect(含む(枠["group-inside"]!, 字[名]!), `${名} が社内の網の枠の中にある`).toBe(false);
    }
    for (const 名 of ["処理の層", "保存の層", "注文の処理", "注文の台帳"]) {
      expect(含む(枠["group-inside"]!, 字[名]!), `${名} が社内の網の枠の外にある`).toBe(true);
    }
  });

  test("パターンを押すとコードの yaml と json に組の欄が出る", async ({ page }) => {
    await 開く(page);
    await page.getByRole("tab", { name: "コード" }).click();
    const コード = page.locator(".catalog-source-code").first();
    await expect(コード).not.toContainText("groups:");
    await 押す(page, "2つの組");
    await expect(コード).toContainText("groups:");
    await expect(コード).toContainText("lanes: [app, db]");
    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const 読んだ = JSON.parse(await コード.innerText()) as {
      groups?: Record<string, { label?: string; lanes?: string[] }>;
    };
    expect(Object.keys(読んだ.groups ?? {}).sort()).toEqual(["front", "inside"]);
    expect(読んだ.groups?.inside?.lanes).toEqual(["app", "db"]);
  });
});
