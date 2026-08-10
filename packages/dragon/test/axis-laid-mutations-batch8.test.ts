/**
 * visualValidateLaid API での real defect assertion (8th batch)。
 * Axis 30 (node-clearance-budget) / 37 (row-content-typing) /
 * 38 (terminal-safe-text) / 39 (gpu-layer-efficiency) / 40 (memory-budget) を追加、
 * 位置関係 core 32 → 37 に拡張。
 *
 * 発火 logic の一次 source は cdl packages/cdl/src/visual-validate.ts SSOT、
 * 本 test は mutation で「意図的に破綻させて発火」 を確認する negative fixture 経路。
 *
 * これで 22 → 37 axis 保証達成、 残 axis (color-blind-safety / contrast-basics /
 * print-media-compat 等) は preset 依存 / 環境依存で mutation 単体発火困難のため、
 * catalog sweep + fixture-based test で covered、 本 mutation batch chain の対象外。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-batch8",
    topic: "batch8",
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

describe("Axis 30 node-clearance-budget (LaidDiagram mutation で意図発火)", () => {
  it("2 node の clearance を shadow budget 6 未満に強制すると影食い込み発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    // 2 node bbox を 3 world だけ離す (clearance > 0 && < 6)。
    // node1 right = 200 + 60/2 = 230、 node2 left = 233 で gap 3、 y は完全一致 (dy=0)。
    laid.nodes[0].cx = 200;
    laid.nodes[0].cy = 300;
    laid.nodes[0].w = 60;
    laid.nodes[0].h = 60;
    laid.nodes[1].cx = 263;
    laid.nodes[1].cy = 300;
    laid.nodes[1].w = 60;
    laid.nodes[1].h = 60;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["node-clearance-budget"]).toBeGreaterThan(0);
  });
});

describe("Axis 37 row-content-typing (CdlDiagram input mutation で意図発火)", () => {
  it("node.rows の url key に非 URL 値を混入すると型検査失敗で発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "n1", lane: "L1", stack: 0, kind: "storage", title: "N1", rows: ["url: not-a-url-value"] },
        { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["row-content-typing"]).toBeGreaterThan(0);
  });
});

describe("Axis 38 terminal-safe-text (CdlDiagram input mutation で意図発火)", () => {
  it("node title に ZWSP (U+200B) を混入すると silent equality break 発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "N1​HIDDEN" },
        { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["terminal-safe-text"]).toBeGreaterThan(0);
  });
});

describe("Axis 39 gpu-layer-efficiency (CdlDiagram input mutation で意図発火)", () => {
  it("dotted-flow edge が phases 0 で particle animation 発火せず無駄 style で警告", () => {
    const diag = baseDiagram({
      edges: [
        { id: "e1", from: "n1", to: "n2", label: "call", tone: "accent", style: "dotted-flow" },
      ],
      phases: [],
    });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["gpu-layer-efficiency"]).toBeGreaterThan(0);
  });
});

describe("Axis 40 memory-budget (LaidDiagram mutation で意図発火)", () => {
  it("nodes の w×h を極端に大きくすると memory unit BUDGET 10^6 超過で発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    // node 2 個 × w=1000 × h=1000 = 2×10^6 で BUDGET 10^6 超過
    for (const n of laid.nodes) {
      n.w = 1000;
      n.h = 1000;
    }
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["memory-budget"]).toBeGreaterThan(0);
  });
});
