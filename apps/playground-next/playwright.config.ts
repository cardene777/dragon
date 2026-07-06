import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  use: { baseURL: "http://localhost:4322", trace: "on-first-retry" },
  workers: 1,
});
