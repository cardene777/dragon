/**
 * catalog の `clickToggle` が押して実際に動くことの確認 (#1038)。
 *
 * 図は `on.click` で受け取り手 (`toggle-active`) を結び付けているが、catalog の描画側が
 * 受け取り手を渡していなかったため、押しても何も起きなかった
 * (`cdl` の `interactive-panel.tsx` は受け取り手の指定が無いと結び付けを中止する)。
 *
 * 「押しても動かない見本」 は、見た人に「壊れている」 か「自分の書き方が悪い」 と
 * 受け取らせる。 押した結果が画面に出ることを e2e で固定する。
 */
import { test, expect, type Page, type Locator } from "@playwright/test";
import { 一覧の行 } from "./catalog-item-pick";

const ITEM_LABEL = "クリックで状態切替";

/** 一覧を開いて `clickToggle` を選び、preview 領域を返す。 */
async function openClickToggle(page: Page): Promise<Locator> {
  await page.goto("catalog/interactive", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await 一覧の行(page, ITEM_LABEL, false).click();
  await page.waitForTimeout(400);
  const preview = page.locator("main.catalog-preview");
  await expect(preview.locator("svg").first()).toBeVisible();
  return preview;
}

/** 値が出る箱 (`signalNode`) の文字列。 */
async function readSignal(scope: Locator): Promise<string> {
  const node = scope.locator('[data-cdl-node="signalNode"]').first();
  await expect(node).toBeAttached();
  return (await node.textContent()) ?? "";
}

/** 押す箱 (`btn`) を押して、描画が落ち着くまで待つ。 */
async function pressButton(page: Page, scope: Locator): Promise<void> {
  await scope.locator('[data-cdl-node="btn"]').first().click();
  await page.waitForTimeout(300);
}

test.describe("catalog の clickToggle (#1038)", () => {
  test("一覧の中で押すと値が入れ替わる", async ({ page }) => {
    const preview = await openClickToggle(page);
    const before = await readSignal(preview);

    await pressButton(page, preview);

    const after = await readSignal(preview);
    expect(after, `押しても値が変わらない (前 "${before}" 後 "${after}")`).not.toBe(before);
  });

  test("2 回押すと元に戻る", async ({ page }) => {
    const preview = await openClickToggle(page);
    const before = await readSignal(preview);

    await pressButton(page, preview);
    const mid = await readSignal(preview);
    expect(mid, "1 回目で変わっていない").not.toBe(before);

    await pressButton(page, preview);
    const after = await readSignal(preview);
    expect(after, `2 回押しても戻らない (前 "${before}" 後 "${after}")`).toBe(before);
  });

  test("拡大表示でも押して動く", async ({ page }) => {
    // 描画の起動口は一覧の中と拡大表示の 2 つある。 片方だけ受け取り手を渡すと、
    // もう片方が「押しても動かない」 まま残る
    await openClickToggle(page);
    await page.getByRole("button", { name: /拡大表示$/ }).first().click();
    await page.waitForTimeout(500);

    const modal = page.locator(".cdl-modal-content");
    await expect(modal).toBeVisible();
    const before = await readSignal(modal);

    await pressButton(page, modal);

    const after = await readSignal(modal);
    expect(after, `拡大表示で押しても値が変わらない (前 "${before}" 後 "${after}")`).not.toBe(before);
  });
});
