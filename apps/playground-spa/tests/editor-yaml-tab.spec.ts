/**
 * CAR-1678 editor multi-line YAML tab E2E spec。
 * spec `docs/spec/pr1-editor-multiline-yaml-tab.md` の AC 1 / 2 / 3 / 4 を Playwright で verify する。
 * AC 5 (catalog byte-identical) は既存 sweep test (`sweep-5-category.spec.ts` 他) に責務、
 * 本 file は「YAML tab UI が spec 通り動くか」 に集約する。
 *
 * 前提 = dev server が localhost:4323 で起動していること (playwright.config.ts SSOT)。
 */
import { test, expect, type Page } from "@playwright/test";

async function getActiveTab(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const w = window as unknown as { __cdlEditorActiveTab?: string };
    return w.__cdlEditorActiveTab ?? "unknown";
  });
}

async function getYamlSrc(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const w = window as unknown as { __cdlEditorYamlSrc?: string };
    return w.__cdlEditorYamlSrc ?? "";
  });
}

async function setYamlSrc(page: Page, text: string): Promise<void> {
  // CodeMirror の virtual scrolling を bypass、 直接 window mirror を書き換えても React state と乖離するため
  // 実際の editing は CodeMirror .cm-content の contenteditable 経由で行う。
  await page.locator('[data-testid="editor-code-body-yaml"] .cm-content').click();
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(text);
}

test.describe("CAR-1678 editor YAML tab", () => {
  test.describe("AC 1 = URL param + 拡張子で YAML tab active", () => {
    test("URL `?format=yaml` で YAML tab が active state で起動する", async ({ page }) => {
      await page.goto("/editor?format=yaml", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await expect(page.getByTestId("editor-tab-yaml")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("editor-tab-cdl")).toHaveAttribute("aria-selected", "false");
      expect(await getActiveTab(page)).toBe("yaml");
    });

    test("URL param なし = CDL tab default で起動する (regression 防止)", async ({ page }) => {
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await expect(page.getByTestId("editor-tab-cdl")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("editor-tab-yaml")).toHaveAttribute("aria-selected", "false");
      expect(await getActiveTab(page)).toBe("cdl");
    });
  });

  test.describe("AC 2 = tab 切替時の unsaved change confirm", () => {
    test("unsaved change なし = 即切替 (confirm dialog 出ない)", async ({ page }) => {
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      let dialogSeen = false;
      page.on("dialog", (d) => {
        dialogSeen = true;
        void d.dismiss();
      });
      await page.getByTestId("editor-tab-yaml").click();
      await page.waitForTimeout(300);
      expect(dialogSeen).toBe(false);
      expect(await getActiveTab(page)).toBe("yaml");
    });

    test("CDL tab で unsaved change あり = 切替時 confirm dialog、 cancel で切替中止", async ({ page }) => {
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      // CDL 側 buffer を意図的に編集して dirty state を作る
      await page.locator('[data-testid="editor-code-body-cdl"] .cm-content').click();
      await page.keyboard.press("End");
      await page.keyboard.type("\n# user edit marker");
      await page.waitForTimeout(400);
      // 次の click で confirm dialog が出るはず、 dismiss (cancel) 経路
      let dialogMessage = "";
      page.on("dialog", (d) => {
        dialogMessage = d.message();
        void d.dismiss();
      });
      await page.getByTestId("editor-tab-yaml").click();
      await page.waitForTimeout(300);
      // spec § AC 2 の確認文言 SSOT
      expect(dialogMessage).toContain("Unsaved changes will be lost");
      // cancel なので CDL tab のまま
      expect(await getActiveTab(page)).toBe("cdl");
    });

    test("confirm accept で切替される", async ({ page }) => {
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.locator('[data-testid="editor-code-body-cdl"] .cm-content').click();
      await page.keyboard.press("End");
      await page.keyboard.type("\n# accept switch marker");
      await page.waitForTimeout(400);
      page.on("dialog", (d) => {
        void d.accept();
      });
      await page.getByTestId("editor-tab-yaml").click();
      await page.waitForTimeout(400);
      expect(await getActiveTab(page)).toBe("yaml");
    });
  });

  test.describe("AC 3 / 4 = YAML 編集で preview render + parse error", () => {
    test.beforeEach(({ page }) => {
      // 起動時 dialog は全て accept、 unrelated confirm も含めて blocking を避ける
      page.on("dialog", (d) => {
        void d.accept();
      });
    });

    test("AC 3 = YAML 有効編集で preview SVG が render される", async ({ page }) => {
      await page.goto("/editor?format=yaml", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      expect(await getActiveTab(page)).toBe("yaml");
      // default YAML template で render 済 = SVG が存在するはず
      await expect(page.locator(".v4-editor-preview svg")).toBeVisible({ timeout: 5000 });
      // 500ms debounce 後の再 render を確認、 title を書き換えて反映を見る
      await setYamlSrc(page, `title: "Rendered YAML"
type: sequence
actors:
  - Alpha
  - Beta
flow:
  - from: Alpha
    to: Beta
    label: hello
`);
      // 500ms debounce + layout margin
      await page.waitForTimeout(900);
      const yaml = await getYamlSrc(page);
      expect(yaml).toContain("Rendered YAML");
      expect(yaml).toContain("Alpha");
      // preview は残っている
      await expect(page.locator(".v4-editor-preview svg")).toBeVisible();
      // yaml-error banner は出ていない (有効 source なので null)
      await expect(page.getByTestId("editor-yaml-error")).toHaveCount(0);
    });

    test("AC 4 = parse error で error banner 表示、 前回 render は消えない", async ({ page }) => {
      await page.goto("/editor?format=yaml", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      // 前回 render が存在することを確認
      await expect(page.locator(".v4-editor-preview svg")).toBeVisible();
      // unclosed quote で意図的な parse error を作る
      await setYamlSrc(page, `title: "unclosed
type: sequence
actors:
  - A
`);
      await page.waitForTimeout(900);
      // error banner が YAML parse error: line ... 形式で表示される
      const errBanner = page.getByTestId("editor-yaml-error");
      await expect(errBanner).toBeVisible({ timeout: 3000 });
      const text = await errBanner.textContent();
      expect(text).toMatch(/^YAML parse error: line \d+:/);
      // 前回 render の SVG は残っている (spec AC 4)
      await expect(page.locator(".v4-editor-preview svg")).toBeVisible();
    });
  });

  test.describe("本文欄の重ね描きは YAML 欄に持ち込まない", () => {
    test.beforeEach(({ page }) => {
      // 欄を移る時の確認は本 describe の対象ではないので、 出たら通す
      page.on("dialog", (d) => {
        void d.accept();
      });
    });

    test("本文欄で置いたパーツは YAML 欄の図に重ならない", async ({ page }) => {
      // パーツは本文欄の記述から取り出したもので、 YAML 欄の図はそれを持たない。
      // 残したままだと、 その図に無い部品が乗って見える。
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.getByTestId("editor-parts-tab").click();
      await page.waitForTimeout(400);
      await page.getByTestId("editor-part-item-parts-achievement").click();
      await page.waitForTimeout(900);
      await expect(page.locator("[data-overlay-part]"), "本文欄では出ている").toHaveCount(1);

      await page.getByTestId("editor-tab-yaml").click();
      await page.waitForTimeout(900);
      expect(await getActiveTab(page)).toBe("yaml");
      await expect(page.locator("[data-overlay-part]"), "YAML 欄に残っている").toHaveCount(0);

      // 本文欄に戻せば元通り出る (消しているのではなく出し分けている)
      await page.getByTestId("editor-tab-cdl").click();
      await page.waitForTimeout(900);
      await expect(page.locator("[data-overlay-part]"), "戻しても出ない").toHaveCount(1);
    });

    test("本文欄の位置の札は YAML 欄に出ない", async ({ page }) => {
      // 札を押すと本文欄の記述に座標を書く。 YAML 欄で出すと、 映していない方が書き換わる。
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.getByTestId("editor-toggle-positions").click();
      await page.waitForTimeout(600);
      const marksInCdl = await page.locator(".v4-editor-pos-mark").count();
      expect(marksInCdl, "本文欄で札が出ていない").toBeGreaterThan(0);

      await page.getByTestId("editor-tab-yaml").click();
      await page.waitForTimeout(900);
      expect(await getActiveTab(page)).toBe("yaml");
      await expect(page.locator(".v4-editor-pos-mark"), "YAML 欄に札が残っている").toHaveCount(0);

      await page.getByTestId("editor-tab-cdl").click();
      await page.waitForTimeout(900);
      expect(await page.locator(".v4-editor-pos-mark").count(), "戻しても出ない").toBe(marksInCdl);
    });
  });

  test.describe("regression = CDL tab 経路は無変更", () => {
    test("CDL tab で既存 SAMPLES 選択が動く", async ({ page }) => {
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      // CDL tab active で preview SVG が render されている (SAMPLES[0] が initial)
      await expect(page.locator(".v4-editor-preview svg")).toBeVisible({ timeout: 5000 });
      // parts tab へ切替 → parts item が見える (既存機能)
      await page.getByTestId("editor-parts-tab").click();
      await expect(page.getByTestId("editor-part-item-parts-wave-gauge")).toBeVisible({ timeout: 5000 });
    });
  });
});
