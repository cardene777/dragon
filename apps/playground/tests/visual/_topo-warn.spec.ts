import { test } from "@playwright/test";
test.use({ viewport: { width: 1600, height: 1000 } });
test("warn on bad offset", async ({ page }) => {
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.evaluate(() => { localStorage.clear(); window.location.hash = ""; localStorage.setItem("v4-theme", "dark"); });
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  // 悪い DSL を貼付け ... label を極端に離す labelOffsetY で proximity warn を発火
  const bad = `title: "テスト"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "call" { labelOffsetY: 400 }
animation:
  - step: "s1" 1.4s
    focus: [A, B, "A -> B"]`;
  // CodeMirror content にセット
  const cm = page.locator(".cm-content").first();
  await cm.click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.type(bad);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/warn.png", fullPage: false });
});
