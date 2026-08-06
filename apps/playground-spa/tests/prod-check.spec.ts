import { test, expect } from "@playwright/test";
import { ITEM_NAME_JA } from "../src/lib/i18n";

/**
 * 本番ビルドでの動作確認 (公開前の最終ゲート)。
 *
 * dev server と本番 build は経路が違う。 base path (`/dragon/`) が付き、 code split で
 * chunk が分かれ、 minify で変数名が変わる。 dev で動いても本番で壊れることがあるため、
 * 公開前に本番 build を preview して主要機能を一通り触る。
 */

const BASE = process.env.PROD_BASE_URL ?? "http://localhost:4324/dragon";
test.use({ viewport: { width: 1920, height: 1080 } });

/** console error / pageerror を集めて返す。 */
function collectErrors(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

const PAGES = [
  { path: "/", name: "トップ" },
  { path: "/editor", name: "エディタ" },
  { path: "/catalog", name: "カタログ索引" },
  { path: "/catalog/ethereum", name: "Ethereum" },
  { path: "/catalog/animation", name: "アニメーション" },
  { path: "/catalog/presets", name: "プリセット" },
  { path: "/catalog/parts", name: "パーツ" },
  { path: "/docs", name: "ドキュメント" },
];

for (const { path, name } of PAGES) {
  test(`本番: ${name} が JS エラーなく開く`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(`${BASE}${path}`);
    expect(res?.status(), `${name} の HTTP`).toBeLessThan(400);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    expect(errors, `${name} のエラー`).toEqual([]);
  });
}


test("本番: Ethereum 4 図が描画される", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`${BASE}/catalog/ethereum`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);
  // 一覧に出るのは表示名 (`ERC-20の送金`) で、 export 名 (`erc20Transfer`) は描かれない
  // (`#1035` で表示名に変わった)。 名前は手で書かず表から引く (#1068)。
  const names = (await page.locator(".catalog-list-item-name").allTextContents()).map((s) => s.trim());
  for (const id of ["erc20Transfer", "eip1559Gas", "erc4337Flow", "blockProduction"]) {
    const name = ITEM_NAME_JA[id];
    expect(name, `表示名が表に無い: ${id}`).toBeTruthy();
    expect(names, `${id} (${name}) が一覧に無い: ${names.join(", ")}`).toContain(name);
  }
  expect(await page.locator("svg[viewBox]").count(), "SVG").toBeGreaterThanOrEqual(4);
  expect(errors, "カタログのエラー").toEqual([]);
});

test("本番: 存在しない URL で 404 ページが出る (白画面にならない)", async ({ page }) => {
  await page.goto(`${BASE}/catalog/does-not-exist`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const text = await page.evaluate(() => document.body.innerText.trim());
  expect(text.length, "本文が空でない").toBeGreaterThan(10);
});
