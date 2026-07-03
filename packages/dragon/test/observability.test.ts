/**
 * observability helper (Axis 53-56) の behavior test。
 *
 * OTel span / Prometheus / LSP diagnostic / docs URL 生成の 4 helper が
 * 期待 shape を返すことを assert。
 */
import { describe, it, expect } from "vitest";
import {
  reportToOtelSpan,
  sweepReportToPrometheus,
  violationToLspDiagnostic,
  axisDocsUrl,
  visualValidate,
  visualValidateAll,
  type Violation,
  type CdlDiagram,
} from "@cardenelabs/cdl";

function makeMinDiag(): CdlDiagram {
  return {
    id: "obs-test",
    topic: "observability test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "a", lane: "l", stack: 0, kind: "actor", title: "A" },
      { id: "b", lane: "l", stack: 1, kind: "actor", title: "B" },
    ],
    edges: [{ id: "e", from: "a", to: "b", label: "test", tone: "accent" }],
    states: [],
    phases: [],
  };
}

describe("observability helpers (Axis 53-56)", () => {
  it("reportToOtelSpan は OTel-compatible shape を返す", () => {
    const d = makeMinDiag();
    const report = visualValidate(d);
    const span = reportToOtelSpan(report, 0, 12);
    expect(span.name).toBe("cdl.visualValidate");
    expect(span.durationMs).toBe(12);
    expect(span.attributes["cdl.diagram.id"]).toBe("obs-test");
    expect(typeof span.attributes["cdl.violations.total"]).toBe("number");
    expect(span.status === "ok" || span.status === "error").toBe(true);
  });

  it("sweepReportToPrometheus は Prometheus text format を返す", () => {
    const sweep = visualValidateAll([makeMinDiag()]);
    const promText = sweepReportToPrometheus(sweep);
    expect(promText).toContain("# HELP cdl_validate_total");
    expect(promText).toContain("# TYPE cdl_validate_total counter");
    expect(promText).toContain('cdl_validate_total{outcome="pass"}');
    expect(promText).toContain("cdl_axis_count");
    expect(promText).toContain("cdl_diagram_count 1");
  });

  it("violationToLspDiagnostic は LSP shape で codeDescription href に docs URL", () => {
    const v: Violation = {
      axis: "svg-injection-safety",
      diagramId: "d",
      detail: "test",
      severity: "error",
    };
    const diag = violationToLspDiagnostic(v);
    expect(diag.severity).toBe(1); // error → 1
    expect(diag.code).toBe("svg-injection-safety");
    expect(diag.source).toBe("cdl");
    expect(diag.codeDescription?.href).toContain("#svg-injection-safety");
  });

  it("violationToLspDiagnostic warn severity は 2", () => {
    const v: Violation = { axis: "text-readability", diagramId: "d", detail: "x", severity: "warn" };
    expect(violationToLspDiagnostic(v).severity).toBe(2);
  });

  it("axisDocsUrl は kebab-case anchor 付き URL", () => {
    expect(axisDocsUrl("edge-crossing")).toMatch(/#edge-crossing$/);
    expect(axisDocsUrl("svg-injection-safety")).toContain("github.com/cardene777/cdl");
  });
});
