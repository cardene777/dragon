/**
 * フローの並ぶ向きの見本で、向きを書いた切替が書いた端のとおりに矢印を引くことの確認 (#1986)。
 *
 * 向きを書かないフローは登場人物を書いた順に鎖で繋ぐため、`登録する -> 申し込む` の差し戻しは
 * 矢印にならない。 向きを書くと行に書いた端のとおりに引き、差し戻しも出る。
 *
 * **矢印の名札が付く矢印の id で見る**。 本数だけだと、2 本目が差し戻しではなく別の矢印でも通る。
 */
import { test, expect, type Page } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

const 見本 = "フローの並ぶ向きを書かない";
const 図 = "main.catalog-preview svg[data-cdl-stage]";

async function 押す(page: Page, 名: string): Promise<void> {
  await page
    .getByRole("radiogroup", { name: "パターン" })
    .getByRole("radio", { name: 名, exact: true })
    .click();
  await page.waitForTimeout(800);
}

/** 矢印の名札ごとに、名札の字と名札が付く矢印の id */
async function 名札(page: Page): Promise<{ 字: string; 矢印: string }[]> {
  return page
    .locator(図)
    .first()
    .evaluate((svg) =>
      [...svg.querySelectorAll("[data-cdl-edge-label-for]")].map((el) => ({
        字: el.textContent?.trim() ?? "",
        矢印: el.getAttribute("data-cdl-edge-label-for") ?? "",
      })),
    );
}

test.describe("フローの並ぶ向きの見本 (#1986)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("catalog/primitives", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await 一覧の行(page, 見本).click();
    await page.waitForTimeout(800);
    await expect(page.locator(図).first()).toBeVisible();
  });

  test("書いた端のとおりに繋ぐ切替は、申込書と差し戻しの 2 本を描く", async ({ page }) => {
    await 押す(page, "書いた端のとおりに繋ぐ");
    await expect(page.locator(図).first().locator("[data-cdl-edge]")).toHaveCount(2);
    const 出た = await 名札(page);
    expect(出た.length, "矢印の名札が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    const 差し戻し = 出た.find((x) => x.字 === "差し戻し");
    expect(差し戻し, `差し戻しの名札が無い (${JSON.stringify(出た)})`).toBeDefined();
    // 差し戻しは登録するから申し込むへ向かう。 鎖の向き (申し込むから登録する) に付いていない
    expect(差し戻し!.矢印).toMatch(/登録する-申し込む$/u);
    expect(出た.find((x) => x.字 === "申込書")?.矢印).toMatch(/申し込む-登録する$/u);
  });

  test("段を書いた縦に積む切替は、書いた 1 行の 1 本を描く", async ({ page }) => {
    // 対照。 同じ 2 人でも行が 1 本なら矢印も 1 本
    await 押す(page, "縦に積む");
    await expect(page.locator(図).first().locator("[data-cdl-edge]")).toHaveCount(1);
  });
});
