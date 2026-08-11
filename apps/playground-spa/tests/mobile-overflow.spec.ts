/**
 * 携帯の幅で画面が横にはみ出さないことの検証 (#1074)。
 *
 * 実測で 2 画面が切れていた。 `/contribute` はカードが 480px 固定で 137px、
 * `/preset/{id}` は前後移動のボタンが縮まず 27px 外に出ていた。
 *
 * ## 経路を絞らない
 *
 * 既存の横スクロール検査 (`a11y-check.spec.ts`) は `/` `/editor` `/catalog/ethereum` の 3 経路
 * だけを見ており、上の 2 件はどちらも対象外の経路で起きた。 **経路を絞っている限り同じ
 * 見落としが繰り返される** ので、router が持つ経路をすべて通す。
 *
 * ## 「はみ出していない」 だけでは守れない
 *
 * 画面が真っ白でも横スクロールは 0 になる。 中身が実際に描かれていること (本文の文字数) を
 * 併せて見る。
 */
import { test, expect } from "@playwright/test";

/** `main.tsx` の `<Route>` が持つ経路。 動的な部分は実在する値を入れる。 */
const 経路 = [
  "/",
  "/catalog",
  "/catalog/presets",
  "/catalog/ethereum",
  "/editor",
  "/docs",
  "/preset/swimlane",
  "/release-notes",
  "/contribute",
  "/does-not-exist",
] as const;

/** 携帯の幅。 375 = iPhone SE / 390 = iPhone 14。 */
const 幅一覧 = [375, 390] as const;

test("広い画面のカードの並びは変わらない", async ({ page }) => {
  // 下限を `min()` で頭打ちにした時に、 広い画面の列数や幅が動いていないかを見る。
  // 実測値 = 1280px でカード 339px が 3 枚 / 1 行。
  // 作り直しの前は 598px の 2 行だった (#1110 で 3 枚が 1 行に収まる幅になった)。
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/contribute");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".nm-preset-card")];
    return {
      幅: [...new Set(cards.map((el) => Math.round(el.getBoundingClientRect().width)))],
      枚数: cards.length,
      行数: new Set(cards.map((el) => Math.round(el.getBoundingClientRect().top))).size,
    };
  });
  expect(m.枚数, "カードが無い (検査が空振りしている)").toBe(3);
  expect(m.幅, "カードの幅が動いた").toEqual([339]);
  expect(m.行数, "1 行あたりの枚数が動いた").toBe(1);
});

for (const 幅 of 幅一覧) {
  for (const path of 経路) {
    test(`幅 ${幅}px の ${path} が横にはみ出さない`, async ({ page }) => {
      await page.setViewportSize({ width: 幅, height: 780 });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);

      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        // どの要素が外に出ているかまで出す。 数値だけだと直す場所が分からない
        const 外: string[] = [];
        document.querySelectorAll("body *").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return;
          // 自分でスクロールする欄 (コード欄等) の中身は対象外。 欄そのものが画面内なら、
          // 中身が広くても画面は切れない
          const parent = el.parentElement;
          if (parent && parent.scrollWidth > parent.clientWidth + 1) return;
          if (r.right > doc.clientWidth + 1) {
            const cls = typeof el.className === "string" ? el.className.split(" ")[0] : "";
            外.push(`${el.tagName}${cls ? "." + cls : ""}(+${Math.round(r.right - doc.clientWidth)})`);
          }
        });
        return {
          はみ出し: Math.round(doc.scrollWidth - doc.clientWidth),
          外: [...new Set(外)].slice(0, 5),
          文字数: (document.body.innerText ?? "").trim().length,
        };
      });

      // 真っ白な画面は横スクロールが 0 になる。 中身が出ていることを先に見る
      expect(m.文字数, `${path} の本文が空 (検査が空振りしている)`).toBeGreaterThan(20);
      // 数 px の誤差は許容 (scrollbar 分)
      expect(
        m.はみ出し,
        `${path} が ${m.はみ出し}px はみ出している: ${m.外.join(", ")}`,
      ).toBeLessThan(20);
    });
  }
}
