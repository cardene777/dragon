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

test("next: editor page", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/editor", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/next-editor.png", fullPage: true });
});

test("next: docs page", async ({ page }) => {
  await page.goto(BASE + "/docs", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-docs.png", fullPage: true });
});

test("next: modal click open", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/?theme=handdrawn", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.locator('article button[aria-label*="拡大"]').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/next-modal-handdrawn.png" });
});

test("next: dark mode neumorphism", async ({ page }) => {
  await page.goto(BASE + "/?theme=neumorphism", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("dragon-color-mode", "dark");
    document.documentElement.classList.add("dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-dark-neumorphism.png", fullPage: true });
});

test("next: dark mode handdrawn", async ({ page }) => {
  await page.goto(BASE + "/?theme=handdrawn", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("dragon-color-mode", "dark");
    document.documentElement.classList.add("dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-dark-handdrawn.png", fullPage: true });
});

test("next: dark mode circuit", async ({ page }) => {
  await page.goto(BASE + "/?theme=circuit", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("dragon-color-mode", "dark");
    document.documentElement.classList.add("dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-dark-circuit.png", fullPage: true });
});

test("next: topology zoom", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/?theme=neumorphism", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const topology = page.locator('article').filter({ hasText: 'topology' }).first();
  await topology.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await topology.screenshot({ path: "test-results/next-topology-zoom.png" });
});

test("next: flowchart zoom", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/?theme=blueprint", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const flowchart = page.locator('article').filter({ hasText: 'flowchart' }).first();
  await flowchart.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await flowchart.screenshot({ path: "test-results/next-flowchart-zoom.png" });
});

test("next: mobile view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/?theme=neumorphism", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-mobile-neumorphism.png", fullPage: true });
});

test("next: modal ESC close", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/?theme=neumorphism", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.locator('article button[aria-label*="拡大"]').first().click();
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const isClosed = await page.evaluate(() => document.querySelector('[role="dialog"]') === null);
  console.log("Modal closed after ESC:", isClosed);
});

test("next: keyboard help modal", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/?theme=neumorphism", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.keyboard.press("?");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/next-help-modal.png" });
  // ESC close
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const isClosed = await page.evaluate(() => document.querySelector('[role="dialog"]') === null);
  console.log("Help modal closed:", isClosed);
});

test("next: keyboard theme cycle", async ({ page }) => {
  await page.goto(BASE + "/?theme=neumorphism", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.keyboard.press("t");
  await page.waitForTimeout(300);
  const themeAttr = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  console.log("After 't' press, theme:", themeAttr);
});

test("next: modal arrow nav", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/?theme=neumorphism", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.locator('article button[aria-label*="拡大"]').first().click();
  await page.waitForTimeout(500);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/next-modal-arrow-nav.png" });
});

test("next: preset permalink page", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(BASE + "/preset/topology?theme=circuit", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/next-permalink-topology.png", fullPage: true });
});
