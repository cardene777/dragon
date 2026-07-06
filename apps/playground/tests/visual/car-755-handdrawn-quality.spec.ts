/**
 * CAR-755 = Handdrawn theme を Circuit pattern (CAR-741) で流用完成、 Round 11 意図まで到達。
 *
 * 前 PR #148 (bf6ab63) を PR #154 (2b4ae69) で revert した後、 本 PR で再実装。
 * Circuit theme 完璧化 (CAR-741, task #147) の pattern を Handdrawn section にそのまま流用し、
 * (a) CSS var 上書き経路 (b) 子孫 selector 経路 (c) 全 role !important 明示 の 3 経路を成立させる。
 *
 * Round 11 意図の視覚経路を computed style で pin する 8 軸:
 *
 *   軸 A: node-body fill = rgb(253, 247, 217) (#fdf7d9 sticky yellow surface)
 *          stroke = rgb(44, 40, 32) (#2c2820 ink border)
 *          filter = url(#dragon-hd-wobble) (turbulence displacement)
 *   軸 B: node-label fill = rgb(44, 40, 32) (#2c2820 ink text)
 *          stroke = none (親 g からの inherit 阻止)
 *          font-family = Caveat 系 (cursive handdrawn)
 *   軸 C: edge-line stroke = rgb(44, 40, 32) (#2c2820 ink)
 *          stroke-linecap = round
 *          fill = none
 *          filter = url(#dragon-hd-wobble)
 *   軸 D: edge-label fill = rgb(169, 74, 58) (#a94a3a marker red accent)
 *          font-family = Caveat 系 (cursive)
 *   軸 E: generic.tsx の g 直下 path/ellipse も sticky yellow surface に override
 *          (task #147 と同型の regression pin、 white fallback 混入検出)
 *   軸 F: CSS var --cdl-node-fill / --cdl-tone-accent / --cdl-text が root に上書き適用
 *   軸 G: node-kind-icon path fill = #a94a3a marker red (accent 統一)
 *   軸 H: default (blueprint) 見た目維持 (blueprint node-body fill = #f6faff)
 *
 * getComputedStyle 経路で attribute-only test では捕捉できない「実 render 到達」 を保証する。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

const CATALOG_URL = "/catalog/presets";

async function waitStable(page: Page): Promise<void> {
  await waitForAllCdlDiagrams(page);
  await page.evaluate(() => document.fonts.ready);
  // catalog/presets は client:load thumbnail が下 fold に多数並ぶため、 全 SVG が
  // rect[data-cdl-role="node-body"] を含むまで追加待機する (CAR-N-neumorphism-icon-badge と同 pattern)。
  await page.waitForFunction(
    () => document.querySelectorAll('rect[data-cdl-role="node-body"]').length > 0,
    undefined,
    { timeout: 10_000 },
  );
  // 追加待ち = webfont 実 render 反映 (Caveat font 読込 → font-family 反映)
  await page.waitForTimeout(400);
}

test.describe("CAR-755 Handdrawn theme quality regression (Round 11 意図 pin)", () => {
  test("軸 A-1: node-body rect fill = #fdf7d9 (sticky yellow surface)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe("rgb(253, 247, 217)");
  });

  test("軸 A-2: node-body rect stroke = #2c2820 (ink border)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const stroke = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).stroke);
    expect(stroke).toBe("rgb(44, 40, 32)");
  });

  test("軸 A-3: node-body rect filter = url(#dragon-hd-wobble) (turbulence displacement)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const filter = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toMatch(/url\(["']?#dragon-hd-wobble["']?\)/);
  });

  test("軸 B: 全 node-label が stroke=none + fill=ink + Caveat cursive font", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="node-label"]'));
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(44, 40, 32)",
          strokeIsNone: cs.stroke === "none",
          fontCaveat: /Caveat|Bradley Hand|Comic Sans MS|cursive/i.test(cs.fontFamily),
        };
      });
      const total = stats.length;
      return {
        total,
        fillOk: stats.filter((s) => s.fillOk).length,
        strokeIsNone: stats.filter((s) => s.strokeIsNone).length,
        fontCaveat: stats.filter((s) => s.fontCaveat).length,
      };
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.fillOk).toBe(result.total);
    // 親 g 由来の stroke inherit 阻止
    expect(result.strokeIsNone).toBe(result.total);
    // font-family 宣言に Caveat / cursive family が含まれる
    expect(result.fontCaveat).toBe(result.total);
  });

  test("軸 C: edge-line stroke = #2c2820 ink + linecap=round + fill=none + wobble filter", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
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
          filter: cs.filter,
        };
      });
    expect(result.stroke).toBe("rgb(44, 40, 32)");
    expect(result.linecap).toBe("round");
    expect(result.fill).toMatch(/^(none|rgba?\(0,\s*0,\s*0,?\s*0?\)?)$/);
    expect(result.filter).toMatch(/url\(["']?#dragon-hd-wobble["']?\)/);
  });

  test("軸 D: edge-label fill = #a94a3a marker red + Caveat cursive font", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="edge-label"]'));
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(169, 74, 58)",
          fontCaveat: /Caveat|Bradley Hand|Comic Sans MS|cursive/i.test(cs.fontFamily),
        };
      });
      return {
        total: stats.length,
        fillOk: stats.filter((s) => s.fillOk).length,
        fontCaveat: stats.filter((s) => s.fontCaveat).length,
      };
    });
    // catalog/presets には edge label pill を持つ preset (flow / sequence / classDiagram 等) が
    // 必ず存在する想定 = 0 件早期 return を許容しない (Codex review MINOR fix、 regression pin 強化)
    expect(result.total).toBeGreaterThan(0);
    expect(result.fillOk).toBe(result.total);
    expect(result.fontCaveat).toBe(result.total);
  });

  test("軸 E: generic.tsx の g 直下 path/ellipse/circle も sticky yellow に override (white fallback 検出)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
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
      // icon path (別 fill 適用) は集合から除外
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
    // 全 shape が sticky yellow (fill = #fdf7d9 = rgb(253, 247, 217)) で描画
    expect(result.fills["rgb(253, 247, 217)"]).toBe(result.total);
    // white fallback が 1 つも無い
    expect(result.fills["rgb(255, 255, 255)"]).toBeUndefined();
  });

  test("軸 F: CSS var --cdl-node-fill / --cdl-text / --cdl-tone-accent が root に上書き適用", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-cdl-theme="handdrawn"]');
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
    expect(result?.textColor).toBe("#2c2820");
    expect(result?.toneAccent).toBe("#a94a3a");
  });

  test("軸 G: node-kind-icon path fill = #a94a3a marker red (accent 統一)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const icons = Array.from(
        document.querySelectorAll('[data-cdl-role="node-kind-icon"] path'),
      );
      const fills = icons.map((el) => getComputedStyle(el).fill);
      const matched = fills.filter((f) => f === "rgb(169, 74, 58)").length;
      return { total: icons.length, matched };
    });
    // GenericNode を使う preset (topology / class / er 等) が catalog/presets に必ず存在する想定 =
    // 0 件早期 return を許容しない (Codex review MINOR fix、 regression pin 強化)
    expect(result.total).toBeGreaterThan(0);
    expect(result.matched).toBe(result.total);
  });

  test("軸 H: default (blueprint) 見た目維持 = blueprint node-body fill = #f6faff", async ({
    page,
  }) => {
    // Handdrawn CSS 変更が blueprint (default) を巻き込んでいない regression pin
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe("rgb(246, 250, 255)");
  });
});
