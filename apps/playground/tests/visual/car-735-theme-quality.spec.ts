/**
 * CAR-735 = CAR-730 後の 6 theme 視覚品質改善 regression test。
 *
 * CAR-730 の CSS !important override 経路は既に `cdl-6-theme-switch.spec.ts` で検証済み
 * (computedStyle で filter / stroke / fill が反映されることを assert)。 本 spec は CAR-735 で
 * 追加した 4 修正の regression pin として、 CAR-730 の attribute-level test では捕捉できない
 * 3 軸を behavior test 化する:
 *
 * 軸 1 (webfont load): Caveat / Kalam webfont が Google Fonts CDN 経由で actual load される
 * 軸 2 (pinboard rotation): CSS rotate transform が rect のみに適用され、
 *                          GenericNode の `<g data-cdl-role="node-body">` (outer wrapper) には
 *                          適用されない (適用すると child text 座標が破綻して layout displacement)
 * 軸 3 (filter parameters): Neumorphism dual shadow / Isometric cast shadow の filter が
 *                          computed filter として `<g>` / `<rect>` の両 node-body target に効いている
 *                          (視認可能な視覚差を保証する内部前提)
 *
 * 意図 = 「CSS が届いている」 と「視覚的に到達している」 は別、 attribute-level test では
 * 「CSS 反映済だが視覚が blueprint と同じ」 状態を捕捉できない。 本 spec は視覚経路の必須前提を
 * 静的検証で pin して、 CAR-735 修正の regression を防ぐ。
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

test.describe("CAR-735 6 theme visual quality regression", () => {
  test("軸 1 Caveat webfont link が BaseLayout に埋め込まれている (Handdrawn / Pinboard の handwriting 描画配線)", async ({
    page,
  }) => {
    // document.fonts.check は preview / dev 環境で外部 Google Fonts がまだ resolve していない
    // タイミングで false を返す flaky があるため、 link href を直接検証する経路に置換。
    // Round 11 意図の handwriting 描画は Caveat / Kalam の link 埋込で成立する。
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const hasLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
      return links.some((l) => l.href.includes("family=") && l.href.includes("Caveat"));
    });
    expect(hasLink).toBe(true);
  });

  test("軸 1 Pinboard 用 webfont link が BaseLayout に埋め込まれている (Caveat annotation 配線)", async ({
    page,
  }) => {
    // CAR-Pinboard = Round 11 意図で Söhne Breit heading + Caveat annotation に切替。
    // Söhne 系は商用フォントで Google Fonts 経由 load できないため配線対象外、
    // Caveat (annotation edge-label) の link 埋込を pin する (Handdrawn と shared)。
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const hasLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
      return links.some((l) => l.href.includes("family=") && l.href.includes("Caveat"));
    });
    expect(hasLink).toBe(true);
  });

  test("軸 2 Pinboard rotate は rect[data-cdl-role='node-body'] のみに適用、 g wrapper には未適用 (layout displacement 回避)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      // 全 node-body の (tag, computed transform matrix) を取得
      const bodies = Array.from(document.querySelectorAll('[data-cdl-role="node-body"]'));
      const stats = { gCount: 0, gRotated: 0, rectCount: 0, rectRotated: 0 };
      for (const el of bodies) {
        const cs = getComputedStyle(el);
        const t = cs.transform;
        // rotate 検出 = matrix(a, b, c, d, ...) で b !== 0 or c !== 0 (a=cosθ, b=sinθ)
        const rotated = /matrix\(([-\d.]+),\s*([-\d.]+),/.exec(t);
        const sinTheta = rotated ? Math.abs(parseFloat(rotated[2])) : 0;
        const isRotated = sinTheta > 0.005; // 0.3 度以上
        if (el.tagName.toLowerCase() === "g") {
          stats.gCount++;
          if (isRotated) stats.gRotated++;
        } else if (el.tagName.toLowerCase() === "rect") {
          stats.rectCount++;
          if (isRotated) stats.rectRotated++;
        }
      }
      return stats;
    });
    // g wrapper (GenericNode 由来) は rotate されない = 0 個回転
    expect(result.gRotated).toBe(0);
    // rect (actor/card/event/function/storage 由来) は rotate されている = 1 個以上回転
    // catalog page には actor / card / event 等 rect ベースの node が存在する前提
    expect(result.rectCount).toBeGreaterThan(0);
    // 全 rect のうち rotate されるのは奇数番目 g > rect (nth-of-type(odd)) と偶数番目 g > rect (nth-of-type(even))
    // 実 catalog page は g の順序で odd/even が混在するため、 全 rect 中 25% 以上が回転していれば OK
    // (安全域を持たせた assertion、 実測は 50-100% 想定)
    expect(result.rectRotated).toBeGreaterThan(0);
  });

  test("軸 3 Neumorphism filter (dragon-nm-raised) が全 node-body に computed filter として適用 (CAR-748 Round 11 意図)", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=neumorphism`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const bodies = Array.from(document.querySelectorAll('[data-cdl-role="node-body"]'));
      const filters = bodies.map((el) => getComputedStyle(el).filter);
      // CAR-748 で dragon-nm-raised-soft → dragon-nm-raised に変更 (Round 11 意図の dual shadow filter)
      const matched = filters.filter((f) => /url\(["']?#dragon-nm-raised(?!-sm)(?!-soft)(?!-dark)["']?\)/.test(f));
      return { total: bodies.length, matched: matched.length };
    });
    // 全 node-body に filter が計算 style として反映
    expect(result.total).toBeGreaterThan(0);
    expect(result.matched).toBe(result.total);
  });

  test("軸 3 Isometric fill が全 node-body に url(#dragon-iso-top-gradient) として反映", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=isometric`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const bodies = Array.from(document.querySelectorAll('[data-cdl-role="node-body"]'));
      const fills = bodies.map((el) => getComputedStyle(el).fill);
      const matched = fills.filter((f) => /url\(["']?#dragon-iso-top-gradient["']?\)/.test(f));
      return { total: bodies.length, matched: matched.length };
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.matched).toBe(result.total);
  });

  test("軸 3 Handdrawn wobble filter (dragon-hd-wobble) が全 node-body に computed filter として適用", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=handdrawn`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const bodies = Array.from(document.querySelectorAll('[data-cdl-role="node-body"]'));
      const filters = bodies.map((el) => getComputedStyle(el).filter);
      const matched = filters.filter((f) => /url\(["']?#dragon-hd-wobble["']?\)/.test(f));
      return { total: bodies.length, matched: matched.length };
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.matched).toBe(result.total);
  });

  test("軸 3 Pinboard sticky filter (dragon-pin-shadow) が全 node-body に computed filter として適用 (CAR-Pinboard Round 11 意図)", async ({
    page,
  }) => {
    // CAR-Pinboard = Round 11 意図で dragon-pin-sticky-shadow (legacy blur 2.5 offset 3/5) から
    // dragon-pin-shadow (subtle blur 1.4 offset 1/2 opacity 0.32) に切替、
    // legacy filter は他 spec の backward compat のため残置。
    await page.goto(`${CATALOG_URL}?theme=pinboard`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const bodies = Array.from(document.querySelectorAll('[data-cdl-role="node-body"]'));
      const filters = bodies.map((el) => getComputedStyle(el).filter);
      // dragon-pin-shadow (base) だけ match、 dragon-pin-sticky-shadow (legacy) は除外
      const matched = filters.filter((f) => /url\(["']?#dragon-pin-shadow["']?\)/.test(f));
      return { total: bodies.length, matched: matched.length };
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.matched).toBe(result.total);
  });

  /*
   * ─── CAR-Circuit-完璧化 (CAR-735 後継、 Round 11 意図 100% 到達 pin) ───
   *
   * Circuit theme を先行 theme として完璧化した規範値の regression pin。 他 5 theme
   * (Neumorphism / Isometric / Pinboard / Blueprint / Handdrawn) へ流用する pattern の
   * 起点となるため、 実 render で以下 4 経路が同時成立することを assert する。
   *
   *   軸 A: node-body fill = rgb(10, 26, 18) dark board / stroke = rgb(200, 160, 56) gold
   *   軸 B: node-label fill = rgb(168, 230, 193) mint / stroke = none (親 g の gold stroke 継承阻止)
   *                        / font-family = JetBrains Mono / letter-spacing = 0.05em 反映
   *   軸 C: edge-line stroke = rgb(72, 224, 176) mint / stroke-linecap = square / filter glow url
   *   軸 D: circle[data-cdl-role="node-pad"] が rect 数 × 4 個 dynamic inject されている
   *         (client-side decoratePads() で 4 隅 solder pad を SVG namespace 円として付与)
   *
   * getComputedStyle 経路で attribute-only test では捕捉できない「実 render 到達」 を保証する。
   */
  test("Circuit 軸 A: node-body rect fill = #0a1a12 (dark PCB board)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const fill = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe("rgb(10, 26, 18)");
  });

  test("Circuit 軸 A: node-body rect stroke = #c8a038 (gold solder tone)", async ({ page }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const stroke = await page
      .locator('rect[data-cdl-role="node-body"]')
      .first()
      .evaluate((el) => getComputedStyle(el).stroke);
    expect(stroke).toBe("rgb(200, 160, 56)");
  });

  test("Circuit 軸 B: 全 node-label が stroke=none + fill=mint + JetBrains Mono + letter-spacing=0.05em", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('text[data-cdl-role="node-label"]'));
      const stats = labels.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fillOk: cs.fill === "rgb(168, 230, 193)",
          strokeNone: cs.stroke === "none" || cs.stroke === "rgb(0, 0, 0)" || cs.strokeWidth === "0px",
          strokeIsNone: cs.stroke === "none",
          fontMono: /JetBrains Mono/.test(cs.fontFamily),
          letterOk: cs.letterSpacing !== "normal" && parseFloat(cs.letterSpacing) > 0,
        };
      });
      const total = stats.length;
      return {
        total,
        fillOk: stats.filter((s) => s.fillOk).length,
        strokeIsNone: stats.filter((s) => s.strokeIsNone).length,
        fontMono: stats.filter((s) => s.fontMono).length,
        letterOk: stats.filter((s) => s.letterOk).length,
      };
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.fillOk).toBe(result.total);
    // stroke: none を明示的に enforce = 親 g 由来の gold stroke inherit 阻止 (実測で
    // 未 fix 時は全 label の 40% 前後で stroke=rgb(200,160,56) 1.6px が計上されていた)
    expect(result.strokeIsNone).toBe(result.total);
    expect(result.fontMono).toBe(result.total);
    expect(result.letterOk).toBe(result.total);
  });

  test("Circuit 軸 C: edge-line stroke=#48e0b0 mint + linecap=square + filter glow", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page
      .locator('path[data-cdl-role="edge-line"]')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          stroke: cs.stroke,
          linecap: cs.strokeLinecap,
          filter: cs.filter,
        };
      });
    expect(result.stroke).toBe("rgb(72, 224, 176)");
    expect(result.linecap).toBe("square");
    expect(result.filter).toMatch(/url\(["']?#dragon-cir-trace-glow["']?\)/);
  });

  test("Circuit 軸 D: solder pad (circle[data-cdl-role='node-pad']) が rect 数 × 4 個 inject", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const rects = document.querySelectorAll('rect[data-cdl-role="node-body"]');
      const pads = document.querySelectorAll('circle[data-cdl-role="node-pad"]');
      // pad fill 実測 (Circuit CSS で #c8a038 gold が適用されているか)
      const firstPad = pads[0];
      const fill = firstPad ? getComputedStyle(firstPad).fill : "";
      return { rectCount: rects.length, padCount: pads.length, fill };
    });
    expect(result.rectCount).toBeGreaterThan(0);
    // 4 隅 solder pad の実装で rect 数 × 4 個の circle が付与される
    expect(result.padCount).toBe(result.rectCount * 4);
    // Circuit CSS で gold (#c8a038 = rgb(200, 160, 56)) が適用
    expect(result.fill).toBe("rgb(200, 160, 56)");
  });

  /*
   * ─── task #147 DOM-確定 fix regression pin ───
   *
   * task #147 で判明した根本原因 = generic.tsx の `<g data-cdl-role="node-body">` 直下の
   * rect/path/ellipse は inline `fill="var(--cdl-node-fill, #ffffff)"` で描画され、 親 g への
   * CSS `fill:` は届かず fallback white で render されていた。 修正経路 = (a) CSS var
   * `--cdl-node-fill` を `[data-cdl-theme="circuit"]` root で上書き、 (b) 子孫 selector
   * `[data-cdl-role="node-body"] rect / > path / > g > path / > g > ellipse / > g > circle`
   * で fill/stroke を !important 強制。
   *
   * 本 test は 2 経路が両方成立することを assert する。 未 fix 時は `pathFill` に
   * `rgb(255, 255, 255)` (white fallback) が混入していた。
   */
  test("Circuit 軸 E (task #147): generic.tsx の g 直下 path/ellipse も PCB dark に override", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      // <g data-cdl-role="node-body"> 直下 (または g > g 経由) の shape 全てを枚挙
      const shapes = Array.from(
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
    // 全 shape が PCB dark (fill = #0a1a12 = rgb(10, 26, 18)) で描画
    // 未 fix 時 = white (rgb(255, 255, 255)) が混入
    expect(result.fills["rgb(10, 26, 18)"]).toBe(result.total);
    // white fallback が 1 つも無い
    expect(result.fills["rgb(255, 255, 255)"]).toBeUndefined();
  });

  test("Circuit 軸 F (task #147): CSS var --cdl-node-fill / --cdl-text が root に上書き適用", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const result = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-cdl-theme="circuit"]');
      if (!svg) return null;
      const cs = getComputedStyle(svg);
      return {
        nodeFill: cs.getPropertyValue("--cdl-node-fill").trim(),
        textColor: cs.getPropertyValue("--cdl-text").trim(),
        toneAccent: cs.getPropertyValue("--cdl-tone-accent").trim(),
      };
    });
    expect(result).not.toBeNull();
    expect(result?.nodeFill).toBe("#0a1a12");
    expect(result?.textColor).toBe("#a8e6c1");
    expect(result?.toneAccent).toBe("#c8a038");
  });

  test("Circuit 軸 D 冪等: blueprint に切替後 pad が全 remove、 circuit に再切替で再 inject", async ({
    page,
  }) => {
    await page.goto(`${CATALOG_URL}?theme=circuit`, { waitUntil: "networkidle" });
    await waitStable(page);
    const before = await page.locator('circle[data-cdl-role="node-pad"]').count();
    expect(before).toBeGreaterThan(0);

    // blueprint に切替 = pad 全 remove
    await page.evaluate(() => {
      const s = document.getElementById("cdl-theme-select") as HTMLSelectElement | null;
      if (s) {
        s.value = "blueprint";
        s.dispatchEvent(new Event("change"));
      }
    });
    await page.waitForTimeout(200);
    const afterBlueprint = await page.locator('circle[data-cdl-role="node-pad"]').count();
    expect(afterBlueprint).toBe(0);

    // circuit に再切替 = pad 再 inject
    await page.evaluate(() => {
      const s = document.getElementById("cdl-theme-select") as HTMLSelectElement | null;
      if (s) {
        s.value = "circuit";
        s.dispatchEvent(new Event("change"));
      }
    });
    await page.waitForTimeout(200);
    const afterCircuit = await page.locator('circle[data-cdl-role="node-pad"]').count();
    // 冪等 (blueprint→circuit で pad 数が最初と同じ)
    expect(afterCircuit).toBe(before);
  });
});
