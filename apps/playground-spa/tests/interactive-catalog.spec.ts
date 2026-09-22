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

  test("使い方の 4 例に crypto / finance の題材が出ない", async ({ page }) => {
    // **見るのは 4 例だけ** (#2470)。 元は画面全体の字を見ていたが、分類そのものは
    // 題材を持つ見本を意図して並べており (`interactive.cdl.ts` が
    // `domain example = EIP-1559 gas cost model` と書いて置いた見本が 1 件ある)、
    // 画面全体で見ると「題材の見本を 1 件でも足したら落ちる」 形になる。
    //
    // この file が守るのは冒頭の 4 例 = 仕組みの使い方を見せる tour で、そこに題材が
    // 混ざると「仕組みを見る」 のに題材の知識が要る。 対象をその 4 例に閉じる。
    await page.goto("catalog/interactive", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const preview = page.locator("main.catalog-preview");
    const 出てはいけない字 = ["EIP-1559", "arc-intro", "blockchain", "merkle"];
    const 混ざる = (字: string): string[] =>
      出てはいけない字.filter((t) => 字.toLowerCase().includes(t.toLowerCase()));

    // 植え込み対照 = 判定そのものが空振りしていないこと
    expect(混ざる("これは EIP-1559 の図"), "判定が題材の字を拾えていない").toEqual(["EIP-1559"]);

    for (const label of 例の名前()) {
      await 一覧の行(page, label, false).click();
      await page.waitForTimeout(300);
      const 字 = await preview.innerText();
      expect(字.length, `${label} の詳細が空 (検査が空振りしている)`).toBeGreaterThan(0);
      expect(混ざる(字), `${label} の詳細に題材の字が混ざっている`).toEqual([]);
    }
  });
});
