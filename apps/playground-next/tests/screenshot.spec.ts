import { test, expect } from "@playwright/test";

const BASE = "http://localhost:4322";

test.describe.configure({ mode: "serial" });

test("catalog page renders with cdl thumbnails", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const thumbnails = await page.locator('button[aria-label="拡大表示"]').count();
  expect(thumbnails).toBeGreaterThanOrEqual(20);
});

test("modal opens on preset click", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.locator('button[aria-label="拡大表示"]').first().click();
  await page.waitForTimeout(1000);
  const dialog = await page.evaluate(() => document.querySelector('[role="dialog"]'));
  expect(dialog).not.toBeNull();
});

test("modal closes on ESC", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.locator('button[aria-label="拡大表示"]').first().click();
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const dialog = await page.evaluate(() => document.querySelector('[role="dialog"]'));
  expect(dialog).toBeNull();
});

test("theme switch reflects to data-cdl-theme", async ({ page }) => {
  await page.goto(BASE + "/?theme=handdrawn", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const themeAttr = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(themeAttr).toBe("handdrawn");
});

test("editor page loads", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/editor", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const dropdown = await page.locator("select").count();
  expect(dropdown).toBeGreaterThan(0);
});

test("docs page loads", async ({ page }) => {
  await page.goto(BASE + "/docs", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await expect(page.locator("h1").first()).toContainText("Documentation");
});

test("compare page loads", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto(BASE + "/compare?preset=swimlane", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await expect(page.locator("h1").first()).toContainText("across 6 themes");
});

test("preset permalink loads", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/preset/topology", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await expect(page.locator("h1").first()).toContainText("topology");
});
