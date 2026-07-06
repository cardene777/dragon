/**
 * CAR-N = Neumorphism theme の node kind icon 囲み丸を Round 11 意図 (24x24 → 40x40 raised
 * circular badge) まで拡大する regression pin。
 *
 * 現状 bug = kind icon (laptop / gear / DB glyph) の背景 rect が transparent + 24x24 で、
 * icon glyph だけが浮いた状態、 Round 11 の意図 raised bump badge が反映されていない。
 *
 * fix = cdl-theme.css の Neumorphism section に以下 rule 追加:
 *   [data-cdl-role="node-kind-icon"] > rect
 *     x=-8px / y=-8px / w=40px / h=40px / rx=ry=20px / fill=#e6ebf0 / filter=dragon-nm-raised-sm
 *   [data-cdl-role="node-kind-icon"] > path
 *     transform=translate(-8px, -8px) scale(1.67) で 24x24 → 40x40 に等方拡大
 *     fill=#4a7fc8 (blue accent)
 *
 * 3 軸で computed style pin:
 *   軸 A: rect 寸法 = 40x40, rx=20, x=-8, y=-8 (円形 badge)
 *   軸 B: rect filter = dragon-nm-raised-sm (soft dual shadow)
 *   軸 C: path fill = rgb(74, 127, 200) (#4a7fc8 blue accent)
 *
 * SVG width/height CSS override は unit less (`width: 40`) だと Chromium で無視される
 * ことがあるため、 明示 `40px` 単位で書く必要がある (2026-07 実測で確認)。 本 test は
 * 単位付き CSS が届いていることを computed style で保証する。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

const CATALOG_URL = "/catalog/presets";

async function waitStable(page: Page): Promise<void> {
  await waitForAllCdlDiagrams(page);
  await page.evaluate(() => document.fonts.ready);
  // catalog/presets は client:load thumbnail が下 fold に多数並ぶため、
  // 全 SVG が [data-cdl-role="node-kind-icon"] を含むまで追加待機する。
  // GenericNode を使う preset (topology / class / er 系) が最低 1 個 hydrate 完了する保証。
  await page.waitForFunction(
    () => document.querySelectorAll('[data-cdl-role="node-kind-icon"] > rect').length > 0,
    undefined,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(400);
}

test.describe("CAR-N Neumorphism kind icon badge (24 → 40 raised circular badge)", () => {
  test("軸 A: node-kind-icon > rect が 40x40 円形 badge (x=-8, y=-8, rx=ry=20)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const rects = Array.from(
        document.querySelectorAll('[data-cdl-role="node-kind-icon"] > rect'),
      );
      if (rects.length === 0) return null;
      const stats = rects.map((el) => {
        const cs = getComputedStyle(el);
        return {
          width: cs.width,
          height: cs.height,
          x: cs.x,
          y: cs.y,
          rx: cs.rx,
          ry: cs.ry,
        };
      });
      const w40 = stats.filter((s) => s.width === "40px").length;
      const h40 = stats.filter((s) => s.height === "40px").length;
      const xMinus8 = stats.filter((s) => s.x === "-8px").length;
      const yMinus8 = stats.filter((s) => s.y === "-8px").length;
      const rx20 = stats.filter((s) => s.rx === "20px").length;
      const ry20 = stats.filter((s) => s.ry === "20px").length;
      return {
        total: stats.length,
        w40,
        h40,
        xMinus8,
        yMinus8,
        rx20,
        ry20,
      };
    });
    // GenericNode を使う preset (topology / class / er 等) で kind-icon rect が存在
    expect(result).not.toBeNull();
    expect(result!.total).toBeGreaterThan(0);
    expect(result!.w40).toBe(result!.total);
    expect(result!.h40).toBe(result!.total);
    expect(result!.xMinus8).toBe(result!.total);
    expect(result!.yMinus8).toBe(result!.total);
    expect(result!.rx20).toBe(result!.total);
    expect(result!.ry20).toBe(result!.total);
  });

  test("軸 B: node-kind-icon > rect fill = #e6ebf0 + filter = dragon-nm-raised-sm", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const rects = Array.from(
        document.querySelectorAll('[data-cdl-role="node-kind-icon"] > rect'),
      );
      if (rects.length === 0) return null;
      const stats = rects.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fill: cs.fill,
          filter: cs.filter,
        };
      });
      return {
        total: stats.length,
        fillOk: stats.filter((s) => s.fill === "rgb(230, 235, 240)").length,
        // filter は url("#dragon-nm-raised-sm") (SVG small variant) を pin。
        // -sm-dark / -soft は他 filter なので混入しないことを確認。
        filterOk: stats.filter((s) => /url\(["']?#dragon-nm-raised-sm(?!-dark)["']?\)/.test(s.filter))
          .length,
      };
    });
    expect(result).not.toBeNull();
    expect(result!.total).toBeGreaterThan(0);
    expect(result!.fillOk).toBe(result!.total);
    expect(result!.filterOk).toBe(result!.total);
  });

  test("軸 C: node-kind-icon > path fill = #4a7fc8 (blue accent glyph)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const paths = Array.from(
        document.querySelectorAll('[data-cdl-role="node-kind-icon"] > path'),
      );
      if (paths.length === 0) return null;
      const fills = paths.map((el) => getComputedStyle(el).fill);
      return {
        total: fills.length,
        matched: fills.filter((f) => f === "rgb(74, 127, 200)").length,
      };
    });
    expect(result).not.toBeNull();
    expect(result!.total).toBeGreaterThan(0);
    expect(result!.matched).toBe(result!.total);
  });

  test("軸 D: 他 theme (blueprint default) の kind icon rect に badge 化影響なし", async ({
    page,
  }) => {
    // Neumorphism 用の badge CSS が [data-cdl-theme="neumorphism"] scope で閉じているか回帰 pin。
    // blueprint theme の kind icon rect は元の 24x24 / fill=transparent を維持するはず。
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const rects = Array.from(
        document.querySelectorAll('[data-cdl-role="node-kind-icon"] > rect'),
      );
      if (rects.length === 0) return null;
      const stats = rects.map((el) => {
        const cs = getComputedStyle(el);
        return {
          width: cs.width,
          height: cs.height,
        };
      });
      return {
        total: stats.length,
        // blueprint では badge 化していない = width は 24px (native attribute 値相当)
        widthNot40: stats.filter((s) => s.width !== "40px").length,
      };
    });
    if (result !== null && result.total > 0) {
      // blueprint theme では badge CSS が発火していない = width が 40px でない
      expect(result.widthNot40).toBe(result.total);
    }
  });
});
