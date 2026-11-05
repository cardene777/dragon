/**
 * 頁を開く検査の Chromium の準備の段の検査 (`apps/playground-spa/src/lib/chromium-preload.test.ts`) が起こす、見本の検査だけを回す設定 (#3388)。
 *
 * repo の設定をそのまま使い、検査の file の当て先をこの dir の `*.fixture.ts` に替える。
 * 準備の段 (`setupFiles`) は repo の設定のものが効く。
 * 見本は見本帳の頁を開かないので、頁を build する準備の段 (`site-setup.ts`) は外す。
 */
import { defineConfig } from "vitest/config";
import base from "../../../vitest.config";

const globalSetup = (base.test?.globalSetup as string[]).filter((path) => !path.endsWith("site-setup.ts"));

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["test-support/fixtures/chromium/*.fixture.ts"],
    globalSetup,
  },
});
