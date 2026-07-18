import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
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
    environment: "node",
    globals: false,
    environmentMatchGlobs: [
      ["packages/**/test/**/*.test.tsx", "jsdom"],
      // apps/ 側 DOM helper (document.createElement 等) 使う test は jsdom を強制
      ["apps/**/src/**/*.test.ts", "jsdom"],
      ["apps/**/src/**/*.test.tsx", "jsdom"],
    ],
    // bench mode default include は **/*.{bench,benchmark}.* のみ。
    // chainome は test/bench.test.ts に bench を集約する規約のため明示 override。
    benchmark: {
      include: ["**/test/bench.test.ts"],
    },
  },
});
