/**
 * カタログの色味の切替の検証 (#1569)。
 *
 * 意匠は全ての図へ当てて見比べる。切替の札と、押した名前 / 地が舞台へ届く所までを押さえる。
 *
 * ## 押した後の markup を見る
 *
 * 押しものの状態 (`aria-checked`) だけを見ると、掛け忘れても通る。
 * 図の `data-cdl-palette` が実際に変わることを見る。
 *
 */
import { test, expect, type Page } from "@playwright/test";
import { 配色の札, 配色の選択肢, 画面の色の札 } from "../src/lib/palette-switch";
import { 一覧の行 } from "./catalog-item-pick";
import { readThemeNotes } from "./helpers/theme-notes";

/** 見本を id で名指しして開く */
async function 開く(page: Page, slug: string, id: string): Promise<void> {
  await page.goto(`catalog/${slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
  await 一覧の行(page, id).click();
  await page.waitForSelector(`[data-cdl-diagram="${id}"]`, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
}

/** いま出ている図の配色の名前 */
async function 配色(page: Page, id: string): Promise<string | null> {
  return await page.evaluate((diagramId) => {
    const 舞台 = document.querySelector(`[data-cdl-diagram="${diagramId}"] svg[data-cdl-stage]`);
    return 舞台?.getAttribute("data-cdl-palette") ?? null;
  }, id);
}

const 切替 = (page: Page) => page.locator('[role="radiogroup"][aria-label="図の色味"]');

const hexToRgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
};

test("switch: 意匠の札が全て並び、配色を持つ図で切り替えられる (#1569 / #2790)", async ({
  page,
}) => {
  await 開く(page, "presets", "er-demo");

  await expect(切替(page), "配色を持つ図に切替が出ていない").toBeVisible();
  const expected = 配色の選択肢.map((theme) => 配色の札(theme, "ja"));
  expect(expected).toEqual(["生成りに茶", "青磁に墨", "図面", "活版", "図録", "端末"]);
  for (const label of expected)
    await expect(切替(page).getByRole("radio", { name: label })).toHaveCount(1);
  expect(await 配色(page, "er-demo"), "既定が生成りに茶でない").toBe("kinari");

  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect.poll(async () => await 配色(page, "er-demo"), { timeout: 5000 }).toBe("celadon");

  await 切替(page).getByRole("radio", { name: "生成りに茶" }).click();
  await expect.poll(async () => await 配色(page, "er-demo"), { timeout: 5000 }).toBe("kinari");
});

test("switch: クラス図でも切り替えられる (#1569)", async ({ page }) => {
  // ER 図だけを見ると、配色を持つ図が 1 種類しか無い形でも通る
  await 開く(page, "presets", "class-demo");
  await expect(切替(page), "クラス図に切替が出ていない").toBeVisible();

  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect.poll(async () => await 配色(page, "class-demo"), { timeout: 5000 }).toBe("celadon");
});

test("switch: 配色を持たない図にも切替が出て、図面を当てられる (#2790)", async ({ page }) => {
  await 開く(page, "presets", "infra-demo");
  expect(await 配色(page, "infra-demo"), "この図が配色を持ってしまっている").toBeNull();
  await expect(切替(page), "配色を持たない図に切替が出ていない").toBeVisible();
  await expect(切替(page).getByRole("radio", { name: 画面の色の札("ja") })).toBeChecked();

  await 切替(page)
    .getByRole("radio", { name: 配色の札("blueprint", "ja") })
    .click();
  await expect
    .poll(async () => await 配色(page, "infra-demo"), { timeout: 5000 })
    .toBe("blueprint");
  const blueprint = readThemeNotes().get("blueprint");
  if (blueprint?.mode !== "fixed") throw new Error("図面の意匠帳が固定の表ではない");
  const ground = await page.evaluate(() => {
    const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="blueprint"]');
    return stage ? getComputedStyle(stage).backgroundColor : null;
  });
  expect(ground).toBe(hexToRgb(blueprint.value.ground));
});

test("letterpress switch: 配色のない図と表の図へ活版の名前と地が届く", async ({ page }) => {
  const letterpress = readThemeNotes().get("letterpress");
  if (letterpress?.mode !== "fixed") throw new Error("活版の意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    await 切替(page)
      .getByRole("radio", { name: 配色の札("letterpress", "ja") })
      .click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("letterpress");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="letterpress"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(letterpress.value.ground));
  }
});

test("catalog switch: 配色のない図と表の図へ図録の名前と地が届く", async ({ page }) => {
  const catalog = readThemeNotes().get("catalog");
  if (catalog?.mode !== "fixed") throw new Error("図録の意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    await 切替(page)
      .getByRole("radio", { name: 配色の札("catalog", "ja") })
      .click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("catalog");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="catalog"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(catalog.value.ground));
  }
});

test("terminal switch: 配色のない図と表の図へ端末の名前と地が届く", async ({ page }) => {
  const terminal = readThemeNotes().get("terminal");
  if (terminal?.mode !== "fixed") throw new Error("端末の意匠帳が固定の表ではない");

  for (const id of ["infra-demo", "er-demo"]) {
    await 開く(page, "presets", id);
    await 切替(page)
      .getByRole("radio", { name: 配色の札("terminal", "ja") })
      .click();
    await expect.poll(async () => await 配色(page, id), { timeout: 5000 }).toBe("terminal");
    const ground = await page.evaluate(() => {
      const stage = document.querySelector('svg[data-cdl-stage][data-cdl-palette="terminal"]');
      return stage ? getComputedStyle(stage).backgroundColor : null;
    });
    expect(ground, id).toBe(hexToRgb(terminal.value.ground));
  }
});

test("switch: 項目を選び直すと既定へ戻る (#1569)", async ({ page }) => {
  // 残すと、次の図が別の色みで出る理由を見失う (速さ / 描き方 と同じ扱い)
  await 開く(page, "presets", "er-demo");
  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect.poll(async () => await 配色(page, "er-demo"), { timeout: 5000 }).toBe("celadon");

  await 一覧の行(page, "class-demo").click();
  await page.waitForSelector('[data-cdl-diagram="class-demo"]', { timeout: 15000 });
  await expect.poll(async () => await 配色(page, "class-demo"), { timeout: 5000 }).toBe("kinari");
});
