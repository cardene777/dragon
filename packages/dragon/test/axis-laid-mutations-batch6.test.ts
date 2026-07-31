/**
 * visualValidateLaid API での real defect assertion (6th batch)。
 * Axis 4 (row-format) / 21 (grid-alignment) / 23 (responsive-viewport) /
 * 32 (marker-gradient-def-integrity) / 41 (svg-injection-safety) を追加、
 * 位置関係 core 22 → 27 に拡張。
 *
 * 発火 logic の一次 source は cdl packages/cdl/src/visual-validate.ts SSOT、
 * 本 test は mutation で「意図的に破綻させて発火」 を確認する negative fixture 経路。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-batch6",
    topic: "batch6",
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

describe("Axis 4 row-format (CdlDiagram input mutation で意図発火)", () => {
  it("node.rows に 'key: value' 形式でない row を混ぜると row-format 発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "n1", lane: "L1", stack: 0, kind: "storage", title: "N1", rows: ["not-key-value"] },
        { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["row-format"]).toBeGreaterThan(0);
  });
});

describe("Axis 21 grid-alignment (LaidDiagram mutation で意図発火)", () => {
  it("chart- prefix node の cx を grid 16 world 倍数から外すと grid-alignment 発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "chart-a", lane: "L1", stack: 0, kind: "actor", title: "A" },
        { id: "chart-b", lane: "L2", stack: 0, kind: "actor", title: "B" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    laid.nodes[0].cx = 100.7;
    laid.nodes[0].cy = 100.3;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["grid-alignment"]).toBeGreaterThan(0);
  });
});

describe("Axis 23 responsive-viewport (LaidDiagram mutation で意図発火)", () => {
  // cdl#353 で幅の下限判定を外した。 図は親幅いっぱいに伸びるため幅が小さいほど拡大されて
  // 読みやすくなり、 「幅が小さい = 識別不能」 は成り立たない。 代わりに縦横比と、
  // 描画できない寸法を見る。
  it("viewBox を極端に横長にすると responsive-viewport 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    laid.viewBox.w = 3000;
    laid.viewBox.h = 270;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["responsive-viewport"]).toBeGreaterThan(0);
  });

  it("viewBox を極端に縦長にしても responsive-viewport 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    laid.viewBox.w = 270;
    laid.viewBox.h = 3000;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["responsive-viewport"]).toBeGreaterThan(0);
  });

  it("viewBox width を 400 world 未満にしても縦横比が保たれていれば発火しない", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    laid.viewBox.w = 300;
    laid.viewBox.h = 270;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["responsive-viewport"] ?? 0).toBe(0);
  });

  it("viewBox 寸法を 0 にすると描画不能として発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    laid.viewBox.w = 0;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["responsive-viewport"]).toBeGreaterThan(0);
  });
});

describe("Axis 32 marker-gradient-def-integrity (LaidDiagram mutation で意図発火)", () => {
  it("edge tone を TONE_COLORS 未定義値に強制すると marker dead ref 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    // tone 型 union を bypass して runtime string を注入 (dead ref 検知の gate 目的)
    (laid.edges[0] as { tone: string }).tone = "unknown-tone";
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["marker-gradient-def-integrity"]).toBeGreaterThan(0);
  });
});

describe("Axis 41 svg-injection-safety (CdlDiagram input mutation で意図発火)", () => {
  it("node title に <script> tag を混入すると XSS pattern 検出で発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "<script>alert(1)</script>" },
        { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["svg-injection-safety"]).toBeGreaterThan(0);
  });
});
