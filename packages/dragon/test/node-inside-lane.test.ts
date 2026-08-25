/**
 * Axis 54 node-inside-lane の behavior test。
 *
 * contain / lifeline lane で node bbox が境界越えなら warn 発火、
 * default lane では判定対象外 (header 領域のみで node 内包対象外)。
 */
import { describe, it, expect } from "vitest";
import { visualValidate } from "@cardenelabs/cdl";
import type { CdlDiagram, Violation } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "test-lane",
    topic: "node lane",
    lanes: [{ id: "L", x: 0, width: 400, label: "L" }],
    nodes: [],
    edges: [],
    phases: [],
    states: [],
    ...overrides,
  };
}

describe("Axis 54 node-inside-lane", () => {
  it("default lane では判定対象外 (発火 0)", () => {
    const diag = baseDiagram({
      nodes: [{ id: "n1", lane: "L", stack: 0, kind: "actor", title: "Actor" }],
    });
    const report = visualValidate(diag);
    const violations = report.violations.filter((v: Violation) => v.axis === "node-inside-lane");
    expect(violations.length).toBe(0);
    expect(report.counts["node-inside-lane"]).toBe(0);
  });

  it("contain: true な lane 内に収まる node で発火 0", () => {
    const diag = baseDiagram({
      lanes: [{ id: "L", x: 0, width: 400, contain: true, label: "L" }],
      nodes: [{ id: "n1", lane: "L", stack: 0, kind: "actor", title: "Actor" }],
    });
    const report = visualValidate(diag);
    const violations = report.violations.filter((v: Violation) => v.axis === "node-inside-lane");
    expect(violations.length).toBe(0);
  });

  it("VisualAxis type に node-inside-lane が含まれる (counts field 存在)", () => {
    const diag = baseDiagram({
      nodes: [{ id: "n1", lane: "L", stack: 0, kind: "actor", title: "T" }],
    });
    const report = visualValidate(diag);
    expect(report.counts).toHaveProperty("node-inside-lane");
    expect(typeof report.counts["node-inside-lane"]).toBe("number");
  });
});
