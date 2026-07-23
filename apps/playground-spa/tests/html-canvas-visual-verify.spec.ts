/**
 * HTML div canvas visual verify (CAR-1947 Phase 1 dev server 目視 verify 補助)。
 *
 * `?canvas=html` で editor 起動 → drag 前 / drag 中 / drag 直後 / release 後 300ms の 4 状態を screenshot
 * capture、 AI が目視で 3 条件 (掴んだ点=置いた点 / drag 中 smooth 追従 / release 後 flicker ゼロ) を
 * 判定する経路。 前 session の「Playwright screenshot 1 shot だけで user verify 依頼」 禁止規約に従い、
 * 実装 → AI 目視 verify → user verify 依頼 の順を厳守する。
 *
 * 出力先 = `apps/playground-spa/test-results/html-canvas-visual/*.png` (git ignore、 debug 用途)。
 * 前 session snapshot SSOT = `apps/playground-spa/.context/state/session-snapshot-20260723-164044.md`。
 */
import { test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LANE_SELECTOR = "[data-html-canvas-lane]";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "..", "test-results", "html-canvas-visual");

async function getLaneCenter(page: Page, slug: string): Promise<{ x: number; y: number }> {
  return page.evaluate((s) => {
    const el = document.querySelector(`[data-html-canvas-lane="${s}"]`) as HTMLElement | null;
    if (!el) throw new Error(`lane not found: ${s}`);
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, slug);
}

test.describe("HTML div canvas visual verify (CAR-1947 Phase 1)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (d) => { void d.accept(); });
    await page.goto("/editor", { waitUntil: "networkidle" });
    await page.waitForSelector(LANE_SELECTOR, { timeout: 10000 });
    await page.waitForTimeout(400);
  });

  test("V-1 = 初期状態 (drag 前) の viewport 全体 screenshot", async ({ page }) => {
    await page.screenshot({ path: path.join(OUT_DIR, "01-initial.png"), fullPage: false });
  });

  test("V-2 = drag 中 (mid-drag) の viewport screenshot", async ({ page }) => {
    // 全 lane list を取得、 最初の lane を drag
    const slug = await page.evaluate(() => {
      const el = document.querySelector("[data-html-canvas-lane]") as HTMLElement | null;
      return el?.getAttribute("data-html-canvas-lane") ?? "";
    });
    const start = await getLaneCenter(page, slug);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    // 200px x 60px 分 drag 進行
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(start.x + (200 * i) / 6, start.y + (60 * i) / 6);
      await page.waitForTimeout(20);
    }
    // drag 中に screenshot (mouse.up 前)
    await page.screenshot({ path: path.join(OUT_DIR, "02-mid-drag.png"), fullPage: false });
    await page.mouse.up();
  });

  test("V-3 = release 前 / release 直後 / release+300ms の 3 stage screenshot (Round 2 F6 対応)", async ({ page }) => {
    const slug = await page.evaluate(() => {
      const el = document.querySelector("[data-html-canvas-lane]") as HTMLElement | null;
      return el?.getAttribute("data-html-canvas-lane") ?? "";
    });
    const start = await getLaneCenter(page, slug);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(start.x + (180 * i) / 10, start.y + (50 * i) / 10);
      await page.waitForTimeout(15);
    }
    // F6 対応 = release 前 = mouse.up 前の drag end 状態 (掴んでいる最終位置)
    await page.screenshot({ path: path.join(OUT_DIR, "03-pre-release.png"), fullPage: false });
    await page.mouse.up();
    // release 直後 = DSL write back + React 再 render 経路の直後
    await page.waitForTimeout(16); // 1 frame
    await page.screenshot({ path: path.join(OUT_DIR, "04-release-immediate.png"), fullPage: false });
    // 300ms 後 (flicker window 後、 完全 settle 状態)
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, "05-release-plus-300ms.png"), fullPage: false });
  });
});
