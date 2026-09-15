/**
 * visualValidateLaid API での real defect assertion (3rd batch)。
 * Axis 15/18/19/24 を追加、 位置関係 core を 12 → 16 に拡張。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { at } from "./support/at";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-more",
    topic: "more",
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

describe("Axis 15 lane-cx-consistency (LaidDiagram mutation で意図発火)", () => {
  it("node cx を lane 中心から強く shift すると cx-consistency 発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    const laneL1 = laid.lanes.find((l) => l.id === "L1")!;
    at(laid.nodes, 0, "laid.nodes").cx = laneL1.x + laneL1.width + 100;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["lane-cx-consistency"]).toBeGreaterThan(0);
  });
});

describe("Axis 18 node-vertical-clearance (LaidDiagram mutation で意図発火)", () => {
  it("同 lane 内 2 node の vertical gap を極端に近づけると clearance 発火", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "a", lane: "L1", stack: 0, kind: "actor", title: "A" },
        { id: "b", lane: "L1", stack: 1, kind: "actor", title: "B" },
      ],
      edges: [],
    });
    const laid = layout(diag);
    // b の cy を a のすぐ下 (gap 5px) に強制
    at(laid.nodes, 1, "laid.nodes").cy =
      at(laid.nodes, 0, "laid.nodes").cy +
      at(laid.nodes, 0, "laid.nodes").h +
      5;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["node-vertical-clearance"]).toBeGreaterThan(0);
  });
});

describe("Axis 19 lane-lane-gap (LaidDiagram mutation で意図発火)", () => {
  // cdl#353 で判定対象を「枠が描かれる lane の対」 に絞った。 contain なし lane は塗りも線も
  // 持たない矩形しか描かれず、 間隔が狭いこと自体が画面に現れないため。
  it("枠を描く 2 lane を極端に近づけると gap 発火", () => {
    const diag = baseDiagram();
    for (const l of diag.lanes) l.contain = true;
    const laid = layout(diag);
    // L2 を L1 の右端に近づける (gap 5px)
    at(laid.lanes, 1, "laid.lanes").x =
      at(laid.lanes, 0, "laid.lanes").x +
      at(laid.lanes, 0, "laid.lanes").width +
      5;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["lane-lane-gap"]).toBeGreaterThan(0);
  });

  it("片方だけ枠を描く 2 lane を近づけても gap 発火", () => {
    const diag = baseDiagram();
    at(diag.lanes, 0, "diag.lanes").contain = true;
    const laid = layout(diag);
    at(laid.lanes, 1, "laid.lanes").x =
      at(laid.lanes, 0, "laid.lanes").x +
      at(laid.lanes, 0, "laid.lanes").width +
      5;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["lane-lane-gap"]).toBeGreaterThan(0);
  });

  it("枠を描かない 2 lane はいくら近づけても発火しない", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    at(laid.lanes, 1, "laid.lanes").x =
      at(laid.lanes, 0, "laid.lanes").x +
      at(laid.lanes, 0, "laid.lanes").width +
      5;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["lane-lane-gap"] ?? 0).toBe(0);
  });
});

describe("Axis 24 accessibility-basics (LaidDiagram mutation で意図発火)", () => {
  // 図は `<svg role="img">` で描かれ、 中の節は個別に公開されない。 そのため本軸は
  // 節ごとの題名ではなく「図の代替説明が組み立つか」 を見る (cdl#363)。
  const countOf = (diag: CdlDiagram): number =>
    visualValidateLaid(layout(diag), diag).counts["accessibility-basics"] ?? 0;

  it("題名 (topic) が空だと発火", () => {
    expect(countOf(baseDiagram({ topic: "" }))).toBeGreaterThan(0);
  });

  it("段に題も説明も無いと発火", () => {
    const diag = baseDiagram({
      phases: [
        { id: "p", duration: 1000, title: "", body: "", activate: [], tweens: [], sets: [] },
      ],
    });
    expect(countOf(diag)).toBeGreaterThan(0);
  });

  it("題名と段の説明が揃っていれば発火しない", () => {
    const diag = baseDiagram({
      phases: [
        { id: "p", duration: 1000, title: "段の題", body: "段の説明", activate: [], tweens: [], sets: [] },
      ],
    });
    expect(countOf(diag)).toBe(0);
  });

  it("段は題だけ / 説明だけでも発火しない (どちらか一方でよい)", () => {
    const withOnly = (title: string, body: string): CdlDiagram =>
      baseDiagram({
        phases: [{ id: "p", duration: 1000, title, body, activate: [], tweens: [], sets: [] }],
      });
    expect(countOf(withOnly("段の題", "")), "題だけで発火した").toBe(0);
    expect(countOf(withOnly("", "段の説明")), "説明だけで発火した").toBe(0);
  });

  it("段は 1 つずつ見る (揃った段と空の段が混ざると空の方だけ発火)", () => {
    const diag = baseDiagram({
      phases: [
        { id: "p1", duration: 1000, title: "段 1", body: "説明 1", activate: [], tweens: [], sets: [] },
        { id: "p2", duration: 1000, title: "", body: "", activate: [], tweens: [], sets: [] },
      ],
    });
    expect(countOf(diag)).toBe(1);
  });

  it("節の題名が空でも発火しない (節は個別に公開されない)", () => {
    const diag = baseDiagram({
      nodes: [
        { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "" },
        { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
      ],
      phases: [
        { id: "p", duration: 1000, title: "段の題", body: "段の説明", activate: [], tweens: [], sets: [] },
      ],
    });
    expect(countOf(diag)).toBe(0);
  });
});
