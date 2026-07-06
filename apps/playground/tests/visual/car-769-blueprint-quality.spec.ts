/**
 * CAR-769 = Blueprint theme を Circuit pattern (CAR-741) で流用完成、 Round 11 意図まで到達。
 *
 * Circuit theme 完璧化 (CAR-741, task #147) の pattern を Blueprint section にそのまま流用し、
 * (a) CSS var 上書き経路 (b) 子孫 selector 経路 (c) 全 role !important 明示 の 3 経路を成立させる。
 *
 * Round 11 意図の視覚経路を computed style で pin する 9 軸:
 *
 *   軸 A: node-body fill = rgb(255, 255, 255) (#ffffff 純白 blueprint paper)
 *          stroke = rgb(30, 66, 108) (#1e426c navy blueprint ink)
 *          stroke-width = 1 (Round 11 意図 = 細い罫線相当)
 *   軸 B: node-label fill = rgb(30, 66, 108) (navy)
 *          stroke = none (親 g からの inherit 阻止)
 *          font-family = Inter / Söhne (heading web-safe fallback)
 *          font-weight = 700
 *   軸 C: edge-line stroke = rgb(30, 66, 108) (navy)
 *          stroke-width = 1
 *          fill = none
 *   軸 D: edge-label fill = rgb(139, 58, 31) (#8b3a1f rust rev codes accent)
 *          font-family = JetBrains Mono / monospace
 *   軸 E: generic.tsx の g 直下 path/ellipse も 純白 surface に override
 *          (task #147 と同型の regression pin、 white fallback 混入検出 = 逆に white 期待)
 *   軸 F: CSS var --cdl-node-fill / --cdl-tone-accent / --cdl-text が root に上書き適用
 *   軸 G: node-kind-icon path fill = #1e426c navy 統一
 *   軸 H: svg[data-cdl-theme="blueprint"] background-image に graticule linear-gradient 適用
 *          (SVG root 全域に 16px grid overlay が乗る Round 11 意図)
 *   軸 I: lane-label letter-spacing = 0.14em + text-transform = uppercase
 *
 * getComputedStyle 経路で attribute-only test では捕捉できない「実 render 到達」 を保証する。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

const CATALOG_URL = "/catalog/presets";

async function waitStable(page: Page): Promise<void> {
  await waitForAllCdlDiagrams(page);
  await page.evaluate(() => document.fonts.ready);
  // 追加待ち = webfont 実 render 反映 (font-family 反映 → computed style)
  await page.waitForTimeout(400);
}

test.describe("CAR-769 Blueprint theme quality regression (Round 11 意図 pin)", () => {
  test("軸 A-1: node-body rect fill = #ffffff (blueprint paper 純白)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe("rgb(255, 255, 255)");
  });

  test("軸 A-2: node-body rect stroke = #1e426c navy + stroke-width = 1", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { stroke: cs.stroke, width: cs.strokeWidth };
      });
    expect(result.stroke).toBe("rgb(30, 66, 108)");
    // stroke-width は "1" or "1px" (browser normalize 差) を吸収
    expect(result.width).toMatch(/^1(?:px)?$/);
  });

  test("軸 B: node-label fill = navy + font-family = Inter/Söhne + font-weight = 700", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="node-label"]'));
      if (labels.length === 0) return null;
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(30, 66, 108)",
          strokeNone: /^(none|rgba?\(0,\s*0,\s*0,?\s*0?\)?|)$/.test(cs.stroke),
          fontOk: /Inter|Söhne|Sohne/i.test(cs.fontFamily),
          weightOk: cs.fontWeight === "700",
        };
      });
      return {
        total: stats.length,
        fillOk: stats.filter((s) => s.fillOk).length,
        strokeNone: stats.filter((s) => s.strokeNone).length,
        fontOk: stats.filter((s) => s.fontOk).length,
        weightOk: stats.filter((s) => s.weightOk).length,
      };
    });
    expect(result).not.toBeNull();
    expect(result!.total).toBeGreaterThan(0);
    expect(result!.fillOk).toBe(result!.total);
    expect(result!.strokeNone).toBe(result!.total);
    expect(result!.fontOk).toBe(result!.total);
    expect(result!.weightOk).toBe(result!.total);
  });

  test("軸 C: edge-line stroke = navy + stroke-width = 1 + fill = none", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page
      .locator('path[data-cdl-role="edge-line"], line[data-cdl-role="edge-line"]')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { stroke: cs.stroke, width: cs.strokeWidth, fill: cs.fill };
      });
    expect(result.stroke).toBe("rgb(30, 66, 108)");
    expect(result.width).toMatch(/^1(?:px)?$/);
    expect(result.fill).toMatch(/^(none|rgba?\(0,\s*0,\s*0,?\s*0?\)?)$/);
  });

  test("軸 D: edge-label fill = #8b3a1f rust + font-weight = 700 (rev codes 感)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="edge-label"]'));
      if (labels.length === 0) return null;
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(139, 58, 31)",
          weightOk: cs.fontWeight === "700",
        };
      });
      return {
        total: stats.length,
        fillOk: stats.filter((s) => s.fillOk).length,
        weightOk: stats.filter((s) => s.weightOk).length,
      };
    });
    // catalog/presets には edge label pill を持つ preset があるはず (swimlane / classDiagram 等)
    // font-family は engine 側 (Inter 相当) 継承 = CSS で monospace 強制すると catalog/patterns の
    // fan-out で overlap 発生 (overlap-detector.spec.ts、 layout engine が sans 幅で positioning する
    // ため mono 幅化で node × edge-label 重なり)。 rev codes 感は fill (rust) + weight (700) で表現。
    if (result !== null && result.total > 0) {
      expect(result.fillOk).toBe(result.total);
      expect(result.weightOk).toBe(result.total);
    }
  });

  test("軸 E: generic.tsx の g 直下 path/ellipse も 純白 surface に override (regression pin)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      // <g data-cdl-role="node-body"> 直下の shape 全てを枚挙。
      // node-kind-icon 配下は accent (navy fill) が別 rule で適用されるため除外。
      const raw = Array.from(
        document.querySelectorAll(
          [
            'g[data-cdl-role="node-body"] > path',
            'g[data-cdl-role="node-body"] > g > path',
            'g[data-cdl-role="node-body"] > g > ellipse',
            'g[data-cdl-role="node-body"] > g > circle',
            'g[data-cdl-role="node-body"] > rect',
          ].join(","),
        ),
      );
      const shapes = raw.filter((el) => !el.closest('[data-cdl-role="node-kind-icon"]'));
      const fills = new Map<string, number>();
      shapes.forEach((el) => {
        const f = getComputedStyle(el).fill;
        fills.set(f, (fills.get(f) ?? 0) + 1);
      });
      return {
        total: shapes.length,
        fills: Object.fromEntries(fills),
      };
    });
    expect(result.total).toBeGreaterThan(0);
    // 全 shape が 純白 (#ffffff = rgb(255, 255, 255)) で描画 (旧 #f6faff 混入検出)
    expect(result.fills["rgb(255, 255, 255)"]).toBe(result.total);
    // 旧 blueprint fill (rgb(246, 250, 255) = #f6faff) が 1 つも無い
    expect(result.fills["rgb(246, 250, 255)"]).toBeUndefined();
  });

  test("軸 F: CSS var --cdl-node-fill / --cdl-text / --cdl-tone-accent が root に上書き適用", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-cdl-theme="blueprint"]');
      if (!svg) return null;
      const cs = getComputedStyle(svg);
      return {
        nodeFill: cs.getPropertyValue("--cdl-node-fill").trim(),
        textColor: cs.getPropertyValue("--cdl-text").trim(),
        toneAccent: cs.getPropertyValue("--cdl-tone-accent").trim(),
        labelText: cs.getPropertyValue("--cdl-label-text").trim(),
      };
    });
    expect(result).not.toBeNull();
    expect(result?.nodeFill).toBe("#ffffff");
    expect(result?.textColor).toBe("#1e426c");
    expect(result?.toneAccent).toBe("#1e426c");
    // rev codes accent = rust (edge-label 用)
    expect(result?.labelText).toBe("#8b3a1f");
  });

  test("軸 G: node-kind-icon path fill = #1e426c navy 統一", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const icons = Array.from(
        document.querySelectorAll('[data-cdl-role="node-kind-icon"] path'),
      );
      if (icons.length === 0) return null;
      const fills = icons.map((el) => getComputedStyle(el).fill);
      const matched = fills.filter((f) => f === "rgb(30, 66, 108)").length;
      return { total: icons.length, matched };
    });
    // GenericNode を使う preset がある想定 (topology / class 等)
    if (result !== null && result.total > 0) {
      expect(result.matched).toBe(result.total);
    }
  });

  test("軸 H: graticule 背景 (SVG root + preview wrapper) に linear-gradient 適用 (Round 11 意図)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    // catalog では `.nm-preset-preview` (SVG parent) 側に graticule を適用する経路。
    // SVG element 直接には Chromium の spec 曖昧性 + PresetCard の `.nm-preset-preview svg
    // { background: transparent !important }` があるため、 parent wrapper 検査で
    // 実 render を pin する。
    const result = await page.evaluate(() => {
      const wrapper = document.querySelector(
        '.nm-preset-preview:has(svg[data-cdl-theme="blueprint"])',
      );
      if (!wrapper) return null;
      const cs = getComputedStyle(wrapper);
      return {
        bgImage: cs.backgroundImage,
        bgSize: cs.backgroundSize,
      };
    });
    expect(result).not.toBeNull();
    // linear-gradient 2 段 (縦 + 横) が入る = "linear-gradient" 2 回出現
    const bgImage = result!.bgImage;
    const linearCount = (bgImage.match(/linear-gradient/g) ?? []).length;
    expect(linearCount).toBe(2);
    // rgba(30, 66, 108, 0.05) navy 色が含まれる (light mode)
    expect(bgImage).toMatch(/rgba?\(30,\s*66,\s*108,\s*0?\.05\)/);
    // 16px grid size
    expect(result!.bgSize).toMatch(/16px\s+16px/);
  });

  test("軸 I: lane-label letter-spacing = 0.14em + text-transform = uppercase", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="lane-label"]'));
      if (labels.length === 0) return null;
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          spacing: cs.letterSpacing,
          transform: cs.textTransform,
        };
      });
      return {
        total: stats.length,
        // font-size は engine 継承 (stage.tsx:120 = 20px)、 letter-spacing 0.14em = 20 * 0.14 = 2.8px
        spacingOk: stats.filter((s) => {
          const val = parseFloat(s.spacing);
          return Math.abs(val - 2.8) < 0.1;
        }).length,
        transformOk: stats.filter((s) => s.transform === "uppercase").length,
      };
    });
    // catalog に swimlane preset が含まれる想定
    if (result !== null && result.total > 0) {
      expect(result.spacingOk).toBe(result.total);
      expect(result.transformOk).toBe(result.total);
    }
  });
});
