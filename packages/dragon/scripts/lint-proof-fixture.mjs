#!/usr/bin/env node
/**
 * Notation lint 実効性 proof fixture。
 *
 * 意図的に問題ある CdlDiagram を組立て、 lintDiagram() が全 rule を検知するか実証する。
 * pnpm 経由で: node packages/dragon/scripts/lint-proof-fixture.mjs
 *
 * **期待する規則は `src/notation-lint.ts` の `rule: "…"` から読む** (#1944)。 手で並べると、
 * 規則を足した日に図が新しい規則を踏まなくても全件を検知したと出る (実測 = 規則が 9 つある時に
 * 手書きの 8 つだけを見て、四象限図の偏りの規則を踏まないまま全件検知と出ていた)。
 * 同じ理由で、指摘の件数も注釈に書かない。
 *
 * 台本は repo の中だけで使う (package の `files` に `scripts` が無い) ので、`src/` を読んでよい。
 */
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { lintDiagram, autoFix } from "../dist/index.js";
import { 指摘の行 } from "./lint-output.mjs";

/** 記法の検査の規則。 指摘の文の検査 (`lint-message-words.test.ts`) と同じ読み方で `rule: "…"` を読む */
export function 規則を読む(src) {
  return [...new Set([...src.matchAll(/\brule: "([a-z-]+)"/g)].map((m) => m[1]))];
}

/** 期待する規則のうち、指摘に 1 度も現れなかったもの */
export function 見逃した規則(期待する規則, 指摘たち) {
  const 出た = new Set(指摘たち.map((i) => i.rule));
  return 期待する規則.filter((規則) => !出た.has(規則));
}

export const buggyDiagram = {
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
      // 項目が 4 つ以上あって全て 1 つの区画に入る形。 項目 0 件 (`quad-bug`) とは別の規則が指摘する
      id: "quad-lopsided",
      lane: "lane1",
      stack: 6,
      kind: "quadrant-matrix",
      title: "Q2",
      quadrantData: {
        xAxis: { left: "L", right: "R" },
        yAxis: { bottom: "B", top: "T" },
        quadrantLabels: { topLeft: "TL", topRight: "TR", bottomLeft: "BL", bottomRight: "BR" },
        items: [0, 1, 2, 3].map((i) => ({ id: `i${i}`, title: `I${i}`, quadrant: "topLeft" })),
      },
    },
    {
      id: "funnel-bug",
      lane: "lane1",
      stack: 7,
      kind: "funnel-stages",
      title: "F",
      funnelData: [
        { id: "s1", title: "S1", count: 100 },
        { id: "s2", title: "S2", count: 200 },
      ],
    },
  ],
};

function 実行する() {
  console.log("=== わざと問題を入れた図に記法の検査 (`lintDiagram`) を当てる ===\n");
  const report = lintDiagram(buggyDiagram);
  console.log(`図: \`${report.diagramId}\``);
  console.log(`指摘: ${report.issues.length} 件`);
  console.log(`自動修正できる指摘: ${report.autoFixableCount} 件\n`);

  for (const issue of report.issues) {
    for (const 行 of 指摘の行(issue)) console.log(行);
    console.log();
  }

  console.log("=== 自動修正 (`autoFix`) を当てた図の説明 ===");
  const fixed = autoFix(buggyDiagram);
  console.log(`直す前: \`${buggyDiagram.topic}\``);
  console.log(`直した後: \`${fixed.topic}\``);

  console.log("\n=== まとめ ===");
  const 規則の元 = fileURLToPath(new URL("../src/notation-lint.ts", import.meta.url));
  const 期待する規則 = 規則を読む(readFileSync(規則の元, "utf8"));
  if (期待する規則.length === 0) {
    // 読めないまま比べると、見逃しが 0 件になって全件を検知したと出る
    console.log(`❌ 記法の検査の規則を 1 つも読めない (\`${規則の元}\`)`);
    process.exit(1);
  }
  const 見逃し = 見逃した規則(期待する規則, report.issues);
  if (見逃し.length === 0) {
    console.log(`✅ 記法の検査の規則 ${期待する規則.length} 件のすべてが指摘を出した`);
    process.exit(0);
  }
  console.log(
    `❌ 指摘を出さなかった規則が ${期待する規則.length} 件のうち ${見逃し.length} 件ある: ${見逃し.map((r) => `\`${r}\``).join(", ")}`,
  );
  process.exit(1);
}

// 検査から読み込んだ時は走らせない (見逃した規則を求める関数だけを使う)。 起動した file とは実体の
// path で比べる。 字で比べると、途中に別名の dir がある時に一致せず、何もしないまま終了値 0 で終わる
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) 実行する();
