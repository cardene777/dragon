/**
 * developer toolchain helper (Axis 69-72) の behavior test。
 */
import { describe, it, expect } from "vitest";
import {
  attachSourceLocation,
  generateCodemodPatches,
  applyCodemodPatches,
  benchmarkValidate,
  detectRegression,
  generateFuzzDiagram,
  fuzzInvariantHolds,
  visualValidate,
  type CdlDiagram,
  type Violation,
} from "@cardenelabs/cdl";

function makeDiag(id: string): CdlDiagram {
  return {
    id,
    topic: "toolchain test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "a", lane: "l", stack: 0, kind: "actor", title: "A" },
      { id: "b", lane: "l", stack: 1, kind: "actor", title: "B" },
    ],
    edges: [{ id: "e1", from: "a", to: "b", label: "test", tone: "accent" }],
    states: [],
    phases: [],
  };
}

describe("toolchain helpers (Axis 69-72)", () => {
  // Axis 69: Source location
  it("attachSourceLocation は quoted needle を DSL 内 grep で line 特定", () => {
    const dsl = `title: sample
flow:
  - a -> b: "hello"
  - c -> d: "world"
`;
    const v: Violation = {
      axis: "edge-label-overlap",
      diagramId: "x",
      detail: `label "world" と node 重なり`,
      severity: "error",
    };
    const located = attachSourceLocation([v], dsl, "test.dsl");
    expect(located[0].location).toBeDefined();
    expect(located[0].location?.file).toBe("test.dsl");
    // "world" が row "- c -> d: \"world\"" (line 4) にヒット
    expect(located[0].location?.line).toBe(4);
  });

  it("attachSourceLocation 一致なし = location undefined", () => {
    const v: Violation = { axis: "text-readability", diagramId: "x", detail: "no match here", severity: "warn" };
    const out = attachSourceLocation([v], "line 1\nline 2\n");
    expect(out[0].location).toBeUndefined();
  });

  // Axis 70: Codemod
  it("generateCodemodPatches は label-char-range で labelOffset reset patch を生成", () => {
    const v: Violation = { axis: "label-char-range", diagramId: "d", detail: 'edge "e1" 過長', severity: "warn" };
    const patches = generateCodemodPatches([v]);
    expect(patches.length).toBe(2);
    expect(patches[0].field).toBe("labelOffsetX");
    expect(patches[1].field).toBe("labelOffsetY");
    expect(patches[0].value).toBe(0);
  });

  it("generateCodemodPatches edge-node-cross で routing patch", () => {
    const v: Violation = { axis: "edge-node-cross", diagramId: "d", detail: 'edge "e1" が node "c" を貫通', severity: "error" };
    const patches = generateCodemodPatches([v]);
    expect(patches[0].field).toBe("routing");
    expect(patches[0].value).toBe("back-detour");
  });

  it("generateCodemodPatches node-overlap で shift patch (下 node 側)", () => {
    const v: Violation = { axis: "node-overlap", diagramId: "d", detail: 'node "a" ↔ "b" 重なり', severity: "error" };
    const patches = generateCodemodPatches([v]);
    expect(patches[0].field).toBe("stack");
    expect(patches[0].targetId).toBe("b");
    expect(patches[0].op).toBe("shift");
  });

  it("applyCodemodPatches は immutable copy", () => {
    const d = makeDiag("d1");
    const patches = [
      { target: "edge" as const, targetId: "e1", op: "set" as const, field: "routing", value: "back-detour", reason: "test" },
    ];
    const fixed = applyCodemodPatches(d, patches);
    expect(fixed).not.toBe(d);
    expect(fixed.edges[0].routing).toBe("back-detour");
    // 元 d は変わらない
    expect(d.edges[0].routing).toBeUndefined();
  });

  it("applyCodemodPatches node stack shift", () => {
    const d = makeDiag("d1");
    const originalStack = d.nodes[1].stack;
    const patches = [
      { target: "node" as const, targetId: "b", op: "shift" as const, field: "stack", value: 2, reason: "test" },
    ];
    const fixed = applyCodemodPatches(d, patches);
    expect(fixed.nodes[1].stack).toBe(originalStack + 2);
  });

  // Axis 71: Benchmark
  it("benchmarkValidate は diagramCount と meanPerDiagramMs を返す", () => {
    let now = 0;
    const result = benchmarkValidate([makeDiag("d1"), makeDiag("d2")], () => (now += 5));
    expect(result.diagramCount).toBe(2);
    expect(result.totalDurationMs).toBeGreaterThan(0);
    expect(result.meanPerDiagramMs).toBeGreaterThan(0);
  });

  it("detectRegression baseline 遅く current 高速 = no regression", () => {
    const baseline = { diagramCount: 1, totalDurationMs: 100, meanPerDiagramMs: 100, axisBreakdown: [] };
    const current = { diagramCount: 1, totalDurationMs: 50, meanPerDiagramMs: 50, axisBreakdown: [] };
    expect(detectRegression(baseline, current).regressed).toBe(false);
  });

  it("detectRegression current が 5% 超悪化 = regression", () => {
    const baseline = { diagramCount: 1, totalDurationMs: 100, meanPerDiagramMs: 10, axisBreakdown: [] };
    const current = { diagramCount: 1, totalDurationMs: 200, meanPerDiagramMs: 15, axisBreakdown: [] };
    const result = detectRegression(baseline, current);
    expect(result.regressed).toBe(true);
    expect(result.reason).toContain("mean per-diagram");
  });

  it("detectRegression 100ms absolute budget 超え", () => {
    const baseline = { diagramCount: 1, totalDurationMs: 0, meanPerDiagramMs: 0, axisBreakdown: [] };
    const current = { diagramCount: 1, totalDurationMs: 200, meanPerDiagramMs: 200, axisBreakdown: [] };
    expect(detectRegression(baseline, current).regressed).toBe(true);
  });

  // Axis 72: Fuzz
  it("generateFuzzDiagram は seed 固定で deterministic", () => {
    const d1 = generateFuzzDiagram({ seed: 100 });
    const d2 = generateFuzzDiagram({ seed: 100 });
    expect(d1.nodes.length).toBe(d2.nodes.length);
    expect(d1.edges.length).toBe(d2.edges.length);
  });

  it("generateFuzzDiagram nodeRange / edgeRange 反映", () => {
    const d = generateFuzzDiagram({ seed: 7, nodeRange: [3, 4], edgeRange: [2, 3] });
    expect(d.nodes.length).toBe(3);
    expect(d.edges.length).toBe(2);
  });

  it("fuzzInvariantHolds 50 iteration で visualValidate throw しない", () => {
    const result = fuzzInvariantHolds(50, { seed: 1 });
    expect(result.ok).toBe(true);
    expect(result.failedSeeds).toEqual([]);
  });

  it("generated fuzz diagram を visualValidate に通せる", () => {
    for (let seed = 0; seed < 5; seed++) {
      const d = generateFuzzDiagram({ seed });
      const report = visualValidate(d);
      expect(report.diagramId).toBe(d.id);
    }
  });
});
