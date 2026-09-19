import { test, expect } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { bundleFreshnessProblem, staleBundles } from "../../../test-support/dep-bundle-freshness";
import {
  画面の題,
  相手の問題,
  相手を見分ける,
  頁を引く,
} from "../../../test-support/dev-server-identity";
import { DEV_URL } from "../ports";

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
 *
 * ## 束ねの古さだけでは足りない (#2295)
 *
 * 束ねは **disk の記録** で、相手の server に 1 度も触らない。 そのため `DEV_URL` に
 * 別の画面が居ても、そもそも何も居なくても、この関門は通る。
 * 実測 = その port を別のリポジトリの preview が押さえており、関門が通ったうえで 3 件が
 * 15 秒ずつ「要素が現れない」 とだけ言って落ちた。 #1998 が消した読めない落ち方が、
 * 別の原因で戻っていた。
 *
 * 相手を 1 回引いて、名乗る題が `index.html` と同じかを先に見る。
 * 見る順は **相手 → 束ね**。 相手が居ないなら束ねの新しさは意味を持たない。
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/**
 * `dev` project が実際に見に行く先。
 *
 * **`test.info().project.use.baseURL` は使えない** = この検査は `dev-setup` project に
 * 属していて、そちらの見に行く先は本番 build の側。 `playwright.config.ts` の `dev` と
 * 同じ式をここでも書く。
 */
const 開発serverのURL = process.env.DEV_SPA_URL ?? DEV_URL;

test("開発 server に dragon の画面が居る", async () => {
  const 期待 = 画面の題(ROOT);
  const 相手 = 相手を見分ける(期待, await 頁を引く(開発serverのURL));
  const 問題 = 相手の問題(開発serverのURL, 相手);
  test.info().annotations.push({ type: "相手", description: `${開発serverのURL} → ${相手.種類}` });
  expect(
    問題,
    問題 === null
      ? ""
      : `${問題}\n\n` +
          `この検査だけを外すなら --project default を付ける (開発 server を見る検査は走らない)。`,
  ).toBeNull();
});

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
