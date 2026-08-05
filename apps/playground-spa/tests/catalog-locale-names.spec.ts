/**
 * catalog の一覧が言語ごとに読める名前を出すことの確認 (#1035)。
 *
 * 英語表示は以前 `item.title` (= export 名) をそのまま返しており、
 * `interactiveOauthFlow` のような識別子が 332 件すべてに並んでいた。
 *
 * 「名前が変わる」 だけでは弱い。 **識別子が出ていないこと** を直接見る。
 */
import { test, expect } from "@playwright/test";

const SPA_URL = "http://localhost:4323";

/** export 名らしい形 (先頭小文字 + 途中に大文字、空白なし)。 */
const LOOKS_LIKE_EXPORT_NAME = /^[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*$/;

test.describe("catalog の一覧の名前 (#1035)", () => {
  test("言語を切り替えると一覧の名前が変わる", async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog/interactive`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const first = page.locator(".catalog-list-item-name").first();
    const ja = (await first.textContent())?.trim() ?? "";
    expect(ja.length, "日本語の名前が空").toBeGreaterThan(0);

    await page.locator("button.v4-nav-lang-toggle").click();
    await page.waitForTimeout(500);

    const en = (await first.textContent())?.trim() ?? "";
    expect(en, `言語を切り替えても名前が変わらない ("${ja}")`).not.toBe(ja);
  });

  test("英語表示で export 名がそのまま出ない", async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog/interactive`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.locator("button.v4-nav-lang-toggle").click();
    await page.waitForTimeout(500);

    const names = (await page.locator(".catalog-list-item-name").allTextContents())
      .map((s) => s.trim())
      .filter(Boolean);
    expect(names.length, "一覧が空 (検査が空振りしている)").toBeGreaterThan(50);

    const idents = names.filter((n) => LOOKS_LIKE_EXPORT_NAME.test(n));
    expect(idents, `export 名がそのまま出ている: ${idents.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  test("日本語表示でも export 名がそのまま出ない", async ({ page }) => {
    // 英語名を足す際に日本語側を壊していないことを見る
    await page.goto(`${SPA_URL}/catalog/interactive`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const names = (await page.locator(".catalog-list-item-name").allTextContents())
      .map((s) => s.trim())
      .filter(Boolean);
    expect(names.length, "一覧が空 (検査が空振りしている)").toBeGreaterThan(50);

    const idents = names.filter((n) => LOOKS_LIKE_EXPORT_NAME.test(n));
    expect(idents, `export 名がそのまま出ている: ${idents.slice(0, 6).join(", ")}`).toHaveLength(0);
  });
});
