/**
 * canvas pivot PR-B behavior test (dragon canvas pivot spec §product-spec-redefinition)。
 *
 * spec 対応:
 * - spec 項目 1 = 自由移動 (drag body で DSL posX/posY 書出し)
 * - spec 項目 2 = 自由 resize (四隅 handle drag で DSL posW/posH 書出し)
 * - spec 項目 3 = 図単位 resize (図境界四隅 handle は PR-C 以降で拡張)
 *
 * baseURL 4323、 dev-server は外部で起動必要。
 */
import { test, expect, type Page } from "@playwright/test";

async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector(".cm-content")?.textContent ?? "");
}

test.describe("canvas pivot PR-B drag / resize", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.waitForSelector(".v4-editor-preview svg [data-cdl-lane]", { timeout: 10000 });
  });

  test("T1 = lane を drag すると DSL に posX/posY が write back される (spec 項目 1)", async ({ page }) => {
    const before = await getEditorText(page);
    // sequence の 最初 lane の bounding rect を取得
    const lane = await page.$('[data-cdl-lane]');
    expect(lane).not.toBeNull();
    const box = await lane!.boundingBox();
    expect(box).not.toBeNull();
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;
    // +200/+50 CSS px drag
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(startX + 200 * i / 15, startY + 50 * i / 15);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(800);
    const after = await getEditorText(page);
    // DSL 側に posX/posY が現れることを確認
    const hasPos = /posX\s*:\s*-?\d+/.test(after) && /posY\s*:\s*-?\d+/.test(after);
    expect(hasPos, `expected posX/posY in DSL after drag, got:\n${after.slice(0, 500)}`).toBe(true);
    // before と後で DSL が変わったこと
    expect(after).not.toBe(before);
  });

  test("T2 = 1 lane drag で 全 lane が DSL に posX pinning される (spec 独立性、 SVG unit 保証)", async ({ page }) => {
    const lanes = await page.$$('[data-cdl-lane]');
    expect(lanes.length).toBeGreaterThanOrEqual(2);
    const box1 = await lanes[0].boundingBox();
    expect(box1).not.toBeNull();

    // 1 lane を +100/+30 drag
    await page.mouse.move(box1!.x + box1!.width / 2, box1!.y + box1!.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(box1!.x + box1!.width / 2 + 100 * i / 10, box1!.y + box1!.height / 2 + 30 * i / 10);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(1200);

    // 全 actor に posX/Y が pinning されていることを DSL で確認 = SVG unit 座標保護 SSOT
    const dsl = await getEditorText(page);
    const actorEntries = ["Client", "API", "DB"];
    for (const name of actorEntries) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`${escaped}\\s*:\\s*\\{[^}]*posX\\s*:`);
      expect(re.test(dsl), `expected ${name} to have posX in DSL after drag, got:\n${dsl.slice(0, 500)}`).toBe(true);
    }
  });

  test("T3 = drop 直後に元位置に戻らない (spec 座標保持)", async ({ page }) => {
    const lane = await page.$('[data-cdl-lane]');
    expect(lane).not.toBeNull();
    const boxBefore = await lane!.boundingBox();
    expect(boxBefore).not.toBeNull();
    const startX = boxBefore!.x + boxBefore!.width / 2;
    const startY = boxBefore!.y + boxBefore!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(startX + 150 * i / 15, startY + 40 * i / 15);
      await page.waitForTimeout(15);
    }
    await page.mouse.up();
    await page.waitForTimeout(1200);
    const boxAfter = await lane!.boundingBox();
    expect(boxAfter).not.toBeNull();
    // 元位置と 差分が > 20 CSS px = drop 後の位置保持
    const dx = Math.abs(boxAfter!.x - boxBefore!.x);
    const dy = Math.abs(boxAfter!.y - boxBefore!.y);
    expect(dx + dy).toBeGreaterThan(30);
  });
});
