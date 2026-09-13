/**
 * カタログの色味の切替の検証 (#1569)。
 *
 * 配色は 2 組ある (生成りに茶 / 青磁に墨) が、切替が無いと図に書いた方しか見られない。
 * 意匠を決める時は 2 つを見比べるので、見比べる手段そのものを検査で押さえる。
 *
 * ## 押した後の markup を見る
 *
 * 押しものの状態 (`aria-checked`) だけを見ると、掛け忘れても通る。
 * 図の `data-cdl-palette` が実際に変わることを見る。
 *
 * ## 出る側と出ない側の両方を見る
 *
 * 出る側だけだと、全ての図から切替が消えた形でも通る。
 */
import { test, expect, type Page } from "@playwright/test";

/** 見本を id で名指しして開く */
async function 開く(page: Page, slug: string, id: string): Promise<void> {
  await page.goto(`catalog/${slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
  await page.locator(".catalog-list-item").filter({ hasText: id }).first().click();
  await page.waitForSelector(`[data-cdl-diagram="${id}"]`, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
}

/** いま出ている図の配色の名前 */
async function 配色(page: Page, id: string): Promise<string | null> {
  return await page.evaluate((diagramId) => {
    const 舞台 = document.querySelector(`[data-cdl-diagram="${diagramId}"] svg[data-cdl-stage]`);
    return 舞台?.getAttribute("data-cdl-palette") ?? null;
  }, id);
}

const 切替 = (page: Page) => page.locator('[role="radiogroup"][aria-label="図の色味"]');

test("配色を持つ図で色味を切り替えられる (#1569)", async ({ page }) => {
  await 開く(page, "presets", "er-demo");

  await expect(切替(page), "配色を持つ図に切替が出ていない").toBeVisible();
  expect(await 配色(page, "er-demo"), "既定が生成りに茶でない").toBe("kinari");

  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect
    .poll(async () => await 配色(page, "er-demo"), { timeout: 5000 })
    .toBe("celadon");

  await 切替(page).getByRole("radio", { name: "生成りに茶" }).click();
  await expect
    .poll(async () => await 配色(page, "er-demo"), { timeout: 5000 })
    .toBe("kinari");
});

test("クラス図でも切り替えられる (#1569)", async ({ page }) => {
  // ER 図だけを見ると、配色を持つ図が 1 種類しか無い形でも通る
  await 開く(page, "presets", "class-demo");
  await expect(切替(page), "クラス図に切替が出ていない").toBeVisible();

  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect
    .poll(async () => await 配色(page, "class-demo"), { timeout: 5000 })
    .toBe("celadon");
});

test("配色を持たない図では切替が出ない (#1569)", async ({ page }) => {
  /*
   * 出ない側。 配色を書かない図で名前を足すと、site の色で描かれていた図が急に別の色みに
   * なり「見比べる」 ではなく「着せ替える」 道具になる。
   */
  await 開く(page, "presets", "infra-demo");
  expect(await 配色(page, "infra-demo"), "この図が配色を持ってしまっている").toBeNull();
  await expect(切替(page), "配色を持たない図に切替が出ている").toHaveCount(0);
});

test("項目を選び直すと既定へ戻る (#1569)", async ({ page }) => {
  // 残すと、次の図が別の色みで出る理由を見失う (速さ / 描き方 と同じ扱い)
  await 開く(page, "presets", "er-demo");
  await 切替(page).getByRole("radio", { name: "青磁に墨" }).click();
  await expect.poll(async () => await 配色(page, "er-demo"), { timeout: 5000 }).toBe("celadon");

  await page.locator(".catalog-list-item").filter({ hasText: "class-demo" }).first().click();
  await page.waitForSelector('[data-cdl-diagram="class-demo"]', { timeout: 15000 });
  await expect
    .poll(async () => await 配色(page, "class-demo"), { timeout: 5000 })
    .toBe("kinari");
});
