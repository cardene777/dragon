/**
 * experimental helper (Axis 85-88) の behavior test。
 */
import { describe, it, expect } from "vitest";
import {
  assembleBytecode,
  interpret,
  createSuperposition,
  collapseSuperposition,
  expectedValue,
  createAuditLog,
  appendAudit,
  verifyAuditLog,
  createWasmImports,
  invokeWasmValidate,
  visualValidateAll,
  visualValidate,
  type CdlDiagram,
  type SweepReport,
} from "@cardenelabs/cdl";

function makeDiag(id: string): CdlDiagram {
  return {
    id,
    topic: "experimental test",
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

describe("experimental helpers (Axis 85-88)", () => {
  // Axis 85: VM bytecode
  it("assembleBytecode + interpret は各 diagram の report を蓄積", () => {
    const diagrams = [makeDiag("d1"), makeDiag("d2")];
    const program = assembleBytecode(diagrams);
    expect(program[program.length - 1].op).toBe("HALT");
    const state = interpret(program, diagrams);
    expect(state.halted).toBe(true);
    expect(state.reports).toHaveLength(2);
  });

  it("assembleBytecode は LOAD_DIAG / CHECK_AXIS / EMIT_VIOLATION の 3 命令 * N", () => {
    const diagrams = [makeDiag("d1")];
    const program = assembleBytecode(diagrams);
    const ops = program.map((i) => i.op);
    expect(ops).toContain("LOAD_DIAG");
    expect(ops).toContain("CHECK_AXIS");
    expect(ops).toContain("EMIT_VIOLATION");
    expect(ops).toContain("MERGE_REPORTS");
    expect(ops).toContain("HALT");
  });

  // Axis 86: Superposition
  it("createSuperposition は重み正規化 (sum=1)", () => {
    const r1 = visualValidateAll([makeDiag("d1")]);
    const r2 = visualValidateAll([makeDiag("d2")]);
    const sup = createSuperposition([r1, r2], [2, 3]);
    const sum = sup.branches.reduce((s, b) => s + b.weight, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(sup.branches[0].weight).toBeCloseTo(0.4, 6);
    expect(sup.branches[1].weight).toBeCloseTo(0.6, 6);
  });

  it("collapseSuperposition rnd=0.1 で weight 0.4 の branch 選択", () => {
    const r1 = visualValidateAll([makeDiag("d1")]);
    const r2 = visualValidateAll([makeDiag("d2")]);
    const sup = createSuperposition([r1, r2], [4, 6]);
    const collapsed = collapseSuperposition(sup, 0.2); // 累積 0.4 内 = branch 0
    expect(collapsed.reports[0].diagramId).toBe("d1");
    const collapsed2 = collapseSuperposition(sup, 0.7);
    expect(collapsed2.reports[0].diagramId).toBe("d2");
  });

  it("expectedValue は重み付き平均", () => {
    const r1 = visualValidateAll([makeDiag("d1")]);
    const r2 = visualValidateAll([makeDiag("d2"), makeDiag("d3")]);
    const sup = createSuperposition([r1, r2], [0.5, 0.5]);
    const ev = expectedValue(sup);
    // r1.total=1, r2.total=2、 期待値 1.5
    expect(ev.total).toBeCloseTo(1.5, 6);
  });

  // Axis 87: Audit log
  it("appendAudit は hash-chain を張る", () => {
    const log = createAuditLog();
    const report = visualValidate(makeDiag("d1"));
    const entry1 = appendAudit(log, report, () => 1000);
    expect(entry1.index).toBe(0);
    expect(entry1.previousHash).toBe("00000000");
    const entry2 = appendAudit(log, report, () => 2000);
    expect(entry2.index).toBe(1);
    expect(entry2.previousHash).toBe(entry1.hash);
  });

  it("verifyAuditLog 未破壊 = valid true", () => {
    const log = createAuditLog();
    for (let i = 0; i < 3; i++) {
      appendAudit(log, visualValidate(makeDiag(`d${i}`)), () => 1000 + i);
    }
    const result = verifyAuditLog(log);
    expect(result.valid).toBe(true);
  });

  it("verifyAuditLog 途中 payload 改竄 = valid false + brokenAt", () => {
    const log = createAuditLog();
    for (let i = 0; i < 3; i++) {
      appendAudit(log, visualValidate(makeDiag(`d${i}`)), () => 1000 + i);
    }
    // 途中 entry を人為的に改竄
    log[1].payload.diagramId = "TAMPERED";
    const result = verifyAuditLog(log);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  // Axis 88: WASM
  it("createWasmImports は env.cdl_validate / log / now を持つ", () => {
    const diag = makeDiag("d1");
    const imports = createWasmImports((ptr) => (ptr === 0 ? diag : undefined), () => {}, () => 5000);
    expect(typeof imports.env.cdl_validate).toBe("function");
    expect(typeof imports.env.cdl_log).toBe("function");
    expect(typeof imports.env.cdl_now).toBe("function");
    expect(imports.env.cdl_now()).toBe(5000);
  });

  it("invokeWasmValidate は error count を返す", () => {
    const diag = makeDiag("d1");
    const imports = createWasmImports((ptr) => (ptr === 0 ? diag : undefined), () => {});
    const result = invokeWasmValidate(imports, 0);
    expect(typeof result.errorCount).toBe("number");
    expect(result.errorCount).toBeGreaterThanOrEqual(0);
  });

  it("invokeWasmValidate 存在しない ptr は -1 return", () => {
    const imports = createWasmImports(() => undefined, () => {});
    const result = invokeWasmValidate(imports, 99);
    expect(result.errorCount).toBe(-1);
  });
});
