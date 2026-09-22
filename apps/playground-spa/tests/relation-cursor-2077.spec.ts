/**
 * 関係を光らせる図で、押せる箱に押せる形の cursor を出す (#2077)。
 *
 * `relations: hover` を書いた図では箱が押せる形になる
 * (`role="button"` と `aria-pressed` が付き、押すと繋がる線と相手の箱が光ったまま残る)。
 * ところが押せる箱を指しても cursor が変わらず、読み手は触れて光るだけの箱だと読む。
 *
 * ## 描画側は直せないが、こちらで出せる
 *
 * engine (`@cardenelabs/cdl`) は押せる箱へ `style={{ cursor: "pointer" }}` を渡すが、
 * 同じ要素の後ろで動きの指定を `style` で渡し直しており、**後の値が前の値を丸ごと
 * 置き換える**。 要素に残る `style` は `transition` だけになる。
 *
 * 起票時は「描画側が `style` を 1 つにまとめた版を取り込む」 としていたが、
 * **要素に `cursor` が残っていないので、こちらの style sheet が普通に当たる**。
 * 外部の版を待たずに閉じられる (実測 = `auto` から `pointer` へ変わった)。
 *
 * ## 母集団は実物から導く
 *
 * 押せる箱を持つのは `relations: hover` を書いた見本。 手で並べると、
 * 見本を 1 枚足した日にそこだけ黙って対象から外れる。
 */
import { test, expect } from "@playwright/test";
import { 図の箱が出るまで待つ } from "./wait-for-render";
import { PRESETS } from "../src/lib/presets";
import { sourceYaml__presetEr } from "../src/topics/catalog/presets.cdl";

/**
 * `relations: hover` を書いた見本。 押せる箱を持つのはこれだけ。
 *
 * 組み立てた図での欄の名前は `relationFocus` になる (記法の `relations` から変わる)。
 * 記法の綴りで引くと 1 枚も当たらず、検査が黙って空振りする。
 */
const 触れて読む見本 = PRESETS.filter(
  (p) => (p.diagram as unknown as { relationFocus?: string }).relationFocus === "hover",
);

test("押せる箱を持つ見本が 1 枚以上ある (検査の空振り検知)", () => {
  expect(
    触れて読む見本.map((p) => p.slug),
    "`relations: hover` を書いた見本が 1 枚も無い (対象の拾い方が実装とずれた)",
  ).not.toEqual([]);
});

for (const 見本 of 触れて読む見本) {
  test(`見本 ${見本.slug} の押せる箱が押せる形になる`, async ({ page }) => {
    await page.goto(`preset/${見本.slug}`, { waitUntil: "networkidle" });
    await 図の箱が出るまで待つ(page, `見本 ${見本.slug}`);

    const m = await page.evaluate(() => {
      const 押せる = [...document.querySelectorAll('[data-cdl-node][role="button"]')];
      return {
        箱: document.querySelectorAll("[data-cdl-node]").length,
        押せる: 押せる.length,
        cursor: [...new Set(押せる.map((e) => getComputedStyle(e).cursor))],
      };
    });

    // 空振り防止。 押せる箱が 0 個なら、cursor の一致は何も言っていない
    expect(m.箱, "箱が 1 つも描かれていない").toBeGreaterThan(0);
    expect(
      m.押せる,
      `押せる箱が 1 つも無い (箱 ${m.箱} 個。 engine が \`role="button"\` を付けなくなった)`,
    ).toBeGreaterThan(0);

    expect(m.cursor, `押せる箱 ${m.押せる} 個の cursor`).toEqual(["pointer"]);
  });
}

test("押せない箱には押せる形の cursor を出さない (対照)", async ({ page }) => {
  // 関係を書いていない見本。 ここまで `pointer` になっていたら、規則が広すぎる
  const 押せない = PRESETS.find(
    (p) => (p.diagram as unknown as { relationFocus?: string }).relationFocus !== "hover",
  );
  expect(押せない, "関係を書いていない見本が 1 枚も無い").toBeDefined();

  await page.goto(`preset/${押せない!.slug}`, { waitUntil: "networkidle" });
  await 図の箱が出るまで待つ(page, `見本 ${押せない!.slug}`);

  const m = await page.evaluate(() => {
    const 箱 = [...document.querySelectorAll("[data-cdl-node]")];
    return {
      数: 箱.length,
      押せる: box(箱),
      cursor: [...new Set(箱.map((e) => getComputedStyle(e).cursor))],
    };
    function box(xs: Element[]): number {
      return xs.filter((e) => e.getAttribute("role") === "button").length;
    }
  });

  expect(m.数, "箱が 1 つも描かれていない").toBeGreaterThan(0);
  expect(m.押せる, "対照に選んだ見本に押せる箱がある").toBe(0);
  expect(m.cursor, "押せない箱に押せる形の cursor が出ている").not.toContain("pointer");
});

/**
 * 編集画面でも同じことを見る。
 *
 * **記法から開く** = `editor#preset=er` で開くと押せる箱が 1 つも出ない
 * (その経路は組み立て API 側の図を読むため `relations` を持たない)。
 * 起票時の再現手順は本文に `relations: hover` を書く形なので、そちらを通す。
 */
test("編集画面で関係を書いた図の押せる箱が押せる形になる", async ({ page }) => {
  const 載せる = (src: string): string =>
    Buffer.from(unescape(encodeURIComponent(src)), "binary").toString("base64");
  await page.goto(`editor#s=${載せる(sourceYaml__presetEr)}`, { waitUntil: "networkidle" });
  await 図の箱が出るまで待つ(page, "編集画面");

  const m = await page.evaluate(() => {
    const 押せる = [...document.querySelectorAll('[data-cdl-node][role="button"]')];
    return {
      箱: document.querySelectorAll("[data-cdl-node]").length,
      押せる: 押せる.length,
      cursor: [...new Set(押せる.map((e) => getComputedStyle(e).cursor))],
    };
  });

  expect(m.箱, "箱が 1 つも描かれていない").toBeGreaterThan(0);
  expect(m.押せる, `押せる箱が 1 つも無い (箱 ${m.箱} 個)`).toBeGreaterThan(0);
  // 舞台は掴んで動かす側が `grab` を出す。 押せる箱だけが `pointer` に勝つ
  expect(m.cursor, `押せる箱 ${m.押せる} 個の cursor`).toEqual(["pointer"]);
});
