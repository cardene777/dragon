import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: [
      "packages/**/test/**/*.test.ts",
      "packages/**/test/**/*.test.tsx",
      // CAR-1678 = apps/playground-spa/src/lib/__tests__/ 配下の unit test を追加、
      // Playwright e2e (`tests/*.spec.ts`) とは拡張子で分離済 (.test.ts vs .spec.ts)。
      "apps/**/__tests__/**/*.test.ts",
      "apps/**/__tests__/**/*.test.tsx",
    ],
    // bench.test.ts は bench() のみ含み regular test mode で `bench is only available in benchmark mode` を起こすため除外。
    exclude: ["**/node_modules/**", "**/test/bench.test.ts"],
    environment: "node",
    globals: false,
    environmentMatchGlobs: [
      ["packages/**/test/**/*.test.tsx", "jsdom"],
      ["apps/**/__tests__/**/*.test.tsx", "jsdom"],
    ],
    // bench mode default include は **/*.{bench,benchmark}.* のみ。
    // chainome は test/bench.test.ts に bench を集約する規約のため明示 override。
    benchmark: {
      include: ["**/test/bench.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "apps/playground-spa/src"),
    },
  },
});
