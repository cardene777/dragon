import { test, expect } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { bundleFreshnessProblem, staleBundles } from "../../../test-support/dep-bundle-freshness";

/**
 * 開発 server を見る検査の前に、その server が配る束ねが古くないかを見る (#1998)。
 *
 * ## 何が起きたか
 *
 * 描画側の版を上げた後も、立てっぱなしの開発 server は起動時に抱えた束ねを配り続ける。
 * `/__render` が描かれず、`row-bounds-offset` の 3 件が `waiting for locator(...)` の時間切れで
 * 落ちた。 実測 = 束ねの記録は 9/13 に作られた `cdl@0.63.0` で、入っていたのは `0.64.1` だった。
 *
 * 落ち方は「要素が現れない」 としか読めないため、頁が壊れたのか server が古いのかが分からない。
 * vitest の前処理は同じ古さを既に見ていて (`test-support/global-setup.ts`)、直し方まで出す。
 * 画面の検査には同じ関門が無かった。
 *
 * ## 置き方
 *
 * 独立した project (`dev-setup`) にして `dev` の `dependencies` に置く。
 * ここが落ちると `dev` の検査は走らずに飛ばされる = 3 件の時間切れを待たずに済む。
 *
 * `default` (本番 build を配る側) は対象にしない。 build のたびに束ね直すので古くならない。
 *
 * ## 束ねが無い形では止めない
 *
 * 開発 server を 1 度も立てていない環境では束ねが無い。 見られなかったことを「古い」 に倒すと
 * 初回に必ず止まるため、`bundleFreshnessProblem` は `null` を返す。
 * 代わりに見た件数を記録に残し、0 件で通った回を後から読めるようにする。
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("開発 server が配る束ねが、いま入っている依存と同じ", () => {
  const 問題 = bundleFreshnessProblem(ROOT);
  const { 見た, 見られなかった } = staleBundles(ROOT);
  test.info().annotations.push({
    type: "束ね",
    description: `見た ${見た} 件 / 見られなかった ${見られなかった} 件`,
  });
  expect(
    問題,
    問題 === null
      ? ""
      : `開発 server が古い束ねを配っている。\n\n${問題}\n\n` +
        `この検査だけを外すなら --project default を付ける (開発 server を見る検査は走らない)。`,
  ).toBeNull();
});
