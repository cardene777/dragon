/**
 * visualValidateLaid API での real defect assertion (5th batch)。
 * Axis 5/6/13 を追加、 位置関係 core 19 → 22 に拡張。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-batch5",
    topic: "batch5",
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

describe("Axis 5 alignment (LaidDiagram mutation で意図発火)", () => {
  it("同 lane 内 2 node の cx を意図的にずらすと alignment 発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "a", lane: "L1", stack: 0, kind: "actor", title: "A" },
        { id: "b", lane: "L1", stack: 1, kind: "actor", title: "B" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    laid.nodes[1].cx = laid.nodes[0].cx + 100;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["alignment"]).toBeGreaterThan(0);
  });
});

describe("Axis 6 clearance (LaidDiagram mutation で意図発火)", () => {
  it("2 node の cx を極端に近づけると near collision で clearance 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    laid.nodes[0].cx = 400;
    laid.nodes[1].cx = 480;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["clearance"]).toBeGreaterThan(0);
  });
});

describe("Axis 13 edge-segment-orthogonality (LaidDiagram mutation で意図発火)", () => {
  it("edge path を斜めに強制すると orthogonality 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    laid.edges[0].d = "M 100 100 L 500 400";
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["edge-segment-orthogonality"]).toBeGreaterThan(0);
  });
});
