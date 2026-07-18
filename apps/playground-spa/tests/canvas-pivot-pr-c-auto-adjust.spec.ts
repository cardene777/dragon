/**
 * canvas pivot PR-C behavior test (dragon canvas pivot spec §4 + §5)。
 *
 * spec 対応:
 * - spec §4 = 図内 drag = 自動調整 (他 preset element の transient shift、 DSL 書込みなし)
 * - spec §5 = Command bypass (Command 押下中は自動調整無効)
 *
 * baseURL 4323、 dev-server 起動必要。
 */
import { test, expect, type Page } from "@playwright/test";

test.describe("canvas pivot PR-C auto adjust", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.waitForSelector(".v4-editor-preview svg [data-cdl-lane]", { timeout: 10000 });
  });

  test("T1 = drag 中に他 lane に auto-adjust-shift 属性が付く (spec §4)", async ({ page }) => {
    const lanes = await page.$$('[data-cdl-lane]');
    expect(lanes.length).toBeGreaterThanOrEqual(2);
    const box1 = await lanes[0].boundingBox();
    expect(box1).not.toBeNull();
    const box2Before = await lanes[1].boundingBox();
    expect(box2Before).not.toBeNull();

    // 1 lane を 2 lane に重なる位置まで drag
    const startX = box1!.x + box1!.width / 2;
    const startY = box1!.y + box1!.height / 2;
    const overlapX = box2Before!.x + box2Before!.width / 2;
    const overlapY = startY;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // 途中で auto-adjust が発火することを確認するため drag 途中の attribute をチェック
    let sawShift = false;
    for (let i = 1; i <= 20; i++) {
      const nx = startX + (overlapX - startX) * i / 20;
      const ny = startY + (overlapY - startY) * i / 20;
      await page.mouse.move(nx, ny);
      await page.waitForTimeout(20);
      if (!sawShift) {
        const cnt = await page.evaluate(() => document.querySelectorAll('[data-auto-adjust-shift="1"]').length);
        if (cnt > 0) sawShift = true;
      }
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(sawShift, "expected some element to have data-auto-adjust-shift during drag").toBe(true);
  });

  test("T2 = drop 後に auto-adjust-shift 属性が全 clear (transient shift)", async ({ page }) => {
    const lanes = await page.$$('[data-cdl-lane]');
    expect(lanes.length).toBeGreaterThanOrEqual(2);
    const box1 = await lanes[0].boundingBox();
    const box2 = await lanes[1].boundingBox();
    const startX = box1!.x + box1!.width / 2;
    const startY = box1!.y + box1!.height / 2;
    const overlapX = box2!.x + box2!.width / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(startX + (overlapX - startX) * i / 15, startY);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    const cnt = await page.evaluate(() => document.querySelectorAll('[data-auto-adjust-shift="1"]').length);
    expect(cnt).toBe(0);
  });

  test("T3 = Command 押下中は auto-adjust-shift が発火しない (spec §5 bypass)", async ({ page }) => {
    const lanes = await page.$$('[data-cdl-lane]');
    const box1 = await lanes[0].boundingBox();
    const box2 = await lanes[1].boundingBox();
    const startX = box1!.x + box1!.width / 2;
    const startY = box1!.y + box1!.height / 2;
    const overlapX = box2!.x + box2!.width / 2;

    await page.keyboard.down("Meta");
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    let sawShift = false;
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(startX + (overlapX - startX) * i / 15, startY);
      await page.waitForTimeout(20);
      const cnt = await page.evaluate(() => document.querySelectorAll('[data-auto-adjust-shift="1"]').length);
      if (cnt > 0) sawShift = true;
    }
    await page.mouse.up();
    await page.keyboard.up("Meta");
    expect(sawShift, "Command bypass should suppress auto-adjust-shift").toBe(false);
  });
});
