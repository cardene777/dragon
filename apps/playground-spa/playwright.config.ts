import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: { baseURL: "http://localhost:4323", trace: "on-first-retry" },
  workers: 1,
});
