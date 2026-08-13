/**
 * 舞台の方眼の検証 (#1141)。
 *
 * 方眼は設計 (`docs/design/app.pen`) に無く、 実装だけが `editor.css` で足していた。
 * 暗い配色の実画素を測ると、 舞台 `#2E2C28` に対して罫が 1.33、 名札の面が 1.47 で、
 * 背景と図がほぼ同じ強さで鳴っていた。
 *
 * 加えて罫は線で、 図の中身 (生存線 / 矢印) も線なので、 同じ種類のものが画面全体に
 * 敷き詰められる。 既定で消し、 要る時だけ **点** で出す。
 *
 * ## 検査の作り
 *
 * **class の有無では守れない**。 `has-grid` が付いても CSS 側が空なら方眼は出ないし、
 * 逆に既定側の CSS に罫が残っていれば class が無くても出る。 実際に描画された
 * `background-image` を見る。
 */
import { test, expect } from "@playwright/test";

const 舞台 = "editor-preview-stage";
const 釦 = "editor-toggle-grid";

async function 開く(page: import("@playwright/test").Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1800);
}

/** 舞台に実際に描かれている背景。 */
async function 背景(page: import("@playwright/test").Page): Promise<{
  image: string;
  size: string;
  color: string;
}> {
  return page.getByTestId(舞台).evaluate((el) => {
    const c = getComputedStyle(el);
    return { image: c.backgroundImage, size: c.backgroundSize, color: c.backgroundColor };
  });
}

test.describe("舞台の方眼 (#1141)", () => {
  test("開いた直後は方眼が出ていない", async ({ page }) => {
    await 開く(page);
    const b = await 背景(page);
    expect(b.image, `既定で背景に絵がある: ${b.image}`).toBe("none");
    await expect(page.getByTestId(釦)).toHaveAttribute("aria-pressed", "false");
  });

  test("押すと点の方眼が出る", async ({ page }) => {
    await 開く(page);
    await page.getByTestId(釦).click();

    const b = await 背景(page);
    // 点は radial-gradient、 罫は repeating-linear-gradient。 種類まで見ないと、
    // 罫に戻しても「方眼が出た」 で通る
    expect(b.image, `点になっていない: ${b.image}`).toContain("radial-gradient");
    expect(b.image, `罫に戻っている: ${b.image}`).not.toContain("repeating-linear-gradient");
    expect(b.size, `刻みが 24px でない: ${b.size}`).toBe("24px 24px");
    await expect(page.getByTestId(釦)).toHaveAttribute("aria-pressed", "true");
  });

  test("もう一度押すと消える", async ({ page }) => {
    await 開く(page);
    await page.getByTestId(釦).click();
    await page.getByTestId(釦).click();

    const b = await 背景(page);
    expect(b.image, `消えていない: ${b.image}`).toBe("none");
    await expect(page.getByTestId(釦)).toHaveAttribute("aria-pressed", "false");
  });

  test("方眼を出しても舞台の色は変わらない", async ({ page }) => {
    await 開く(page);
    // 切り替えるのは方眼の有無だけ。 同じ操作で舞台の明度まで動くと、 1 つの操作が
    // 2 つのことをする
    const 前 = (await 背景(page)).color;
    await page.getByTestId(釦).click();
    const 後 = (await 背景(page)).color;
    expect(後, `舞台の色が変わった (${前} → ${後})`).toBe(前);
  });

  test("暗い配色でも同じ", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await 開く(page);
    expect((await 背景(page)).image, "暗い配色の既定で方眼が出ている").toBe("none");

    await page.getByTestId(釦).click();
    const b = await 背景(page);
    expect(b.image, `暗い配色で点が出ない: ${b.image}`).toContain("radial-gradient");
    expect(b.size).toBe("24px 24px");
  });
});
