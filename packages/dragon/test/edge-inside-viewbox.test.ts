/**
 * Axis 55 edge-inside-viewbox の behavior test。
 *
 * edge path segment 端点が viewBox 内に収まっているかを検知。
 * 通常の 2 node 間 edge は自動 layout で viewBox 内に収まるので発火 0 が正常。
 */
import { describe, it, expect } from "vitest";
import { visualValidate } from "@cardenelabs/cdl";
import type { CdlDiagram, Violation } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "test-edge-viewbox",
    topic: "edge viewBox",
    lanes: [
      { id: "L1", x: 0, width: 400, label: "L1" },
      { id: "L2", x: 480, width: 400, label: "L2" },
    ],
    nodes: [
      { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "Actor1" },
      { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "Actor2" },
    ],
    edges: [{ id: "e1", from: "n1", to: "n2", label: "call", tone: "accent" }],
    phases: [],
    states: [],
    ...overrides,
  };
}

describe("Axis 55 edge-inside-viewbox", () => {
  it("通常の 2 node 間 edge で発火 0 (viewBox 内に自動配置)", () => {
    const diag = baseDiagram();
    const report = visualValidate(diag);
    const violations = report.violations.filter((v: Violation) => v.axis === "edge-inside-viewbox");
    expect(violations.length).toBe(0);
    expect(report.counts["edge-inside-viewbox"]).toBe(0);
  });

  it("edge なし diagram で発火 0", () => {
    const diag = baseDiagram({ edges: [] });
    const report = visualValidate(diag);
    const violations = report.violations.filter((v: Violation) => v.axis === "edge-inside-viewbox");
    expect(violations.length).toBe(0);
  });

  it("VisualAxis type に edge-inside-viewbox が含まれる (counts field 存在)", () => {
    const diag = baseDiagram();
    const report = visualValidate(diag);
    expect(report.counts).toHaveProperty("edge-inside-viewbox");
    expect(typeof report.counts["edge-inside-viewbox"]).toBe("number");
  });
});
