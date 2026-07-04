/**
 * visualValidateLaid API での real defect assertion (4th batch)。
 * Axis 17/20/33 を追加、 位置関係 core 16 → 19 に拡張。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-batch4",
    topic: "batch4",
    lanes: [
      { id: "L1", x: 0, width: 400, label: "L1" },
      { id: "L2", x: 480, width: 400, label: "L2" },
    ],
    nodes: [
      { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "N1" },
      { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
    ],
    edges: [{ id: "e1", from: "n1", to: "n2", label: "call", tone: "accent" }],
    phases: [],
    states: [],
    ...overrides,
  };
}

describe("Axis 17 group-boundary-clearance (LaidDiagram mutation で意図発火)", () => {
  it("contain lane 内 node を lane 右端に迫らせると boundary 発火", () => {
    const diag = baseDiagram({
      lanes: [{ id: "L1", x: 0, width: 400, contain: true, label: "L1" }],
      nodes: [{ id: "n1", lane: "L1", stack: 0, kind: "actor", title: "N1" }],
      edges: [],
    });
    const laid = layout(diag);
    const lane = laid.lanes[0];
    laid.nodes[0].cx = lane.x + lane.width - 20;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["group-boundary-clearance"]).toBeGreaterThan(0);
  });
});

describe("Axis 20 arrow-marker-clearance (LaidDiagram mutation で意図発火)", () => {
  it("edge 終点を to node 中心に近づけると marker clearance 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    const n2 = laid.nodes[1];
    laid.edges[0].d = `M ${n2.cx} ${n2.cy} L ${n2.cx + 1} ${n2.cy + 1}`;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["arrow-marker-clearance"]).toBeGreaterThan(0);
  });
});

describe("Axis 33 subpixel-precision (LaidDiagram mutation で意図発火)", () => {
  it("node cx/cy に極端な非整数値を強制すると subpixel drift 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    laid.nodes[0].cx = 100.7777;
    laid.nodes[0].cy = 100.3333;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["subpixel-precision"]).toBeGreaterThan(0);
  });
});
