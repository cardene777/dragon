/**
 * Axis 56 lane-label-inside-viewbox の behavior test。
 *
 * lane-label bbox が viewBox 内に収まっているか検知。 通常 layout は viewBox を
 * lane 全体を包む形で自動計算するので発火 0 が正常運用。
 */
import { describe, it, expect } from "vitest";
import { visualValidate } from "@cardenelabs/cdl";
import type { CdlDiagram, Violation } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "test-lane-label",
    lanes: [
      { id: "L1", x: 0, width: 400, label: "認証" },
      { id: "L2", x: 480, width: 400, label: "データベース" },
    ],
    nodes: [
      { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "Actor1" },
      { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "Actor2" },
    ],
    edges: [],
    phases: [],
    states: [],
    ...overrides,
  };
}

describe("Axis 56 lane-label-inside-viewbox", () => {
  it("通常の lane で発火 0 (label が viewBox 内)", () => {
    const diag = baseDiagram();
    const report = visualValidate(diag);
    const violations = report.violations.filter((v: Violation) => v.axis === "lane-label-inside-viewbox");
    expect(violations.length).toBe(0);
    expect(report.counts["lane-label-inside-viewbox"]).toBe(0);
  });

  it("label なし lane で発火 0 (対象なし)", () => {
    const diag = baseDiagram({
      lanes: [
        { id: "L1", x: 0, width: 400 },
        { id: "L2", x: 480, width: 400 },
      ],
    });
    const report = visualValidate(diag);
    const violations = report.violations.filter((v: Violation) => v.axis === "lane-label-inside-viewbox");
    expect(violations.length).toBe(0);
  });

  it("VisualAxis type に lane-label-inside-viewbox が含まれる (counts field 存在)", () => {
    const diag = baseDiagram();
    const report = visualValidate(diag);
    expect(report.counts).toHaveProperty("lane-label-inside-viewbox");
    expect(typeof report.counts["lane-label-inside-viewbox"]).toBe("number");
  });
});
