/**
 * compiler / distributed helper (Axis 81-84) の behavior test。
 */
import { describe, it, expect } from "vitest";
import {
  toMlirIr,
  serializeMlir,
  toSmtConstraints,
  buildCompressionDict,
  applyDictTokens,
  computeConsensus,
  visualValidateAll,
  visualValidate,
  type CdlDiagram,
  type Violation,
  type SweepReport,
} from "@cardenelabs/cdl";

function makeDiag(id: string): CdlDiagram {
  return {
    id,
    topic: "compiler test",
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

describe("compiler / distributed helpers (Axis 81-84)", () => {
  // Axis 81: MLIR IR
  it("toMlirIr は cdl.diagram root op + nodes/edges/phases block", () => {
    const ir = toMlirIr(makeDiag("d1"));
    expect(ir.name).toBe("cdl.diagram");
    expect(ir.attrs.id).toBe("d1");
    expect(ir.regions[0].blocks.map((b) => b.label)).toEqual(["^nodes", "^edges", "^phases"]);
    expect(ir.regions[0].blocks[0].operations[0].name).toBe("cdl.node");
    expect(ir.regions[0].blocks[1].operations[0].name).toBe("cdl.edge");
  });

  it("serializeMlir は operation を pretty-print", () => {
    const ir = toMlirIr(makeDiag("d1"));
    const text = serializeMlir(ir);
    expect(text).toContain("cdl.diagram");
    expect(text).toContain("cdl.node");
    expect(text).toContain("cdl.edge");
    expect(text).toContain("^nodes");
  });

  // Axis 82: SMT
  it("toSmtConstraints は SMT-LIB2 assert 群を返す", () => {
    const report = visualValidateAll([makeDiag("d1")]);
    const constraints = toSmtConstraints(report);
    const names = constraints.map((c) => c.name);
    expect(names).toContain("declare-vars");
    expect(names).toContain("invariant-pass-fail-total");
    expect(names).toContain("check-sat");
    const smtBody = constraints.map((c) => c.smtlib).join("\n");
    expect(smtBody).toContain("(declare-const pass Int)");
    expect(smtBody).toContain("(assert (= (+ pass fail) total))");
    expect(smtBody).toContain("(check-sat)");
  });

  // Axis 83: Compression dict
  it("buildCompressionDict は頻出 token 順に並べる", () => {
    const d = makeDiag("d1");
    d.nodes.push({ id: "c", lane: "l", stack: 2, kind: "actor", title: "" }); // a11y warn
    const report = visualValidateAll([d, makeDiag("d2")]);
    const dict = buildCompressionDict([report]);
    expect(dict.size).toBeGreaterThan(0);
    expect(dict.size).toBeLessThanOrEqual(100);
    expect(dict.tokens.length).toBe(dict.size);
    expect(dict.totalOccurrences).toBeGreaterThanOrEqual(dict.size);
  });

  it("applyDictTokens は dict hit 時 T${idx}: prefix", () => {
    const d = makeDiag("d1");
    d.nodes.push({ id: "c", lane: "l", stack: 2, kind: "actor", title: "" });
    const report = visualValidateAll([d]);
    const dict = buildCompressionDict([report]);
    const v: Violation = report.reports[0].violations[0];
    const encoded = applyDictTokens(v, dict);
    if (dict.tokens.includes(v.axis)) {
      expect(encoded.encoded).toMatch(/^T\d+:/);
      expect(encoded.tokenIdx).toBeGreaterThanOrEqual(0);
    } else {
      expect(encoded.encoded).toBe(v.detail);
      expect(encoded.tokenIdx).toBe(-1);
    }
  });

  it("applyDictTokens は dict 未 hit で raw detail 返却", () => {
    const dict = { tokens: [], size: 0, totalOccurrences: 0 };
    const v: Violation = { axis: "text-readability", diagramId: "d", detail: "raw", severity: "warn" };
    expect(applyDictTokens(v, dict).encoded).toBe("raw");
  });

  // Axis 84: Consensus
  it("computeConsensus 全 engine 一致 = agreed true / majority ok", () => {
    const report = visualValidateAll([makeDiag("d1")]);
    const result = computeConsensus([report, report, report]);
    expect(result.agreed).toBe(true);
    expect(result.votes).toBe(3);
    expect(result.totalEngines).toBe(3);
    expect(result.disagreements).toEqual([]);
  });

  it("computeConsensus 3 engine 中 2 一致 = agreed + majority", () => {
    const rA = visualValidateAll([makeDiag("d1")]);
    // 別 tuple を持つ report を人為的に作る
    const rB = { ...rA, pass: 0, fail: 1 };
    const result = computeConsensus([rA, rA, rB as SweepReport]);
    expect(result.agreed).toBe(true);
    expect(result.votes).toBe(2);
    expect(result.disagreements.length).toBeGreaterThan(0);
  });

  it("computeConsensus 全 engine disagree = tie", () => {
    const rA = visualValidateAll([makeDiag("d1")]);
    const rB = { ...rA, pass: 0, fail: 1 };
    const rC = { ...rA, pass: 0, fail: 2, total: 2 };
    const result = computeConsensus([rA, rB as SweepReport, rC as SweepReport]);
    expect(result.agreed).toBe(false);
    expect(result.majority).toBe("tie");
  });

  it("computeConsensus 空 = agreed false / tie", () => {
    const result = computeConsensus([]);
    expect(result.agreed).toBe(false);
    expect(result.majority).toBe("tie");
    expect(result.totalEngines).toBe(0);
  });

  // 回帰確認 = visualValidate 単発も通る
  it("visualValidate 単発呼出しは既存挙動", () => {
    const r = visualValidate(makeDiag("dz"));
    expect(r.diagramId).toBe("dz");
  });
});
