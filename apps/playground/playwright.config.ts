import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for @chainome/web (e2e + visual regression)。
 *
 * - testDir = tests/ ... tests/e2e (Tier B-1 fallback) と tests/visual (SVG pixel diff) の両方をホスト
 * - webServer = `pnpm preview` を 4321 port で立ち上げ
 * - browser = chromium (default のみ、 CI/cost 抑止)
 * - baseURL = http://localhost:4321
 * - viewport = 1400x900 (visual regression は固定 viewport で再現性確保)
 * - retries = 0、 visual snapshot diff は flaky でなく真の regression なので retry しない
 *
 * 起動 ... `pnpm --filter @chainome/web test:visual` (baseline 比較)
 * baseline 更新 ... `pnpm --filter @chainome/web test:visual:update`
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4321",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1400, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm preview --port 4321 --host 127.0.0.1",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
