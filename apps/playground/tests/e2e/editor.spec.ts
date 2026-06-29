import { test, expect } from "@playwright/test";

test.describe("Visual Editor /editor", () => {
  test("1. ページが load + デフォルトサンプルが preview される", async ({ page }) => {
    await page.goto("/editor");
    await page.waitForSelector(".cdl-editor-textarea");
    await page.waitForSelector(".cdl-editor-preview svg", { timeout: 5000 });
    const textarea = page.locator(".cdl-editor-textarea");
    expect(await textarea.inputValue()).toContain("title:");
  });

  test("2. textarea 入力 → 300ms 後 preview 更新", async ({ page }) => {
    await page.goto("/editor");
    await page.waitForSelector(".cdl-editor-textarea");
    const textarea = page.locator(".cdl-editor-textarea");
    await textarea.fill(`title: "Test"
type: sequence
actors:
  - X
  - Y
flow:
  - X -> Y: "msg"
`);
    await page.waitForTimeout(500);
    const svg = page.locator(".cdl-editor-preview svg");
    await expect(svg).toBeVisible();
  });

  test("3. サンプル切替ボタン", async ({ page }) => {
    await page.goto("/editor");
    // 初期 SVG render を待つ (preview wrap 経由で React hydration を保証)
    await page.waitForSelector(".cdl-editor-preview-wrap svg", { timeout: 10000 });
    const btn = page.locator(".cdl-editor-sample-btn", { hasText: "ERC-20" });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    const textarea = page.locator(".cdl-editor-textarea");
    // setSrc 反映 + 300ms debounce + render を待つため最大 8s 内に値変化を polling
    // (並列 worker 下では preview server response が遅延しうるため余裕を取る)
    await expect.poll(async () => await textarea.inputValue(), { timeout: 8000 }).toContain("type: solidity");
  });

  test("4. parse error 時の error 表示", async ({ page }) => {
    await page.goto("/editor");
    // 初期 hydration 完了を待つ (textarea 表示 + 既存 sample render 完了確認)
    await page.waitForSelector(".cdl-editor-preview-wrap svg", { timeout: 10000 });
    const textarea = page.locator(".cdl-editor-textarea");
    await textarea.fill("invalid yaml here\nno required fields");
    // debounce 300ms + parse fail で error pre が出るまで polling
    const error = page.locator(".cdl-editor-error");
    await expect(error).toBeVisible({ timeout: 8000 });
  });

  test("5. 共有 URL hash 復元", async ({ page }) => {
    const sample = `title: "Hash test"
type: sequence
actors:
  - A
flow:
  - A -> A: "self"
`;
    const encoded = Buffer.from(sample).toString("base64");
    await page.goto(`/editor#s=${encoded}`);
    await page.waitForTimeout(800);
    const textarea = page.locator(".cdl-editor-textarea");
    const v = await textarea.inputValue();
    expect(v).toContain("Hash test");
  });
});
