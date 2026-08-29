/**
 * Kind geometry check (層 3、 developer 向け検知システム)。
 *
 * 目的 ... CAR-994 で追加した新 kind (chart-line / chart-pie / chart-bar /
 * gantt-timeline / mind-map / funnel-stages / quadrant-matrix /
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

type EdgeInspection = {
  d: string;
  points: Array<{ x: number; y: number }>;
};

/** SVG path d 文字列 (M / L のみ対応) から point 列を抽出 */
function parsePath(d: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const tokens = d.trim().split(/[\s,]+/);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "M" || t === "L") {
      // 続く 2 つが無い = 並びの終わり。 元の形も `parseFloat(undefined)` が NaN になり
      // push されず、その後に読むものが無いので同じ結果になる
      const xs = tokens[i + 1];
      const ys = tokens[i + 2];
      if (xs === undefined || ys === undefined) break;
      const x = parseFloat(xs);
      const y = parseFloat(ys);
      if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
      i += 2;
    }
  }
  return points;
}

/**
 * gantt の依存の矢印が出るまで待つ (#1357)。
 *
 * 帯を起点から描く段では、矢印は **帯が出揃ってから** 出る (`cdl` の `draw` の仕様)。
 * 固定の待ち時間だと、描いている途中を読んで 0 件になる。
 *
 * 上限を置いて待ち、出なければそのまま先へ進む = 「1 件以上」 の assert がそこで落ちるので、
 * 本当に出ない形は見逃さない。
 */
async function 矢印が出るまで待つ(page: import("@playwright/test").Page): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const n = await page.evaluate(
      () => document.querySelectorAll('[data-cdl-role="gantt-arrow"] path').length,
    );
    if (n > 0) return;
    await page.waitForTimeout(100);
  }
}

test.describe("kind geometry check (層 3、 developer 向け検知)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("catalog/presets", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
  });

  test("gantt-timeline: dependsOn arrow は右向き (arrow tip が子 bar 左辺、 elbow から水平右方向)", async ({ page }) => {
    await page.getByText("ガントチャート", { exact: true }).first().click();
    await page.waitForTimeout(1000);
    // 帯を起点から描く段では、矢印は帯が出揃ってから出る (#1357)
    await 矢印が出るまで待つ(page);

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
      // gantt arrow の path pattern は 2 分岐 (`kinds/gantt.tsx § dependsOn arrow`)
      //   - hasRoom = true  → M+3L (4 point) の直接 elbow 経路 (start → enter → tipY → tip)
      //   - hasRoom = false → M+5L (6 point) の回り込み経路 (start → +elbowGap → midY → enter → tipY → tip)
      // sample の layout で bar 間隔が近い場合は 6 point 経路が採用される (spec-valid)、 test は両対応で
      // 「終端が水平着地」 + 「1 段目は水平右方向」 のみを共通不変量として assert する。
      expect([4, 6], `path point 数は 4 (直接 elbow) or 6 (回り込み) のいずれか: ${arrow.d}`).toContain(points.length);
      const start = points[0]!;
      const secondPt = points[1]!;
      const tip = points[points.length - 1]!;
      const beforeTip = points[points.length - 2]!;
      // 1 段目 = 水平右方向 (start → 第2 point、 y 一致 + x 増加)
      expect(secondPt.x, `1 段目は水平右方向 (>= start.x): ${arrow.d}`).toBeGreaterThanOrEqual(start.x);
      expect(Math.abs(secondPt.y - start.y), `1 段目 y 一致 (水平): ${arrow.d}`).toBeLessThan(1);
      // 終端 = 水平着地 (beforeTip → tip、 y 一致)、 x は enter 近傍 (子 bar 左辺 40px 以内)
      expect(Math.abs(tip.y - beforeTip.y), `終端は水平着地 (y 一致): ${arrow.d}`).toBeLessThan(1);
      expect(Math.abs(tip.x - beforeTip.x), `終端 x が elbow.x 近傍で子 bar 左辺に着地 (< 40px): ${arrow.d}`).toBeLessThan(40);
    }
  });

  test("gantt-timeline: arrow head 三角形の頂点が 子 bar の左辺の 4px 以上外側 (食い込み防止)", async ({ page }) => {
    await page.getByText("ガントチャート", { exact: true }).first().click();
    await page.waitForTimeout(1000);
    // 帯を起点から描く段では、矢印は帯が出揃ってから出る (#1357)
    await 矢印が出るまで待つ(page);

    const info = await page.evaluate(() => {
      const bars: Array<{ left: number; top: number; width: number; height: number }> = [];
      document.querySelectorAll('[data-cdl-role="gantt-bar"]').forEach((b) => {
        bars.push({
          left: parseFloat(b.getAttribute("x") ?? "0"),
          top: parseFloat(b.getAttribute("y") ?? "0"),
          width: parseFloat(b.getAttribute("width") ?? "0"),
          height: parseFloat(b.getAttribute("height") ?? "0"),
        });
      });
      const heads: Array<{ points: Array<{ x: number; y: number }> }> = [];
      document.querySelectorAll('[data-cdl-role="gantt-arrow"] path').forEach((p) => {
        const d = p.getAttribute("d") ?? "";
        if (!d.includes("Z")) return;
        const pts: Array<{ x: number; y: number }> = [];
        const tokens = d.trim().split(/[\s,]+/);
        for (let i = 0; i < tokens.length; i++) {
          const t = tokens[i];
          if (t === "M" || t === "L") {
            const xs = tokens[i + 1];
            const ys = tokens[i + 2];
            if (xs === undefined || ys === undefined) break;
            const x = parseFloat(xs);
            const y = parseFloat(ys);
            if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
            i += 2;
          }
        }
        if (pts.length === 3) heads.push({ points: pts });
      });
      return { bars, heads };
    });

    for (const head of info.heads) {
      const tipRight = Math.max(...head.points.map((p) => p.x));
      const tipY = head.points.reduce((sum, p) => sum + p.y, 0) / head.points.length;
      // tip Y と重なる bar (arrow が着地する対象 bar) を検索
      const targetBar = info.bars.find(
        (b) => tipY >= b.top && tipY <= b.top + b.height,
      );
      expect(
        targetBar,
        `arrow tip Y=${tipY} と重なる bar が見つからない (head points: ${JSON.stringify(head.points)})`,
      ).toBeDefined();
      if (targetBar) {
        const gap = targetBar.left - tipRight;
        expect(
          gap,
          `arrow head 頂点右端 x=${tipRight} と 着地対象 bar 左辺 x=${targetBar.left} の gap (${gap}) が >= 4px (負値 = 食い込み)`,
        ).toBeGreaterThanOrEqual(4);
      }
    }
  });

  test("funnel-stages: polygon の幅が上から下へ単調減少 (自然な逆三角形)", async ({ page }) => {
    await page.getByText("ファネル図", { exact: true }).first().click();
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
      const 今 = widths[i];
      const 前 = widths[i - 1];
      // 上の `toBeGreaterThanOrEqual(2)` が先に落ちるので、ここへは 2 件以上ある時しか来ない
      if (今 === undefined || 前 === undefined) continue;
      expect(今, `stage[${i}] 幅 (${今}) <= stage[${i - 1}] 幅 (${前})`).toBeLessThanOrEqual(前 + 0.5);
    }
  });

  test("mind-map: root node が canvas の中央付近 (±20% 内)", async ({ page }) => {
    await page.getByText("マインドマップ", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const svg = document.querySelector('svg[role="img"]');
      if (!svg) return null;
      const view = svg.getAttribute("viewBox")?.split(/\s+/).map(Number) ?? [0, 0, 0, 0];
      // 4 つ揃わない形は上の `?? [0, 0, 0, 0]` と同じく 0 に落とす (元の挙動と揃える)
      const w = view[2] ?? 0;
      const h = view[3] ?? 0;
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

  test("chart-line: value label が axis tick label と bbox 重ならない (他要素との重なり回避)", async ({ page }) => {
    await page.getByText("折れ線グラフ", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const svg = document.querySelector('svg[role="img"]');
      if (!svg) return null;
      const texts = Array.from(svg.querySelectorAll("text"));
      const valueLabels: Array<{ x: number; y: number; w: number; h: number; t: string }> = [];
      const axisLabels: Array<{ x: number; y: number; w: number; h: number; t: string }> = [];
      texts.forEach((t) => {
        const bb = (t as SVGGraphicsElement).getBBox();
        const content = t.textContent ?? "";
        if (/^[\d,]+$/.test(content) && content.includes(",")) {
          valueLabels.push({ x: bb.x, y: bb.y, w: bb.width, h: bb.height, t: content });
        } else if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.test(content)) {
          axisLabels.push({ x: bb.x, y: bb.y, w: bb.width, h: bb.height, t: content });
        }
      });
      return { valueLabels, axisLabels };
    });
    expect(info, "chart-line labels が存在").not.toBeNull();
    if (info) {
      const overlaps: string[] = [];
      for (const v of info.valueLabels) {
        for (const a of info.axisLabels) {
          const overlapX = v.x < a.x + a.w && v.x + v.w > a.x;
          const overlapY = v.y < a.y + a.h && v.y + v.h > a.y;
          if (overlapX && overlapY) overlaps.push(`"${v.t}" と axis "${a.t}"`);
        }
      }
      expect(overlaps, `value label と axis label が重なる: ${overlaps.join(", ")}`).toHaveLength(0);
    }
  });

  test("card: subtitle が rect の水平範囲を超えない (sm2 の long entry/exit label 対応)", async ({ page }) => {
    await page.getByText("拡張ステート図", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const results: Array<{ cardW: number; textEndX: number; text: string }> = [];
      document.querySelectorAll('[data-cdl-node]').forEach((g) => {
        const rect = g.querySelector('[data-cdl-role="node-body"]');
        if (!rect) return;
        const cardW = parseFloat(rect.getAttribute("width") ?? "0");
        g.querySelectorAll("text").forEach((t) => {
          const bb = (t as SVGGraphicsElement).getBBox();
          if (bb.x + bb.width > cardW + 4) {
            results.push({ cardW, textEndX: bb.x + bb.width, text: t.textContent ?? "" });
          }
        });
      });
      return results;
    });
    expect(info.length, `sm2 card の text が rect の水平範囲を超える件数 (0 期待): ${JSON.stringify(info)}`).toBe(0);
  });

  test("edge-line: fill は none (fill:#XXX bug 回帰なし)", async ({ page }) => {
    await page.getByText("フローチャート", { exact: true }).first().click();
    /*
     * **線が出るまで待つ** (#1479)。
     *
     * `#1470` で矢印が段に合わせて出るようになり、開いた直後は 1 本も描かれていない。
     * 決め打ちの待ち時間だと、何段目で読むかによって 0 件になる (実測 = 1 秒では 0 件)。
     * 出た時点で先へ進むので、待ち時間を延ばす形より速くて確実。
     *
     * **見えているかは待たない** (`state: "attached"`)。 線は段の進みで長さが 0 になる瞬間が
     * あり、既定の「見えるまで」 だとその瞬間に当たった回が時間切れになる (実測)。
     * ここで読むのは塗りの指定なので、DOM に在れば足りる。
     */
    await page.waitForSelector('[data-cdl-role="edge-line"]', { state: "attached", timeout: 15_000 });

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
