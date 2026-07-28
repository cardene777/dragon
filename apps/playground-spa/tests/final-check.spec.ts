import { test, expect } from "@playwright/test";

/**
 * 公開判断のための通し確認。
 *
 * 個別機能の test は既にあるので、 ここでは「実際の使い方の順序で触って壊れないか」 を見る。
 * 1 つの操作の後に別の操作をした時に状態が壊れる、 という組合せの欠陥を狙う。
 */

const BASE = process.env.PROD_BASE_URL ?? "http://localhost:4324/dragon";
test.use({ viewport: { width: 1920, height: 1080 } });

function collectErrors(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function openEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(`${BASE}/editor`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500);
}

const dsl = async (page: import("@playwright/test").Page): Promise<string> =>
  await page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");

test("通し: 部品を置いて動かして色を変えて複製して消す", async ({ page }) => {
  const errors = collectErrors(page);
  await openEditor(page);

  // 置く
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  await page.locator('[data-testid="editor-part-item-parts-achievement"]').dragTo(stage, { targetPosition: { x: 400, y: 300 } });
  await page.waitForTimeout(900);
  expect(await page.locator("[data-overlay-part]").count(), "置いた直後").toBe(1);

  // 動かす
  const ov = page.locator("[data-overlay-part]").first();
  const b0 = await ov.boundingBox();
  await page.mouse.move(b0!.x + b0!.width / 2, b0!.y + b0!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b0!.x + b0!.width / 2 + 120, b0!.y + b0!.height / 2 + 60, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  const b1 = await ov.boundingBox();
  expect(Math.abs(b1!.x - b0!.x), "動いた量").toBeGreaterThan(50);

  // 選んで色を変える
  await page.mouse.move(b1!.x + b1!.width / 2, b1!.y + b1!.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
  await page.locator('[data-overlay-toolbar-btn="color"]').click();
  await page.waitForTimeout(300);
  await page.locator("[data-overlay-color-swatch]").first().click();
  await page.waitForTimeout(800);
  expect(await dsl(page), "色が DSL に残る").toContain("bg:");

  // 複製する
  await page.mouse.move(b1!.x + b1!.width / 2, b1!.y + b1!.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  await page.locator('[data-overlay-toolbar-btn="duplicate"]').click();
  await page.waitForTimeout(900);
  expect(await page.locator("[data-overlay-part]").count(), "複製後").toBe(2);

  // 消す
  await page.locator('[data-overlay-toolbar-btn="delete"]').click();
  await page.waitForTimeout(800);
  expect(await page.locator("[data-overlay-part]").count(), "削除後").toBe(1);

  expect(errors, "通しでの JS エラー").toEqual([]);
});

test("通し: 図を拡大してから要素を動かしても座標がずれない", async ({ page }) => {
  const errors = collectErrors(page);
  await openEditor(page);

  // 図を拡大
  await page.locator('[data-testid="editor-diagram-scale-up"]').click();
  await page.waitForTimeout(1200);
  expect(await dsl(page), "倍率が DSL に入る").toContain("scale:");

  // 要素を動かす
  const node = page.locator("[data-cdl-node]").first();
  const bb = await node.boundingBox();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.waitForTimeout(350);
  await page.mouse.down();
  await page.mouse.move(bb!.x + bb!.width / 2 + 80, bb!.y + bb!.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(900);

  // 倍率と座標が両立している
  const after = await dsl(page);
  expect(after, "倍率が残る").toContain("scale:");
  expect(after, "座標が書かれる").toContain("posX");
  expect(errors, "JS エラー").toEqual([]);
});

test("通し: 文字を編集した後も他の操作ができる", async ({ page }) => {
  const errors = collectErrors(page);
  await openEditor(page);

  // 文字を編集。 先頭の text は幅 0 の場合があるので、 実際に見えているものを選ぶ
  const tb = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="editor-preview-stage"]')!;
    for (const t of Array.from(stage.querySelectorAll("text"))) {
      const r = t.getBoundingClientRect();
      if (r.width > 20 && r.height > 8) return { x: r.x, y: r.y, width: r.width, height: r.height };
    }
    return null;
  });
  expect(tb, "編集できる text がある").not.toBeNull();
  await page.mouse.dblclick(tb!.x + tb!.width / 2, tb!.y + tb!.height / 2);
  await page.waitForTimeout(600);
  const input = page.locator('[data-testid="editor-text-edit-input"]');
  if ((await input.count()) > 0) {
    await input.fill("編集後のとても長いラベル文字列");
    // 入力欄が中身を収める幅になっている
    const iw = (await input.boundingBox())!.width;
    expect(iw, "入力欄の幅").toBeGreaterThan(100);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }

  // 編集後も選択できる
  const node = page.locator("[data-cdl-node]").first();
  const bb = await node.boundingBox();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  await page.waitForTimeout(350);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(500);
  expect(await page.locator("[data-cdl-selection-ui]").count(), "編集後の選択").toBeGreaterThan(0);

  expect(errors, "JS エラー").toEqual([]);
});

test("通し: 図種を切り替えても壊れない", async ({ page }) => {
  const errors = collectErrors(page);
  await openEditor(page);
  await page.getByRole("tab", { name: "サンプル" }).click();
  await page.waitForTimeout(300);

  // 3 種を順に開いて、 毎回図が出ることを確認する
  for (const slug of ["sequence", "flow", "state-machine", "er", "gantt"]) {
    const btn = page.locator(`[data-testid="editor-sample-${slug}"]`).first();
    if ((await btn.count()) === 0) continue;
    await btn.click();
    await page.waitForTimeout(1500);
    const n = await page.locator("[data-cdl-node]").count();
    expect(n, `${slug} の要素数`).toBeGreaterThan(0);
  }
  expect(errors, "図種切替での JS エラー").toEqual([]);
});

test("通し: 元に戻す / やり直しが効く", async ({ page }) => {
  const errors = collectErrors(page);
  await openEditor(page);
  const before = await dsl(page);

  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  const stage = page.locator('[data-testid="editor-preview-stage"]');
  await page.locator('[data-testid="editor-part-item-parts-achievement"]').dragTo(stage, { targetPosition: { x: 350, y: 300 } });
  await page.waitForTimeout(900);
  expect(await page.locator("[data-overlay-part]").count(), "置いた").toBe(1);

  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(800);
  expect(await page.locator("[data-overlay-part]").count(), "戻した").toBe(0);
  expect(await dsl(page), "DSL も戻る").toBe(before);

  await page.keyboard.press("Meta+Shift+z");
  await page.waitForTimeout(800);
  expect(await page.locator("[data-overlay-part]").count(), "やり直した").toBe(1);

  expect(errors, "JS エラー").toEqual([]);
});
