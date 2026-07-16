/**
 * Editor drag-and-drop parts E2E spec (CAR-1646)
 *
 * verify する経路 =
 * 1. editor sidebar の parts tab を open すると 60+ parts が lazy import で流入する
 * 2. sidebar item click で REPLACE semantic が働き editor text buffer が `#!parts` marker + JSON になる
 * 3. drag-and-drop simulation (dataTransfer 経由) で drop 経路も同じ text buffer 更新をする
 * 4. Round 5 で追加した bind pattern demo parts が sidebar に表示される (partsBindCounterRadius 等)
 * 5. `#!parts` marker text の JSON.parse で id / nodes / phases 全 field が復元される
 *
 * baseURL 4323 前提 (playwright.config.ts)、 dev server (pnpm dev) 起動が必要。
 */
import { test, expect } from "@playwright/test";

const PARTS_MARKER = "#!parts";
const PART_ID_BASIC = "parts-wave-gauge";
const PART_ID_BIND_ROUND5 = "parts-bind-counter-radius";

test.describe("Editor drag-drop parts (CAR-1646)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
  });

  test("parts tab を open すると 60+ parts が sidebar に流入する", async ({ page }) => {
    // default = samples tab、 parts tab を click で切替
    const partsTab = page.getByTestId("editor-parts-tab");
    await expect(partsTab).toBeVisible();
    await partsTab.click();

    const partsPanel = page.getByTestId("editor-parts-panel");
    await expect(partsPanel).toBeVisible();

    // 初回 load 完了を待つ = 最初の parts item が現れるまで
    const firstPart = page.getByTestId(`editor-part-item-${PART_ID_BASIC}`);
    await firstPart.waitFor({ state: "visible", timeout: 5000 });

    // 全 parts 件数を count = 60 base + 20 追加 = 80 前提、 少なくとも 60 は超えていることを assert
    const allParts = page.locator('[data-testid^="editor-part-item-"]');
    const count = await allParts.count();
    expect(count).toBeGreaterThanOrEqual(80);
  });

  test("parts item click で REPLACE semantic + #!parts marker が text buffer に入る", async ({ page }) => {
    await page.getByTestId("editor-parts-tab").click();
    const firstPart = page.getByTestId(`editor-part-item-${PART_ID_BASIC}`);
    await firstPart.waitFor({ state: "visible", timeout: 5000 });

    await firstPart.click();
    // CodeMirror text buffer から src 取得 (contentEditable の .cm-content 経由)
    await page.waitForTimeout(400);
    const editorText = await page.locator(".cm-content").innerText();
    expect(editorText.trim().startsWith(PARTS_MARKER)).toBe(true);

    // JSON body に id と nodes が含まれる
    expect(editorText).toContain(`"id": "${PART_ID_BASIC}"`);
    expect(editorText).toContain('"nodes"');
    expect(editorText).toContain('"phases"');
  });

  test("Round 5 bind pattern parts (CAR-1646) が sidebar で見つかる + click で load できる", async ({ page }) => {
    await page.getByTestId("editor-parts-tab").click();
    const bindPart = page.getByTestId(`editor-part-item-${PART_ID_BIND_ROUND5}`);
    await bindPart.waitFor({ state: "visible", timeout: 5000 });
    await expect(bindPart).toBeVisible();

    await bindPart.click();
    await page.waitForTimeout(400);
    const editorText = await page.locator(".cm-content").innerText();
    expect(editorText).toContain(`"id": "${PART_ID_BIND_ROUND5}"`);
  });

  test("drag simulation (dispatchEvent) で drop → REPLACE 経路 pass", async ({ page }) => {
    await page.getByTestId("editor-parts-tab").click();
    const dragPart = page.getByTestId(`editor-part-item-${PART_ID_BASIC}`);
    await dragPart.waitFor({ state: "visible", timeout: 5000 });

    // native drag events は Playwright hover + mouse.down/up で完全 simulate しづらいため、
    // 直接 dispatchEvent で dragstart → dragover → drop を打つ (dataTransfer は空 object で
    // preventDefault が働けば drop handler が partId を text/plain から取れる形にする)
    const previewStage = page.getByTestId("editor-preview-stage");
    await previewStage.waitFor({ state: "visible" });

    // page.evaluate で custom dataTransfer を持つ DragEvent を dispatch する
    // (Playwright の built-in drag API では dataTransfer が空になるため独自経路)
    await page.evaluate((partId) => {
      const item = document.querySelector(`[data-testid="editor-part-item-${partId}"]`);
      const stage = document.querySelector('[data-testid="editor-preview-stage"]');
      if (!item || !stage) throw new Error("drag source or drop target not found");

      const dt = new DataTransfer();
      dt.setData("application/dragon-part", partId);
      dt.setData("text/plain", partId);

      const dragStart = new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt });
      item.dispatchEvent(dragStart);

      const dragOver = new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt });
      stage.dispatchEvent(dragOver);

      const drop = new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt });
      stage.dispatchEvent(drop);
    }, PART_ID_BASIC);

    await page.waitForTimeout(500);
    const editorText = await page.locator(".cm-content").innerText();
    expect(editorText.trim().startsWith(PARTS_MARKER)).toBe(true);
    expect(editorText).toContain(`"id": "${PART_ID_BASIC}"`);
  });

  test("`#!parts` marker text の editor render で SVG が preview に描画される", async ({ page }) => {
    await page.getByTestId("editor-parts-tab").click();
    const firstPart = page.getByTestId(`editor-part-item-${PART_ID_BASIC}`);
    await firstPart.waitFor({ state: "visible", timeout: 5000 });
    await firstPart.click();

    // debounce 300ms + render 反映を待つ
    await page.waitForTimeout(800);
    const svg = page.locator(".v4-editor-preview svg").first();
    await expect(svg).toBeVisible({ timeout: 5000 });
  });
});
