/**
 * CAR-748 = Neumorphism theme を Circuit pattern (CAR-741) で流用完成、 Round 11 意図まで到達。
 *
 * Circuit theme 完璧化 (CAR-741, task #147) の pattern を Neumorphism section にそのまま流用し、
 * (a) CSS var 上書き経路 (b) 子孫 selector 経路 (c) 全 role !important 明示 の 3 経路を成立させる。
 *
 * Round 11 意図の視覚経路を computed style で pin する 6 軸:
 *
 *   軸 A: node-body fill = rgb(230, 235, 240) (#e6ebf0 blue-grey surface)
 *          stroke = none (raised bumps + no border 意図)
 *          filter = url(#dragon-nm-raised) (dual shadow)
 *   軸 B: node-label fill = rgb(58, 61, 71) (#3a3d47 dark text)
 *          stroke = none (親 g からの inherit 阻止)
 *          font-family = Söhne / Inter 系
 *   軸 C: edge-line stroke = rgb(74, 127, 200) (#4a7fc8 cool blue)
 *          stroke-linecap = round
 *          fill = none
 *   軸 D: edge-label fill = rgb(74, 127, 200) (#4a7fc8 cool blue)
 *          font-family = JetBrains Mono / monospace
 *   軸 E: generic.tsx の g 直下 path/ellipse も blue-grey surface に override
 *          (task #147 と同型の regression pin、 white fallback 混入検出)
 *   軸 F: CSS var --cdl-node-fill / --cdl-tone-accent / --cdl-text が root に上書き適用
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

test.describe("CAR-748 Neumorphism theme quality regression (Round 11 意図 pin)", () => {
  test("軸 A-1: node-body rect fill = #e6ebf0 (blue-grey monolithic surface)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe("rgb(230, 235, 240)");
  });

  test("軸 A-2: node-body rect stroke = none (raised bumps + no border 意図)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const stroke = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).stroke);
    // stroke none = "none" / "" / "rgb(0,0,0)" + stroke-width 0 の browser 差を吸収
    expect(stroke).toMatch(/^(none|rgba?\(0,\s*0,\s*0,?\s*0?\)?|)$/);
  });

  test("軸 A-3: node-body rect filter = url(#dragon-nm-raised) (Round 11 dual shadow)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const filter = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).filter);
    // #dragon-nm-raised (末尾に -sm / -dark / -soft が付かない主 filter を pin)
    expect(filter).toMatch(/url\(["']?#dragon-nm-raised(?!-sm)(?!-soft)(?!-dark)["']?\)/);
  });

  test("軸 B: 全 node-label が stroke=none + fill=dark text + Söhne / Inter 系 font", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="node-label"]'));
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(58, 61, 71)",
          strokeIsNone: cs.stroke === "none",
          fontSohneOrInter: /Söhne|Inter/i.test(cs.fontFamily),
        };
      });
      const total = stats.length;
      return {
        total,
        fillOk: stats.filter((s) => s.fillOk).length,
        strokeIsNone: stats.filter((s) => s.strokeIsNone).length,
        fontSohneOrInter: stats.filter((s) => s.fontSohneOrInter).length,
      };
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.fillOk).toBe(result.total);
    // 親 g 由来の stroke inherit 阻止
    expect(result.strokeIsNone).toBe(result.total);
    // Söhne はライセンス font のため大半のブラウザで fallback = Inter に落ちる
    // font-family 宣言に Söhne / Inter が含まれる = family 名が反映されていることを pin
    expect(result.fontSohneOrInter).toBe(result.total);
  });

  test("軸 C: edge-line stroke = #4a7fc8 cool blue + linecap=round + fill=none", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page
      .locator('path[data-cdl-role="edge-line"]')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          stroke: cs.stroke,
          linecap: cs.strokeLinecap,
          fill: cs.fill,
        };
      });
    expect(result.stroke).toBe("rgb(74, 127, 200)");
    expect(result.linecap).toBe("round");
    // fill = none / rgb(0,0,0,0) 相当 (path で fill が edge line の下地を作らない)
    expect(result.fill).toMatch(/^(none|rgba?\(0,\s*0,\s*0,?\s*0?\)?)$/);
  });

  test("軸 D: edge-label fill = #4a7fc8 cool blue + font-family JetBrains Mono / monospace", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="edge-label"]'));
      if (labels.length === 0) return null;
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(74, 127, 200)",
          fontMono: /JetBrains Mono|Söhne Mono|ui-monospace|SFMono|monospace/i.test(cs.fontFamily),
        };
      });
      return {
        total: stats.length,
        fillOk: stats.filter((s) => s.fillOk).length,
        fontMono: stats.filter((s) => s.fontMono).length,
      };
    });
    // catalog/presets には edge label pill を持つ preset があるはず (swimlane / classDiagram 等)
    if (result !== null && result.total > 0) {
      expect(result.fillOk).toBe(result.total);
      expect(result.fontMono).toBe(result.total);
    }
  });

  test("軸 E: generic.tsx の g 直下 path/ellipse も blue-grey surface に override (white fallback 混入検出)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
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
    // shape が 1 個以上 (topology / class / er 等 GenericNode 使用 preset 存在前提)
    expect(result.total).toBeGreaterThan(0);
    // 全 shape が blue-grey surface (fill = #e6ebf0 = rgb(230, 235, 240)) で描画
    // 未 fix 時 = white (rgb(255, 255, 255)) が混入
    expect(result.fills["rgb(230, 235, 240)"]).toBe(result.total);
    // white fallback が 1 つも無い
    expect(result.fills["rgb(255, 255, 255)"]).toBeUndefined();
  });

  test("軸 F: CSS var --cdl-node-fill / --cdl-text / --cdl-tone-accent が root に上書き適用", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-cdl-theme="neumorphism"]');
      if (!svg) return null;
      const cs = getComputedStyle(svg);
      return {
        nodeFill: cs.getPropertyValue("--cdl-node-fill").trim(),
        textColor: cs.getPropertyValue("--cdl-text").trim(),
        toneAccent: cs.getPropertyValue("--cdl-tone-accent").trim(),
      };
    });
    expect(result).not.toBeNull();
    expect(result?.nodeFill).toBe("#e6ebf0");
    expect(result?.textColor).toBe("#3a3d47");
    expect(result?.toneAccent).toBe("#4a7fc8");
  });

  test("軸 G: node-kind-icon path fill = #4a7fc8 cool blue (accent 統一)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const icons = Array.from(
        document.querySelectorAll('[data-cdl-role="node-kind-icon"] path'),
      );
      if (icons.length === 0) return null;
      const fills = icons.map((el) => getComputedStyle(el).fill);
      const matched = fills.filter((f) => f === "rgb(74, 127, 200)").length;
      return { total: icons.length, matched };
    });
    // GenericNode を使う preset がある想定 (topology / class 等)
    if (result !== null && result.total > 0) {
      expect(result.matched).toBe(result.total);
    }
  });

  test("軸 H: default (blueprint) 見た目維持 = blueprint node-body fill = #ffffff", async ({
    page,
  }) => {
    // Neumorphism CSS 変更が blueprint (default) を巻き込んでいない regression pin
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    // blueprint は #ffffff = rgb(255, 255, 255) (CAR-769 = Round 11 意図)
    expect(fill).toBe("rgb(255, 255, 255)");
  });
});
