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

/**
 * 図の中身を 1 本の文字列にする。
 *
 * 「svg があるか」 だけを見ると、 図が更新されなくなっても前の図が残るので気付けない。
 * 描かれている文字を並べて、 前後で変わったか / 変わっていないかを見る。
 */
async function previewFingerprint(page: Page): Promise<string> {
  return await page
    .locator(".v4-editor-preview svg")
    .first()
    .evaluate((svg) =>
      Array.from(svg.querySelectorAll("text"))
        .map((t) => t.textContent ?? "")
        .join("|"),
    );
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

    test("拡張子 `.yml` / `.yaml` の場所を開くと YAML 欄で始まる", async ({ page }) => {
      // 判定関数だけを test すると通るが、 route を通らないと 404 に落ちて画面が出ない。
      // 実 URL で開いて、 画面が出ることと欄が選ばれることの両方を見る。
      for (const path of ["/editor/diagram.yml", "/editor/diagram.yaml"]) {
        await page.goto(path, { waitUntil: "networkidle" });
        await page.waitForTimeout(800);
        await expect(page.getByTestId("editor-tab-yaml"), `${path} で画面が出ない`).toHaveAttribute(
          "aria-selected",
          "true",
        );
        expect(await getActiveTab(page), path).toBe("yaml");
      }
    });

    test("拡張子が付かない場所は本文欄で始まる", async ({ page }) => {
      await page.goto("/editor/diagram.txt", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      expect(await getActiveTab(page)).toBe("cdl");
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
      const before = await previewFingerprint(page);
      expect(before, "初期の図が描かれていない").not.toBe("");

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
      // yaml-error banner は出ていない (有効 source なので null)
      await expect(page.getByTestId("editor-yaml-error")).toHaveCount(0);

      // 図そのものが書き換わっている。 svg の有無だけを見ていると、 更新が止まっても
      // 前の図が残るので気付けない
      const after = await previewFingerprint(page);
      expect(after, "図が更新されていない").not.toBe(before);
      expect(after, "書いた内容が図に出ていない").toContain("Alpha");
      expect(after).toContain("Beta");
      expect(after).toContain("hello");
    });

    test("AC 4 = parse error で error banner 表示、 前回 render は消えない", async ({ page }) => {
      await page.goto("/editor?format=yaml", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      // 前回 render が存在することを確認
      await expect(page.locator(".v4-editor-preview svg")).toBeVisible();
      const before = await previewFingerprint(page);
      expect(before).not.toBe("");

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
      // 前の図が「同じ中身のまま」 残る。 svg の有無だけでは、 別の図に描き換わる形を見逃す
      expect(await previewFingerprint(page), "前の図が保たれていない").toBe(before);
    });

    test("形は読めるが図にできない YAML でも前の図が残る", async ({ page }) => {
      // 誤りの経路は 3 つある (読めない / 図の形に合わない / 組み立てに失敗する)。
      // 2 つ目を通しても前の図が消えないことを見る
      await page.goto("/editor?format=yaml", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const before = await previewFingerprint(page);
      expect(before).not.toBe("");

      // YAML としては読めるが、 図の定義としては受け付けられない形
      await setYamlSrc(page, "just a string\n");
      await page.waitForTimeout(900);
      await expect(page.getByTestId("editor-yaml-error")).toBeVisible({ timeout: 3000 });
      expect(await previewFingerprint(page), "前の図が保たれていない").toBe(before);
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

  test.describe("本文欄を書き換える操作は YAML 欄で押せない", () => {
    // これらは押しても画面が変わらないのに、 映していない本文欄の中身だけが変わる。
    // 押せる状態のままにすると、 変わったことに気付けない。
    const CDL_ONLY = [
      "editor-new-file",
      "editor-share",
      "editor-diagram-scale-up",
      "editor-diagram-scale-down",
      "editor-toggle-positions",
    ];

    test("本文欄では押せて、 YAML 欄では押せない", async ({ page }) => {
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      for (const id of CDL_ONLY) {
        await expect(page.getByTestId(id), `${id} が本文欄で押せない`).toBeEnabled();
      }

      page.on("dialog", (d) => void d.accept());
      await page.getByTestId("editor-tab-yaml").click();
      await page.waitForTimeout(900);
      expect(await getActiveTab(page)).toBe("yaml");
      for (const id of CDL_ONLY) {
        await expect(page.getByTestId(id), `${id} が YAML 欄で押せてしまう`).toBeDisabled();
      }
    });

    test("見本とパーツも YAML 欄では押せない", async ({ page }) => {
      page.on("dialog", (d) => void d.accept());
      await page.goto("/editor?format=yaml", { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      await expect(page.getByTestId("editor-sample-sequence").first()).toBeDisabled();

      await page.getByTestId("editor-parts-tab").click();
      await page.waitForTimeout(600);
      await expect(page.getByTestId("editor-part-item-parts-achievement")).toBeDisabled();
    });

    test("YAML 欄で本文欄の中身が変わらない", async ({ page }) => {
      // 押せないことの裏を取る = 実際に本文欄が保たれている
      page.on("dialog", (d) => void d.accept());
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const cdlBefore = await page.evaluate(() => {
        const w = window as unknown as { __cdlEditorSrc?: string };
        return w.__cdlEditorSrc ?? "";
      });
      expect(cdlBefore).not.toBe("");

      await page.getByTestId("editor-tab-yaml").click();
      await page.waitForTimeout(900);
      await setYamlSrc(page, `title: "edited in yaml"
type: sequence
actors:
  - X
  - Y
flow:
  - from: X
    to: Y
    label: go
`);
      await page.waitForTimeout(900);

      const cdlAfter = await page.evaluate(() => {
        const w = window as unknown as { __cdlEditorSrc?: string };
        return w.__cdlEditorSrc ?? "";
      });
      expect(cdlAfter, "YAML を書いたのに本文欄が変わった").toBe(cdlBefore);
    });
  });

  test.describe("覚えてある図に戻る時、 前の誤りを引きずらない", () => {
    test.beforeEach(({ page }) => {
      page.on("dialog", (d) => {
        void d.accept();
      });
    });

    test("正しい YAML → 壊れた YAML → 元に戻すと誤りの帯が消える", async ({ page }) => {
      // 覚えてあるのは組み立てに成功した結果だけ。 戻った時に前の失敗の帯が残ると、
      // 図は正しいのに直っていないように見える
      await page.goto("/editor?format=yaml", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      const good = `title: "ok"
type: sequence
actors:
  - X
  - Y
flow:
  - from: X
    to: Y
    label: go
`;
      await setYamlSrc(page, good);
      await page.waitForTimeout(900);
      await expect(page.getByTestId("editor-yaml-error")).toHaveCount(0);

      // 壊す
      await setYamlSrc(page, `title: "broken\ntype: sequence\n`);
      await page.waitForTimeout(900);
      await expect(page.getByTestId("editor-yaml-error")).toBeVisible({ timeout: 3000 });

      // 元に戻す = 覚えてある結果に当たる
      await setYamlSrc(page, good);
      await page.waitForTimeout(900);
      await expect(page.getByTestId("editor-yaml-error"), "誤りの帯が残っている").toHaveCount(0);
      await expect(page.locator(".v4-editor-preview svg")).toBeVisible();
    });
  });

  test.describe("regression = CDL tab 経路は無変更", () => {
    test("CDL tab で見本を選ぶと本文と図が入れ替わる", async ({ page }) => {
      page.on("dialog", (d) => void d.accept());
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await expect(page.locator(".v4-editor-preview svg")).toBeVisible({ timeout: 5000 });
      const before = await previewFingerprint(page);
      const srcBefore = await page.evaluate(() => {
        const w = window as unknown as { __cdlEditorSrc?: string };
        return w.__cdlEditorSrc ?? "";
      });

      // 初期の見本 (先頭) とは別のものを選ぶ
      const items = page.locator("[data-sample-label]");
      const count = await items.count();
      expect(count, "見本が並んでいない").toBeGreaterThan(1);
      await items.nth(count - 1).click();
      await page.waitForTimeout(900);

      const srcAfter = await page.evaluate(() => {
        const w = window as unknown as { __cdlEditorSrc?: string };
        return w.__cdlEditorSrc ?? "";
      });
      expect(srcAfter, "本文が入れ替わっていない").not.toBe(srcBefore);
      expect(await previewFingerprint(page), "図が入れ替わっていない").not.toBe(before);
    });

    test("CDL tab で parts 一覧が開く", async ({ page }) => {
      await page.goto("/editor", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.getByTestId("editor-parts-tab").click();
      await expect(page.getByTestId("editor-part-item-parts-wave-gauge")).toBeVisible({ timeout: 5000 });
    });
  });
});
