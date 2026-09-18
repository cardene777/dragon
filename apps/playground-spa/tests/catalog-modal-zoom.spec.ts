/**
 * 拡大表示の倍率の検査 (#1745)。
 *
 * 拡大表示は図を器 (画面 1440 × 900 で 1150 × 630px) に収まるよう縮めるため、
 * **大きい図ほど小さく描かれる**。 `er-complex-demo` は一覧の並びで見た時より小さくなる
 * (実寸は `packages/dragon/test/support/responsive-accepted.ts` の `代表的な図` が持ち、
 * `readability-representative.test.ts` が描き直して突き合わせる)。
 * 器を広げる余地は 6px しか無い (#1740 で実測)。
 *
 * 倍率を指定すると、収める側の頭打ちを外して viewBox の 1 world を 1px として描く。
 *
 * ここで見るのは **実際に描かれた寸法**。 状態や class 名だけを見ると、CSS の側を外しても
 * 通る検査になる (収める規則は `!important` 付きなので、打ち消しに失敗しやすい)。
 *
 * 倍率の刻みそのものは `src/lib/diagram-zoom.test.ts` が見る。
 *
 * 収めている時も、倍率の欄は実際に描かれた倍率を数字で出す (#1961)。 svg の箱は器いっぱいに広がるが、
 * 図は縦横比を保って箱の中に描かれるので、描かれた倍率は箱の幅と高さそれぞれの縮み方の小さい方になる。
 * ボタンで倍率を動かす時はその数字から次の刻みへ動く。 収めている状態かどうかは「収める」 のボタンが
 * 押せないことで見る。 ホイールとドラッグは `catalog-panzoom.spec.ts` が見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-modal-zoom`
 */
import { test, expect } from "@playwright/test";
import { 倍率の刻み } from "../src/lib/diagram-zoom";

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

/**
 * 一覧から図を開き、拡大表示まで進む。
 *
 * 複雑な ER 図は「ER図」 の中のパターン「複雑」 なので、パターンの名前を受けて押す (#1960)
 */
async function 拡大を開く(page: Page, 分類: string, 名前: string, パターン?: string): Promise<void> {
  await page.goto(`catalog/${分類}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText(名前, { exact: true }).first().click();
  if (パターン !== undefined) {
    await page.getByRole("radiogroup", { name: "パターン" }).getByRole("radio", { name: パターン }).click();
  }
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /を拡大表示$/ }).first().click();
  await expect(page.locator(拡大)).toBeVisible();
  await page.waitForTimeout(600);
}

const 上げる = (page: Page) => page.locator(拡大).getByRole("button", { name: "倍率を上げる" });
const 下げる = (page: Page) => page.locator(拡大).getByRole("button", { name: "倍率を下げる" });
/** 拡大表示の中の倍率の表示。 **並べて見る側も同じ部品を持つ** ので拡大表示の中に限る (#1749) */
const 表示 = (page: Page) => page.locator(`${拡大} .cdl-zoom-value`);
const 収める = (page: Page) =>
  page.locator(拡大).getByRole("button", { name: "収める", exact: true });

/** 箱の中に縦横比を保って描かれた倍率 */
const 描かれた倍率 = (s: { 幅: number; 高さ: number; vbW: number; vbH: number }): number =>
  Math.min(s.幅 / s.vbW, s.高さ / s.vbH);
const 上の刻み = (倍率: number): number => {
  const 刻み = 倍率の刻み.find((x) => x > 倍率 + 1e-6);
  if (刻み === undefined) throw new Error(`${倍率} より大きい刻みが無い (この図では上げる向きを確かめられない)`);
  return 刻み;
};
const 百分率 = (倍率: number): string => `${Math.round(倍率 * 100)}%`;

test.describe("拡大表示の倍率 (#1745)", () => {
  test("既定は収める = 図が器に収まっていて、描かれた倍率を欄に出す", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図", "複雑");
    await expect(収める(page)).toBeDisabled();
    const s = await 図を測る(page);
    // 器は 1150 × 630。 収める側は必ずその中に入る
    expect(s.幅).toBeLessThanOrEqual(1151);
    expect(s.高さ).toBeLessThanOrEqual(631);
    // 縮んでいることまで見る = この図が元から器に収まっていたら、下の検査は差を測っていない
    expect(s.幅 / s.vbW).toBeLessThan(1);
    await expect(表示(page)).toHaveText(百分率(描かれた倍率(s)));
  });

  test("倍率を上げると、描かれていた倍率の次に大きい刻みで viewBox の幅 × 倍率 に描かれる", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図", "複雑");
    const 収めた = await 図を測る(page);
    const 次 = 上の刻み(描かれた倍率(収めた));

    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText(百分率(次));
    const 拡げた = await 図を測る(page);

    // 収めた時に描かれていた幅 (箱の幅ではない) より広く、viewBox の 1 world を 1px として数えた幅 × 倍率
    expect(拡げた.幅).toBeGreaterThan(収めた.vbW * 描かれた倍率(収めた));
    expect(Math.abs(拡げた.幅 - 拡げた.vbW * 次)).toBeLessThan(2);
    // 縦横比は保つ
    expect(Math.abs(拡げた.高さ / 拡げた.幅 - 拡げた.vbH / 拡げた.vbW)).toBeLessThan(0.01);
    await expect(収める(page)).toBeEnabled();
  });

  test("刻みの上で下げると、1 つ下の刻みで viewBox の幅 × 倍率 に描かれる", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図", "複雑");
    const 一つ目 = 上の刻み(描かれた倍率(await 図を測る(page)));
    await 上げる(page).click();
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText(百分率(上の刻み(一つ目)));
    await 下げる(page).click();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText(百分率(一つ目));
    const s = await 図を測る(page);
    expect(Math.abs(s.幅 - s.vbW * 一つ目)).toBeLessThan(2);
  });

  test("収めた倍率より小さい刻みが無い図では、下げるを押せない", async ({ page }) => {
    /*
     * 器に収めた `er-complex-demo` は 22% で描かれ、いちばん小さい刻み (50%) より小さい。
     * 押せると刻みの端へ跳ねて、下げる向きなのに図が大きくなる。
     */
    await 拡大を開く(page, "presets", "ER図", "複雑");
    const 倍率 = 描かれた倍率(await 図を測る(page));
    expect(倍率, "この図が小さい刻みより大きく描かれていて、確かめたい形になっていない").toBeLessThan(倍率の刻み[0]!);
    await expect(下げる(page)).toBeDisabled();
    await expect(上げる(page)).toBeEnabled();
  });

  test("器に収まらない倍率では本体が巻き取れる", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図", "複雑");
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
    await 拡大を開く(page, "presets", "ER図", "複雑");
    const 前 = await 図を測る(page);
    const 前の表示 = await 表示(page).textContent();
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await 収める(page).click();
    await page.waitForTimeout(400);
    await expect(収める(page)).toBeDisabled();
    await expect(表示(page)).toHaveText(前の表示 ?? "");
    const 後 = await 図を測る(page);
    expect(Math.abs(後.幅 - 前.幅)).toBeLessThan(2);
    expect(Math.abs(後.高さ - 前.高さ)).toBeLessThan(2);
  });

  test("別の図を開くと収めるへ戻る", async ({ page }) => {
    await 拡大を開く(page, "presets", "ER図", "複雑");
    await 上げる(page).click();
    await page.waitForTimeout(400);
    await expect(収める(page)).toBeEnabled();

    await page.keyboard.press("Escape");
    await expect(page.locator(拡大)).toBeHidden();
    await page.getByText("スイムレーン", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /を拡大表示$/ }).first().click();
    await expect(page.locator(拡大)).toBeVisible();
    await expect(収める(page)).toBeDisabled();
    await page.waitForTimeout(400);
    await expect(表示(page)).toHaveText(百分率(描かれた倍率(await 図を測る(page))));
  });
});
