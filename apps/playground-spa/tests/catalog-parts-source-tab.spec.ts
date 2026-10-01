/**
 * 基本パーツの見本でコードのタブが押せることの検査 (#1381)。
 *
 * ここに並ぶのは箱の中の図形と、値を見せる部品を組み合わせた「使い回す部品」 で、記法に
 * 3 つ足りなかったため 1 件も記法を持てなかった (部品の種類が 9 種しか無い / 場所だけを
 * 空ける見えない箱を書けない / 名前と題を切り離せない)。
 *
 * 記法と組み立て API が同じ図になることは `src/lib/catalog-source-parity.test.tsx` が見る。
 * ここでは **画面から読めるか** を見る。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test catalog-parts-source-tab`
 */
import { test, expect } from "@playwright/test";
import * as parts from "../src/topics/catalog/parts.cdl";
import * as partsInBox from "../src/topics/catalog/parts-in-box.cdl";
import * as partsMotion from "../src/topics/catalog/parts-motion.cdl";
import { moduleToItems } from "../src/lib/catalog-items";
import { 一覧の行 } from "./catalog-item-pick";
import { 一覧が落ち着くまで待つ } from "./wait-for-render";

type Page = import("@playwright/test").Page;

/**
 * 部品の頁に並ぶ件数。 **一覧の実体から導く** (#2762)。
 *
 * 頁は 3 つの群を 1 つの一覧に並べる (`parts` / `parts-in-box` / `parts-motion`)。
 * 件数を手で書くと、群に図を足した日にずれる。
 *
 * **数えるのは頁が一覧を組む関数に通した結果**。 群の export をそのまま数えると合わない =
 * 切替を持つ見本は複数の図を export して 1 行に並ぶので、export を数えると 148 件になる
 * (画面は 112 行)。 `moduleToItems` は `loadPartsItems` が頁のために呼ぶ関数そのもの。
 *
 * 画面で数えた件数と一致することは下の検査が見る = 導いた数が実際の一覧と違ったら落ちる。
 */
const 並ぶ件数 = [parts, partsInBox, partsMotion].reduce(
  (n, mod) => n + moduleToItems(mod).length,
  0,
);

/**
 * 1 件の検査が押す回数 (#2762)。
 *
 * 持ち時間は 1 件の単位で与えられるので、1 件に詰め込む回数を増やすと 1 回あたりの余裕が
 * その数で割られる。 一覧の全 112 行を 1 件で押していた時は 1 回あたり 0.54 秒しかなく、
 * 検査一式の中で 60 秒を超えた (実測 = 単独なら 5.8 秒、一式では 57 件目の押す操作で止まる)。
 *
 * 10 回に区切ると 1 回あたり 6 秒になる。 同じ形は #2757 が 1 度目 (5 画面 × 写し 2 枚を
 * 1 件に詰め込んで 20.8 秒かかっていた)。
 */
const 一度に押す回数 = 10;

async function 開く(page: Page, 名前: string): Promise<void> {
  await page.goto("catalog/parts", { waitUntil: "networkidle" });
  // 一覧が組み終わる前に押すと、押す側が要素の動きを待ち続けて 30 秒で落ちる (#2488)
  await 一覧が落ち着くまで待つ(page, "部品");
  await 一覧の行(page, 名前, false).click();
  await page.waitForTimeout(300);
}

test.describe("基本パーツで記法が読める (#1381)", () => {
  test("組の並びを取る部品と、見えない箱が記法に出る", async ({ page }) => {
    await 開く(page, "parts-status-dot");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml.length, "yaml が空 (検査が空振りしている)").toBeGreaterThan(50);
    expect(yaml, "値を見せる部品が出ていない").toContain("readouts:");
    expect(yaml, "#1381 で足した部品が出ていない").toContain("kind: status-dot");
    expect(yaml, "組の並びが出ていない").toContain('map: [{ value: "online"');
    expect(yaml, "出す条件が出ていない").toContain('visibleIf: "0"');
    expect(yaml, "空の題が出ていない").toContain('title: ""');

    await page.getByRole("tab", { name: "json" }).click();
    await page.waitForTimeout(300);
    const json = await page.locator(".catalog-source-code").first().innerText();
    const 読んだ = JSON.parse(json) as {
      readouts?: { kind?: string; map?: unknown[] }[];
      actors?: { visibleIf?: string; title?: string }[];
    };
    expect(
      (読んだ.readouts ?? []).map((r) => r.kind),
      "json に #1381 で足した部品が無い",
    ).toContain("status-dot");
    expect((読んだ.readouts ?? [])[0]?.map, "json に組の並びが無い").toHaveLength(3);
    expect(
      (読んだ.actors ?? []).map((a) => a.visibleIf),
      "json に出す条件が無い",
    ).toContain("0");
  });

  test("箱の中の図形を持つ見本でも押せる", async ({ page }) => {
    // 部品を使う見本と、図形を使う見本では拾い方が違う
    await 開く(page, "parts-wave-gauge");

    const タブ = page.getByRole("tab", { name: "コード" });
    await expect(タブ, "コードのタブが押せない").toBeEnabled();
    await タブ.click();
    await page.waitForTimeout(300);

    const yaml = await page.locator(".catalog-source-code").first().innerText();
    expect(yaml, "箱の中の図形が出ていない").toContain("shape: { kind: wave");
    expect(yaml, "図形の水位が状態を指していない").toContain('level: "{lv}"');
  });

  test("同じ題の箱を並べる見本で、名前と題が分かれて出る", async ({ page }) => {
    // 名前は 1 つに決まる必要があり、題は重なってよい。 分かれていないと 5 つの箱が 1 つに潰れる
    await 開く(page, "parts-rating-stars");

    await page.getByRole("tab", { name: "コード" }).click();
    await page.waitForTimeout(300);
    const yaml = await page.locator(".catalog-source-code").first().innerText();
    const 題の数 = [...yaml.matchAll(/title: "★"/g)].length;
    expect(題の数, "同じ題の箱が並んでいない").toBeGreaterThan(1);
  });

  // 全件を押す。 1 件の検査に詰め込まず、区切って分ける (#2762、`一度に押す回数` を参照)。
  // 区切りの数は一覧の実体から導くので、群に図を足した日に自動で追従する
  for (let 始まり = 0; 始まり < 並ぶ件数; 始まり += 一度に押す回数) {
    const 終わり = Math.min(始まり + 一度に押す回数, 並ぶ件数);
    test(`${始まり + 1} 件目から ${終わり} 件目でコードのタブが押せる`, async ({ page }) => {
      await page.goto("catalog/parts", { waitUntil: "networkidle" });
      await 一覧が落ち着くまで待つ(page, "部品");

      const 行 = page.locator("aside.catalog-sidebar .catalog-list-item");
      const 件数 = await 行.count();
      // 導いた数と画面の数が違ったら落とす。 違うまま進むと、押す範囲が一覧より狭くなる
      expect(件数, `一覧の行が ${並ぶ件数} 件でない (実体から導いた数と画面が食い違う)`).toBe(並ぶ件数);

      const タブ = page.getByRole("tab", { name: "コード" });
      for (let i = 始まり; i < 終わり; i++) {
        await 行.nth(i).click();
        await expect(タブ, `${i + 1} 件目でコードのタブが押せない`).toBeEnabled({ timeout: 5000 });
      }
    });
  }
});
