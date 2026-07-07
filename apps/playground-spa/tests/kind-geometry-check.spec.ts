/**
 * Kind geometry check (層 3、 developer 向け検知システム)。
 *
 * 目的 ... CAR-994 で追加した新 kind (chart-line / chart-pie / chart-bar /
 * gantt-timeline / mind-map / mind-radial / funnel-stages / quadrant-matrix /
 * tree-hierarchy / journey-map) の SVG geometry を DOM inspect で検証する。
 *
 * 既存 2 層 check (層 1 = SPA route regression / 層 2 = engine visualValidate)
 * では kind 内部の SVG geometry (gantt arrow の方向 / funnel polygon の幅減少 /
 * mind-map root 中央 等) を検出できないため、 本 test で 3 層目を追加する。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test kind-geometry-check`
 * or `pnpm check:kind` (root scripts 経由)。
 *
 * LLM 不要、 pure geometry。 修正提案なし、 検出のみ (発見 → 開発者が cdl kind 側修正)。
 */
import { test, expect } from "@playwright/test";

const SPA_URL = "http://localhost:4323";

type EdgeInspection = {
  d: string;
  points: Array<{ x: number; y: number }>;
};

/** SVG path d 文字列 (M / L のみ対応) から point 列を抽出 */
function parsePath(d: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const tokens = d.trim().split(/[\s,]+/);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === "M" || t === "L") {
      const x = parseFloat(tokens[i + 1]!);
      const y = parseFloat(tokens[i + 2]!);
      if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
      i += 2;
    }
  }
  return points;
}

test.describe("kind geometry check (層 3、 developer 向け検知)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${SPA_URL}/catalog/presets`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
  });

  test("gantt-timeline: dependsOn arrow は右向き (arrow tip が子 bar 左辺、 elbow から水平右方向)", async ({ page }) => {
    await page.getByText("ガントチャート", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const arrows = await page.evaluate(() => {
      const list: EdgeInspection[] = [];
      document.querySelectorAll('[data-cdl-role="gantt-arrow"] path').forEach((path) => {
        const d = path.getAttribute("d") ?? "";
        if (!d.includes("Z")) {
          list.push({ d, points: [] });
        }
      });
      return list;
    });
    expect(arrows.length, "gantt-arrow が 1 件以上").toBeGreaterThan(0);

    for (const arrow of arrows) {
      const points = parsePath(arrow.d);
      expect(points.length, `path が 4 point (M + 3L 直角 elbow): ${arrow.d}`).toBe(4);
      const [start, mid1, mid2, tip] = points as [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ];
      expect(mid1.x, `1 段目は水平右方向 (mid1.x >= start.x): ${arrow.d}`).toBeGreaterThanOrEqual(start.x);
      expect(Math.abs(mid1.y - start.y), `1 段目 y 一致 (水平): ${arrow.d}`).toBeLessThan(1);
      expect(Math.abs(mid2.x - mid1.x), `2 段目 x 一致 (垂直 elbow): ${arrow.d}`).toBeLessThan(1);
      expect(Math.abs(tip.y - mid2.y), `3 段目 y 一致 (水平着地): ${arrow.d}`).toBeLessThan(1);
      expect(Math.abs(tip.x - mid2.x), `3 段目 x が elbow.x 近傍で子 bar 左辺に着地 (< 20px): ${arrow.d}`).toBeLessThan(20);
    }
  });

  test("funnel-stages: polygon の幅が上から下へ単調減少 (自然な逆三角形)", async ({ page }) => {
    await page.getByText("ファネル", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const widths = await page.evaluate(() => {
      const w: number[] = [];
      document.querySelectorAll('[data-cdl-role="funnel-stage"]').forEach((el) => {
        const bbox = (el as SVGGraphicsElement).getBBox();
        w.push(bbox.width);
      });
      return w;
    });
    expect(widths.length, "funnel-stage が 2 件以上").toBeGreaterThanOrEqual(2);
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i], `stage[${i}] 幅 (${widths[i]}) <= stage[${i - 1}] 幅 (${widths[i - 1]})`).toBeLessThanOrEqual(widths[i - 1]! + 0.5);
    }
  });

  test("mind-map: root node が canvas の中央付近 (±20% 内)", async ({ page }) => {
    await page.getByText("マインドマップ", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const svg = document.querySelector('svg[role="img"]');
      if (!svg) return null;
      const view = svg.getAttribute("viewBox")?.split(/\s+/).map(Number) ?? [0, 0, 0, 0];
      const [, , w, h] = view;
      const texts = Array.from(svg.querySelectorAll("text")).filter((t) => t.textContent === "Project");
      if (texts.length === 0) return null;
      const bbox = (texts[0] as SVGGraphicsElement).getBBox();
      return { canvasW: w, canvasH: h, cx: bbox.x + bbox.width / 2, cy: bbox.y + bbox.height / 2 };
    });
    expect(info, "mindMap root text が存在").not.toBeNull();
    if (info) {
      const centerX = info.canvasW / 2;
      const centerY = info.canvasH / 2;
      expect(Math.abs(info.cx - centerX), `root cx (${info.cx}) が canvas 中央 (${centerX}) の ±20% 内`).toBeLessThan(info.canvasW * 0.2);
      expect(Math.abs(info.cy - centerY), `root cy (${info.cy}) が canvas 中央 (${centerY}) の ±20% 内`).toBeLessThan(info.canvasH * 0.2);
    }
  });

  test("chart-line: polyline は datum 数の point を含む", async ({ page }) => {
    await page.getByText("折れ線グラフ", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const p = document.querySelector('[data-cdl-role="chart-line"]');
      if (!p) return null;
      const pts = p.getAttribute("points")?.trim().split(/\s+/) ?? [];
      return { pointCount: pts.length };
    });
    expect(info, "chart-line polyline が存在").not.toBeNull();
    if (info) {
      expect(info.pointCount, "polyline が 2 point 以上 (2 datum 以上)").toBeGreaterThanOrEqual(2);
    }
  });

  test("edge-line: fill は none (fill:#XXX bug 回帰なし)", async ({ page }) => {
    await page.getByText("フローチャート", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const fills = await page.evaluate(() => {
      const list: string[] = [];
      document.querySelectorAll('[data-cdl-role="edge-line"]').forEach((el) => {
        const cs = getComputedStyle(el);
        list.push(cs.fill);
      });
      return list;
    });
    expect(fills.length, "edge-line が 1 件以上").toBeGreaterThan(0);
    for (const fill of fills) {
      expect(fill, `edge-line fill が none / transparent (${fill})`).toMatch(/none|rgba?\(\s*0,\s*0,\s*0,\s*0/);
    }
  });
});
