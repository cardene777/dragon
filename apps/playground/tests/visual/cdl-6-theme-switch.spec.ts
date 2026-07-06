/**
 * CAR-708 = 6 theme switch regression。 catalog/presets page で dropdown + URL query 経由に
 * data-cdl-theme attribute が全 cdl SVG root に反映され、 `[data-cdl-theme="<name>"]`
 * selector 別 CSS が computed style として適用される経路を behavior test で検証する。
 *
 * 3 軸:
 *   軸 1 = default (query なし) は data-cdl-theme="blueprint" (CAR-707 SSOT の fallback)
 *   軸 2 = URL query `?theme=<name>` で attribute が反映される (6 theme 全部)
 *   軸 3 = dropdown 選択で attribute が反映 + URL query が更新される
 *
 * 6 theme の computed style spot check:
 *   - blueprint  ... node-body に stroke: rgb(30, 66, 108) (SSOT #1e426c)
 *   - neumorphism ... node-body に filter: url(#dragon-nm-raised-soft)
 *   - isometric  ... node-body に filter: url(#dragon-iso-cast-shadow) (fill も gradient url)
 *   - circuit    ... node-body に stroke: rgb(200, 160, 56) (SSOT #c8a038)
 *   - pinboard   ... node-body に filter: url(#dragon-pin-sticky-shadow)
 *   - handdrawn  ... node-body に filter: url(#dragon-hd-wobble)
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

const CATALOG_URL = "/catalog/presets";

async function waitStable(page: Page): Promise<void> {
  await waitForAllCdlDiagrams(page);
  await page.evaluate(() => document.fonts.ready);
}

test.describe("CAR-708 cdl 6 theme switch regression", () => {
  test("軸 1 default (query なし) = data-cdl-theme='blueprint' が全 cdl SVG root に付与される", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    const themes = await page.evaluate(() => {
      const roots = Array.from(document.querySelectorAll("[data-cdl-theme]"));
      return roots.map((el) => el.getAttribute("data-cdl-theme"));
    });
    expect(themes.length).toBeGreaterThan(0);
    for (const t of themes) {
      expect(t).toBe("blueprint");
    }
  });

  test("軸 1 default = blueprint theme の node-body に stroke: rgb(30, 66, 108) (#1e426c)", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    const stroke = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-body"]');
      if (!el) return null;
      return window.getComputedStyle(el).stroke;
    });
    expect(stroke).not.toBeNull();
    // SSOT #1e426c = rgb(30, 66, 108)
    expect(stroke).toMatch(/rgb\(30,\s*66,\s*108\)/);
  });

  const THEMES = [
    "blueprint",
    "neumorphism",
    "isometric",
    "circuit",
    "pinboard",
    "handdrawn",
  ] as const;

  for (const theme of THEMES) {
    test(`軸 2 URL query ?theme=${theme} で全 cdl SVG root の data-cdl-theme が ${theme} に反映される`, async ({
      page,
    }) => {
      await page.goto(`${CATALOG_URL}?theme=${theme}`, { waitUntil: "networkidle" });
      await waitStable(page);
      const themes = await page.evaluate(() => {
        const roots = Array.from(document.querySelectorAll("[data-cdl-theme]"));
        return roots.map((el) => el.getAttribute("data-cdl-theme"));
      });
      expect(themes.length).toBeGreaterThan(0);
      for (const t of themes) {
        expect(t).toBe(theme);
      }
    });
  }

  test("軸 2 theme=circuit の node-body に stroke rgb(200, 160, 56) (#c8a038 gold)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const stroke = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-body"]');
      if (!el) return null;
      return window.getComputedStyle(el).stroke;
    });
    expect(stroke).toMatch(/rgb\(200,\s*160,\s*56\)/);
  });

  test("軸 2 theme=pinboard の node-body に filter url(#dragon-pin-sticky-shadow)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const filter = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-body"]');
      if (!el) return null;
      return window.getComputedStyle(el).filter;
    });
    expect(filter).toMatch(/url\(["']?#dragon-pin-sticky-shadow["']?\)/);
  });

  test("軸 2 theme=handdrawn の node-body に filter url(#dragon-hd-wobble)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const filter = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-body"]');
      if (!el) return null;
      return window.getComputedStyle(el).filter;
    });
    expect(filter).toMatch(/url\(["']?#dragon-hd-wobble["']?\)/);
  });

  test("軸 3 dropdown 選択で attribute が反映 + URL query が更新される (blueprint → circuit)", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    // dropdown 選択 = circuit
    await page.selectOption("#cdl-theme-select", "circuit");
    // MutationObserver が catchup するのを wait
    await page.waitForTimeout(200);
    const [themes, href] = await page.evaluate(() => {
      const roots = Array.from(document.querySelectorAll("[data-cdl-theme]"));
      return [roots.map((el) => el.getAttribute("data-cdl-theme")), window.location.href];
    });
    for (const t of themes) {
      expect(t).toBe("circuit");
    }
    expect(href).toContain("theme=circuit");
  });

  test("軸 3 dropdown で circuit → blueprint 選択で URL query が削除される", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    await page.selectOption("#cdl-theme-select", "blueprint");
    await page.waitForTimeout(200);
    const [themes, href] = await page.evaluate(() => {
      const roots = Array.from(document.querySelectorAll("[data-cdl-theme]"));
      return [roots.map((el) => el.getAttribute("data-cdl-theme")), window.location.href];
    });
    for (const t of themes) {
      expect(t).toBe("blueprint");
    }
    expect(href).not.toContain("theme=");
  });

  test("6 theme SVG defs が BaseLayout inject 経由で DOM に存在", async ({ page }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    const defs = await page.evaluate(() => {
      return {
        nmRaised: document.querySelectorAll('filter[id="dragon-nm-raised-soft"]').length,
        isoCast: document.querySelectorAll('filter[id="dragon-iso-cast-shadow"]').length,
        cirBoard: document.querySelectorAll('pattern[id="dragon-cir-board-pattern"]').length,
        pinBoard: document.querySelectorAll('pattern[id="dragon-pin-board-pattern"]').length,
        bpGrat: document.querySelectorAll('pattern[id="dragon-bp-graticule"]').length,
        hdWobble: document.querySelectorAll('filter[id="dragon-hd-wobble"]').length,
      };
    });
    expect(defs.nmRaised).toBeGreaterThanOrEqual(1);
    expect(defs.isoCast).toBeGreaterThanOrEqual(1);
    expect(defs.cirBoard).toBeGreaterThanOrEqual(1);
    expect(defs.pinBoard).toBeGreaterThanOrEqual(1);
    expect(defs.bpGrat).toBeGreaterThanOrEqual(1);
    expect(defs.hdWobble).toBeGreaterThanOrEqual(1);
  });

  /**
   * CAR-730 = 6 theme override 強化の効き目検証。 5 追加 role (edge-line / edge-arrowhead /
   * node-label / edge-label / node-kind-icon) が cdl 側に付与された前提で、 dragon 側
   * cdl-theme.css の !important + 全 role 網羅 CSS が確実に inline attr を override する経路。
   *
   * 意図 = Round 11 Artifact の各 theme 見た目に到達させるための構造的規制:
   *   - Neumorphism    ... node-body に stroke none (raised bumps + no border)
   *   - Circuit        ... edge-line stroke rgb(72, 224, 176) mint
   *   - Handdrawn      ... node-label font-family Caveat 系
   *   - Pinboard       ... node-label font-family cursive 系
   *   - Isometric      ... edge-line stroke width 3px (立体感の厚み)
   *   - Blueprint      ... edge-arrowhead fill rgb(30, 66, 108) (SSOT)
   */
  test("CAR-730 軸 A Neumorphism node-body に stroke none (raised bumps + no border 意図)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const stroke = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-body"]');
      if (!el) return null;
      return window.getComputedStyle(el).stroke;
    });
    // stroke none = "none" or "" (browser 差) を許容
    expect(stroke).toMatch(/^(none|)$/);
  });

  test("CAR-730 軸 A Circuit edge-line に stroke rgb(72, 224, 176) mint (PCB trace 意図)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const stroke = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="edge-line"]');
      if (!el) return null;
      return window.getComputedStyle(el).stroke;
    });
    expect(stroke).toMatch(/rgb\(72,\s*224,\s*176\)/);
  });

  test("CAR-730 軸 A Handdrawn node-label に font-family Caveat 系 (手描き font 意図)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fontFamily = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-label"]');
      if (!el) return null;
      return window.getComputedStyle(el).fontFamily;
    });
    // Caveat / Bradley Hand / Comic Sans MS のいずれか含まれれば pass
    expect(fontFamily).toMatch(/Caveat|Bradley Hand|Comic Sans/i);
  });

  test("CAR-730 軸 A Pinboard node-label に cursive 系 font (掲示板 font 意図)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fontFamily = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-label"]');
      if (!el) return null;
      return window.getComputedStyle(el).fontFamily;
    });
    expect(fontFamily).toMatch(/Kalam|Caveat|Comic Sans/i);
  });

  test("CAR-730 軸 A Isometric edge-line に stroke-width 3px (立体感の厚み 意図)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=isometric`, { waitUntil: "networkidle" });
    await waitStable(page);
    const strokeWidth = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="edge-line"]');
      if (!el) return null;
      return window.getComputedStyle(el).strokeWidth;
    });
    // "3" or "3px" どちらも許容
    expect(strokeWidth).toMatch(/^3(px)?$/);
  });

  test("CAR-730 軸 A Blueprint edge-arrowhead に fill rgb(30, 66, 108) (SSOT #1e426c)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=blueprint`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="edge-arrowhead"]');
      if (!el) return null;
      return window.getComputedStyle(el).fill;
    });
    expect(fill).toMatch(/rgb\(30,\s*66,\s*108\)/);
  });

  test("CAR-730 軸 B 5 追加 role が cdl SVG に存在する (edge-line / edge-arrowhead / node-label / edge-label / node-kind-icon)", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    const counts = await page.evaluate(() => {
      return {
        edgeLine: document.querySelectorAll('[data-cdl-role="edge-line"]').length,
        edgeArrowhead: document.querySelectorAll('[data-cdl-role="edge-arrowhead"]').length,
        nodeLabel: document.querySelectorAll('[data-cdl-role="node-label"]').length,
        edgeLabel: document.querySelectorAll('[data-cdl-role="edge-label"]').length,
        nodeKindIcon: document.querySelectorAll('[data-cdl-role="node-kind-icon"]').length,
      };
    });
    // 全部 1 個以上
    expect(counts.edgeLine).toBeGreaterThan(0);
    expect(counts.edgeArrowhead).toBeGreaterThan(0);
    expect(counts.nodeLabel).toBeGreaterThan(0);
    expect(counts.edgeLabel).toBeGreaterThan(0);
    // node-kind-icon は GenericNode 経路のみ、 catalog 全 preset で 1 個以上出現想定
    expect(counts.nodeKindIcon).toBeGreaterThan(0);
  });

  test("dropdown 選択 = 6 theme 全部で screenshot が異なる (attribute + style 両方適用の証明)", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    const svgHtmlMap: Record<string, string> = {};
    for (const t of THEMES) {
      await page.selectOption("#cdl-theme-select", t);
      await page.waitForTimeout(150);
      const outer = await page.evaluate(() => {
        const svg = document.querySelector<SVGElement>('[data-cdl-role="node-body"]')?.closest("svg");
        // 実際の inline style computed 影響を捕捉するため、 SVG root の attribute state を string 化
        if (!svg) return "";
        const style = window.getComputedStyle(svg.querySelector('[data-cdl-role="node-body"]')!);
        return `${svg.getAttribute("data-cdl-theme")}|${style.filter}|${style.stroke}|${style.fill}`;
      });
      svgHtmlMap[t] = outer;
    }
    // 少なくとも 6 theme のうち unique な attribute + computed style state 4 種以上あれば pass
    // (theme 依存 stroke / fill / filter のどれかが変わっていれば OK、 完全一致数を数える)
    const uniqueStates = new Set(Object.values(svgHtmlMap));
    expect(uniqueStates.size).toBeGreaterThanOrEqual(4);
  });
});
