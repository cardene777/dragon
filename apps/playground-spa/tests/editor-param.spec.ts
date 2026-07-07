import { test, expect } from "@playwright/test";

test("editor #preset=<id> loads catalog item", async ({ page }) => {
  await page.goto("/editor#preset=kind-actor", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await expect(page.locator("text=PRIMITIVES")).toBeVisible();
});
