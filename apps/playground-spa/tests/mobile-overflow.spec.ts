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
 * ## 経路は実装から導く (#2270)
 *
 * 初めは「router が持つ経路をすべて通す」 と書きながら、**手で並べた 10 本の配列**を見ていた。
 * `/editor/:filename` が抜けており、図を出す画面が 1 つも見られていなかった。
 * 気付いたのは `phone-diagram-legibility.spec.ts` (#2268) で、あちらは `main.tsx` から読む。
 *
 * ここも `画面の経路()` から読む。 欄 (`:slug` / `:id` / `:filename`) は分類とひな形の一覧で
 * 全件に広げるので、画面が増えても見本が増えても、追記を忘れて対象から外れることが無い。
 *
 * ## 「はみ出していない」 だけでは守れない
 *
 * 画面が真っ白でも横スクロールは 0 になる。 中身が実際に描かれていること (本文の文字数) を
 * 併せて見る。
 */
import { test, expect } from "@playwright/test";
import { 本文が出るまで待つ } from "./wait-for-render";

import { 画面の経路, 経路を広げる, 値を入れる節 } from "./app-routes";
import { CATEGORIES } from "../src/lib/catalog";
import { PRESETS } from "../src/lib/presets";

/**
 * 経路の欄に入れる値 (#2270)。
 *
 * 分類とひな形は **全件に広げる** = 中身によって幅の要求が変わるので、1 つ選ぶと残りが
 * 黙って対象から外れる。
 *
 * `*` は当たらなかった時の受け皿で、router が持つ経路。 検査の側で「存在しない path」 を
 * 思い付きで書かずに、受け皿へ落ちる値を 1 つ渡す。
 */
const 欄の値: Record<string, readonly string[]> = {
  ":slug": CATEGORIES.map((c) => c.slug),
  ":id": PRESETS.map((p) => p.slug),
  ":filename": ["diagram.yaml"],
  "*": ["does-not-exist"],
};

/** 開発時にしか繋がらない経路。 build 済の画面には route が無いので開けない */
const 開かない経路 = new Set(["/__render"]);

const 対象の経路 = 画面の経路().filter((p) => !開かない経路.has(p));
const 経路 = 対象の経路.flatMap((p) => 経路を広げる(p, 欄の値));

/**
 * test の名前と、落ちた時に出す画面の名前。
 *
 * 経路は base 相対で書くため、トップだけ空文字になる (#1438)。 そのまま出すと
 * 「幅 375px の  が横にはみ出さない」 のように、名前に穴が空く。
 */
const 画面名 = (path: string): string => path || "トップ";

/** 携帯の幅。 375 = iPhone SE / 390 = iPhone 14。 */
const 幅一覧 = [375, 390] as const;

test("経路を実装から読めている (空振り検知)", () => {
  expect(対象の経路.length, "main.tsx から経路を 1 つも読めていない").toBeGreaterThan(0);
  expect(経路.length, "広げた先の画面が 0 件").toBeGreaterThan(対象の経路.length);
  expect(PRESETS.length, "見本の一覧が空").toBeGreaterThan(0);
  expect(CATEGORIES.length, "分類の一覧が空").toBeGreaterThan(0);
  expect(
    値を入れる節(対象の経路).sort(),
    "経路に出る欄と、入れる値の表がずれている (表を直す)",
  ).toEqual(Object.keys(欄の値).sort());
  // 手で並べていた頃に抜けていた経路。 広げた先に居ることを名指しで押さえる (#2270)
  expect(経路, "図を出す編集画面が対象から外れている").toContain("editor/diagram.yaml");
});

test("広い画面のカードの並びは変わらない", async ({ page }) => {
  // 下限を `min()` で頭打ちにした時に、 広い画面の列数や幅が動いていないかを見る。
  // 実測値 = 1280px でカード 339px が 3 枚 / 1 行。
  // 作り直しの前は 598px の 2 行だった (#1110 で 3 枚が 1 行に収まる幅になった)。
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("contribute");
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

/** 本文が出たとみなす下限。 待つ側と判定する側で同じ値を使う */
const 本文の下限 = 20;

for (const 幅 of 幅一覧) {
  for (const path of 経路) {
    test(`幅 ${幅}px の ${画面名(path)} が横にはみ出さない`, async ({ page }) => {
      await page.setViewportSize({ width: 幅, height: 780 });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      // 固定の待ち時間だと一式実行の負荷で足りず、真っ白な画面を測る (#2458)
      await 本文が出るまで待つ(page, 画面名(path), 本文の下限);

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
      expect(m.文字数, `${画面名(path)} の本文が空 (検査が空振りしている)`).toBeGreaterThan(本文の下限);
      // 数 px の誤差は許容 (scrollbar 分)
      expect(
        m.はみ出し,
        `${画面名(path)} が ${m.はみ出し}px はみ出している: ${m.外.join(", ")}`,
      ).toBeLessThan(20);
    });
  }
}
