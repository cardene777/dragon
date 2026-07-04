/**
 * visualValidateLaid API での real defect assertion (3rd batch)。
 * Axis 15/18/19/24 を追加、 位置関係 core を 12 → 16 に拡張。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-more",
    topic: "more",
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

describe("Axis 15 lane-cx-consistency (LaidDiagram mutation で意図発火)", () => {
  it("node cx を lane 中心から強く shift すると cx-consistency 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    const laneL1 = laid.lanes.find((l) => l.id === "L1")!;
    laid.nodes[0].cx = laneL1.x + laneL1.width + 100;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["lane-cx-consistency"]).toBeGreaterThan(0);
  });
});

describe("Axis 18 node-vertical-clearance (LaidDiagram mutation で意図発火)", () => {
  it("同 lane 内 2 node の vertical gap を極端に近づけると clearance 発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "a", lane: "L1", stack: 0, kind: "actor", title: "A" },
        { id: "b", lane: "L1", stack: 1, kind: "actor", title: "B" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    // b の cy を a のすぐ下 (gap 5px) に強制
    laid.nodes[1].cy = laid.nodes[0].cy + laid.nodes[0].h + 5;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["node-vertical-clearance"]).toBeGreaterThan(0);
  });
});

describe("Axis 19 lane-lane-gap (LaidDiagram mutation で意図発火)", () => {
  it("2 lane を極端に近づけると gap 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    // L2 を L1 の右端に近づける (gap 5px)
    laid.lanes[1].x = laid.lanes[0].x + laid.lanes[0].width + 5;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["lane-lane-gap"]).toBeGreaterThan(0);
  });
});

describe("Axis 24 accessibility-basics (LaidDiagram mutation で意図発火)", () => {
  it("node title が空だと accessible name 欠落で発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "" },
        { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
      ],
    });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["accessibility-basics"]).toBeGreaterThan(0);
  });
});
