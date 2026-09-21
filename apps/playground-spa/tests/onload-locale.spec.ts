import { test, expect } from "@playwright/test";

import { 画面の経路 } from "./app-routes";
import { PRESETS } from "../src/lib/presets";

/**
 * 英語で開いた時に、画面に残る日本語の件数を画面ごとに固定する (#2449)。
 *
 * 帯の右の切替は画面ぜんぶの言語が変わるように見えるが、実際に変わるのは概要と
 * 見つからない頁の 2 画面だけだった。 それを見る検査 (`pages-i18n.spec.ts`) が
 * `/` の 4 区画と見つからない頁しか開いていないので、残り 7 画面は無検査だった。
 *
 * ## 訳す作業はここでしない
 *
 * ここは歯止め。 訳した分だけ下の表の値が下がり、訳さずに日本語を足せば上がる。
 * 画面ごとの訳は別 Issue で下げる。
 *
 * ## 上限ではなく一致で見る
 *
 * 上限にすると、訳した後に値を下げ忘れても緑のままになる。
 * この repo は既に同じ形の歯止めを持つ (`src/lib/screen-words.test.ts` のカタカナの天井)。
 *
 * ## 経路は実装から導く
 *
 * `main.tsx` の `<Route>` を読む。 手で並べると画面が増えた時に黙って対象から外れる。
 *
 * ## 字が 1 つでも日本語なら、その塊は日本語として数える
 *
 * 判定は 1 つの塊 (text node) の中に日本語の字が 1 つでもあるか。 塊の全部が日本語である
 * 必要はない。 訳したつもりの塊に片仮名の中黒 (`・` = `U+30FB`) を残すと、残りが全部
 * 英字でも日本語として数える (`Script_Extensions` が片仮名を含むため)。
 *
 * 区切りに使うなら中黒 (`U+00B7`) か `-` を選ぶ。 この違いで 20 分溶かした。
 */

/** 経路の `:欄` に入れる値。 経路に出る欄が増えると下の突き合わせが落ちる */
const 欄の値: Record<string, string> = {
  ":slug": "primitives",
  ":id": PRESETS[0]!.slug,
  ":filename": "diagram.yaml",
};

/** 当たらなかった時の受け皿を開く時の path。 見つからない頁が出る */
const 受け皿を開く先 = "__no_such_page__";

/** 開発時にしか繋がらない経路。 公開ビルドには無い */
const 開かない経路 = new Set(["/__render"]);

/**
 * 英語で開いた時に残る日本語の件数。
 *
 * **実測値と一致することを見る**。 訳したら下げる、日本語を足したら上げる。
 * 0 になった画面はその画面の訳が終わったことを表す。
 */
const 日本語の残り: Record<string, number> = {
  "/": 12,
  "/catalog": 51,
  "/catalog/:slug": 28,
  "/editor": 55,
  "/editor/:filename": 35,
  "/docs": 62,
  "/preset/:id": 15,
  "/release-notes": 17,
  "/contribute": 26,
  "*": 0,
};

const 対象の経路 = 画面の経路().filter((p) => !開かない経路.has(p));

test("経路と表がずれていない (検査の空振り検知)", () => {
  expect(対象の経路.length, "main.tsx から経路を 1 つも読めていない").toBeGreaterThan(0);
  expect(
    [...対象の経路].sort(),
    "経路と、日本語の残りの表がずれている (表を直す)",
  ).toEqual(Object.keys(日本語の残り).sort());

  const 使う欄 = new Set(
    対象の経路.flatMap((p) => p.split("/").filter((x) => x.startsWith(":"))),
  );
  expect([...使う欄].sort(), "経路に出る欄と、入れる値の表がずれている").toEqual(
    Object.keys(欄の値).sort(),
  );
});

test("訳し終えた画面が 1 つ以上ある (歯止めが 0 を出せることの確認)", () => {
  const 訳し終えた = Object.entries(日本語の残り).filter(([, n]) => n === 0);
  expect(訳し終えた.length, "0 件の画面が 1 つも無い = 0 に届く形か確かめられない").toBeGreaterThan(0);
});

for (const 経路 of 対象の経路) {
  const 開く先 =
    経路 === "*"
      ? 受け皿を開く先
      : 経路
          .split("/")
          .map((x) => (x.startsWith(":") ? 欄の値[x]! : x))
          .join("/")
          .replace(/^\//u, "");

  test(`${経路} を英語で開いた時に残る日本語`, async ({ page }) => {
    await page.goto(`${開く先}?lang=en`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const 字 = await page.evaluate(() => {
      const root = document.body;
      const out: string[] = [];
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walk.nextNode())) {
        const t = (n.textContent ?? "").trim();
        if (!t) continue;
        // 記法の見本は日本語で書かれており、訳す対象ではない
        if (n.parentElement?.closest("pre")) continue;
        // 図の中の字も別の話 (図そのものの訳)
        if (n.parentElement?.closest("[data-cdl-diagram]")) continue;
        out.push(t);
      }
      return out;
    });

    // 空振り防止。 字が 1 つも取れていないなら、件数の一致は何も言っていない
    expect(字.length, "画面から字を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);

    const 日本語 =
      /[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]/u;
    const 残り = 字.filter((t) => 日本語.test(t));
    expect(
      残り.length,
      `英語で開いた時に残る日本語が表と合わない。 例: ${残り.slice(0, 5).join(" / ").slice(0, 200)}`,
    ).toBe(日本語の残り[経路]);
  });
}
