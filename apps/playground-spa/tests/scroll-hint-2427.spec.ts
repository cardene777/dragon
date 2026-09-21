/**
 * 続きが隠れている側に手がかりを出す (#2427)。
 *
 * 判定そのものは `src/lib/scroll-edges.test.ts` が 3 つの数で見る。 ここが見るのは
 * **その判定が実際の画面に繋がっているか** = 器の送りを読んで属性が変わり、
 * 溢れない図には付かないこと。
 *
 * `jsdom` では確かめられない (配置を計算しないので `scrollWidth` が常に 0)。
 */
import { test, expect, type Page } from "@playwright/test";

const 台 = ".nm-preset-detail-stage";
const 内側 = ".nm-preset-detail-stage-inner";

const 端 = (page: Page): Promise<string | null> =>
  page.locator(台).first().getAttribute("data-cdl-more");

async function 送る(page: Page, 先: "右端" | "真ん中"): Promise<void> {
  await page.locator(内側).first().evaluate((el, 先) => {
    const 余り = el.scrollWidth - el.clientWidth;
    el.scrollLeft = 先 === "右端" ? 余り : Math.round(余り / 2);
  }, 先);
  await page.waitForTimeout(300);
}

test.describe("続きが隠れている側の手がかり (#2427)", () => {
  test("器に入らない図は、送った位置で手がかりの向きが変わる", async ({ page }) => {
    await page.goto("preset/flow", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    // 空振り防止。 この図が器に入らないことを先に確かめる
    const 余り = await page
      .locator(内側)
      .first()
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(余り, "この図が器に入ってしまっている (検査が空振りしている)").toBeGreaterThan(1);

    await expect.poll(() => 端(page), { timeout: 4000 }).toBe("右");
    await 送る(page, "真ん中");
    expect(await 端(page)).toBe("両方");
    await 送る(page, "右端");
    expect(await 端(page)).toBe("左");
  });

  test("器に入る図には手がかりが付かない", async ({ page }) => {
    // 対照。 付けっぱなしの実装だとここが落ちる
    await page.goto("preset/swimlane", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const 余り = await page
      .locator(内側)
      .first()
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(余り, "対照に選んだ図が器に入っていない").toBeLessThanOrEqual(1);
    expect(await 端(page)).toBeNull();
  });

  test("手がかりの下の箱を押せる", async ({ page }) => {
    // 帯が押す操作を止めると、右端の箱に触れなくなる
    await page.goto("preset/flow", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await 送る(page, "右端");
    await expect.poll(() => 端(page), { timeout: 4000 }).toBe("左");

    const 左の帯 = await page.locator(台).first().evaluate((el) => {
      const cs = getComputedStyle(el, "::before");
      return { content: cs.content, pointerEvents: cs.pointerEvents };
    });
    expect(左の帯.content, "左の手がかりが描かれていない").not.toBe("none");
    expect(左の帯.pointerEvents, "帯が押す操作を止めている").toBe("none");
  });
});
