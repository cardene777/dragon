/**
 * 動きの記述が、動かない図も含めて必ず画面に出ることの確認 (#1053)。
 *
 * 出さない図が残ると、その図では説明が単独で出る。 説明に語彙の外の言い回しで動きを
 * 書かれた時、隣に正しい導出文が無いため読み手が気付けない (#1051 の review 指摘)。
 */
import { test, expect, type Page } from "@playwright/test";

const NOTES = [
  "段の中で値が連続して動く",
  "段の切替で値が一度に変わる",
  "段を進めても値は変わらない",
];

async function openItem(page: Page, category: string, label: string): Promise<void> {
  await page.goto(`/catalog/${category}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.locator("aside.catalog-sidebar").getByText(label, { exact: false }).first().click();
  await page.waitForTimeout(500);
}

test.describe("動きの記述の表示 (#1053)", () => {
  test("動かない図にも一文が出る", async ({ page }) => {
    // 図の構造だけを見せる見本は段で値が変わらない。 直す前はここに一文が出ず、
    // 説明だけが単独で出ていた
    await openItem(page, "presets", "スイムレーン");
    const note = (await page.locator(".catalog-preview-motion").first().textContent())?.trim();
    expect(note, "動かない図に一文が出ていない").toBe("段を進めても値は変わらない");
  });

  test("動く図には動きに応じた一文が出る", async ({ page }) => {
    await openItem(page, "interactive", "パスワード強度チェック");
    const note = (await page.locator(".catalog-preview-motion").first().textContent())?.trim();
    expect(note, "連続して動く図の一文が違う").toBe("段の中で値が連続して動く");
  });

  test("preset 詳細でも一文が出る", async ({ page }) => {
    await page.goto("/preset/swimlane", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const note = (await page.locator(".nm-hero-motion").first().textContent())?.trim();
    expect(NOTES, `preset 詳細の一文が想定外: ${note}`).toContain(note);
  });

  test("拡大表示でも一文が出る", async ({ page }) => {
    await openItem(page, "presets", "スイムレーン");
    await page.locator("main.catalog-preview").getByRole("button", { name: /拡大/ }).first().click();
    await page.waitForTimeout(600);
    const note = (await page.locator(".cdl-modal-motion").first().textContent())?.trim();
    expect(NOTES, `拡大表示の一文が想定外: ${note}`).toContain(note);
  });
});
