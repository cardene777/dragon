/**
 * 見せ方の札が開いた言語で出ることの検証 (#2460)。
 *
 * 札の字がそのまま画面の状態の値になっていた間、字を訳すと型と状態が同時に変わるため
 * 訳せず、英語で開いても札だけ日本語で出ていた。 値と札を分けたので、ここで両方を見る。
 *
 * **見本は実物から導く**。 id を手で書くと、その見本が消えた日に検査が別の図を見る
 * (`interactive-catalog.spec.ts` が #1834 で踏んだ形)。 切替が出る条件は画面と同じ
 * 判定関数を引いて、条件に当たる見本の 1 件目を開く。
 *
 * **日本語の側も見る**。 英語に日本語が出ないことだけを見ると、札が 1 つも描かれない形でも
 * 通る。 同じ見本を日本語で開いて札に日本語が出ていることを併せて見る。
 */
import { test, expect, type Page } from "@playwright/test";
import { CATALOG_ITEMS, type CatalogItem } from "../src/lib/catalog-items";
import { 描き方を選べる } from "../src/lib/redraw-mode";
import { 配色を選べる } from "../src/lib/palette-switch";
import { 折れ線を選べる } from "../src/lib/chart-line-options";
import { 円の見せ方を選べる } from "../src/lib/chart-pie-options";
import { 傾きの見せ方を選べる } from "../src/lib/chart-slope-options";
import { 一覧の行 } from "./catalog-item-pick";

const 日本語の字 =
  /[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script=Han}]/u;

/** 切替の群と、その群が出る条件 */
const 群 = [
  { 名: "2 段目以降", 出る: 描き方を選べる },
  { 名: "図の色味", 出る: 配色を選べる },
  { 名: "折れ線の見せ方", 出る: 折れ線を選べる },
  { 名: "円グラフの見せ方", 出る: 円の見せ方を選べる },
  { 名: "傾き図の見せ方", 出る: 傾きの見せ方を選べる },
] as const;

/** 条件に当たる見本を、分類ごと総当たりで 1 件探す */
function 当たる見本(出る: (d: CatalogItem["diagram"]) => boolean): { 分類: string; id: string } {
  for (const [分類, items] of Object.entries(CATALOG_ITEMS)) {
    for (const item of items) {
      if (出る(item.diagram)) return { 分類, id: item.id };
    }
  }
  throw new Error("条件に当たる見本が 1 件も無い (検査の前提が崩れた)");
}

async function 開く(page: Page, 分類: string, id: string, lang: "ja" | "en"): Promise<void> {
  await page.goto(`catalog/${分類}?lang=${lang}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
  await 一覧の行(page, id).click();
  await page.waitForTimeout(500);
}

/** いま出ている切替の札を全部拾う (見せ方の群と再生速度の群) */
async function 札たち(page: Page): Promise<string[]> {
  return await page.evaluate(() =>
    Array.from(document.querySelectorAll(".catalog-redraw button, .catalog-speed button")).map(
      (b) => (b.textContent ?? "").trim(),
    ),
  );
}

for (const { 名, 出る } of 群) {
  test(`${名} の札が英語で出る`, async ({ page }) => {
    const { 分類, id } = 当たる見本(出る);

    await 開く(page, 分類, id, "en");
    const 英語 = await 札たち(page);
    expect(英語.length, `${分類}/${id} で札が 1 つも出ていない`).toBeGreaterThan(0);
    expect(
      英語.filter((t) => 日本語の字.test(t)),
      `${分類}/${id} の札に日本語が残っている`,
    ).toEqual([]);

    await 開く(page, 分類, id, "ja");
    const 日本語 = await 札たち(page);
    expect(日本語.length, `${分類}/${id} で札が 1 つも出ていない`).toBeGreaterThan(0);
    expect(
      日本語.filter((t) => 日本語の字.test(t)).length,
      `${分類}/${id} の札が日本語で出ていない (英語だけを見て通る形)`,
    ).toBeGreaterThan(0);
  });
}
