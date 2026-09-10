/**
 * visualValidateLaid API での real defect assertion (8th batch)。
 * Axis 37 (row-content-typing) /
 * 38 (terminal-safe-text) / 39 (gpu-layer-efficiency) / 34 (dom-complexity-budget) を追加、
 * 位置関係 core 32 → 37 に拡張。
 *
 * 軸 40 (memory-budget) は cardene777/cdl#775 で削除され、軸 34 へ差し替えた。
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

/**
 * 軸 30 (旧 `neumorphism-shadow-budget` → `node-clearance-budget`) の検査は
 * cardene777/cdl#426 で軸ごと削除されたため外した。
 *
 * 軸は主題固有の影 (6 world) を前提としており、 主題の廃止で根拠が消えた。
 * 隣り合う node の間隔は `node-vertical-clearance` (40 world) と
 * near-collision (70 world) が引き続き見る。
 */

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

/**
 * 軸 40 (`memory-budget`) の検査は cardene777/cdl#775 で軸ごと削除されたため差し替えた。
 *
 * 軸は「図が大きすぎる」 を **箱の面積の合計** で測っており、順位が実物と逆だった
 * (箱 1 つ・描く物 5 個の縦長の図が超過し、線の折れが 44 ある図が通っていた)。
 * 描く物の数は軸 34 (`dom-complexity-budget`) が見るので、保証をそちらへ移す。
 *
 * **面積では発火しない入力で書く**。 面積で測る形に戻した時に落ちるようにするため、
 * 箱を小さくして数だけを増やす。
 */
describe("Axis 34 dom-complexity-budget (LaidDiagram mutation で意図発火)", () => {
  it("描く物を境の外まで増やすと発火する (面積は境の内側のまま)", () => {
    const 箱数 = 420;
    const diag = baseDiagram({
      nodes: Array.from({ length: 箱数 }, (_, i) => ({
        id: `n${i}`,
        lane: i % 2 === 0 ? "L1" : "L2",
        stack: Math.floor(i / 2),
        kind: "card" as const,
        title: `N${i}`,
        w: 10,
        h: 10,
      })),
      edges: [],
    });
    const laid = layout(diag);
    for (const n of laid.nodes) {
      n.w = 10;
      n.h = 10;
    }
    // 面積の合計は旧軸 40 の境 (10^6) の内側 = 面積で測る形に戻すと発火しない
    const 面積 = laid.nodes.reduce((a, n) => a + n.w * n.h, 0);
    expect(面積, "面積が旧軸の境を超えていると、数で拾えている証拠にならない").toBeLessThan(
      1_000_000,
    );
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["dom-complexity-budget"]).toBeGreaterThan(0);
  });
});
