import { test } from "@playwright/test";

const BASE = "http://localhost:4322";

test.describe.configure({ mode: 'serial' });

test("next: neumorphism", async ({ page }) => {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-neumorphism.png", fullPage: true });
});

test("next: handdrawn", async ({ page }) => {
  await page.goto(BASE + "/?theme=handdrawn", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-handdrawn.png", fullPage: true });
});

test("next: handdrawn zoom", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/?theme=handdrawn", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const first = page.locator('article').first();
  await first.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await first.screenshot({ path: "test-results/next-handdrawn-first.png" });
});

test("next: blueprint", async ({ page }) => {
  await page.goto(BASE + "/?theme=blueprint", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-blueprint.png", fullPage: true });
});

test("next: circuit", async ({ page }) => {
  await page.goto(BASE + "/?theme=circuit", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-circuit.png", fullPage: true });
});

test("next: pinboard", async ({ page }) => {
  await page.goto(BASE + "/?theme=pinboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-pinboard.png", fullPage: true });
});

test("next: isometric", async ({ page }) => {
  await page.goto(BASE + "/?theme=isometric", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-isometric.png", fullPage: true });
});
