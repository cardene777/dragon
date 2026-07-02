/**
 * Visual regression ... /editor (Visual Editor split view) の初期 render。
 *
 * tests/e2e/editor.spec.ts は機能テスト (textarea / sample / hash 復元)、
 * 本 file は preview pane の SVG 視覚 regression に特化。
 *
 * baseline 不一致 = editor layout / preview SVG / toolbar / sample button の崩れ。
 */
import { test, expect } from "@playwright/test";

test.describe("Visual regression - Editor (/editor)", () => {
  test("editor initial render SVG snapshot", async ({ page }) => {
    await page.goto("/editor", { waitUntil: "networkidle" });
    // Editor の preview SVG が出るまで待つ (default sample が auto render される)
    // v4 editor で class 名 refactor 済 (cdl-editor-* → v4-editor-*)
    await page.waitForSelector(".v4-editor-code", { timeout: 10_000 });
    await page.waitForSelector(".v4-editor-preview svg", { timeout: 10_000 });
    // hydration + initial render 完了を条件明示で待つ (waitForTimeout の任意 sleep 撤廃)
    await page.waitForFunction(
      () => {
        const svg = document.querySelector(".v4-editor-preview svg");
        if (!svg) return false;
        const nodes = svg.querySelectorAll("[data-cdl-node]");
        return nodes.length > 0;
      },
      undefined,
      { timeout: 10_000 },
    );
    await page.evaluate(() => document.fonts.ready);
    const editorPreview = page.locator(".v4-editor-preview").first();
    await expect(editorPreview).toHaveScreenshot("editor-preview.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});
