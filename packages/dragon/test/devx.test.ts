/**
 * developer-experience helper (Axis 57-60) の behavior test。
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  mcpToolDefinition,
  mcpToolInvoke,
  cliAdapter,
  registerPlugin,
  invokePlugins,
  listPlugins,
  clearPlugins,
  localizeViolation,
  localizeSweepReport,
  visualValidate,
  visualValidateAll,
  type Violation,
  type CdlDiagram,
} from "@cardenelabs/cdl";

function makeMinDiag(): CdlDiagram {
  return {
    id: "devx-test",
    topic: "devx test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "a", lane: "l", stack: 0, kind: "actor", title: "A" },
      { id: "b", lane: "l", stack: 1, kind: "actor", title: "B" },
    ],
    edges: [{ id: "e", from: "a", to: "b", label: "ok", tone: "accent" }],
    states: [],
    phases: [],
  };
}

describe("devx helpers (Axis 57-60)", () => {
  beforeEach(() => clearPlugins());

  it("mcpToolDefinition は MCP schema 準拠", () => {
    const t = mcpToolDefinition();
    expect(t.name).toBe("cdl_validate");
    expect(t.inputSchema.required).toContain("diagram");
    expect(t.inputSchema.type).toBe("object");
  });

  it("mcpToolInvoke は visualValidate 結果を JSON shape で返す", () => {
    const result = mcpToolInvoke({ diagram: makeMinDiag() });
    expect(typeof result.ok).toBe("boolean");
    expect(Array.isArray(result.violations)).toBe(true);
    expect(typeof result.totalCount).toBe("number");
  });

  it("cliAdapter text format = summary lines", () => {
    const out = cliAdapter([makeMinDiag()]);
    expect(out).toContain("cdl validate:");
    expect(out).toContain("total=1");
  });

  it("cliAdapter json format = JSON.parse 可能", () => {
    const out = cliAdapter([makeMinDiag()], { format: "json" });
    const parsed = JSON.parse(out);
    expect(parsed.total).toBe(1);
    expect(parsed.pass + parsed.fail).toBe(1);
  });

  it("cliAdapter prometheus format = counter", () => {
    const out = cliAdapter([makeMinDiag()], { format: "prometheus" });
    expect(out).toContain("cdl_validate_total");
  });

  it("cliAdapter lsp format = severity 数値 + code axis", () => {
    const d = makeMinDiag();
    d.nodes.push({ id: "c", lane: "l", stack: 2, kind: "actor", title: "" }); // a11y warn 発火
    const out = cliAdapter([d], { format: "lsp" });
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed)).toBe(true);
    if (parsed.length > 0) {
      expect(typeof parsed[0].severity).toBe("number");
      expect(typeof parsed[0].code).toBe("string");
    }
  });

  it("registerPlugin + invokePlugins で custom axis 発火", () => {
    registerPlugin({
      name: "my-custom-check",
      check: (d) => (d.edges.length > 0 ? [{ detail: `edges=${d.edges.length}`, severity: "warn" }] : []),
    });
    const violations = invokePlugins(makeMinDiag());
    expect(violations.length).toBe(1);
    expect(violations[0].axis).toBe("plugin-system");
    expect(violations[0].detail).toContain("my-custom-check");
    expect(violations[0].detail).toContain("edges=1");
  });

  it("registerPlugin 同名は後勝ちで上書き", () => {
    registerPlugin({ name: "p", check: () => [{ detail: "first", severity: "warn" }] });
    registerPlugin({ name: "p", check: () => [{ detail: "second", severity: "warn" }] });
    expect(listPlugins()).toHaveLength(1);
    const v = invokePlugins(makeMinDiag());
    expect(v[0].detail).toContain("second");
  });

  it("localizeViolation ja/en/zh で prefix 注入", () => {
    const v: Violation = { axis: "edge-crossing", diagramId: "d", detail: "test", severity: "warn" };
    expect(localizeViolation(v, "ja").detail).toContain("edge 交差");
    expect(localizeViolation(v, "en").detail).toContain("edge crossing");
    expect(localizeViolation(v, "zh").detail).toContain("边交叉");
  });

  it("localizeViolation 未 mapping axis は元 detail のまま", () => {
    const v: Violation = { axis: "row-format", diagramId: "d", detail: "raw", severity: "warn" };
    expect(localizeViolation(v, "ja").detail).toBe("raw");
  });

  it("localizeSweepReport 全 violation を localized 化", () => {
    const d = makeMinDiag();
    d.nodes.push({ id: "c", lane: "l", stack: 2, kind: "actor", title: "" }); // a11y warn
    const report = visualValidateAll([d]);
    const localized = localizeSweepReport(report, "ja");
    const hasLocalized = localized.reports.some((r) =>
      r.violations.some((v) => v.detail.includes("アクセシビリティ")),
    );
    expect(hasLocalized).toBe(true);
  });
});
