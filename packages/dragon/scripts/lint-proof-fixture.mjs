#!/usr/bin/env node
/**
 * Notation lint 実効性 proof fixture。
 *
 * 意図的に問題ある CdlDiagram を組立て、 lintDiagram() が全 rule を検知するか実証する。
 * pnpm 経由で: node packages/dragon/scripts/lint-proof-fixture.mjs
 *
 * 期待 = 8 issue 検出 + 3 auto-fixable。
 */
import { lintDiagram, autoFix } from "../dist/index.js";

const buggyDiagram = {
  id: "buggy",
  topic: "chart preset (SVG polyline + tone 別 slice)",
  lanes: [{ id: "lane1", x: 0, width: 400 }],
  edges: [],
  states: [],
  phases: [{ id: "p1", duration: 1000, title: "test", body: "", activate: [], tweens: [], sets: [] }],
  nodes: [
    {
      id: "empty-chart",
      lane: "lane1",
      stack: 0,
      kind: "chart-line",
      title: "Empty",
      chartData: [],
    },
    {
      id: "single-chart",
      lane: "lane1",
      stack: 1,
      kind: "chart-pie",
      title: "Single",
      chartData: [{ label: "A", value: 100 }],
    },
    {
      id: "gantt-bug",
      lane: "lane1",
      stack: 2,
      kind: "gantt-timeline",
      title: "Gantt",
      ganttData: [
        { id: "t1", title: "T1", startIdx: 0, endIdx: 0, startLabel: "Q1", endLabel: "Q1" },
        { id: "t2", title: "T2", startIdx: 1, endIdx: 1, startLabel: "Q2", endLabel: "Q2", dependsOn: "UNKNOWN_TASK" },
      ],
    },
    {
      id: "mindmap-bug",
      lane: "lane1",
      stack: 3,
      kind: "mind-map",
      title: "MM",
      mindData: {
        rootId: "root",
        rootTitle: "R",
        branches: [
          { id: "b1", title: "B1", parent: "root" },
          { id: "b2", title: "B2", parent: "MISSING_PARENT" },
        ],
      },
    },
    {
      id: "tree-bug",
      lane: "lane1",
      stack: 4,
      kind: "tree-hierarchy",
      title: "T",
      treeData: [
        { id: "n1", title: "N1" },
        { id: "n2", title: "N2", parent: "MISSING_TREE_PARENT" },
      ],
    },
    {
      id: "quad-bug",
      lane: "lane1",
      stack: 5,
      kind: "quadrant-matrix",
      title: "Q",
      quadrantData: {
        xAxis: { left: "L", right: "R" },
        yAxis: { bottom: "B", top: "T" },
        quadrantLabels: { topLeft: "TL", topRight: "TR", bottomLeft: "BL", bottomRight: "BR" },
        items: [],
      },
    },
    {
      id: "funnel-bug",
      lane: "lane1",
      stack: 6,
      kind: "funnel-stages",
      title: "F",
      funnelData: [
        { id: "s1", title: "S1", count: 100 },
        { id: "s2", title: "S2", count: 200 },
      ],
    },
  ],
};

console.log("=== 意図的にバグを注入した CdlDiagram に対して lintDiagram() 実行 ===\n");
const report = lintDiagram(buggyDiagram);
console.log(`diagram id: ${report.diagramId}`);
console.log(`issues detected: ${report.issues.length}`);
console.log(`auto-fixable: ${report.autoFixableCount}\n`);

for (const issue of report.issues) {
  const marker = issue.severity === "warn" ? "⚠" : "ℹ";
  const auto = issue.autoFixable ? " (auto-fix 可)" : "";
  console.log(`${marker} ${issue.rule} @ ${issue.target}${auto}`);
  console.log(`   ${issue.message}`);
  if (issue.suggestion) console.log(`   → ${issue.suggestion}`);
  console.log();
}

console.log("=== autoFix() 適用後 の topic ===");
const fixed = autoFix(buggyDiagram);
console.log(`before: "${buggyDiagram.topic}"`);
console.log(`after:  "${fixed.topic}"`);

console.log("\n=== summary ===");
const expectedRules = [
  "topic-redundant-implementation-detail",
  "chart-empty-datum",
  "chart-single-datum",
  "gantt-unknown-depends-on",
  "mindmap-unknown-parent",
  "tree-unknown-parent",
  "quadrant-empty",
  "funnel-increasing-count",
];
const detectedRules = new Set(report.issues.map((i) => i.rule));
const missed = expectedRules.filter((r) => !detectedRules.has(r));
if (missed.length === 0) {
  console.log("✅ 期待 rule 全 8 件 検知成功");
  process.exit(0);
} else {
  console.log(`❌ 検知漏れ: ${missed.join(", ")}`);
  process.exit(1);
}
