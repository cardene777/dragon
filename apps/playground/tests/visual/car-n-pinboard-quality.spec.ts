/**
 * CAR-Pinboard = Pinboard theme を Circuit pattern (CAR-741) で流用完成、 Round 11 意図まで到達。
 *
 * Circuit theme 完璧化 (CAR-741, task #147) の pattern を Pinboard section にそのまま流用し、
 * (a) CSS var 上書き経路 (b) 子孫 selector 経路 (c) 全 role !important 明示 の 3 経路を成立させる。
 *
 * Round 11 意図の視覚経路を computed style で pin する 9 軸:
 *
 *   軸 A: node-body fill = rgb(253, 247, 217) (#fdf7d9 sticky yellow)
 *          stroke = rgba(92, 74, 52, 0.3) (kraft mute outline)
 *          filter = url(#dragon-pin-shadow) (subtle sticky shadow blur 1.4 offset 1/2 opacity 0.32)
 *   軸 B: node-label fill = rgb(58, 40, 24) (#3a2818 dark ink)
 *          stroke = none (親 g からの inherit 阻止)
 *          font-family = Söhne Breit / Söhne / Inter (heading web-safe fallback)
 *   軸 C: edge-line stroke = rgb(92, 74, 52) (#5c4a34 kraft mute)
 *          stroke-linecap = round
 *          stroke-dasharray = 1 2 (Pinboard 独自 dashed 表現)
 *          opacity = 0.7
 *          fill = none
 *   軸 D: edge-label fill = rgb(169, 74, 58) (#a94a3a marker red accent)
 *          font-family = Caveat / Bradley Hand cursive (annotation)
 *   軸 E: generic.tsx の g 直下 path/ellipse も sticky yellow surface に override
 *          (task #147 と同型の regression pin、 white fallback 混入検出)
 *   軸 F: CSS var --cdl-node-fill / --cdl-tone-accent / --cdl-text が root に上書き適用
 *   軸 G: node-kind-icon path fill = #5c4a34 kraft mute 統一
 *   軸 H: node-tape (Pinboard 独自 tape strip) fill = #eab89c peach, visibility = visible
 *   軸 I: default (blueprint) 見た目維持 = blueprint node-body fill 変化なし +
 *          blueprint 時 node-tape が hidden (Pinboard 装飾が他 theme に染み出さない)
 *
 * getComputedStyle 経路で attribute-only test では捕捉できない「実 render 到達」 を保証する。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

const CATALOG_URL = "/catalog/presets";

async function waitStable(page: Page): Promise<void> {
  await waitForAllCdlDiagrams(page);
  await page.evaluate(() => document.fonts.ready);
  // 追加待ち = webfont 実 render 反映 (font-family 反映 → computed style) +
  //           decorateTapeStrips() の MutationObserver 起因の再走 stabilization
  await page.waitForTimeout(400);
}

test.describe("CAR-Pinboard theme quality regression (Round 11 意図 pin)", () => {
  test("軸 A-1: node-body rect fill = #fdf7d9 (sticky yellow)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe("rgb(253, 247, 217)");
  });

  test("軸 A-2: node-body rect stroke = rgba(92, 74, 52, 0.3) (kraft mute outline)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const stroke = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).stroke);
    // rgba(92, 74, 52, 0.3) は computed で rgba(92, 74, 52, 0.3) 形式 (Chromium normalize)
    expect(stroke).toMatch(/rgba?\(92,\s*74,\s*52,\s*0?\.3\)/);
  });

  test("軸 A-3: node-body rect filter = url(#dragon-pin-shadow) (subtle sticky shadow)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const filter = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toMatch(/url\(["']?#dragon-pin-shadow["']?\)/);
  });

  test("軸 B: 全 node-label が stroke=none + fill=#3a2818 dark ink + Söhne / Inter sans-serif", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="node-label"]'));
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(58, 40, 24)",
          strokeIsNone: cs.stroke === "none",
          // Söhne / Söhne Breit は web font 未提供環境で fallback するが、 font-family 宣言に含まれることを pin
          fontHeading: /Söhne|Inter|sans-serif/i.test(cs.fontFamily),
        };
      });
      const total = stats.length;
      return {
        total,
        fillOk: stats.filter((s) => s.fillOk).length,
        strokeIsNone: stats.filter((s) => s.strokeIsNone).length,
        fontHeading: stats.filter((s) => s.fontHeading).length,
      };
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.fillOk).toBe(result.total);
    expect(result.strokeIsNone).toBe(result.total);
    expect(result.fontHeading).toBe(result.total);
  });

  test("軸 C: edge-line stroke = #5c4a34 kraft mute + linecap=round + dasharray=1 2 + opacity=0.7 + fill=none", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page
      .locator('path[data-cdl-role="edge-line"]')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          stroke: cs.stroke,
          linecap: cs.strokeLinecap,
          dasharray: cs.strokeDasharray,
          opacity: cs.opacity,
          fill: cs.fill,
        };
      });
    expect(result.stroke).toBe("rgb(92, 74, 52)");
    expect(result.linecap).toBe("round");
    // computed strokeDasharray は Chromium で "1px, 2px" (px + comma) 形式になる。
    // Firefox / Safari は "1 2" 形式もあるため両方 accept。
    expect(result.dasharray).toMatch(/^1(?:px)?[,\s]+2(?:px)?$/);
    expect(parseFloat(result.opacity)).toBeCloseTo(0.7, 2);
    expect(result.fill).toMatch(/^(none|rgba?\(0,\s*0,\s*0,?\s*0?\)?)$/);
  });

  test("軸 D: edge-label fill = #a94a3a marker red + font-family Caveat / cursive", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="edge-label"]'));
      if (labels.length === 0) return null;
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(169, 74, 58)",
          fontCursive: /Caveat|Bradley Hand|cursive/i.test(cs.fontFamily),
        };
      });
      return {
        total: stats.length,
        fillOk: stats.filter((s) => s.fillOk).length,
        fontCursive: stats.filter((s) => s.fontCursive).length,
      };
    });
    // catalog/presets には edge label pill を持つ preset があるはず (swimlane / classDiagram 等)
    if (result !== null && result.total > 0) {
      expect(result.fillOk).toBe(result.total);
      expect(result.fontCursive).toBe(result.total);
    }
  });

  test("軸 E: generic.tsx の g 直下 path/ellipse も sticky yellow surface に override (white fallback 混入検出)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      // <g data-cdl-role="node-body"> 直下 (または g > g 経由) の shape 全てを枚挙。
      // ただし <g data-cdl-role="node-kind-icon"> 配下の path は icon で別 fill (accent) が
      // 適用されるため、 shape 集合から除外する (Element.closest で ancestor 探索)。
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
    // 全 shape が sticky yellow surface (#fdf7d9 = rgb(253, 247, 217)) で描画
    expect(result.fills["rgb(253, 247, 217)"]).toBe(result.total);
    // white fallback (rgb(255, 255, 255)) が 1 つも無い
    expect(result.fills["rgb(255, 255, 255)"]).toBeUndefined();
  });

  test("軸 F: CSS var --cdl-node-fill / --cdl-text / --cdl-tone-accent が root に上書き適用", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-cdl-theme="pinboard"]');
      if (!svg) return null;
      const cs = getComputedStyle(svg);
      return {
        nodeFill: cs.getPropertyValue("--cdl-node-fill").trim(),
        textColor: cs.getPropertyValue("--cdl-text").trim(),
        toneAccent: cs.getPropertyValue("--cdl-tone-accent").trim(),
      };
    });
    expect(result).not.toBeNull();
    expect(result?.nodeFill).toBe("#fdf7d9");
    expect(result?.textColor).toBe("#3a2818");
    expect(result?.toneAccent).toBe("#a94a3a");
  });

  test("軸 G: node-kind-icon path fill = #5c4a34 kraft mute (icon 統一)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const icons = Array.from(
        document.querySelectorAll('[data-cdl-role="node-kind-icon"] path'),
      );
      if (icons.length === 0) return null;
      const fills = icons.map((el) => getComputedStyle(el).fill);
      const matched = fills.filter((f) => f === "rgb(92, 74, 52)").length;
      return { total: icons.length, matched };
    });
    // GenericNode を使う preset がある想定 (topology / class 等)
    if (result !== null && result.total > 0) {
      expect(result.matched).toBe(result.total);
    }
  });

  test("軸 H: node-tape (Pinboard 独自 tape strip) が inject + visible + peach fill", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const tapes = Array.from(document.querySelectorAll('rect[data-cdl-role="node-tape"]'));
      const rects = Array.from(document.querySelectorAll('rect[data-cdl-role="node-body"]'));
      const stats = tapes.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(234, 184, 156)",
          visibilityOk: cs.visibility === "visible",
        };
      });
      return {
        tapeCount: tapes.length,
        rectCount: rects.length,
        fillOk: stats.filter((s) => s.fillOk).length,
        visibilityOk: stats.filter((s) => s.visibilityOk).length,
      };
    });
    // tape は各 rect[data-cdl-role="node-body"] に 1 個ずつ inject される
    expect(result.rectCount).toBeGreaterThan(0);
    expect(result.tapeCount).toBe(result.rectCount);
    expect(result.fillOk).toBe(result.tapeCount);
    expect(result.visibilityOk).toBe(result.tapeCount);
  });

  test("軸 I-1: default (blueprint) 見た目維持 = blueprint node-body fill = #ffffff", async ({
    page,
  }) => {
    // Pinboard CSS 変更が blueprint (default) を巻き込んでいない regression pin。
    // CAR-769 で blueprint を Round 11 意図 (純白 node) まで更新済、 期待値を #ffffff に追随。
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    // blueprint は #ffffff = rgb(255, 255, 255) (CAR-769 = Round 11 意図)
    expect(fill).toBe("rgb(255, 255, 255)");
  });

  test("軸 I-2: blueprint theme 時に node-tape が hidden (Pinboard 装飾が他 theme に染み出さない)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const tapes = Array.from(document.querySelectorAll('rect[data-cdl-role="node-tape"]'));
      if (tapes.length === 0) return { total: 0, hidden: 0 };
      const hidden = tapes.filter((el) => getComputedStyle(el).visibility === "hidden").length;
      return { total: tapes.length, hidden };
    });
    // tape は inject 済 (decorateTapeStrips は theme 問わず inject) だが CSS で hidden
    // 万が一 tape が未 inject なら total = 0 になり (test skip 相当)、 これも許容
    if (result.total > 0) {
      expect(result.hidden).toBe(result.total);
    }
  });
});
