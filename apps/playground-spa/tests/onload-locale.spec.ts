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
 * 必要はない。 訳したつもりの塊に中黒を残すと、残りが全部英字でも日本語として数える。
 *
 * **中黒は 2 つとも数えられる**。 実測 (この画面を描く browser 上)。
 *
 * | 字 | 符号位置 | 日本語として数えるか |
 * |---|---|---|
 * | `・` | `U+30FB` | する |
 * | `·` | `U+00B7` | **する** |
 * | `•` | `U+2022` | しない |
 * | `—` | `U+2014` | しない |
 * | `-` | `U+002D` | しない |
 *
 * `U+00B7` は片仮名の中黒の代わりに使われるため `Script_Extensions` に片仮名を含む。
 * 英語の側の区切りには `•` か `—` か `-` を選ぶ。
 *
 * **`node -e` で確かめない**。 手元の `node` は `U+00B7` を数えないと答えた (`false`)。
 * 判定するのは画面を描く browser なので、確かめるなら browser 上で確かめる。
 *
 * ## 分類の画面は開く分類で残り方が違う
 *
 * 表が見るのは `primitives` の 1 つ (`欄の値` が決める)。 他の分類には図の段の題と
 * 見せ方の札が残る (#2461 / #2460)。 表の 0 は「この 1 分類で 0」 であって
 * 「全分類で 0」 ではない。
 *
 * ## `/preset/:id` の 1 件は図が持つ段の題
 *
 * 見本の詳細に残る 1 件は、図の段の題 (`phases[].title`) を図の外の札として出したもの (#2455)。
 * 題は見本の記法 (`topics/catalog/presets.cdl.ts`) が持つ図の中の字で、カタログの一覧にも
 * 同じ字が出る。 2 画面で同じ出どころを直すことになるため #2461 に寄せた。
 *
 * ## `/editor` の 1 件は記法の engine が出す字
 *
 * 編集画面に残る 1 件は、走査の engine (`@cardenelabs/cdl`) が返す指摘の本文で、この repo に
 * 実体が無い (#2454)。 本文には見本の記法に書かれた題も入るため、engine を英語にしても
 * 日本語の題は残る。 0 にするには engine 側と見本の記法の両方が要る。
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
  "/": 0,
  "/catalog": 0,
  "/catalog/:slug": 0,
  "/editor": 1,
  "/editor/:filename": 0,
  "/docs": 0,
  "/preset/:id": 1,
  "/release-notes": 0,
  "/contribute": 0,
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
        // 記法の見本は日本語で書かれており、訳す対象ではない。
        // **記法が出る所は 2 つある** (#2454)。 見せるだけの所は `<pre>`、書き換えられる所は
        // 編集画面の本文の欄で、こちらは `<pre>` を使わない。 同じ「記法の見本」 なので同じく外す
        if (n.parentElement?.closest("pre")) continue;
        if (n.parentElement?.closest(".v4-editor-code-body")) continue;
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
