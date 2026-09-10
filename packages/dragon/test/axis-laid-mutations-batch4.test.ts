/**
 * visualValidateLaid API での real defect assertion (4th batch)。
 * Axis 17/20/33 を追加、 位置関係 core 16 → 19 に拡張。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { at } from "./support/at";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-batch4",
    topic: "batch4",
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

describe("Axis 17 group-boundary-clearance (LaidDiagram mutation で意図発火)", () => {
  it("contain lane 内 node を lane 右端に迫らせると boundary 発火", () => {
    const diag = baseDiagram({
      lanes: [{ id: "L1", x: 0, width: 400, contain: true, label: "L1" }],
      nodes: [{ id: "n1", lane: "L1", stack: 0, kind: "actor", title: "N1" }],
      edges: [],
    });
    const laid = layout(diag);
    const lane = at(laid.lanes, 0, "laid.lanes");
    at(laid.nodes, 0, "laid.nodes").cx = lane.x + lane.width - 20;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["group-boundary-clearance"]).toBeGreaterThan(0);
  });
});

describe("Axis 20 arrow-marker-clearance (LaidDiagram mutation で意図発火)", () => {
  it("edge 終点を to node 中心に近づけると marker clearance 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    const n2 = at(laid.nodes, 1, "laid.nodes");
    at(laid.edges, 0, "laid.edges").d = `M ${n2.cx} ${n2.cy} L ${n2.cx + 1} ${n2.cy + 1}`;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["arrow-marker-clearance"]).toBeGreaterThan(0);
  });
});

describe("Axis 23 responsive-viewport (LaidDiagram mutation で意図発火)", () => {
  it("図を横に広げると発火する (縦横比は境の内側のまま)", () => {
    /*
     * 元は軸 33 (`subpixel-precision`) の発火を見ていたが、 軸は `cdl#783` で外れた。
     * 同じ release で判定を差し替えた軸 23 に置き換える。
     *
     * **入力は旧判定が拾えない形にする**。 旧判定は縦横比 6:1 を境にしていたので、
     * 縦横比を 6:1 の内側に保ったまま幅だけを境の外へ出す。 面積で測る形に戻したら
     * この検査が落ちる。
     */
    const diag = baseDiagram();
    const laid = layout(diag);
    laid.viewBox = { x: 0, y: 0, w: 3000, h: 2000 };
    const 縦横比 = Math.max(laid.viewBox.w / laid.viewBox.h, laid.viewBox.h / laid.viewBox.w);
    expect(縦横比, "縦横比が旧判定の境を超えていると、幅で拾えている証拠にならない").toBeLessThan(6);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["responsive-viewport"]).toBeGreaterThan(0);
  });
});
