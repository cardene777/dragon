/**
 * visualValidateLaid API を使った残 axis の real defect assertion (extended)。
 *
 * 見るのは Axis 8/14/55/56 の 4 本。 Axis 1/10/53/54 は `axis-laid-mutations.test.ts` が見る。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { at } from "./support/at";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-extended",
    topic: "extended",
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

describe("Axis 14 label-inside-viewbox (LaidDiagram mutation で意図発火)", () => {
  it("edge label を viewBox 右端の外に強制 shift すると overflow 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    at(laid.edges, 0, "laid.edges").labelX = laid.viewBox.x + laid.viewBox.w + 500;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["label-inside-viewbox"]).toBeGreaterThan(0);
  });
});

describe("Axis 55 edge-inside-viewbox (LaidDiagram mutation で意図発火)", () => {
  it("edge path 全体を viewBox 外に強制 shift すると overflow 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    const outsideX = laid.viewBox.x + laid.viewBox.w + 2000;
    at(laid.edges, 0, "laid.edges").d = `M ${outsideX} 100 L ${outsideX + 100} 200`;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["edge-inside-viewbox"]).toBeGreaterThan(0);
  });
});

describe("Axis 56 lane-label-inside-viewbox (LaidDiagram mutation で意図発火)", () => {
  it("lane を viewBox 外に強制 shift すると lane label overflow 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    at(laid.lanes, 0, "laid.lanes").x = laid.viewBox.x + laid.viewBox.w + 500;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["lane-label-inside-viewbox"]).toBeGreaterThan(0);
  });
});

describe("Axis 8 arrow-endpoint-anchoring (LaidDiagram mutation で意図発火)", () => {
  it("edge path 終点を to node の bbox から乖離させると anchoring 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    // edge path を to node と無関係な位置に強制 shift
    at(laid.edges, 0, "laid.edges").d = "M 100 100 L 300 100";
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["arrow-endpoint-anchoring"]).toBeGreaterThan(0);
  });
});
