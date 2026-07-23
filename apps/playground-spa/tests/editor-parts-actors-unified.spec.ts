/**
 * CAR-1657 editor parts unified `actors:` syntax E2E spec。
 *
 * 前 PR #413 / #415 (JSON escape hatch REPLACE 経路) を rebuild、 unified `actors:` に parts kind を
 * 追記する additive semantic の verify。 前 spec file editor-drag-drop-full.spec.ts は wrong direction
 * (`#!parts` REPLACE 前提) を lock していたため本 file で置換。
 *
 * source spec = docs/spec-parts-actors-unified.md
 * baseURL 4323 前提 (playwright.config.ts)、 dev server は外部で `pnpm dev` 起動必要。
 */
import { test, expect, type Page } from "@playwright/test";

const PART_ID_BASIC = "parts-wave-gauge";
const PART_ID_ARC = "parts-arc-gauge";
const PART_ID_BIND = "parts-bind-counter-radius";

async function openPartsTab(page: Page): Promise<void> {
  await page.getByTestId("editor-parts-tab").click();
  await page.getByTestId(`editor-part-item-${PART_ID_BASIC}`).waitFor({ state: "visible", timeout: 5000 });
}

async function getEditorText(page: Page): Promise<string> {
  const full = await page.evaluate(() => {
    const w = window as unknown as { __cdlEditorSrc?: string };
    return w.__cdlEditorSrc ?? null;
  });
  if (full !== null) return full;
  return await page.locator(".cm-content").innerText();
}

async function simulateDragDrop(page: Page, partId: string): Promise<void> {
  await page.evaluate((pid) => {
    const item = document.querySelector(`[data-testid="editor-part-item-${pid}"]`);
    const stage = document.querySelector('[data-testid="editor-preview-stage"]');
    if (!item || !stage) throw new Error("drag source or drop target not found");
    const dt = new DataTransfer();
    dt.setData("application/dragon-part", pid);
    dt.setData("text/plain", pid);
    item.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
    stage.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
    stage.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, partId);
}

test.describe("CAR-1657 editor parts unified actors: syntax", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
  });

  // ============================================================
  // 観点 1: additive semantic (drop = actors: に append、 REPLACE ではない)
  // ============================================================
  test.describe("additive semantic (drop = actors: append)", () => {
    test("click で parts が既存 actors: に kind field 追加される", async ({ page }) => {
      const before = await getEditorText(page);
      expect(before).toContain("actors:");
      expect(before).toContain("Client"); // SAMPLES[0] 既存 actor
      await openPartsTab(page);
      await page.getByTestId(`editor-part-item-${PART_ID_BASIC}`).click();
      await page.waitForTimeout(400);
      const after = await getEditorText(page);
      // parts が kind field で追加、 prefix なし ('parts-wave-gauge' → 'wave-gauge')
      expect(after).toContain("kind: wave-gauge");
      // 既存 actor が保存されている
      expect(after).toContain("Client");
      expect(after).toContain("API");
      // flow: block も保存
      expect(after).toContain("flow:");
    });

    test("drag simulation でも同じ additive 挙動", async ({ page }) => {
      await openPartsTab(page);
      await simulateDragDrop(page, PART_ID_ARC);
      await page.waitForTimeout(500);
      const text = await getEditorText(page);
      expect(text).toContain("kind: arc-gauge");
      expect(text).toContain("actors:");
      expect(text).toContain("Client"); // 既存保存
    });

    test("同 parts を 2 回 click = alias 連番 (arc1 / arc2)", async ({ page }) => {
      await openPartsTab(page);
      await page.getByTestId(`editor-part-item-${PART_ID_ARC}`).click();
      await page.waitForTimeout(300);
      await page.getByTestId(`editor-part-item-${PART_ID_ARC}`).click();
      await page.waitForTimeout(300);
      const text = await getEditorText(page);
      // arcgauge1 + arcgauge2 (alias 生成 = kind から non-alphanumeric strip)
      expect(text).toMatch(/arcgauge1/);
      expect(text).toMatch(/arcgauge2/);
    });
  });

  // ============================================================
  // 観点 2: state override (inline field が parts state 名にマッピング)
  // ============================================================
  test.describe("state override propagation", () => {
    test("追加された parts の state initial が inline field として書き出される", async ({ page }) => {
      await openPartsTab(page);
      await page.getByTestId(`editor-part-item-${PART_ID_ARC}`).click();
      await page.waitForTimeout(400);
      const text = await getEditorText(page);
      // arc-gauge の parts state 'v' が initial = 0 で追記される想定
      // ('v: 0' が inline に含まれる)
      expect(text).toMatch(/v:\s*\d+/);
    });
  });

  // ============================================================
  // 観点 3: preview render (unified syntax で正しく render 継続)
  // ============================================================
  test.describe("preview render continuity", () => {
    test("additive append 後 preview SVG が render 継続", async ({ page }) => {
      await openPartsTab(page);
      await page.getByTestId(`editor-part-item-${PART_ID_BASIC}`).click();
      await page.waitForTimeout(1000);
      const svg = page.locator(".v4-editor-preview svg").first();
      await expect(svg).toBeVisible({ timeout: 5000 });
    });

    test("複数 parts append 後も preview render", async ({ page }) => {
      await openPartsTab(page);
      await page.getByTestId(`editor-part-item-${PART_ID_ARC}`).click();
      await page.waitForTimeout(300);
      await page.getByTestId(`editor-part-item-${PART_ID_BASIC}`).click();
      await page.waitForTimeout(1000);
      const svg = page.locator(".v4-editor-preview svg").first();
      await expect(svg).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================
  // 観点 4: sidebar UI (前 PR 保存)
  // ============================================================
  test.describe("sidebar UI regression", () => {
    test("パーツ tab open で 80+ parts populate", async ({ page }) => {
      await openPartsTab(page);
      const allParts = page.locator('[data-testid^="editor-part-item-"]');
      const count = await allParts.count();
      expect(count).toBeGreaterThanOrEqual(80);
    });

    test("サンプル tab / パーツ tab 双方向切替", async ({ page }) => {
      const samplesTab = page.locator('[role="tab"]').first();
      const partsTab = page.getByTestId("editor-parts-tab");
      await partsTab.click();
      await expect(partsTab).toHaveAttribute("aria-selected", "true");
      await samplesTab.click();
      await expect(samplesTab).toHaveAttribute("aria-selected", "true");
    });

    test("search input で filter", async ({ page }) => {
      await openPartsTab(page);
      const search = page.locator(".v4-editor-search");
      await search.fill("wave");
      await page.waitForTimeout(200);
      const visible = await page.getByTestId(`editor-part-item-${PART_ID_BASIC}`).isVisible();
      expect(visible).toBe(true);
    });
  });

  // ============================================================
  // 観点 5: 既存 SAMPLES regression (前 PR 保存 + 新 impl で壊れない)
  // ============================================================
  test.describe("existing SAMPLES regression", () => {
    test("SAMPLES click で従来通り load", async ({ page }) => {
      const samples = page.locator(".v4-editor-side-item");
      await samples.nth(1).click();
      await page.waitForTimeout(400);
      const text = await getEditorText(page);
      expect(text).toContain("type: sequence");
    });

    test("URL hash #preset=sequence で SAMPLES load", async ({ page }) => {
      await page.goto("/editor#preset=sequence", { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      const text = await getEditorText(page);
      expect(text).toContain("type: sequence");
    });
  });

  // ============================================================
  // 観点 6: 未知 partId error handling
  // ============================================================
  test.describe("error handling", () => {
    test("存在しない partId で drop = error hint", async ({ page }) => {
      await openPartsTab(page);
      await page.evaluate(() => {
        const stage = document.querySelector('[data-testid="editor-preview-stage"]');
        if (!stage) throw new Error("stage not found");
        const dt = new DataTransfer();
        dt.setData("application/dragon-part", "parts-doesnotexist");
        dt.setData("text/plain", "parts-doesnotexist");
        stage.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
        stage.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
      });
      await page.waitForTimeout(500);
      const hint = page.locator(".v4-editor-drop-hint");
      await expect(hint).toContainText("見つかりません", { timeout: 3000 });
    });
  });

  // ============================================================
  // 観点 7: bind pattern parts (Round 5 追加分) が unified syntax で追加可能
  // ============================================================
  test.describe("Round 5 bind pattern parts (previous PR)", () => {
    test("bind-counter-radius parts が kind field で追加", async ({ page }) => {
      await openPartsTab(page);
      await page.getByTestId(`editor-part-item-${PART_ID_BIND}`).click();
      await page.waitForTimeout(400);
      const text = await getEditorText(page);
      expect(text).toContain("kind: bind-counter-radius");
    });
  });
});
