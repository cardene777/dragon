import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // playground-spa の `@/` を vite / tsconfig と同じ場所に向ける。
  // 揃えていないと、 型だけの import は通るのに実体を呼ぶ test が「package が無い」 で落ちる。
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/playground-spa/src", import.meta.url)),
    },
  },
  test: {
    // test は `@cardenelabs/dragon` / `@cardenelabs/cdl` を package として import する = どちらも
    // `dist` を読む。 `pnpm test` に build は含まれていないため、 古い `dist` が残っていると
    // src を壊しても通ってしまう。 走らせる前に検知する (#979)。
    globalSetup: ["./test-support/global-setup.ts"],
    /*
     * 待ち時間は既定より長くする (#2087)。
     *
     * 既定は検査 5 秒 / 前後処理 10 秒。 実測 = 6 秒待つだけの検査は 5.01 秒で切られた。
     * この一式は 400 file 超を並列で回すので、機械が混むと重い検査 (`tsc` / `eslint` の起動、
     * 図の組み立て、描画) がその範囲に収まらない。 同じ commit で 3 回回した実測では、
     * 落ちた検査が 8 件 → 5 件 → 0 件と変わり、落ちた組も毎回違い、どれも単独では通った。
     *
     * **中身ではなく機械の混み具合で結果が決まる状態をやめる**。 30 秒は、落ちなかった回の
     * 最も遅い検査 (8.7 秒) の 3 倍強で、止まったまま返らない検査はこの時間で止まる。
     * 待つ長さではなく切る位置なので、全件の所要時間は延びない。
     */
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: [
      "packages/**/test/**/*.test.ts",
      "packages/**/test/**/*.test.tsx",
      // apps/ 側 (playground-spa) の canvas pivot interaction unit test を対象化
      "apps/**/src/**/*.test.ts",
      "apps/**/src/**/*.test.tsx",
    ],
    // bench.test.ts は bench() のみ含み regular test mode で `bench is only available in benchmark mode` を起こすため除外。
    // apps/playground-spa/tests/**/*.spec.ts は Playwright e2e 経路、 vitest v4 の default include
    // (`**/*.{test,spec}.?(c|m)[jt]s?(x)`) と merge されて拾われると
    // `Playwright Test did not expect test() to be called here` で崩れるため明示除外。
    exclude: [
      "**/node_modules/**",
      "**/test/bench.test.ts",
      "**/tests/**/*.spec.ts",
      "**/tests/**/*.spec.tsx",
    ],
    /*
     * 既定は node。 画面の部品を要る検査は、file 冒頭に `// @vitest-environment jsdom` を書く (#2089)。
     *
     * ここで glob と環境の対応表 (`environmentMatchGlobs`) を持っていたが、今の vitest はこの指定を
     * 読まない。 実測 = vitest 4.1.11 の配布物に字が 1 つも無く、当たるはずの検査
     * (`catalog-motion-render.test.tsx`) の実行時間の `environment` が 0ms だった (jsdom を組み立てていない)。
     * 対応表を消しても走る環境は 1 file も変わらない。
     *
     * file 冒頭に書く形を採るのは、要る検査だけが jsdom を組み立てるため。
     * 実測では素の `document` / `window` を使う 14 file が全て既にこの指定を持っていた。
     * 書き忘れは `packages/dragon/test/vitest-env-declared-per-file.test.ts` が落とす。
     */
    environment: "node",
    globals: false,
    // bench mode default include は **/*.{bench,benchmark}.* のみ。
    // chainome は test/bench.test.ts に bench を集約する規約のため明示 override。
    benchmark: {
      include: ["**/test/bench.test.ts"],
    },
  },
});
