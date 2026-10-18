/**
 * 基本の形の細部が輪郭と同じ色と幅で描かれることの検証 (#2954)。
 *
 * cdl 0.141.0 は基本の形を「線は 1 色、面は 1 種類」 で描き、輪郭 1 つにだけ `node-body` を付ける。
 * 細部 (中の線 / 点 / 奥の面) は輪郭の兄弟に置かれ、`cdl-theme.css` の箱の規則が当たらない。
 * 当たらないと細部だけ cdl の色 (この site では墨) で残り、枠は朱なのに中の線が黒くなる
 * (実測 = 端末の見本で枠 `rgb(192, 66, 31)` / 中の線 `rgb(34, 24, 17)`)。
 *
 * ## 計算後の値を輪郭と突き合わせる
 *
 * 色を literal で持たない。 輪郭の色は色味と明暗と状態で変わり、細部はそれに揃っていればよい。
 * 細部は cdl が付けた属性で 3 つに分ける。
 *
 * | 細部 | 見分け方 | 輪郭と揃える値 |
 * |---|---|---|
 * | 線 | `fill="none"` | `stroke` / `stroke-width`、塗りは `none` のまま |
 * | 面 | 上の 2 つ以外 | `stroke` / `stroke-width` / `fill` |
 * | 点 | `stroke="none"` | 塗りを輪郭の `stroke` に |
 *
 * 状態は箱の属性を書き換えて作る。 光る / 光らないは段の進みで決まり、見本によっては片方しか
 * 出ない。 書き換えと測定を 1 回の `evaluate` で行い、描き直しが間に入らないようにする。
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

const 対象 = "catalog/primitives";

type 状態 = "光っていない" | "光った" | "節の色で光った";
const 状態たち: readonly 状態[] = ["光っていない", "光った", "節の色で光った"];

type 測った値 = {
  輪郭: { stroke: string; fill: string; width: string };
  細部: { 種: "線" | "面" | "点"; tag: string; stroke: string; fill: string; width: string }[];
};

/** 見本を開き、形の箱が描かれるまで待つ */
async function 見本を開く(page: Page, id: string): Promise<void> {
  await 一覧の行(page, id).click();
  await page
    .locator(`article.catalog-preview-card[data-item-id="${id}"] [data-cdl-kind^="shape-"] [data-cdl-role="node-body"]`)
    .first()
    .waitFor();
}

/** 開いている見本の形の箱を、指定した状態にして測る */
async function 測る(page: Page, id: string, 状態: 状態): Promise<測った値> {
  const 箱 = page.locator(`article.catalog-preview-card[data-item-id="${id}"] [data-cdl-kind^="shape-"]`).first();
  return 箱.evaluate((node, 状態) => {
    const 元の光 = node.getAttribute("data-cdl-active");
    const 元の節の色 = node.getAttribute("data-cdl-tone");
    node.setAttribute("data-cdl-active", 状態 === "光っていない" ? "false" : "true");
    if (状態 === "節の色で光った") node.setAttribute("data-cdl-tone", "success");
    else node.removeAttribute("data-cdl-tone");

    const 輪郭 = node.querySelector('[data-cdl-role="node-body"]');
    if (!輪郭 || !輪郭.parentElement) throw new Error("輪郭が無い");
    const 輪郭の値 = getComputedStyle(輪郭);
    const 結果 = {
      輪郭: { stroke: 輪郭の値.stroke, fill: 輪郭の値.fill, width: 輪郭の値.strokeWidth },
      細部: [...輪郭.parentElement.children]
        .filter((e) => e !== 輪郭)
        .map((e) => {
          const 値 = getComputedStyle(e);
          const 種 =
            e.getAttribute("stroke") === "none" ? "点" : e.getAttribute("fill") === "none" ? "線" : "面";
          return { 種, tag: e.tagName, stroke: 値.stroke, fill: 値.fill, width: 値.strokeWidth };
        }),
    };

    if (元の光 === null) node.removeAttribute("data-cdl-active");
    else node.setAttribute("data-cdl-active", 元の光);
    if (元の節の色 === null) node.removeAttribute("data-cdl-tone");
    else node.setAttribute("data-cdl-tone", 元の節の色);
    return 結果 as 測った値;
  }, 状態);
}

/** 輪郭と食い違う細部を 1 行ずつ返す。 空なら全て揃っている */
function 食い違い(見出し: string, 値: 測った値): string[] {
  const 行: string[] = [];
  const { 輪郭 } = 値;
  for (const 細部 of 値.細部) {
    const 先頭 = `${見出し} ${細部.種} <${細部.tag}>`;
    if (細部.種 === "点") {
      if (細部.fill !== 輪郭.stroke) 行.push(`${先頭} 塗り ${細部.fill} ≠ 輪郭の線 ${輪郭.stroke}`);
      continue;
    }
    if (細部.stroke !== 輪郭.stroke) 行.push(`${先頭} 線 ${細部.stroke} ≠ 輪郭 ${輪郭.stroke}`);
    if (細部.width !== 輪郭.width) 行.push(`${先頭} 幅 ${細部.width} ≠ 輪郭 ${輪郭.width}`);
    if (細部.種 === "線" && 細部.fill !== "none") 行.push(`${先頭} 塗り ${細部.fill} ≠ none`);
    if (細部.種 === "面" && 細部.fill !== 輪郭.fill) 行.push(`${先頭} 塗り ${細部.fill} ≠ 輪郭 ${輪郭.fill}`);
  }
  return 行;
}

test.describe("基本の形の細部は輪郭と同じ色と幅で描く (#2954)", () => {
  test("見本帳の形の見本の全てで、3 通りの状態とも細部が輪郭に揃う", async ({ page }) => {
    await page.goto(対象);
    await page.waitForLoadState("networkidle");
    const ids = await page
      .locator('.catalog-list-item[data-item-id^="shape-"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-item-id") ?? ""));
    expect(ids.length).toBeGreaterThan(0);

    const 行: string[] = [];
    const 見た種 = new Set<string>();
    for (const id of ids) {
      await 見本を開く(page, id);
      for (const 状態 of 状態たち) {
        const 値 = await 測る(page, id, 状態);
        for (const 細部 of 値.細部) 見た種.add(細部.種);
        行.push(...食い違い(`${id} ${状態}`, 値));
      }
    }
    // 3 種とも在る見本を通したことを確かめる = 細部を 1 つも測らずに通る形を防ぐ
    expect([...見た種].sort()).toEqual(["点", "線", "面"].sort());
    expect(行).toEqual([]);
  });

  test("色味の全てと明暗で、細部が輪郭に揃う", async ({ page }) => {
    test.setTimeout(180000);
    await page.goto(対象);
    await page.waitForLoadState("networkidle");
    const 色味 = page.getByRole("combobox", { name: "図の色味" });
    const 値たち = await 色味.locator("option").evaluateAll((els) =>
      els.map((e) => (e as HTMLOptionElement).value),
    );
    expect(値たち.length).toBeGreaterThan(1);

    // 線と点を持つ棚、面と線を持つ円柱、奥の面を持つ重なり。 3 つで細部の 3 種を覆う
    const 見本たち = ["shape-server-rack", "shape-cylinder", "shape-stack"];
    const 行: string[] = [];
    const 見た種 = new Set<string>();
    for (const 値 of 値たち) {
      await 色味.selectOption(値);
      for (const 暗い of [false, true]) {
        await page.evaluate((暗い) => document.documentElement.classList.toggle("dark", 暗い), 暗い);
        for (const id of 見本たち) {
          await 見本を開く(page, id);
          for (const 状態 of 状態たち) {
            const 測定 = await 測る(page, id, 状態);
            for (const 細部 of 測定.細部) 見た種.add(細部.種);
            行.push(...食い違い(`${値 || "画面の色"} ${暗い ? "暗" : "明"} ${id} ${状態}`, 測定));
          }
        }
      }
    }
    expect([...見た種].sort()).toEqual(["点", "線", "面"].sort());
    expect(行).toEqual([]);
  });
});
