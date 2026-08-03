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
  // cdl#368 で 2 点変わった。 対象を節の id 接頭辞から **種別** で絞るようになり、
  // 判定も箱の中心から **4 辺** に変わった。 節の id を `chart-` にしただけでは対象に入らない。
  const gridDiagram = () =>
    baseDiagram({
      nodes: [
        { id: "a", lane: "L1", stack: 0, kind: "chart-pie", title: "A" },
        { id: "b", lane: "L2", stack: 0, kind: "actor", title: "B" },
      ],
      edges: [],
    });

  it("格子に載せる種別の箱の左端を grid 16 world 倍数から外すと発火", () => {
    const diag = gridDiagram();
    const laid = layout(diag);
    // 左端 = cx - w / 2 を格子から 5 world ずらす (許容は ±2)
    laid.nodes[0].cx = laid.nodes[0].w / 2 + 5;
    laid.nodes[0].cy = laid.nodes[0].h / 2;
    expect(visualValidateLaid(laid, diag).counts["grid-alignment"]).toBeGreaterThan(0);
  });

  it("箱の寸法を grid 16 world 倍数から外すと右下が外れて発火", () => {
    const diag = gridDiagram();
    const laid = layout(diag);
    laid.nodes[0].cx = laid.nodes[0].w / 2;
    laid.nodes[0].cy = laid.nodes[0].h / 2;
    // 左上は格子に載せたまま幅だけ 5 world 増やす
    laid.nodes[0].w += 5;
    laid.nodes[0].cx += 2.5;
    expect(visualValidateLaid(laid, diag).counts["grid-alignment"]).toBeGreaterThan(0);
  });

  it("格子に載せない種別は、 id が chart- / funnel- でも発火しない", () => {
    // id は旧仕様の接頭辞に合わせ、 種別だけを対象外にする。 実装が id 接頭辞の判定に
    // 戻る (または種別と併用する) 回帰を、 この形でないと捕まえられない。
    const diag = baseDiagram({
      nodes: [
        { id: "chart-a", lane: "L1", stack: 0, kind: "actor", title: "A" },
        { id: "funnel-b", lane: "L2", stack: 0, kind: "card", title: "B" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    for (const n of laid.nodes) {
      n.cx = n.w / 2 + 5;
      n.cy = n.h / 2 + 5;
    }
    expect(visualValidateLaid(laid, diag).counts["grid-alignment"]).toBe(0);
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
