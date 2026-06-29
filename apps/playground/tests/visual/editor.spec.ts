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
    await page.waitForSelector(".cdl-editor-textarea", { timeout: 10_000 });
    await page.waitForSelector(".cdl-editor-preview svg", { timeout: 10_000 });
    // CdlEditor の textarea は時間で hydrate されるため十分待つ
    await page.waitForTimeout(1500);
    const editorPreview = page.locator(".cdl-editor-preview").first();
    await expect(editorPreview).toHaveScreenshot("editor-preview.png", {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
});
