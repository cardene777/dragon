import { test, expect } from "@playwright/test";

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

test("本番: エディタで図が描画され操作できる", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`${BASE}/editor`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  // 図が出ている
  const svg = page.locator('[data-testid="editor-preview-stage"] svg[viewBox]');
  expect(await svg.count(), "図の SVG").toBeGreaterThan(0);

  // 要素を選択できる
  const node = page.locator("[data-cdl-node]").first();
  const bb = await node.boundingBox();
  expect(bb, "node の bbox").not.toBeNull();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.waitForTimeout(400);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(500);
  expect(await page.locator("[data-cdl-selection-ui]").count(), "選択 UI").toBeGreaterThan(0);

  // 図の倍率が効く
  const vb = async (): Promise<number> =>
    await page.evaluate(() => {
      const s = document.querySelector('[data-testid="editor-preview-stage"] svg[viewBox]')!;
      return Number(s.getAttribute("viewBox")!.split(/\s+/)[2]);
    });
  const before = await vb();
  await page.locator('[data-testid="editor-diagram-scale-up"]').click();
  await page.waitForTimeout(1200);
  expect(await vb(), "拡大後の幅").toBeGreaterThan(before);

  expect(errors, "エディタのエラー").toEqual([]);
});

test("本番: Ethereum 4 図が描画される", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`${BASE}/catalog/ethereum`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);
  for (const id of ["erc20Transfer", "eip1559Gas", "erc4337Flow", "blockProduction"]) {
    expect(await page.getByText(id, { exact: true }).count(), id).toBeGreaterThan(0);
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
