/**
 * 拡大表示でも続きが隠れている側に手がかりを出す (#2429)。
 *
 * 判定そのものは `src/lib/scroll-edges.test.ts` が 3 つの数で見る (#2427)。
 * ここが見るのは **拡大表示でその判定が画面に繋がっているか** と、
 * **飾りが中身と一緒に流れないか** の 2 つ。
 *
 * 後者がこの Issue の中身。 巻き取る要素と位置の基準を同じ要素に兼ねさせると、
 * `position: absolute` で置いた飾りが図と同じだけ動き、隠れている端を指さなくなる。
 */
import { test, expect, type Page } from "@playwright/test";

const 台 = ".cdl-modal-stage";
const 巻き取り = ".cdl-modal-body";

const 端 = (page: Page): Promise<string | null> => page.locator(台).first().getAttribute("data-cdl-more");

/** 分類を開き、一覧から見本を選んで拡大表示にする */
async function 拡大を開く(page: Page, 分類: string, 見本: string): Promise<void> {
  await page.goto(`catalog/${分類}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page
    .locator("aside.catalog-sidebar .catalog-list-item", { hasText: 見本 })
    .first()
    .click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /を拡大表示$/ }).first().click();
  await page.waitForTimeout(1200);
}

async function 送る(page: Page, 先: "右端" | "真ん中"): Promise<void> {
  await page.locator(巻き取り).first().evaluate((el, 先) => {
    const 余り = el.scrollWidth - el.clientWidth;
    el.scrollLeft = 先 === "右端" ? 余り : Math.round(余り / 2);
  }, 先);
  await page.waitForTimeout(300);
}

test.describe("拡大表示の手がかり (#2429)", () => {
  test("器に入らない図は、送った位置で手がかりの向きが変わる", async ({ page }) => {
    await 拡大を開く(page, "presets", "フロー");

    // 空振り防止。 この図が器に入らないことを先に確かめる
    const 余り = await page
      .locator(巻き取り)
      .first()
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(余り, "この図が器に入ってしまっている (検査が空振りしている)").toBeGreaterThan(1);

    await expect.poll(() => 端(page), { timeout: 4000 }).toBe("右");
    await 送る(page, "真ん中");
    expect(await 端(page)).toBe("両方");
    await 送る(page, "右端");
    expect(await 端(page)).toBe("左");
  });

  test("飾りを持つ要素そのものが巻き取らない", async ({ page }) => {
    // この Issue の中身。 **飾りを持つ要素を探してから測る** = 台を名前で指すと、
    // 飾りが巻き取る側へ戻っても台は巻き取らないままなので素通りする (実測で植え込みが 1 度抜けた)
    await 拡大を開く(page, "presets", "フロー");
    await 送る(page, "右端");

    const 持ち主 = page.locator("[data-cdl-more]").first();
    await expect(持ち主, "飾りを持つ要素が 1 つも無い").toHaveCount(1);

    const 測った = await 持ち主.evaluate((el) => ({
      余り: el.scrollWidth - el.clientWidth,
      送り: el.scrollLeft,
      position: getComputedStyle(el).position,
    }));
    expect(測った.余り, "飾りを持つ要素が巻き取っている (飾りが図と一緒に流れる)").toBeLessThanOrEqual(1);
    expect(測った.送り, "飾りを持つ要素が送られている").toBe(0);
    expect(測った.position, "飾りの位置の基準になっていない").toBe("relative");
  });

  test("器に入る図には手がかりが付かない", async ({ page }) => {
    // 対照。 付けっぱなしの実装だとここが落ちる
    await 拡大を開く(page, "presets", "円グラフ");

    const 余り = await page
      .locator(巻き取り)
      .first()
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(余り, "対照に選んだ図が器に入っていない").toBeLessThanOrEqual(1);
    expect(await 端(page)).toBeNull();
  });
});
