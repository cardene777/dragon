/**
 * Interactive catalog 動作確認 (CAR #231、 Step 7)。
 *
 * cdl の 4 interactive primitive (input widget / formula / scroll-driven trigger / event handler) を
 * 使い方 tour として登録した 4 例 (inputSliderBar / formulaTextBind / scrollNarrative / clickToggle) が
 * catalog SPA に表示され、 各例が render されることを確認する。
 *
 * 本 test は「primitive の存在 tour」 が catalog に配置されることを保証、 primitive の詳細動作 (signal
 * 更新 / event 発火 / progress 反映) は cdl 側 unit test でカバー済み (別 test suite)。
 */
import { test, expect } from "@playwright/test";

const SPA_URL = "http://localhost:4323";

test.describe("interactive catalog category (CAR #231)", () => {
  test("interactive category が catalog top に表示される", async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    // interactive category card は JA label 「インタラクティブ」 (`src/lib/catalog.ts § CATEGORIES`
    // + `pages/CatalogIndexPage.tsx § category name`)、 URL 経路で確実に hit
    const link = page.locator('a[href*="/catalog/interactive"]').first();
    await expect(link).toBeVisible();
  });

  test("interactive category page で 4 例が全て render される", async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog/interactive`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    // 4 diagram の title 相当 label が表示 (JA)
    for (const label of ["スライダーの値で棒の高さが変わる", "入力値から 2 倍と半分を自動計算する", "スクロール進行に 3 つの段が同時に追随する", "クリックが handler を通って状態に届く"]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("各 example の SVG preview が sidebar 選択で表示される", async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog/interactive`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    // 各 example を sidebar で選択して preview area の SVG を verify する
    const examples = ["スライダーの値で棒の高さが変わる", "入力値から 2 倍と半分を自動計算する", "スクロール進行に 3 つの段が同時に追随する", "クリックが handler を通って状態に届く"];
    const preview = page.locator("main.catalog-preview");
    for (const label of examples) {
      // sidebar 側の該当 item を click
      await page.locator("aside.catalog-sidebar").getByText(label, { exact: false }).first().click();
      await page.waitForTimeout(300);
      // preview 側に SVG が存在
      const previewSvg = preview.locator("svg").first();
      await expect(previewSvg).toBeVisible();
    }
  });

  test("domain-neutral: catalog 内に crypto / finance 系 domain 語彙が含まれない", async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog/interactive`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const bodyText = await page.locator("body").innerText();
    // domain 特化語 (crypto / chain / gas / merkle) が interactive category 内に出ないこと
    const bannedTerms = ["EIP-1559", "arc-intro", "blockchain", "merkle"];
    for (const term of bannedTerms) {
      expect(bodyText.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
