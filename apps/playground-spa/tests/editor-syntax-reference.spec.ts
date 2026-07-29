import { test, expect } from "@playwright/test";

/**
 * 記法一覧が「実際に受け付ける値」 を出しているかを見る。
 *
 * 一覧を手書きすると、 記法に値が増えた時に一覧だけが取り残される。 そこで一覧は記法側の
 * 実装から値を引いている。 その配線が生きているかを、 実際に書ける記述で確かめる。
 *
 * 測るのは「一覧が表示されたか」 ではなく、 **載っている値が実際に書けるか**。
 */

const openEditor = async (page: import("@playwright/test").Page): Promise<void> => {
  await page.goto("/editor");
  await page.waitForSelector('[data-testid="editor-preview-stage"]');
  await page.waitForTimeout(600);
};

/**
 * DSL を書き換える。 共有 URL の経路 (`#s=<符号化>`) を使う。
 *
 * 本番に test 専用の書き込み口を足すと、 出荷物に test のための穴が残る。 共有 URL は
 * user が実際に使う経路なので、 それを通す。
 */
const setDsl = async (page: import("@playwright/test").Page, src: string): Promise<void> => {
  const encoded = await page.evaluate((s) => btoa(unescape(encodeURIComponent(s))), src);
  await page.goto(`/editor#s=${encoded}`);
  await page.waitForSelector('[data-testid="editor-preview-stage"]');
  await page.waitForTimeout(900);
};

const dsl = (page: import("@playwright/test").Page): Promise<string> =>
  page.evaluate(() => (window as unknown as { __cdlEditorSrc?: string }).__cdlEditorSrc ?? "");

test("記法タブを開くと一覧が出る", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  await expect(page.locator('[data-testid="editor-syntax-panel"]')).toBeVisible();
});

test("載っている図種が実際に書ける", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const types = await page.locator('[data-testid="editor-syntax-types"] code').allTextContents();
  expect(types.length, "図種が 1 つ以上").toBeGreaterThan(0);

  // 一覧の図種をそのまま書いて、 図が出ることを確かめる。
  // 動きの指定は図種によって必須 (`c4` / `class` は無いと組み立てに失敗する) なので付ける。
  for (const type of types.slice(0, 4)) {
    await setDsl(page, `title: "t"\ntype: ${type}\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n\nanimation:\n  - step: "s" 1.0s\n    focus: [A, B]\n`);
    const err = await page.locator(".v4-editor-error").count();
    expect(err, `${type} で組み立てに失敗した`).toBe(0);
  }
});

test("載っている箱の種類が実際に書ける", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const kinds = await page.locator('[data-testid="editor-syntax-kinds"] code').allTextContents();
  expect(kinds.length, "種類が 1 つ以上").toBeGreaterThan(0);

  // 未知の種類は部品名として扱われて警告が出る。 一覧の値ならそうならない
  const sample = kinds.slice(0, 6);
  const lines = sample.map((k, i) => `  - N${i}: ${k}`).join("\n");
  await setDsl(page, `title: "t"\ntype: flow\n\nactors:\n${lines}\n\nflow:\n  - N0 -> N1: "x"\n\nanimation:\n  - step: "s" 1.0s\n    focus: [N0, N1]\n`);
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
  expect(await page.locator("[data-cdl-node]").count(), "箱が出ない").toBeGreaterThan(0);
});

test("載っている色が実際に効く", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const tones = await page.locator('[data-testid="editor-syntax-tones"] .v4-editor-syntax-code').allTextContents();
  expect(tones.length, "色が 1 つ以上").toBeGreaterThan(0);

  const tone = tones.find((t) => t !== "accent") ?? tones[0]!;
  await setDsl(page, `title: "t"\ntype: flow\n\nactors:\n  - A: service ${tone}\n  - B\n\nflow:\n  - A -> B: "x"\n\nanimation:\n  - step: "s" 1.0s\n    focus: [A, B]\n`);
  const node = page.locator('[data-cdl-node]').first();
  await expect(node, "色を指定した箱に印が付く").toHaveAttribute("data-cdl-tone", tone);
});

test("例をクリックすると入力欄に足される", async ({ page }) => {
  await openEditor(page);
  const before = await dsl(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const row = page.locator('.v4-editor-syntax-row[data-syntax-code]').first();
  const code = await row.getAttribute("data-syntax-code");
  await row.click();
  await page.waitForTimeout(600);
  const after = await dsl(page);
  expect(after, "内容が増える").not.toBe(before);
  expect(after, "押した例が入る").toContain(code!);
});

test("パーツを足すと入れ子なしの行が入る", async ({ page }) => {
  // 一覧の書き方と、 画面が実際に足す行の書き方が食い違うと、 読んだ通りに書けない
  await openEditor(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  await page.locator('[data-testid="editor-part-item-parts-achievement"]').click();
  await page.waitForTimeout(900);

  const added = await dsl(page);
  // 足される行は `  - achievement1: achievement bg="#f59e0b"` の形 (一覧の id ではなく別名)
  const line = added.split("\n").find((l) => /^\s*- achievement\d+:/.test(l));
  expect(line, `パーツの行が入っていない: ${added.slice(-200)}`).toBeTruthy();
  expect(line, `入れ子が残っている: ${line}`).not.toContain("{");
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
});
