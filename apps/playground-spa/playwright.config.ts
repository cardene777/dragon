import { defineConfig } from "@playwright/test";

/**
 * Playwright config。
 *
 * CAR-1983 = motion spec (`html-canvas-motion.spec.ts`) のみ video 常時録画 + slower timeout。
 * 他 spec は既存挙動維持 (trace on-first-retry のみ、 video 無)。 project 分けで overhead を motion spec に限定。
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: { baseURL: "http://localhost:4323", trace: "on-first-retry" },
  workers: 1,
  projects: [
    {
      name: "default",
      testIgnore: /html-canvas-motion\.spec\.ts$/,
      use: { baseURL: "http://localhost:4323", trace: "on-first-retry" },
    },
    {
      name: "motion",
      testMatch: /html-canvas-motion\.spec\.ts$/,
      timeout: 60000,
      use: {
        baseURL: "http://localhost:4323",
        trace: "on-first-retry",
        // video 常時録画 (WebM)、 viewport 内全描画を記録
        video: {
          mode: "on",
          size: { width: 1280, height: 720 },
        },
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
