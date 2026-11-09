import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { testLimitMs } from "./test-support/limits";

export default defineConfig({
  // playground-spa の `@/` を vite / tsconfig と同じ場所に向ける。
  // 揃えていないと、 型だけの import は通るのに実体を呼ぶ test が「package が無い」 で落ちる。
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/playground-spa/src", import.meta.url)),
    },
  },
  test: {
    // 検査が作る一時フォルダは実行ごとの 1 つへまとめ、終わりに丸ごと消す (`run-tmp.ts`、#3587)。後の準備の段の一時フォルダも入るので最初に置く
    // test は `@cardenelabs/dragon` を package として import する = `dist` を読む。
    // `pnpm test` に build は含まれていないため、 古い `dist` が残っていると
    // src を壊しても通ってしまう。 走らせる前に検知する (#979)。
    // 1 回の実行は 5 分で止める (`run-limit.ts`、#3381)。見本帳の頁は要る時に 1 回の実行で 1 度だけ build する (`site-setup.ts`、#3381)
    // npm に出す file の一覧は 1 回の実行で 1 度だけ `npm pack --dry-run` で出す (`pack-setup.ts`、#3410)
    globalSetup: ["./test-support/run-tmp.ts", "./test-support/global-setup.ts", "./test-support/run-limit.ts", "./apps/playground-spa/src/lib/site-setup.ts", "./test-support/pack-setup.ts"],
    /*
     * 1 件の検査とその前後処理は 10 秒で止める (#3381)。上限の値と、下げる環境変数は `test-support/limits.ts` が持つ。
     *
     * 長く待つ形 (検査 30 秒、前後処理 90 秒、#2087、#3300) は、機械が混んだ時に重い検査が落ちないためだった。
     * 長く待つと、遅い検査も止まった検査も待つ人が気付かないまま残り、一式が課題ごとに数十分かかった。
     * 遅い検査は外すか速くし、止まった検査は 10 秒で名前と共に見せる。
     * 検査が自分で書いた上限もこれより長くは待たない (`test-support/test-limit-guard.ts`)。
     */
    testTimeout: testLimitMs(),
    hookTimeout: testLimitMs(),
    setupFiles: ["./test-support/test-limit-guard.ts"],
    /*
     * 同時に動かす数は 4 に留める (#3268)。
     *
     * 一式の所要時間の大半は Chromium で画面を開く検査で、CPU を奪い合うと数を増やしても速くならない。
     * 実測 = 12 コアの機械で既定と 4 を交互に 3 回ずつ回すと、平均 336 秒に対して 4 は 286 秒で、3 組とも 4 が短い。
     * 落ちた検査は既定も 4 も 0 件で、機械が混むと落ちる形が直ったとは言えない。
     */
    maxWorkers: 4,
    include: [
      "packages/**/test/**/*.test.ts",
      "packages/**/test/**/*.test.tsx",
      // apps/ 側 (playground-spa) の canvas pivot interaction unit test を対象化
      "apps/**/src/**/*.test.ts",
      "apps/**/src/**/*.test.tsx",
    ],
    // bench.test.ts は bench() のみ含み regular test mode で `bench is only available in benchmark mode` を起こすため除外。
    exclude: [
      "**/node_modules/**",
      "**/test/bench.test.ts",
    ],
    /*
     * 既定は node。 画面の部品を要る検査は、file 冒頭に `// @vitest-environment jsdom` を書く (#2089)。
     *
     * ここで glob と環境の対応表 (`environmentMatchGlobs`) を持っていたが、今の vitest はこの指定を
     * 読まない。 実測 = vitest 4.1.11 の配布物に字が 1 つも無く、当たるはずの検査の実行時間の
     * `environment` が 0ms だった (jsdom を組み立てていない)。
     *
     * file 冒頭に書く形を採るのは、要る検査だけが jsdom を組み立てるため。
     */
    environment: "node",
    globals: false,
    /*
     * 速さの計測は `test/bench.test.ts` 1 file に集める (この repo の決まり)。
     * bench mode が既定で見るのは `*.bench.*` と `*.benchmark.*` だけなので、明示で上書きする。
     *
     * **先頭を `packages/` で留める** (#2248)。 repo の中には checkout の写しが置かれうる
     * (Claude Code が subagent 用に作る作業場所 `.claude/worktrees/` の下など)。
     * どこからでも当たる形にすると、その写しの計測まで拾う。
     * #2248 では、当時入っていた変異試験の道具が残した作業用 dir の写しを 10 件拾い、
     * そのどれもが package を解決できずに落ちて、実際の計測は出ているのに走り終わりが失敗で返った。
     * 検査の側 (`include`) が最初から `packages/` で留めており、そちらは巻き込まれていない。
     */
    benchmark: {
      include: ["packages/**/test/bench.test.ts"],
    },
  },
});
