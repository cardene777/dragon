import { expect, test, type Locator, type Page } from "@playwright/test";

import { 一覧の行 } from "./catalog-item-pick";

type SkeletonColors = { background: string; edgeStroke: string };

async function 骨組みを開く(page: Page): Promise<void> {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
  await 一覧の行(page, "delivery-flow-demo").click();
  await page.getByRole("radio", { name: "骨組み", exact: true }).click();
  await expect(page.locator('.catalog-preview-stage[data-catalog-skeleton="on"]')).toBeVisible();
}

function 骨組みの図(page: Page): Locator {
  return page.locator('.catalog-preview-stage[data-catalog-skeleton="on"] svg[data-cdl-stage]');
}

async function 骨組みの色(page: Page): Promise<SkeletonColors> {
  const svg = 骨組みの図(page);
  await expect(svg).toBeVisible();
  const edge = svg.locator('[data-cdl-role="edge-line"]').first();
  await expect(edge).toBeAttached();
  return {
    background: await svg.evaluate((element) => getComputedStyle(element).backgroundColor),
    edgeStroke: await edge.evaluate((element) => getComputedStyle(element).stroke),
  };
}

async function 主な流れの線の値(page: Page): Promise<string> {
  const header = page.getByRole("rowheader", { name: "主な流れの線", exact: true });
  await expect(header).toBeVisible();
  return await header.evaluate((element) => {
    if (!(element instanceof HTMLTableCellElement)) throw new Error("主な流れの線が表の見出しでない");
    const firstRow = element.closest("tr");
    if (!firstRow) throw new Error("主な流れの線の行が無い");

    const values: string[] = [];
    let row: HTMLTableRowElement | null = firstRow;
    for (let index = 0; index < element.rowSpan && row; index++) {
      values.push(row.innerText);
      row = row.nextElementSibling as HTMLTableRowElement | null;
    }
    return values.join("\n");
  });
}

async function 色味を選ぶ(page: Page, label: "図面" | "電飾"): Promise<void> {
  const value = label === "図面" ? "blueprint" : "neon";
  await page.getByRole("combobox", { name: "図の色味" }).selectOption({ label });
  await expect(骨組みの図(page)).toHaveAttribute("data-cdl-palette", value);
}

test("骨組みの地と線は色味で変わらず、部品表は意匠の値を示す", async ({ page }) => {
  await 骨組みを開く(page);

  await 色味を選ぶ(page, "図面");
  const blueprint = await 骨組みの色(page);
  await expect.poll(async () => await 主な流れの線の値(page)).toContain("#143a52");

  await 色味を選ぶ(page, "電飾");
  const neon = await 骨組みの色(page);
  await expect.poll(async () => await 主な流れの線の値(page)).toContain("#ff2e97");

  expect(neon).toEqual(blueprint);
});

test("骨組みの地は画面の明暗に追従する", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await 骨組みを開く(page);
  const light = await 骨組みの色(page);

  await page.emulateMedia({ colorScheme: "dark" });
  await 骨組みを開く(page);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  const dark = await 骨組みの色(page);

  expect(dark.background).not.toBe(light.background);
});

for (const [見本, 部品] of [
  ["営業所の階層", ["札", "枝"]],
  ["再配達を減らす", ["中心", "枝"]],
] as const) {
  test(`${見本}の骨組みに部品の表を出す`, async ({ page }) => {
    await page.goto("catalog/charts", { waitUntil: "networkidle" });
    await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
    await 一覧の行(page, 見本).click();
    await page.getByRole("radio", { name: "骨組み", exact: true }).click();

    const 表 = page.locator(".catalog-skeleton-parts table");
    await expect(表.locator("tbody tr").first()).toBeVisible();
    for (const 名前 of 部品) {
      await expect(表.getByRole("rowheader", { name: 名前, exact: true })).toBeVisible();
    }
  });
}

for (const [識別子, 見本, 部品] of [
  ["delivery-sequence-demo", "集荷から配達までの呼び出し順", ["動作中の帯", "生命線", "言づての線"]],
  ["delivery-components-demo", "配送システムの部品", ["区画", "部品の箱", "つながりの線"]],
  ["delivery-relations-demo", "契約と荷物と配送状態の関係", ["箱", "行", "関係の線"]],
  ["delivery-classes-demo", "荷物を運ぶ型", ["箱", "行", "関係の線"]],
] as const) {
  test(`${見本}の骨組みに部品の表を出す`, async ({ page }) => {
    await page.goto("catalog/presets", { waitUntil: "networkidle" });
    await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
    await 一覧の行(page, 識別子).click();
    await page.getByRole("radio", { name: "骨組み", exact: true }).click();

    const 表 = page.locator(".catalog-skeleton-parts table");
    await expect(表.locator("tbody tr").first()).toBeVisible();
    for (const 名前 of 部品) {
      await expect(表.getByRole("rowheader", { name: 名前, exact: true })).toBeVisible();
    }
  });
}

test("関係の図の部品表は番号が 1 から飛ばずに並ぶ", async ({ page }) => {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
  await 一覧の行(page, "delivery-relations-demo").click();
  await page.getByRole("radio", { name: "骨組み", exact: true }).click();

  const 番号 = page.locator(".catalog-skeleton-parts .catalog-skeleton-number span");
  await expect(番号.first()).toBeVisible();
  const 件数 = await 番号.count();
  await expect(番号).toHaveText(Array.from({ length: 件数 }, (_, index) => String(index + 1)));
});
