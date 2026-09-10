/**
 * 拡大表示の倍率の検査 (#1745)。
 *
 * 拡大表示は図を器 (画面 1440 × 900 で 1150 × 630px) に収まるよう縮めるため、
 * **大きい図ほど小さく描かれる**。 `er-complex-demo` は箱の題が 4.8px まで縮み、
 * 一覧の並びで見た時 (8.8px) より小さい。 器を広げる余地は 6px しか無い (#1740 で実測)。
 *
 * 倍率を指定すると、収める側の頭打ちを外して viewBox の 1 world を 1px として描く。
 *
 * ここで見るのは **実際に描かれた寸法**。 状態や class 名だけを見ると、CSS の側を外しても
 * 通る検査になる (収める規則は `!important` 付きなので、打ち消しに失敗しやすい)。
 *
 * 倍率の刻みそのものは `src/lib/modal-zoom.test.ts` が見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-modal-zoom`
 */
import { test, expect } from "@playwright/test";

type Page = import("@playwright/test").Page;

test.use({ actionTimeout: 10_000, viewport: { width: 1440, height: 900 } });

/** 拡大表示の中だけを指す */
const 拡大 = ".cdl-modal-content";

/** 拡大表示の中の図の実寸と viewBox */
async function 図を測る(page: Page): Promise<{ 幅: number; 高さ: number; vbW: number; vbH: number }> {
  return await page.evaluate(() => {
    const svgs = [...document.querySelectorAll(".cdl-modal-content svg[viewBox]")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        const vb = (el.getAttribute("viewBox") ?? "").split(/[ ,]+/).map(Number);
        return { 幅: r.width, 高さ: r.height, vbW: vb[2] ?? 0, vbH: vb[3] ?? 0 };
      })
      // 図の外のしるし (marker の定義など) を除く
      .filter((x) => x.vbW > 200)
      .sort((a, b) => b.幅 - a.幅);
    const s = svgs[0];
    if (!s) throw new Error("拡大表示の中に図が見つからない (検査が空振りしている)");
    return s;
  });
}

/** 一覧から図を開き、拡大表示まで進む */
async function 拡大を開く(page: Page, 分類: string, 名前: string): Promise<void> {
  await page.goto(`catalog/${分類}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText(名前, { exact: true }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /を拡大表示$/ }).first().click();
  await expect(page.locator(拡大)).toBeVisible();
  await page.waitForTimeout(600);
}

const 上げる = (page: Page) => page.getByRole("button", { name: "倍率を上げる" });
const 下げる = (page: Page) => page.getByRole("button", { name: "倍率を下げる" });
const 表示 = (page: Page) => page.locator(".cdl-modal-zoom-value");
const 収める = (page: Page) => page.getByRole("button", { name: "収める", exact: true });

test.describe("拡大表示の倍率 (#1745)", () => {
  test("既定は収める = 図が器に収まっている", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図 (複雑)");
    await expect(表示(page)).toHaveText("収める");
    const s = await 図を測る(page);
    // 器は 1150 × 630。 収める側は必ずその中に入る
    expect(s.幅).toBeLessThanOrEqual(1151);
    expect(s.高さ).toBeLessThanOrEqual(631);
    // 縮んでいることまで見る = この図が元から器に収まっていたら、下の検査は差を測っていない
    expect(s.幅 / s.vbW).toBeLessThan(1);
  });

  test("倍率を上げると viewBox の幅 × 倍率 で描かれる", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図 (複雑)");
    const 収めた = await 図を測る(page);

    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("150%");
    const 拡げた = await 図を測る(page);

    // viewBox の 1 world を 1px として数えた幅
    expect(拡げた.幅).toBeGreaterThan(収めた.幅);
    expect(Math.abs(拡げた.幅 - 拡げた.vbW * 1.5)).toBeLessThan(2);
    // 縦横比は保つ
    expect(Math.abs(拡げた.高さ / 拡げた.幅 - 拡げた.vbH / 拡げた.vbW)).toBeLessThan(0.01);
  });

  test("実寸まで下げると viewBox の幅ちょうどで描かれる", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図 (複雑)");
    await 下げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("75%");
    const s = await 図を測る(page);
    expect(Math.abs(s.幅 - s.vbW * 0.75)).toBeLessThan(2);
  });

  test("器に収まらない倍率では本体が巻き取れる", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図 (複雑)");
    await 上げる(page).click();
    await page.waitForTimeout(400);
    const 巻き取り = await page.evaluate(() => {
      const b = document.querySelector(".cdl-modal-body");
      if (!b) throw new Error("本体が見つからない (検査が空振りしている)");
      return { 中身: b.scrollWidth, 窓: b.clientWidth };
    });
    expect(巻き取り.中身).toBeGreaterThan(巻き取り.窓);
  });

  test("収めるへ戻すと元の大きさに戻る", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図 (複雑)");
    const 前 = await 図を測る(page);
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await 収める(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("収める");
    const 後 = await 図を測る(page);
    expect(Math.abs(後.幅 - 前.幅)).toBeLessThan(2);
    expect(Math.abs(後.高さ - 前.高さ)).toBeLessThan(2);
  });

  test("別の図を開くと収めるへ戻る", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図 (複雑)");
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText("150%");

    await page.keyboard.press("Escape");
    await expect(page.locator(拡大)).toBeHidden();
    await page.getByText("スイムレーン", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /を拡大表示$/ }).first().click();
    await expect(page.locator(拡大)).toBeVisible();
    await expect(表示(page)).toHaveText("収める");
  });
});
