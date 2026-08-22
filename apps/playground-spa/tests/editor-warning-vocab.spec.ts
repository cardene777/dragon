import { test, expect } from "@playwright/test";

/**
 * 画面に出る指摘が、書き手が書いた名前で読めることの検査 (#1324)。
 *
 * 描画側 (`@cardenelabs/cdl`) は箱を **組み立てが作った id** で指す (`node "a-header"`)。
 * 書き手が書いたのは `A` で、`a-header` は source のどこにも現れない。
 *
 * 読み替えは `src/lib/editor-warnings.ts` が行い、単体でも確かめている。 ここで見るのは
 * **その読み替えが画面まで届いているか** = 表示側が元の文面を出していないこと。
 */

/** 記法を編集画面に載せる。 共有 URL の経路 (`#s=<符号化>`) を使う */
const 記法を開く = async (page: import("@playwright/test").Page, src: string): Promise<void> => {
  const encoded = await page.evaluate((s) => btoa(unescape(encodeURIComponent(s))), src);
  await page.goto(`/editor#s=${encoded}`);
  await page.waitForSelector('[data-testid="editor-preview-stage"]');
  await page.waitForTimeout(1200);
};

/**
 * 小さい箱に説明を書いた図。 描画側が絵の帯を優先して説明を落とすため、
 * `shape-label-dropped` の指摘が出る (#1320 で挙動を固定した)。
 */
const 説明が落ちる = `title: "t"
type: sequence

actors:
  - A: { kind: contract, subtitle: "説明" }
  - B

flow:
  - A -> B: "x"
`;

test("指摘が書き手の書いた名前で出る", async ({ page }) => {
  await 記法を開く(page, 説明が落ちる);

  const 文面 = await page.locator(".v4-editor-warning-detail").allTextContents();
  expect(文面.length, "指摘が 1 件も出ていない (検査が空振りしている)").toBeGreaterThan(0);

  const 落ちた説明 = 文面.filter((t) => t.includes("描かれない"));
  expect(落ちた説明.length, "説明が落ちた指摘が出ていない").toBeGreaterThan(0);

  const 対象 = 落ちた説明[0]!;
  expect(対象, "組み立てが作った id が画面に出ている").not.toContain("a-header");
  expect(対象, "書き手が書いた名前が出ていない").toContain('名札 "A"');
});

test("書き手が書ける種別名は残る", async ({ page }) => {
  // `shape-smart-contract` は記法にそのまま書ける語で、記法一覧の「箱の種類」 にも並ぶ。
  // 読み替えると書き手が書いた語を消すことになる
  await 記法を開く(page, 説明が落ちる);

  const 文面 = await page.locator(".v4-editor-warning-detail").allTextContents();
  const 対象 = 文面.find((t) => t.includes("描かれない"));
  expect(対象, "説明が落ちた指摘が出ていない").toBeDefined();
  expect(対象!, "種別名まで読み替えている").toContain("shape-smart-contract");
});
