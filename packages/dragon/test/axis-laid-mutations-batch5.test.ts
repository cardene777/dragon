/**
 * visualValidateLaid API での real defect assertion (5th batch)。
 * Axis 5/6/13 を追加、 位置関係 core 19 → 22 に拡張。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { at } from "./support/at";

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
    at(laid.nodes, 1, "laid.nodes").cx =
      at(laid.nodes, 0, "laid.nodes").cx + 100;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["alignment"]).toBeGreaterThan(0);
  });
});

describe("Axis 6 clearance (LaidDiagram mutation で意図発火)", () => {
  // cx を絶対値 (400 / 480) で固定しない。
  //
  // 1. CAR-470 (lane 間 gap を edge label 収納幅で先手拡張) 以降、 lane の x は
  //    author 指定値ではなく `max(laneGap, requiredGap)` で決まる。 固定 cx は
  //    node 幅に対する近接を意味しなくなり、 この test は CAR-470 で fail した。
  // 2. detectNearCollisions は「重なっている pair」 を除外する (重複は node-overlap axis の担当)。
  //    そのため cx を近づけすぎると clearance ではなく node-overlap になり発火しない。
  //
  // 検証したいのは node × node の near collision なので、
  // 「重ならず、 かつ required clearance (node|node = 70px) 未満」 の距離を node 幅から作る。
  it("2 node の cx を極端に近づけると near collision で clearance 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    const n0 = laid.nodes[0]!;
    const n1 = laid.nodes[1]!;
    // bbox 間 gap = 20px (>0 で重複せず、 node|node の required 70px 未満) になる位置。
    const halfWidths = (n0.w + n1.w) / 2;
    n1.cx = n0.cx + halfWidths + 20;
    n1.cy = n0.cy;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["clearance"]).toBeGreaterThan(0);
  });

  // 上記 test が「node × node」 を検出していることを固定する。
  // (元の fixture は cx=400/480 で node × edge-label の clearance を測っており、
  //  test 名の意図と検出対象がズレていた)
  it("clearance violation の対象が node × node pair である", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    const n0 = laid.nodes[0]!;
    const n1 = laid.nodes[1]!;
    n1.cx = n0.cx + (n0.w + n1.w) / 2 + 20;
    n1.cy = n0.cy;
    const report = visualValidateLaid(laid, diag);
    const details = report.violations.filter((v) => v.axis === "clearance").map((v) => v.detail);
    expect(details.some((d) => d.includes("node:n1") && d.includes("node:n2"))).toBe(true);
  });
});

describe("Axis 13 edge-segment-orthogonality (LaidDiagram mutation で意図発火)", () => {
  it("edge path を斜めに強制すると orthogonality 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    at(laid.edges, 0, "laid.edges").d = "M 100 100 L 500 400";
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["edge-segment-orthogonality"]).toBeGreaterThan(0);
  });
});
