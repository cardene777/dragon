/**
 * AI / formal methods helper (Axis 77-80) の behavior test。
 */
import { describe, it, expect } from "vitest";
import {
  proveInvariants,
  inferPreset,
  makeLlmSuggestionPrompt,
  createLspServerState,
  handleLspRequest,
  visualValidateAll,
  type CdlDiagram,
  type Violation,
  type LspMessage,
} from "@cardenelabs/cdl";

function makeDiag(id: string, overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id,
    topic: "ai test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "a", lane: "l", stack: 0, kind: "actor", title: "A" },
      { id: "b", lane: "l", stack: 1, kind: "actor", title: "B" },
    ],
    edges: [{ id: "e", from: "a", to: "b", label: "ok", tone: "accent" }],
    states: [],
    phases: [],
    ...overrides,
  };
}

describe("AI / formal methods helpers (Axis 77-80)", () => {
  it("proveInvariants は 5 invariant 全 holds (正常 report)", () => {
    const report = visualValidateAll([makeDiag("d1"), makeDiag("d2")]);
    const invariants = proveInvariants(report);
    expect(invariants).toHaveLength(5);
    for (const inv of invariants) {
      expect(inv.holds).toBe(true);
      expect(inv.evidence).toBeUndefined();
    }
  });

  it("proveInvariants は各 invariant に name + predicate を持つ", () => {
    const report = visualValidateAll([makeDiag("d1")]);
    const invariants = proveInvariants(report);
    const names = invariants.map((i) => i.name);
    expect(names).toContain("pass_fail_total");
    expect(names).toContain("counts_aggregation");
    expect(names).toContain("ok_iff_no_error");
  });

  it("proveInvariants は 破壊された report を検知", () => {
    const report = visualValidateAll([makeDiag("d1")]);
    const broken = { ...report, pass: 99, fail: 99, total: 1 };
    const invariants = proveInvariants(broken);
    expect(invariants.find((i) => i.name === "pass_fail_total")?.holds).toBe(false);
  });

  it("inferPreset actor + service = sequence", () => {
    const d = makeDiag("dx", {
      nodes: [
        { id: "u", lane: "l", stack: 0, kind: "actor", title: "User" },
        { id: "s", lane: "l", stack: 1, kind: "service", title: "Svc" },
      ],
    });
    const result = inferPreset(d);
    expect(result.preset).toBe("sequence");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("inferPreset infra kind = topology", () => {
    const d = makeDiag("dx", {
      nodes: [
        { id: "c", lane: "l", stack: 0, kind: "cloud", title: "AWS" },
        { id: "q", lane: "l", stack: 1, kind: "queue", title: "SQS" },
      ],
    });
    expect(inferPreset(d).preset).toBe("topology");
  });

  it("inferPreset storage = er", () => {
    const d = makeDiag("dx", {
      nodes: [
        { id: "u", lane: "l", stack: 0, kind: "storage", title: "User" },
        { id: "o", lane: "l", stack: 1, kind: "storage", title: "Order" },
      ],
    });
    expect(inferPreset(d).preset).toBe("er");
  });

  it("inferPreset unknown mix = generic (low confidence)", () => {
    const d = makeDiag("dx", {
      nodes: [
        { id: "a", lane: "l", stack: 0, kind: "event", title: "E1" },
        { id: "b", lane: "l", stack: 1, kind: "card", title: "C1" },
      ],
    });
    const result = inferPreset(d);
    expect(result.preset).toBe("generic");
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  it("makeLlmSuggestionPrompt は system + user + fewShot を生成", () => {
    const v: Violation = {
      axis: "edge-node-cross",
      diagramId: "d",
      detail: 'edge "e1" が node "b" を貫通',
      severity: "error",
    };
    const prompt = makeLlmSuggestionPrompt(v);
    expect(prompt.system).toContain("cdl diagram assistant");
    expect(prompt.user).toContain("edge-node-cross");
    expect(prompt.user).toContain("error");
    expect(prompt.fewShot.length).toBeGreaterThan(0);
    expect(prompt.fewShot[0].role).toBe("user");
    expect(prompt.fewShot[1].role).toBe("assistant");
  });

  it("handleLspRequest initialize は capabilities を返す", () => {
    const state = createLspServerState();
    const req: LspMessage = { jsonrpc: "2.0", id: 1, method: "initialize", params: {} };
    const res = handleLspRequest(state, req);
    const single = Array.isArray(res) ? res[0]! : res;
    expect(single.result).toBeDefined();
    const result = single.result as { capabilities: unknown; serverInfo: { name: string } };
    expect(result.serverInfo.name).toBe("cdl-lsp");
    expect(result.capabilities).toBeDefined();
  });

  it("handleLspRequest textDocument/didOpen は document を保存", () => {
    const state = createLspServerState();
    handleLspRequest(state, {
      jsonrpc: "2.0",
      method: "textDocument/didOpen",
      params: { textDocument: { uri: "file:///a.cdl", text: "hello" } },
    });
    expect(state.documents.get("file:///a.cdl")).toBe("hello");
  });

  it("handleLspRequest cdl/validate は VisualValidationReport 結果", () => {
    const state = createLspServerState();
    const res = handleLspRequest(state, {
      jsonrpc: "2.0",
      id: 2,
      method: "cdl/validate",
      params: { diagram: makeDiag("d1") },
    });
    const single = Array.isArray(res) ? res[0]! : res;
    const result = single.result as { ok: boolean; violationCount: number };
    expect(typeof result.ok).toBe("boolean");
    expect(typeof result.violationCount).toBe("number");
  });

  it("handleLspRequest 未知 method = -32601 error", () => {
    const state = createLspServerState();
    const res = handleLspRequest(state, { jsonrpc: "2.0", id: 3, method: "unknown/method" });
    const single = Array.isArray(res) ? res[0]! : res;
    expect(single.error?.code).toBe(-32601);
    expect(single.error?.message).toContain("Method not found");
  });
});
