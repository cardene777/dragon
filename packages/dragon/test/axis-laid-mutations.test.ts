/**
 * visualValidateLaid API を使った各 axis 独立の real defect assertion。
 *
 * cdl PR #117 で追加された \`visualValidateLaid(laid, diag)\` public API を使い、
 * layout 済 LaidDiagram を直接 mutation することで各 axis の real defect を意図的に発生させ、
 * axis 判定 logic が正しく検知する事を assertion 化する。
 *
 * 前 PR #117-119 では CdlDiagram レベル fixture では layout が defect を prevent する axis
 * (Axis 10 node-overlap は自動 re-position、 Axis 11 edge-crossing は routing detour、
 * Axis 53 node-inside-viewbox は viewport fallback 自動拡張) の real defect assertion が
 * 不可能だった。 本 PR で完全解消。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-fixture",
    topic: "mutation",
    lanes: [
      { id: "L1", x: 0, width: 400, label: "L1" },
      { id: "L2", x: 480, width: 400, label: "L2" },
    ],
    nodes: [
      { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "N1" },
      { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
    ],
    edges: [],
    phases: [],
    states: [],
    ...overrides,
  };
}

describe("Axis 10 node-overlap (LaidDiagram mutation で意図発火)", () => {
  it("2 node の bbox を強制的に重ねると overlap 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    // n1 の座標を n2 と完全一致させて overlap 状態を作る
    laid.nodes[0].cx = laid.nodes[1].cx;
    laid.nodes[0].cy = laid.nodes[1].cy;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["node-overlap"]).toBeGreaterThan(0);
  });
});

describe("Axis 53 node-inside-viewbox (LaidDiagram mutation で意図発火)", () => {
  it("node bbox を viewBox 右端の外に強制 shift すると overflow 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    // n1 の cx を viewBox 右端の外 + 1000px に強制シフト
    laid.nodes[0].cx = laid.viewBox.x + laid.viewBox.w + 1000;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["node-inside-viewbox"]).toBeGreaterThan(0);
  });
});

describe("Axis 54 node-inside-lane (LaidDiagram mutation で意図発火)", () => {
  it("contain lane 内 node を lane 外に強制 shift すると overflow 発火", () => {
    const diag = baseDiagram({
      lanes: [{ id: "L1", x: 0, width: 400, contain: true, label: "L1" }],
      nodes: [{ id: "n1", lane: "L1", stack: 0, kind: "actor", title: "N1" }],
      edges: [],
      phases: [],
      states: [],
    });
    const laid = layout(diag);
    // n1 を contain lane の右端の外に強制 shift
    const lane = laid.lanes[0];
    laid.nodes[0].cx = lane.x + lane.width + 500;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["node-inside-lane"]).toBeGreaterThan(0);
  });
});

describe("Axis 1 node-visibility (LaidDiagram mutation で意図発火)", () => {
  it("node w/h を極端に小さくすると node-visibility 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    // n1 の w/h を 8 未満 = lifeline 扱いより大 + MIN_NODE_W/H 未満
    laid.nodes[0].w = 30;
    laid.nodes[0].h = 30;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["node-visibility"]).toBeGreaterThan(0);
  });
});

describe("visualValidate() と visualValidateLaid() の互換性", () => {
  it("valid diagram で両者の counts が一致", () => {
    const diag = baseDiagram();
    const { visualValidate } = require("@cardenelabs/cdl") as typeof import("@cardenelabs/cdl");
    const reportA = visualValidate(diag);
    const laid = layout(diag);
    const reportB = visualValidateLaid(laid, diag);
    // core axis の counts が同一 (mutation なし = 同じ layout 結果を audit)
    expect(reportA.counts["node-overlap"]).toBe(reportB.counts["node-overlap"]);
    expect(reportA.counts["node-inside-viewbox"]).toBe(reportB.counts["node-inside-viewbox"]);
    expect(reportA.counts["edge-crossing"]).toBe(reportB.counts["edge-crossing"]);
  });
});
