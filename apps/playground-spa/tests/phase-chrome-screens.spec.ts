/**
 * 図を見せる画面に段の表示が出ることの検証 (#1239)。
 *
 * 設計 (`docs/design/app.pen`) は図を見せる画面すべてに札と帯を描いているが、実装は
 * 編集画面 (`04`) だけが持ち、`03 見本帳の分類` と `06 見本の詳細` は何も出していなかった。
 * 動く図を見ても「いま何段目か」「あと何段あるか」が画面から分からない状態だった。
 *
 * エディタ側は `editor-phase-chrome.spec.ts` が見る。 こちらは **残り 2 画面** を見る。
 *
 * ## 要素の有無では守れない
 *
 * 札が出ていても中身が固定文字なら段は伝わらないし、帯が出ていても区切り数が段と合って
 * いなければ進み具合にならない。 中身と数を直接見る。
 */
import { test, expect, type Page } from "@playwright/test";
import { 段の呼び名 } from "../src/components/PhaseChrome";

/** 図が組み上がって段が回り始めるまで待つ */
async function 開く(page: Page, path: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-cdl-diagram]", { timeout: 30000 });
  await page.waitForTimeout(1200);
}

/** 札の文字。 空白の揺れを吸収する */
async function 札(page: Page): Promise<string> {
  return (await page.locator(".cdl-phase-chip").first().innerText()).replace(/\s+/gu, " ").trim();
}

const 画面 = [
  { 名: "カタログの分類", path: "catalog/animation", 寄せ: "is-right", 舞台: ".catalog-preview-stage" },
  { 名: "見本の詳細", path: "preset/sequence", 寄せ: "is-left", 舞台: ".nm-preset-detail-stage" },
] as const;

for (const s of 画面) {
  test.describe(`段の表示 — ${s.名} (#1239)`, () => {
    test("札に今の段と全体の数が出る", async ({ page }) => {
      await 開く(page, s.path);
      await expect(page.locator(".cdl-phase-chip")).toHaveCount(1);
      // 「段 N / M」 の形。 数が入っていることまで見る = 固定文字なら落ちる
      expect(await 札(page)).toMatch(new RegExp(`${段の呼び名} \\d+ / \\d+`, "u"));
    });

    test("帯が段の数だけ区切られる", async ({ page }) => {
      await 開く(page, s.path);
      const 全体 = Number((await 札(page)).match(new RegExp(`${段の呼び名} \\d+ / (\\d+)`, "u"))?.[1] ?? "0");
      expect(全体, "札から全体の段数を読めない").toBeGreaterThan(1);
      await expect(page.locator(".cdl-phase-seg")).toHaveCount(全体);
    });

    test("設計どおりの側へ寄っている", async ({ page }) => {
      await 開く(page, s.path);
      const cls = (await page.locator(".cdl-phase-chip").first().getAttribute("class")) ?? "";
      expect(cls, `${s.名} は設計が ${s.寄せ} に描いている`).toContain(s.寄せ);
    });

    test("札が図の舞台の中に収まる", async ({ page }) => {
      // 重ねる基準 (`position: relative`) を舞台が持たないと、札はもっと外側の要素を基準に
      // 貼り付く。 **重ねる層 (`.cdl-phase`) と比べてはいけない** = 層は札と一緒に動くので
      // どこへ飛んでも「中に収まっている」 が成り立ち、検査が恒真になる (実測で踏んだ)
      await 開く(page, s.path);
      const chip = await page.locator(".cdl-phase-chip").first().boundingBox();
      const 舞台 = await page.locator(s.舞台).first().boundingBox();
      expect(chip, "札が見つからない").not.toBeNull();
      expect(舞台, "舞台が見つからない").not.toBeNull();
      expect(chip!.x, "札が舞台より左に出ている").toBeGreaterThanOrEqual(舞台!.x - 1);
      expect(chip!.y, "札が舞台より上に出ている").toBeGreaterThanOrEqual(舞台!.y - 1);
      expect(chip!.x + chip!.width, "札が舞台より右に出ている").toBeLessThanOrEqual(舞台!.x + 舞台!.width + 1);
      expect(chip!.y + chip!.height, "札が舞台より下に出ている").toBeLessThanOrEqual(舞台!.y + 舞台!.height + 1);
    });

    test("段が進むと札と帯が追随する", async ({ page }) => {
      await 開く(page, s.path);
      const 初 = await 札(page);
      const 初塗り = await page.locator(".cdl-phase-seg.is-done").count();

      // 1 周ぶん待つ。 段の長さは図によって違うので、変化するまで最大 12 秒見る
      await expect
        .poll(async () => (await 札(page)) !== 初 || (await page.locator(".cdl-phase-seg.is-done").count()) !== 初塗り,
          { timeout: 12000 })
        .toBe(true);
    });
  });
}

test.describe("段が 1 つ以下の図 (#1239)", () => {
  test("札も帯も出さない", async ({ page }) => {
    // `styles` の先頭 (`アクティブ状態のedge`) は段を 1 つしか持たない。 段が 1 つ以下では
    // 進み具合を示す先が無く、1/1 の帯が常に満杯で意味を持たない
    await 開く(page, "catalog/styles");

    // **図が出ていることを先に確かめる**。 頁が壊れて何も描けていない状態でも
    // 「札が無い」 は成り立ってしまう
    await expect(page.locator("[data-cdl-diagram]")).not.toHaveCount(0);

    await expect(page.locator(".cdl-phase-chip")).toHaveCount(0);
    await expect(page.locator(".cdl-phase-seg")).toHaveCount(0);
  });

  test("段が 2 つ以上の分類では出る (陰性対照)", async ({ page }) => {
    // 上が「この画面では元から出ない」 のではなく、段の数で分かれていることを示す。
    // 同じ経路 (`/catalog/:slug` の図の面) で出る分類を 1 つ通す
    await 開く(page, "catalog/patterns");
    await expect(page.locator(".cdl-phase-chip")).toHaveCount(1);
  });
});
