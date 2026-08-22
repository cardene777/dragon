import { test, expect } from "@playwright/test";
import { PREVIEW_URL } from "../ports";

/**
 * 公開判断のための通し確認。
 *
 * 個別機能の test は既にあるので、 ここでは「実際の使い方の順序で触って壊れないか」 を見る。
 * 1 つの操作の後に別の操作をした時に状態が壊れる、 という組合せの欠陥を狙う。
 */

const BASE = process.env.PROD_BASE_URL ?? PREVIEW_URL;
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

  // パーツ一覧から 1 行足す。 図を直接触る操作は無くなったので、 取り消しの対象は
  // DSL 本文の変更になる。
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  await page.locator('[data-testid="editor-part-item-parts-achievement"]').click();
  await page.waitForTimeout(900);
  const added = await dsl(page);
  expect(added, "足した").not.toBe(before);
  expect(await page.locator("[data-overlay-part]").count(), "図に出た").toBe(1);

  // 入力欄に焦点があると CodeMirror 自身の履歴が処理するため、 stage に焦点を移してから押す
  await page.locator('[data-testid="editor-preview-stage"]').click();
  await page.keyboard.press("Meta+z");
  await page.waitForTimeout(800);
  expect(await dsl(page), "DSL が戻る").toBe(before);
  expect(await page.locator("[data-overlay-part]").count(), "図からも消える").toBe(0);

  await page.keyboard.press("Meta+Shift+z");
  await page.waitForTimeout(800);
  expect(await dsl(page), "やり直した").toBe(added);

  expect(errors, "JS エラー").toEqual([]);
});
