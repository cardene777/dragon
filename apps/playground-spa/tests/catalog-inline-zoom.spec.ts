/**
 * 並べて見る側の倍率の検査 (#1749)。
 *
 * 並べて見る側の台は幅 874px (画面 1440 で実測) で、高さの上限が無い。 図は幅いっぱいに
 * 描かれるため、**広い図は縮み、細い図は伸びる**。
 *
 * | 図 | viewBox | 並べて見る側 | 拡大表示 |
 * |---|---|---|---|
 * | `er-complex-demo` | 2190×2904 | 8.8px | 4.8px |
 * | `swim-demo` | 1848×285 | 10.4px | 13.7px |
 * | `scene-web-infra` | 510×1160 | 37.7px (高さ 1988px) | 11.9px |
 *
 * 実測で 53 枚が箱の題 12px 未満、39 枚が高さ 1200px 超になる。
 * 倍率の操作は **どちらの向きにも効く** = 広い図は拡げ、細い図は縮める。
 *
 * ここで見るのは実際に描かれた寸法。 状態や class 名だけを見ると、CSS の側を外しても
 * 通る検査になる。
 *
 * 刻みそのものは `src/lib/diagram-zoom.test.ts` が見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-inline-zoom`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

test.use({ actionTimeout: 10_000, viewport: { width: 1440, height: 900 } });

/** 並べて見る側の操作だけを指す (拡大表示は別の場所に同じ部品を持つ) */
const 並び = ".catalog-preview-actions";

/** 並べて見る側の図の実寸と viewBox、それと巻き取りの状態 */
async function 図を測る(page: Page): Promise<{
  幅: number;
  高さ: number;
  vbW: number;
  vbH: number;
  器の幅: number;
  巻き取り: number;
}> {
  return await page.evaluate(() => {
    const inner = document.querySelector(".catalog-preview-stage-inner");
    if (!inner) throw new Error("台の内側が見つからない (検査が空振りしている)");
    const svg = [...inner.querySelectorAll("svg[viewBox]")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        const vb = (el.getAttribute("viewBox") ?? "").split(/[ ,]+/).map(Number);
        return { 幅: r.width, 高さ: r.height, vbW: vb[2] ?? 0, vbH: vb[3] ?? 0 };
      })
      .filter((x) => x.vbW > 200)
      .sort((a, b) => b.幅 - a.幅)[0];
    if (!svg) throw new Error("台の中に図が見つからない (検査が空振りしている)");
    return { ...svg, 器の幅: inner.clientWidth, 巻き取り: inner.scrollWidth };
  });
}

/**
 * 一覧から図を選ぶ (拡大表示は開かない)。
 *
 * 複雑な ER 図は「ER図」 の中のパターン「複雑」 なので、パターンの名前を受けて押す (#1960)
 */
async function 図を選ぶ(page: Page, 分類: string, 名前: string, パターン?: string): Promise<void> {
  await page.goto(`catalog/${分類}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText(名前, { exact: true }).first().click();
  if (パターン !== undefined) {
    await page.getByRole("radiogroup", { name: "パターン" }).getByRole("radio", { name: パターン }).click();
  }
  await page.waitForTimeout(600);
}

const 上げる = (page: Page) => page.locator(並び).getByRole("button", { name: "並びの倍率を上げる" });
const 下げる = (page: Page) => page.locator(並び).getByRole("button", { name: "並びの倍率を下げる" });
const 表示 = (page: Page) => page.locator(`${並び} .cdl-zoom-value`);
const 幅に合わせる = (page: Page) =>
  page.locator(並び).getByRole("button", { name: "幅に合わせる", exact: true });

test.describe("並べて見る側の倍率 (#1749)", () => {
  test("既定は幅に合わせる = 図が台の幅いっぱいに描かれる", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await expect(表示(page)).toHaveText("幅に合わせる");
    const s = await 図を測る(page);
    expect(Math.abs(s.幅 - s.器の幅)).toBeLessThan(2);
    // 縮んでいることまで見る = 元から器に収まる図だと下の検査が差を測っていない
    expect(s.幅 / s.vbW).toBeLessThan(1);
  });

  test("倍率を上げると viewBox の幅 × 倍率 で描かれる", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    const 合わせた = await 図を測る(page);

    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("150%");
    const 拡げた = await 図を測る(page);

    expect(拡げた.幅).toBeGreaterThan(合わせた.幅);
    expect(Math.abs(拡げた.幅 - 拡げた.vbW * 1.5)).toBeLessThan(2);
    expect(Math.abs(拡げた.高さ / 拡げた.幅 - 拡げた.vbH / 拡げた.vbW)).toBeLessThan(0.01);
  });

  test("台からはみ出す倍率では内側が巻き取れる", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await 上げる(page).click();
    await page.waitForTimeout(400);
    const s = await 図を測る(page);
    expect(s.巻き取り).toBeGreaterThan(s.器の幅);
  });

  test("細い図は倍率を下げると小さくなる (伸ばされる側)", async ({ page }) => {
    /*
     * `scene-web-infra` は viewBox 510 幅が 874px に伸び、高さが 1988px になる。
     * 下げる向きが効くのはこの形のため。
     */
    await 図を選ぶ(page, "primitives", "scene-web-infra");
    const 合わせた = await 図を測る(page);
    // 伸ばされていることを先に押さえる = 縮んでいる図だと下げる向きの意味が変わる
    expect(合わせた.幅 / 合わせた.vbW).toBeGreaterThan(1);

    await 下げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("75%");
    const 縮めた = await 図を測る(page);
    expect(Math.abs(縮めた.幅 - 縮めた.vbW * 0.75)).toBeLessThan(2);
    expect(縮めた.高さ).toBeLessThan(合わせた.高さ);
  });

  test("幅に合わせるへ戻すと元の大きさに戻る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    const 前 = await 図を測る(page);
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await 幅に合わせる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("幅に合わせる");
    const 後 = await 図を測る(page);
    expect(Math.abs(後.幅 - 前.幅)).toBeLessThan(2);
    expect(Math.abs(後.高さ - 前.高さ)).toBeLessThan(2);
  });

  test("別の図を選ぶと幅に合わせるへ戻る", async ({ page }) => {
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("150%");

    await page.getByText("スイムレーン", { exact: true }).first().click();
    await page.waitForTimeout(600);
    await expect(表示(page)).toHaveText("幅に合わせる");
  });

  test("拡大表示の倍率と互いに影響しない", async ({ page }) => {
    /*
     * 器が違う (拡大表示は 1150 × 630、こちらは幅 874 で高さの上限なし) ので、
     * 同じ倍率でも見え方が揃わない。 状態を分けてあることを見る。
     */
    await 図を選ぶ(page, "presets", "ER図", "複雑");
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("150%");

    await page.getByRole("button", { name: /を拡大表示$/ }).first().click();
    await expect(page.locator(".cdl-modal-content")).toBeVisible();
    await page.waitForTimeout(600);
    // 拡大表示は自分の既定から始まる
    await expect(page.locator(".cdl-modal-content .cdl-zoom-value")).toHaveText("収める");

    await page.keyboard.press("Escape");
    await expect(page.locator(".cdl-modal-content")).toBeHidden();
    await page.waitForTimeout(400);
    // 並べて見る側は選んだままで残る
    await expect(表示(page)).toHaveText("150%");
  });
});
