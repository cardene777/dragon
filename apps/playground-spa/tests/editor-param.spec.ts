import { test, expect } from "@playwright/test";

/**
 * editor #preset=<slug> = EDITOR_SAMPLES の slug field 経路 (`CdlEditor.tsx` § URL hash 処理)。
 * primitives catalog (`kind-actor` 等) は editor 対象外で、 editor は EDITOR_SAMPLES のみ受け付ける。
 * 本 test は「sample slug 一致で editor 内で該当 sample の label が bar に表示される」 経路を担保する。
 */
test("editor #preset=<slug> loads editor sample by slug", async ({ page }) => {
  await page.goto("editor#preset=sequence", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  // sequence slug の default sample = 「ログインAPI呼び出し」 (editor-samples.ts:20 first entry)
  // editor 上部 bar (`.v4-editor-bar-file` = `▲ {label}.dragon`) で label を verify
  const bar = page.locator(".v4-editor-bar-file").first();
  await expect(bar).toBeVisible();
  await expect(bar).toContainText(/ログインAPI|注文チェックアウト/);
});
