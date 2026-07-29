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
  const lines = added.split("\n");
  const headIdx = lines.findIndex((l) => /^\s*- achievement\d*:/.test(l));
  expect(headIdx, `パーツの行が入っていない: ${added.slice(-200)}`).toBeGreaterThan(-1);
  // 変えられる値を縦に並べて出す。 1 行に詰めると色番号が読めない形で並ぶ
  const block = lines.slice(headIdx, headIdx + 3).map((l) => l.trimEnd());
  expect(block[0]!.trim(), `1 件目に番号が付いている: ${block[0]}`).toBe("- achievement:");
  expect(block[1]).toBe("      kind: achievement");
  expect(block[2], "色が出ていない").toMatch(/^\s+色: "#[0-9a-fA-F]{6}"$/);
  expect(added, "入れ子が残っている").not.toContain("{ kind:");
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
  expect(await page.locator("[data-overlay-part]").count(), "図に出ていない").toBe(1);
});

test("同じパーツを 2 つ置くと 2 件目に番号が付く", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  const item = page.locator('[data-testid="editor-part-item-parts-achievement"]');
  await item.click();
  await page.waitForTimeout(700);
  await item.click();
  await page.waitForTimeout(900);

  const heads = (await dsl(page)).split("\n").filter((l) => /^\s*- achievement\d*:/.test(l));
  expect(heads.map((l) => l.trim()), heads.join(" / ")).toEqual([
    "- achievement:",
    "- achievement2:",
  ]);
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
});

test("短い形で書いたパーツも図に出る", async ({ page }) => {
  // 生成する行を短くした時、 図に出す側が入れ子の形しか読んでいなかった。 行は入るのに
  // 図には出ない状態になり、 書いた人には理由が分からない。
  //
  // パーツの目録はタブを開いた時に読み込まれる。 開かずに書いても図には出ないので、
  // 実際の使い方 (タブを開いてから書く) に合わせる。
  await openEditor(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(700);
  await setDsl(page, [
    'title: "t"',
    "type: flow",
    "",
    "actors:",
    "  - 実績: achievement",
    "  - X",
    "",
    "flow:",
    '  - 実績 -> X: "y"',
  ].join("\n"));
  expect(await page.locator("[data-overlay-part]").count(), "パーツが図に出ない").toBe(1);
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
});
