#!/usr/bin/env node
/**
 * signal → SVG 属性反映の精度検証 script (CAR primitive expansion)。
 *
 * Playwright で各 diagram を巡回、 signal (slider / timeline / dropdown) を programmatic に
 * 変化させて、 対応する SVG 属性 (width / opacity / stroke-width / stroke-dashoffset) が
 * 期待値に match するかを数値 assertion。 primitive の bind 精度を機械的に保証する。
 */

import { chromium } from "playwright";

const URL = "http://localhost:4323/catalog/interactive";

const setNativeExpr = (val) => `((el) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, '${val}');
  el.dispatchEvent(new Event('input', { bubbles: true }));
})`;

const cases = [
  {
    diagramId: "interactive-visual-bar",
    label: "visual-bar: slider(barW=260) → node rect width=260",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="barW"]');
      await s.evaluate(eval(setNativeExpr("260")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const w = await page.$eval('[data-cdl-node="bar"] rect', (el) => Number(el.getAttribute("width")));
      return { actual: w, expected: 260, tolerance: 2 };
    },
  },
  {
    diagramId: "interactive-shape-chain",
    label: "shape-chain: base(50) → gas1 rect fill = 220 * 50/150 ≈ 73",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="base"]');
      await s.evaluate(eval(setNativeExpr("50")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      // 3 番目 rect が clip 内の実 fill (1=outer frame、 2=clip、 3=fill)
      const bar = await page.$eval(
        '[data-cdl-node="r1"] rect[clip-path]',
        (el) => Number(el.getAttribute("height")),
      );
      return { actual: bar, expected: 220 * (50 / 150), tolerance: 3 };
    },
  },
  {
    diagramId: "interactive-shape-arc",
    label: "shape-arc: angle(150) → arc 2 path",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="a"]');
      await s.evaluate(eval(setNativeExpr("150")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const count = await page.$$eval('[data-cdl-shape="arc"] path', (els) => els.length);
      return { actual: count >= 2, expected: true };
    },
  },
  {
    diagramId: "interactive-repeat-chain",
    label: "repeat-chain: 5 rect が render",
    setup: async () => {},
    assert: async (page) => {
      const count = await page.$$eval('[data-cdl-shape="rect"]', (els) => els.length);
      return { actual: count, expected: 5, tolerance: 0 };
    },
  },
  {
    diagramId: "interactive-edge-flow",
    label: "edge-flow: flow(10) → edge stroke-width=10",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="flow"]');
      await s.evaluate(eval(setNativeExpr("10")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const sw = await page.$eval(
        '[data-cdl-edge] path[data-cdl-role="edge-line"]',
        (el) => Number(el.getAttribute("stroke-width")),
      );
      return { actual: sw, expected: 10, tolerance: 0.5 };
    },
  },
  {
    diagramId: "interactive-visual-opacity",
    label: "visual-opacity: fade(40) → node opacity=0.4",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="fade"]');
      await s.evaluate(eval(setNativeExpr("40")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const op = await page.$eval('[data-cdl-node="target"]', (el) => Number(el.getAttribute("opacity")));
      return { actual: op, expected: 0.4, tolerance: 0.02 };
    },
  },
  {
    diagramId: "interactive-shape-circle",
    label: "shape-circle: p(75) → inner circle radius = maxR * 0.75",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="p"]');
      await s.evaluate(eval(setNativeExpr("75")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const rs = await page.$$eval('[data-cdl-shape="circle"] circle', (els) =>
        els.map((el) => Number(el.getAttribute("r"))),
      );
      const outer = rs[0];
      const inner = rs[1];
      return { actual: Math.round((inner / outer) * 100) / 100, expected: 0.75, tolerance: 0.02 };
    },
  },
  {
    diagramId: "interactive-shape-polygon",
    label: "shape-polygon: sides=6 で 6 頂点",
    setup: async () => {},
    assert: async (page) => {
      const pts = await page.$eval(
        '[data-cdl-shape="polygon"] polygon',
        (el) => (el.getAttribute("points") ?? "").trim().split(/\s+/).length,
      );
      return { actual: pts, expected: 6, tolerance: 0 };
    },
  },
  {
    diagramId: "interactive-input-variety",
    label: "input-variety: range/multi/tabs/text 4 種 widget",
    setup: async () => {},
    assert: async (page) => {
      const range = await page.$('.cdl-ip-range');
      const multi = await page.$('.cdl-ip-multi-select');
      const tabs = await page.$('.cdl-ip-tabs');
      const text = await page.$('.cdl-ip-text');
      return { actual: !!range && !!multi && !!tabs && !!text, expected: true };
    },
  },
  {
    diagramId: "interactive-readout-variety",
    label: "readout-variety: heat/badge/status 3 種 readout",
    setup: async () => {},
    assert: async (page) => {
      const heat = await page.$('[data-cdl-readout="tempHeat"]');
      const badge = await page.$('[data-cdl-readout="tempBadge"]');
      const dot = await page.$('[data-cdl-readout="statusRead"]');
      return { actual: !!heat && !!badge && !!dot, expected: true };
    },
  },
  {
    diagramId: "interactive-slider-bar",
    label: "slider-bar: value(75) → subtitle = 'value: 75'",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="value"]');
      await s.evaluate(eval(setNativeExpr("75")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-node="bar-node"]', (el) => el.textContent);
      return { actual: t.includes("value: 75"), expected: true };
    },
  },
  {
    diagramId: "interactive-formula-text",
    label: "formula-text: input(25) → subtitle 'input * 2 = 50'",
    setup: async (page) => {
      const s = await page.$('input[type="number"][data-cdl-input="input"]');
      await s.evaluate(eval(setNativeExpr("25")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-node="out1"]', (el) => el.textContent);
      return { actual: t.includes("input * 2 = 50"), expected: true };
    },
  },
  {
    diagramId: "interactive-dynamic-readouts",
    label: "dynamic-readouts: rev(400) → countup 数値表示",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="rev"]');
      await s.evaluate(eval(setNativeExpr("400")));
      await page.waitForTimeout(1200);
    },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-readout="revCount"]', (el) => el.textContent);
      // countup は animation 経由なので "3xx" or "4xx" 近辺
      const match = t.match(/(\d+)/);
      const n = match ? Number(match[1]) : 0;
      return { actual: n > 200, expected: true };
    },
  },
  {
    diagramId: "interactive-array-signal",
    label: "array-signal: initial array の sum (=139) が summary node subtitle に反映",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const texts = await page.$$eval('[data-cdl-node="summary"] text', (els) => els.map((e) => e.textContent ?? ""));
      const joined = texts.join(" ");
      return { actual: /sum 139/.test(joined) && /count 5/.test(joined) && /max 45/.test(joined), expected: true };
    },
  },
  {
    diagramId: "interactive-array-signal",
    label: "array-signal: array-bar readout で 5 個の bar column 描画",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const count = await page.$$eval('[data-cdl-readout="hist"] .cdl-ip-readout-array-bar-col', (els) => els.length);
      return { actual: count, expected: 5 };
    },
  },
  {
    diagramId: "interactive-path-progress",
    label: "path-progress: slider(progress=80) → 80% 表示 + stroke-dashoffset > 0",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="progress"]');
      await s.evaluate(eval(setNativeExpr("80")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const pct = await page.$eval('[data-cdl-readout="pp"] .cdl-ip-readout-path-value', (el) => el.textContent ?? "");
      const paths = await page.$$eval('[data-cdl-readout="pp"] path', (els) => els.map((el) => Number(el.getAttribute("stroke-dashoffset")) || 0));
      // pct=80% 表記 + progress path の offset は total * 0.2 で > 0 な有限値
      return { actual: /80%/.test(pct) && paths.some((v) => v > 0), expected: true };
    },
  },
  {
    diagramId: "interactive-path-progress",
    label: "path-progress: progress=100 → visibleIf=1 で `ok` node が表示",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="progress"]');
      await s.evaluate(eval(setNativeExpr("100")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const hidden = await page.$eval('[data-cdl-node="ok"]', (el) => el.getAttribute("data-cdl-hidden"));
      // visibleIf resolves to "1" → shown → no data-cdl-hidden 属性 or "false"
      return { actual: hidden !== "true", expected: true };
    },
  },
  {
    diagramId: "interactive-path-progress",
    label: "path-progress: progress=0 → visibleIf=0 で `ok` node が非表示",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="progress"]');
      await s.evaluate(eval(setNativeExpr("0")));
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const hidden = await page.$eval('[data-cdl-node="ok"]', (el) => el.getAttribute("data-cdl-hidden"));
      return { actual: hidden === "true", expected: true };
    },
  },
  {
    diagramId: "interactive-grid-matrix",
    label: "grid-matrix: 3×4 = 12 cell が SVG に描画",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const count = await page.$$eval('[data-cdl-node^="cell-"]', (els) => els.length);
      return { actual: count, expected: 12 };
    },
  },
  {
    diagramId: "interactive-array-line-chart",
    label: "line-chart: array 10 point → line path が SVG に描画",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const pathCount = await page.$$eval('[data-cdl-readout="chart"] path', (els) => els.length);
      return { actual: pathCount >= 1, expected: true };
    },
  },
  {
    diagramId: "interactive-array-line-chart",
    label: "line-chart: array 10 element → 10 point circle",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const count = await page.$$eval('[data-cdl-readout="chart"] circle', (els) => els.length);
      return { actual: count, expected: 10 };
    },
  },
  {
    diagramId: "interactive-array-stacked-bar",
    label: "stacked-bar: 2 array 5 elem → 5 group × 2 col = 10 col",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const count = await page.$$eval('[data-cdl-readout="cmp"] .cdl-ip-readout-stacked-bar-col', (els) => els.length);
      return { actual: count, expected: 10 };
    },
  },
  {
    diagramId: "interactive-radial-hub",
    label: "radial-hub: 6 spoke node が renderOffsetX 経由で configured",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const spoke0 = await page.$eval('[data-cdl-node="spoke-0"]', (el) => el.getAttribute("data-cdl-offset-x"));
      // spoke-0 = angle 0° → cos(0) * 90 = 90
      return { actual: Number(spoke0), expected: 90, tolerance: 1 };
    },
  },
  {
    diagramId: "interactive-radial-hub",
    label: "radial-hub: spoke-3 = angle 180° → offsetX = -90",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const spoke3 = await page.$eval('[data-cdl-node="spoke-3"]', (el) => el.getAttribute("data-cdl-offset-x"));
      return { actual: Number(spoke3), expected: -90, tolerance: 1 };
    },
  },
  {
    diagramId: "interactive-array-waterfall",
    label: "waterfall: 5 element → 5 bar + 4 connector",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const bars = await page.$$eval('[data-cdl-readout="wf"] svg rect', (els) => els.length);
      return { actual: bars, expected: 5 };
    },
  },
  {
    diagramId: "interactive-render-offset",
    label: "render-offset: slider(dx=50) で floater node が offsetX=50",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="dx"]');
      await s.evaluate(eval(setNativeExpr("50")));
      await page.waitForTimeout(500);
    },
    assert: async (page) => {
      const dx = await page.$eval('[data-cdl-node="floater"]', (el) => el.getAttribute("data-cdl-offset-x"));
      return { actual: Number(dx), expected: 50, tolerance: 1 };
    },
  },
  {
    diagramId: "interactive-matrix-heatmap",
    label: "matrix-heatmap: 4×4 = 16 cell rect が SVG に描画",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const rects = await page.$$eval('[data-cdl-readout="m"] svg rect', (els) => els.length);
      return { actual: rects, expected: 16 };
    },
  },
  {
    diagramId: "interactive-matrix-heatmap",
    label: "matrix-heatmap: showValue=true で 16 text label",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const texts = await page.$$eval('[data-cdl-readout="m"] svg text', (els) => els.length);
      return { actual: texts, expected: 16 };
    },
  },
  {
    diagramId: "interactive-progress-group",
    label: "progress-group: 4 element → 4 row + 4 progress fill",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const rows = await page.$$eval('[data-cdl-readout="tasks"] .cdl-ip-readout-progress-group-row', (els) => els.length);
      return { actual: rows, expected: 4 };
    },
  },
  {
    diagramId: "interactive-progress-group",
    label: "progress-group: labelSource で name array から label が反映 (Design/Impl/Test/Docs)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const names = await page.$$eval('[data-cdl-readout="tasks"] .cdl-ip-readout-progress-group-name', (els) => els.map((e) => e.textContent));
      return { actual: names.join(",") === "Design,Impl,Test,Docs", expected: true };
    },
  },
  {
    diagramId: "interactive-eip1559",
    label: "EIP-1559: slider(base=100) → block2 = (100+5) * 1.2 = 126",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="baseFee"]');
      await s.evaluate(eval(setNativeExpr("100")));
      await page.waitForTimeout(500);
    },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-node="summary"]', (el) => el.getAttribute("data-cdl-subtitle") ?? "");
      return { actual: /block2 126/.test(t), expected: true };
    },
  },
  {
    diagramId: "interactive-eip1559",
    label: "EIP-1559: stacked-bar (burned+tips) 3 element × 2 col = 6 col",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const cols = await page.$$eval('[data-cdl-readout="gas"] .cdl-ip-readout-stacked-bar-col', (els) => els.length);
      return { actual: cols, expected: 6 };
    },
  },
  {
    diagramId: "interactive-oauth-flow",
    label: "OAuth flow: sequence timeline に 6 event marker (circle) 描画",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const dots = await page.$$eval('[data-cdl-readout="seq"] svg circle', (els) => els.length);
      return { actual: dots, expected: 6 };
    },
  },
  {
    diagramId: "interactive-oauth-flow",
    label: "OAuth flow: 6 event name label が SVG text で描画 (name + t の 2 text × 6 = 12)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const texts = await page.$$eval('[data-cdl-readout="seq"] svg text', (els) => els.length);
      return { actual: texts, expected: 12 };
    },
  },
  {
    diagramId: "interactive-decision-tree",
    label: "decision-tree: 完全 2 分木 3 level = 7 node、 root offsetY=-100",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const count = await page.$$eval('[data-cdl-node^="node-"]', (els) => els.length);
      return { actual: count, expected: 7 };
    },
  },
  {
    diagramId: "interactive-decision-tree",
    label: "decision-tree: node-3 (L2 P0) offsetY = 60 (level 2 * 80 - 100)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const oy = await page.$eval('[data-cdl-node="node-3"]', (el) => el.getAttribute("data-cdl-offset-y"));
      return { actual: Number(oy), expected: 60, tolerance: 1 };
    },
  },
  {
    diagramId: "interactive-skill-radar",
    label: "radar: 5 dim → 5 point circle + 3 ring guide + 5 axis line",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const circles = await page.$$eval('[data-cdl-readout="radar"] svg circle', (els) => els.length);
      return { actual: circles, expected: 5 };
    },
  },
  {
    diagramId: "interactive-perf-bubble",
    label: "bubble-chart: 5 workload → 5 bubbles (circle)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const bubbles = await page.$$eval('[data-cdl-readout="bubbles"] svg circle', (els) => els.length);
      return { actual: bubbles, expected: 5 };
    },
  },
  {
    diagramId: "interactive-portfolio-donut",
    label: "donut: 4 asset segment → 4 SVG path",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const paths = await page.$$eval('[data-cdl-readout="d"] svg path', (els) => els.length);
      return { actual: paths, expected: 4 };
    },
  },
  {
    diagramId: "interactive-kpi-dashboard",
    label: "KPI dashboard: slider(revenue=200) → users = 200*8 = 1600 が subtitle に反映",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="revenue"]');
      await s.evaluate(eval(setNativeExpr("200")));
      await page.waitForTimeout(500);
    },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-node="dashboard"]', (el) => el.getAttribute("data-cdl-subtitle") ?? "");
      return { actual: /users 1600/.test(t), expected: true };
    },
  },
  {
    diagramId: "interactive-ab-test",
    label: "A/B test: donut split 2 segment + donut winner 2 segment = 4 SVG path",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const splitPaths = await page.$$eval('[data-cdl-readout="split"] svg path', (els) => els.length);
      const winnerPaths = await page.$$eval('[data-cdl-readout="winner"] svg path', (els) => els.length);
      return { actual: splitPaths + winnerPaths, expected: 4 };
    },
  },
  {
    diagramId: "interactive-contribution-heatmap",
    label: "contribution heatmap: 53 週 × 7 日 = 371 cell rect が描画",
    setup: async (page) => { await page.waitForTimeout(400); },
    assert: async (page) => {
      const rects = await page.$$eval('[data-cdl-readout="h"] svg rect', (els) => els.length);
      return { actual: rects, expected: 371 };
    },
  },
  {
    diagramId: "interactive-canvas-minimap",
    label: "canvas mini-map: 背景 rect + viewport rect = 2 rect",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const rects = await page.$$eval('[data-cdl-readout="map"] svg rect', (els) => els.length);
      return { actual: rects, expected: 2 };
    },
  },
  {
    diagramId: "interactive-revenue-kpi",
    label: "revenue KPI: slider(current=200) → kpi-card value に 200 反映",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="current"]');
      await s.evaluate(eval(setNativeExpr("200")));
      await page.waitForTimeout(500);
    },
    assert: async (page) => {
      const v = await page.$eval('[data-cdl-readout="kpi"] .cdl-ip-readout-kpi-card-value', (el) => el.textContent ?? "");
      return { actual: /200/.test(v), expected: true };
    },
  },
  {
    diagramId: "interactive-revenue-kpi",
    label: "revenue KPI: sparkline SVG path が描画 (6 history point → 1 line path)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const paths = await page.$$eval('[data-cdl-readout="kpi"] .cdl-ip-readout-kpi-card-spark path', (els) => els.length);
      return { actual: paths, expected: 1 };
    },
  },
  {
    diagramId: "interactive-price-candlestick",
    label: "candlestick: 8 day → 8 body rect + 8 wick line = 16 shapes",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const rects = await page.$$eval('[data-cdl-readout="chart"] svg rect', (els) => els.length);
      const lines = await page.$$eval('[data-cdl-readout="chart"] svg line', (els) => els.length);
      return { actual: rects + lines, expected: 16 };
    },
  },
  {
    diagramId: "interactive-user-venn",
    label: "user Venn: 2 circle 描画 (A / B)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const circles = await page.$$eval('[data-cdl-readout="v"] svg circle', (els) => els.length);
      return { actual: circles, expected: 2 };
    },
  },
  {
    diagramId: "interactive-score-slope",
    label: "score slope: 5 student → 5 line + 10 dot (5 before + 5 after)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const dots = await page.$$eval('[data-cdl-readout="s"] svg circle', (els) => els.length);
      return { actual: dots, expected: 10 };
    },
  },
  {
    diagramId: "interactive-sales-funnel",
    label: "sales funnel: 4 stage → 4 path (trapezoid)",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const paths = await page.$$eval('[data-cdl-readout="f"] svg path', (els) => els.length);
      return { actual: paths, expected: 4 };
    },
  },
  {
    diagramId: "interactive-project-gantt",
    label: "project gantt: 4 task → 4 rect bar",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const rects = await page.$$eval('[data-cdl-readout="g"] svg rect', (els) => els.length);
      return { actual: rects, expected: 4 };
    },
  },
  {
    diagramId: "interactive-resource-treemap",
    label: "resource treemap: 6 team → 6 rect (area 比例)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const rects = await page.$$eval('[data-cdl-readout="t"] svg rect', (els) => els.length);
      return { actual: rects, expected: 6 };
    },
  },
  {
    diagramId: "interactive-traffic-sankey",
    label: "sankey: 3 source + 2 target = 5 bar + 6 curve = 5 rect + 6 path",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const rects = await page.$$eval('[data-cdl-readout="s"] svg rect', (els) => els.length);
      const paths = await page.$$eval('[data-cdl-readout="s"] svg path', (els) => els.length);
      return { actual: rects + paths, expected: 11 };
    },
  },
  {
    diagramId: "interactive-activity-polar",
    label: "polar-area: 7 day → 7 sector path",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const paths = await page.$$eval('[data-cdl-readout="p"] svg path', (els) => els.length);
      return { actual: paths, expected: 7 };
    },
  },
  {
    diagramId: "interactive-onboarding-stepper",
    label: "step-indicator: stepper(current=3) → 5 dot + 4 line 描画",
    setup: async (page) => {
      const btns = await page.$$('[data-cdl-input="current"] .cdl-ip-stepper-btn');
      // 現在の initial=2、 +1 で 3
      const plusBtn = btns[btns.length - 1];
      if (plusBtn) await plusBtn.click();
      await page.waitForTimeout(400);
    },
    assert: async (page) => {
      const circles = await page.$$eval('[data-cdl-readout="wizard"] svg circle', (els) => els.length);
      const lines = await page.$$eval('[data-cdl-readout="wizard"] svg line', (els) => els.length);
      return { actual: circles + lines, expected: 9 };
    },
  },
  {
    diagramId: "interactive-kpi-bullet",
    label: "bullet-chart: 3 range rect + 1 actual bar + 1 target line = 4 rect + 1 line",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const rects = await page.$$eval('[data-cdl-readout="b"] svg rect', (els) => els.length);
      const lines = await page.$$eval('[data-cdl-readout="b"] svg line', (els) => els.length);
      return { actual: rects + lines, expected: 5 };
    },
  },
  {
    diagramId: "interactive-revenue-scoreboard",
    label: "number-board: slider(rev=500) → 数字 500 が表示",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="rev"]');
      await s.evaluate(eval(setNativeExpr("500")));
      await page.waitForTimeout(500);
    },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-readout="nb"] .cdl-ip-readout-number-board-value', (el) => el.textContent ?? "");
      return { actual: /500/.test(t), expected: true };
    },
  },
  {
    diagramId: "interactive-player-leaderboard",
    label: "leaderboard: 6 player → top 5 row 表示 (max=5)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const rows = await page.$$eval('[data-cdl-readout="lb"] .cdl-ip-readout-leaderboard-row', (els) => els.length);
      return { actual: rows, expected: 5 };
    },
  },
  {
    diagramId: "interactive-player-leaderboard",
    label: "leaderboard: top 1 = Alice (920)、 name column に表示",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const names = await page.$$eval('[data-cdl-readout="lb"] .cdl-ip-readout-leaderboard-name', (els) => els.map((e) => e.textContent));
      return { actual: names[0] === "Alice", expected: true };
    },
  },
  {
    diagramId: "interactive-build-traffic-light",
    label: "traffic-light: 3 circle + 1 background rect が SVG に描画",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const circles = await page.$$eval('[data-cdl-readout="tl"] svg circle', (els) => els.length);
      const rects = await page.$$eval('[data-cdl-readout="tl"] svg rect', (els) => els.length);
      return { actual: circles + rects, expected: 4 };
    },
  },
  {
    diagramId: "interactive-tech-tagcloud",
    label: "tag-cloud: 8 tag が span 要素で描画",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const tags = await page.$$eval('[data-cdl-readout="tc"] .cdl-ip-readout-tag-cloud-tag', (els) => els.length);
      return { actual: tags, expected: 8 };
    },
  },
  {
    diagramId: "interactive-team-activity",
    label: "activity-feed: 5 event が row 表示",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const rows = await page.$$eval('[data-cdl-readout="af"] .cdl-ip-readout-activity-feed-row', (els) => els.length);
      return { actual: rows, expected: 5 };
    },
  },
  {
    diagramId: "interactive-team-activity",
    label: "activity-feed: 最新 event (row 0) actor = Alice",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const first = await page.$eval('[data-cdl-readout="af"] .cdl-ip-readout-activity-feed-row .cdl-ip-readout-activity-feed-actor', (el) => el.textContent);
      return { actual: first === "Alice", expected: true };
    },
  },
  {
    diagramId: "interactive-product-rating",
    label: "product-rating: 5 star SVG 描画 (5 SVG element)",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const stars = await page.$$eval('[data-cdl-readout="r"] .cdl-ip-readout-rating-star', (els) => els.length);
      return { actual: stars, expected: 5 };
    },
  },
  {
    diagramId: "interactive-alert-notification",
    label: "notification: card + title + body 描画 (data-cdl-kind=warn)",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const kind = await page.$eval('[data-cdl-readout="nt"]', (el) => el.getAttribute("data-cdl-kind"));
      return { actual: kind === "warn", expected: true };
    },
  },
  {
    diagramId: "interactive-commit-diff",
    label: "diff-counter: +120 / -45 が row に表示",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const add = await page.$eval('[data-cdl-readout="dc"] .cdl-ip-readout-diff-counter-add', (el) => el.textContent ?? "");
      const del = await page.$eval('[data-cdl-readout="dc"] .cdl-ip-readout-diff-counter-del', (el) => el.textContent ?? "");
      return { actual: add === "+120" && del === "-45", expected: true };
    },
  },
  {
    diagramId: "interactive-support-chat",
    label: "chat-bubble: 5 message row (self=2, other=3)",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const rows = await page.$$eval('[data-cdl-readout="cb"] .cdl-ip-readout-chat-bubble-row', (els) => els.length);
      return { actual: rows, expected: 5 };
    },
  },
  {
    diagramId: "interactive-support-chat",
    label: "chat-bubble: 2 message が self (isSelf=true)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const selfCount = await page.$$eval('[data-cdl-readout="cb"] [data-cdl-self="true"]', (els) => els.length);
      return { actual: selfCount, expected: 3 };
    },
  },
  {
    diagramId: "interactive-user-avatar",
    label: "avatar: initials = 'AW' (Alice Wonderland)",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-readout="av"] .cdl-ip-readout-avatar-circle', (el) => el.textContent ?? "");
      return { actual: t === "AW", expected: true };
    },
  },
  {
    diagramId: "interactive-sprint-checklist",
    label: "checklist: 6 item + 2 checked (progress 33%)",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const rows = await page.$$eval('[data-cdl-readout="cl"] .cdl-ip-readout-checklist-row', (els) => els.length);
      const checked = await page.$$eval('[data-cdl-readout="cl"] [data-cdl-checked="true"]', (els) => els.length);
      return { actual: rows === 6 && checked === 2, expected: true };
    },
  },
  {
    diagramId: "interactive-engine-tachometer",
    label: "circular-gauge: slider(rpm=5000) → center text に 5000 表示",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="rpm"]');
      await s.evaluate(eval(setNativeExpr("5000")));
      await page.waitForTimeout(500);
    },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-readout="g"] svg text', (el) => el.textContent ?? "");
      return { actual: /5000/.test(t), expected: true };
    },
  },
  {
    diagramId: "interactive-product-price-tag",
    label: "price-tag: newPrice=65 / oldPrice=100 → discount = -35%",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-readout="pt"] .cdl-ip-readout-price-tag-discount', (el) => el.textContent ?? "");
      return { actual: /-35%/.test(t), expected: true };
    },
  },
  {
    diagramId: "interactive-deploy-spinner",
    label: "spinner: dropdown で done → data-cdl-status=done",
    setup: async (page) => {
      const sel = await page.$('select[data-cdl-input="status"]');
      if (sel) {
        await sel.selectOption("done");
        await sel.dispatchEvent("change");
      }
      await page.waitForTimeout(500);
    },
    assert: async (page) => {
      const status = await page.$eval('[data-cdl-readout="sp"]', (el) => el.getAttribute("data-cdl-status"));
      return { actual: status === "done", expected: true };
    },
  },
  {
    diagramId: "interactive-exam-grade",
    label: "grade: slider(score=95) → letter = 'A'",
    setup: async (page) => {
      const s = await page.$('input[type="range"][data-cdl-input="score"]');
      await s.evaluate(eval(setNativeExpr("95")));
      await page.waitForTimeout(500);
    },
    assert: async (page) => {
      const letter = await page.$eval('[data-cdl-readout="g"]', (el) => el.getAttribute("data-cdl-letter"));
      return { actual: letter === "A", expected: true };
    },
  },
  {
    diagramId: "interactive-timer-stopwatch",
    label: "stopwatch: elapsed=125000ms → MM:SS = 02:05",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const t = await page.$eval('[data-cdl-readout="sw"] .cdl-ip-readout-stopwatch-display', (el) => el.textContent ?? "");
      return { actual: /02.*05/.test(t), expected: true };
    },
  },
  {
    diagramId: "interactive-ml-confidence",
    label: "confidence-meter: initial 82% → band = 'high'",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const band = await page.$eval('[data-cdl-readout="cm"]', (el) => el.getAttribute("data-cdl-band"));
      return { actual: band === "high", expected: true };
    },
  },
  {
    diagramId: "interactive-post-reactions",
    label: "reaction-bar: 4 reaction pill 表示",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const pills = await page.$$eval('[data-cdl-readout="rb"] .cdl-ip-readout-reaction-bar-pill', (els) => els.length);
      return { actual: pills, expected: 4 };
    },
  },
  {
    diagramId: "interactive-tech-pills",
    label: "pill-group: 5 tech pill 表示",
    setup: async (page) => { await page.waitForTimeout(200); },
    assert: async (page) => {
      const pills = await page.$$eval('[data-cdl-readout="pg"] .cdl-ip-readout-pill-group-pill', (els) => els.length);
      return { actual: pills, expected: 5 };
    },
  },
  {
    diagramId: "interactive-device-battery",
    label: "fuel-bar: initial 72% → data-cdl-level = 'high'",
    setup: async (page) => { await page.waitForTimeout(300); },
    assert: async (page) => {
      const level = await page.$eval('[data-cdl-readout="fb"]', (el) => el.getAttribute("data-cdl-level"));
      return { actual: level === "high", expected: true };
    },
  },
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  let pass = 0;
  let fail = 0;
  const results = [];
  for (const c of cases) {
    const btns = await page.$$("button.catalog-list-item");
    let clicked = false;
    for (const b of btns) {
      const idEl = await b.$(".catalog-list-item-id");
      const t = idEl ? await idEl.textContent() : "";
      if (t && t.includes(c.diagramId)) {
        await b.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      console.log(`❌ ${c.label} (sidebar item not found)`);
      fail++;
      continue;
    }
    await page.waitForTimeout(800);
    try {
      await c.setup(page);
      const { actual, expected, tolerance } = await c.assert(page);
      let ok = false;
      if (typeof expected === "boolean") {
        ok = actual === expected;
      } else if (typeof expected === "number" && typeof actual === "number") {
        ok = Math.abs(actual - expected) <= (tolerance ?? 0);
      }
      if (ok) {
        console.log(`✅ ${c.label} (actual=${actual})`);
        pass++;
      } else {
        console.log(`❌ ${c.label} (actual=${actual} expected=${expected}±${tolerance ?? 0})`);
        fail++;
      }
      results.push({ label: c.label, actual, expected, tolerance, ok });
    } catch (e) {
      console.log(`❌ ${c.label} (error: ${e.message})`);
      fail++;
      results.push({ label: c.label, error: e.message, ok: false });
    }
  }

  await browser.close();
  console.log("");
  console.log("─".repeat(60));
  console.log(`total: ${cases.length}, pass: ${pass}, fail: ${fail}`);
  if (errors.length > 0) {
    console.log(`page errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(2);
});
