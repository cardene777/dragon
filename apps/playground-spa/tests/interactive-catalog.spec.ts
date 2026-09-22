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
import { ITEM_NAME_JA } from "../src/lib/i18n";
import { 一覧の行 } from "./catalog-item-pick";

/**
 * 見る 4 例の識別子。 **画面に出る名前は書かない** (#1834)。
 *
 * 名前を literal で持っていた間、`スクロール駆動のフェーズ進行` が
 * `スクロール駆動の段進行` に変わった日 (#1821) からこの検査は赤いままだった。
 * 名前は画面と同じ出どころ (`ITEM_NAME_JA`) から引く。
 */
const 例の識別子 = ["inputSliderBar", "formulaTextBind", "scrollNarrative", "clickToggle"] as const;

function 例の名前(): string[] {
  return 例の識別子.map((id) => {
    const 名 = ITEM_NAME_JA[id];
    if (名 === undefined || 名 === "") throw new Error(`見本 ${id} の日本語名が一覧に無い`);
    return 名;
  });
}

test.describe("interactive catalog category (CAR #231)", () => {
  test("interactive category が catalog top に表示される", async ({ page }) => {
    await page.goto("catalog", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    // interactive category card は JA label 「インタラクティブ」 (`src/lib/catalog.ts § CATEGORIES`
    // + `pages/CatalogIndexPage.tsx § category name`)、 URL 経路で確実に hit
    const link = page.locator('a[href*="/catalog/interactive"]').first();
    await expect(link).toBeVisible();
  });

  test("interactive category page で 4 例が全て render される", async ({ page }) => {
    await page.goto("catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    // 4 diagram の title 相当 label が表示 (JA)
    const 名前 = 例の名前();
    expect(名前.length, "見る名前が 1 つも無い (検査が空振りしている)").toBe(例の識別子.length);
    for (const label of 名前) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("各 example の SVG preview が sidebar 選択で表示される", async ({ page }) => {
    await page.goto("catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    // 各 example を sidebar で選択して preview area の SVG を verify する
    const examples = 例の名前();
    expect(examples.length, "見る名前が 1 つも無い (検査が空振りしている)").toBe(例の識別子.length);
    const preview = page.locator("main.catalog-preview");
    for (const label of examples) {
      // sidebar 側の該当 item を click
      await 一覧の行(page, label, false).click();
      await page.waitForTimeout(300);
      // preview 側に SVG が存在
      const previewSvg = preview.locator("svg").first();
      await expect(previewSvg).toBeVisible();
    }
  });

  test("domain-neutral: catalog 内に crypto / finance 系 domain 語彙が含まれない", async ({ page }) => {
    await page.goto("catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const bodyText = await page.locator("body").innerText();
    // domain 特化語 (crypto / chain / gas / merkle) が interactive category 内に出ないこと
    const bannedTerms = ["EIP-1559", "arc-intro", "blockchain", "merkle"];
    for (const term of bannedTerms) {
      expect(bodyText.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
