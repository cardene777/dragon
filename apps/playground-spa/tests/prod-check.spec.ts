import { test, expect } from "@playwright/test";
import { ITEM_NAME_JA } from "../src/lib/i18n";
import { PREVIEW_URL } from "../ports";

/**
 * 本番ビルドでの動作確認 (公開前の最終ゲート)。
 *
 * dev server と本番 build は経路が違う。 base path (`/dragon/`) が付き、 code split で
 * chunk が分かれ、 minify で変数名が変わる。 dev で動いても本番で壊れることがあるため、
 * 公開前に本番 build を preview して主要機能を一通り触る。
 */

const BASE = process.env.PROD_BASE_URL ?? PREVIEW_URL;
test.use({ viewport: { width: 1920, height: 1080 } });

/**
 * console error / pageerror を集めて返す。
 *
 * **外部から取る資源の失敗は数えない**。 字は Google の配信元から取るので、 向こうで
 * 版が変わると古い定義を握っている間だけ 404 になる (実測 = 落ちる画面が実行ごとに
 * 変わり、 新しい状態で開くと出ない)。 本 test が見たいのは本番 build 固有の壊れ方で、
 * 外部の都合ではない。
 *
 * 自分の資源 (`/dragon/` 配下) の 404 は引き続き数える = そちらは本番 build の欠陥。
 */
function collectErrors(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  /**
   * 外部から取る資源の読込失敗か。
   *
   * 判定は同期で行う = 非同期にすると `expect` の時点で結果が揃っていない。
   *
   * **自分の資源かどうかは `BASE` の origin と比べる**。 `localhost` の文字列で見ると、
   * `PROD_BASE_URL` に別の host を渡した時や `127.0.0.1` / IPv6 の形で自分の資源まで
   * 外に数え、 本番 build の欠陥を見逃す (review 指摘)。
   *
   * URL が空 / 解けない時は数える側に倒す = 判定できないものを見逃さない。
   */
  const 外部の資源 = (m: import("@playwright/test").ConsoleMessage): boolean => {
    if (!/Failed to load resource/.test(m.text())) return false;
    const u = m.location()?.url ?? "";
    if (!u) return false;
    try {
      return new URL(u, BASE).origin !== new URL(BASE).origin;
    } catch {
      return false;
    }
  };
  page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (!外部の資源(m)) errors.push(`console: ${m.text()}`);
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
