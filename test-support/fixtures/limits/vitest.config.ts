/**
 * 時間の上限の検査 (`packages/dragon/test/test-limits.test.ts`) が起こす、上限を超える見本の検査だけを回す設定 (#3381)。
 *
 * repo の設定をそのまま使い、検査の file の当て先だけをこの dir の `*.fixture.ts` に替える。
 * 上限と準備の段は repo の設定のものが効くので、repo の設定の上限がどう働くかを確かめられる。
 * 当て先は足さずに置き換える (`mergeConfig` は配列をつなぐので、repo の検査まで回ってしまう)。
 */
import { defineConfig } from "vitest/config";
import base from "../../../vitest.config";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["test-support/fixtures/limits/*.fixture.ts"],
  },
});
