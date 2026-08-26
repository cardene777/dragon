/**
 * catalog の一覧が言語ごとに読める名前を出すことの確認 (#1035)。
 *
 * 英語表示は以前 `item.title` (= export 名) をそのまま返しており、
 * `interactiveOauthFlow` のような識別子が 332 件すべてに並んでいた。
 *
 * 「名前が変わる」 だけでは弱い。 **識別子が出ていないこと** を直接見る。
 */
import { test, expect } from "@playwright/test";

/**
 * 表示名の表に載っている名前 (= 一覧に出てよい名前)。
 *
 * **手で列挙しない**。 前の形は 15 件を手書きしており、interactive 129 件のうち
 * 13 件しか見ていなかった。 表に載っていない文字列が一覧に出たら、表示名が引けずに
 * export 名がそのまま出ている。
 *
 * 名前の形 (camelCase かどうか) では判定しない。 形で見ると `websocket` のような
 * 小文字 1 語の export 名を見逃し、`iPhone` のような正しい英語名を誤って弾く。
 */
import { ITEM_NAME_JA, ITEM_NAME_EN } from "../src/lib/i18n";

const ALLOWED_JA = new Set(Object.values(ITEM_NAME_JA));
const ALLOWED_EN = new Set(Object.values(ITEM_NAME_EN));

test.describe("catalog の一覧の名前 (#1035)", () => {
  test("言語を切り替えると一覧の名前が変わる", async ({ page }) => {
    await page.goto("catalog/interactive", { waitUntil: "networkidle" });
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
    await page.goto("catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.locator("button.v4-nav-lang-toggle").click();
    await page.waitForTimeout(500);

    const names = (await page.locator(".catalog-list-item-name").allTextContents())
      .map((s) => s.trim())
      .filter(Boolean);
    expect(names.length, "一覧が空 (検査が空振りしている)").toBeGreaterThan(50);

    const unknown = names.filter((n) => !ALLOWED_EN.has(n));
    expect(unknown, `表に無い名前が出ている (export 名の可能性): ${unknown.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  test("日本語表示でも export 名がそのまま出ない", async ({ page }) => {
    // 英語名を足す際に日本語側を壊していないことを見る
    await page.goto("catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const names = (await page.locator(".catalog-list-item-name").allTextContents())
      .map((s) => s.trim())
      .filter(Boolean);
    expect(names.length, "一覧が空 (検査が空振りしている)").toBeGreaterThan(50);

    const unknown = names.filter((n) => !ALLOWED_JA.has(n));
    expect(unknown, `表に無い名前が出ている (export 名の可能性): ${unknown.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  test("英語表示の名前で検索できる", async ({ page }) => {
    // 一覧に出す名前と、検索が見る名前がずれていると、見えているものを打っても消える
    // (実測 = 検索は日本語名だけを見ており、英語で見えている名前を打つと 0 件になった)
    await page.goto("catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.locator("button.v4-nav-lang-toggle").click();
    await page.waitForTimeout(500);

    const first = page.locator(".catalog-list-item-name").first();
    const shown = (await first.textContent())?.trim() ?? "";
    expect(shown.length, "一覧の名前が空").toBeGreaterThan(0);

    // 画面に出ている名前の先頭 1 語で引く
    const word = shown.split(/\s+/)[0]!;
    await page.locator("input.catalog-search").fill(word);
    await page.waitForTimeout(400);

    const names = (await page.locator(".catalog-list-item-name").allTextContents())
      .map((t) => t.trim())
      .filter(Boolean);
    expect(names, `画面に出ている "${shown}" を "${word}" で引けない`).toContain(shown);
  });
});
