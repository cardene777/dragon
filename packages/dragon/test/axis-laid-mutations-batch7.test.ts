/**
 * visualValidateLaid API での real defect assertion (7th batch)。
 * Axis 25 (animation-frame-integrity) / 34 (dom-complexity-budget) /
 * 35 (reduced-motion-compat) / 36 (touch-target-size) /
 * 42 (seo-metadata-quality) を追加、 位置関係 core 27 → 32 に拡張。
 *
 * 発火 logic の一次 source は cdl packages/cdl/src/visual-validate.ts SSOT、
 * 本 test は mutation で「意図的に破綻させて発火」 を確認する negative fixture 経路。
 */
import { describe, it, expect } from "vitest";
import { visualValidateLaid, layout } from "@cardenelabs/cdl";
import type { CdlDiagram, CdlPhase } from "@cardenelabs/cdl";
import { at } from "./support/at";

/**
 * 手で組む段 (#1414)。
 *
 * `CdlPhase` は `title` / `body` / `activate` を必須で持つ。 画面に出す見出しと説明と
 * 「この段で光らせる箱」 で、動きの検査には要らない。 空で埋める。
 *
 * 省くと型が通らず、`as` で潰すと **本当に必要な項目を書き忘れた時も通ってしまう**。
 */
function 段(o: Pick<CdlPhase, "id" | "duration"> & Partial<CdlPhase>): CdlPhase {
  return { title: "", body: "", activate: [], tweens: [], sets: [], ...o };
}

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "laid-mutation-batch7",
    topic: "batch7",
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

describe("Axis 25 animation-frame-integrity (CdlDiagram input mutation で意図発火)", () => {
  it("phase tween が未定義 stateId を参照すると発火", () => {
    const diag = baseDiagram({
      states: [{ id: "s1", initial: 0 }],
      phases: [
        段({
          id: "p1",
          duration: 800,
          tweens: [{ stateId: "s-undefined", from: 0, to: 1 }],
          sets: [],
        }),
        段({
          id: "p2",
          duration: 800,
          tweens: [],
          sets: [],
        }),
      ],
    });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["animation-frame-integrity"]).toBeGreaterThan(0);
  });
});

describe("Axis 34 dom-complexity-budget (LaidDiagram mutation で意図発火)", () => {
  it("nodes を 401 個に膨らませると DOM_COMPLEXITY_BUDGET 400 超過で発火", () => {
    const diag = baseDiagram();
    const laid = layout(diag);
    const template = at(laid.nodes, 0, "laid.nodes");
    for (let i = 0; i < 400; i++) {
      laid.nodes.push({ ...template, id: `mass-${i}` });
    }
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["dom-complexity-budget"]).toBeGreaterThan(0);
  });
});

describe("Axis 35 reduced-motion-compat (CdlDiagram input mutation で意図発火)", () => {
  it("phase duration を 400ms 未満に強制すると flicker/seizure リスク発火", () => {
    const diag = baseDiagram({
      states: [{ id: "s1", initial: 0 }],
      phases: [
        段({
          id: "p-fast",
          duration: 100,
          tweens: [],
          sets: [],
        }),
        段({
          id: "p2",
          duration: 800,
          tweens: [],
          sets: [],
        }),
      ],
    });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["reduced-motion-compat"]).toBeGreaterThan(0);
  });
});

describe("Axis 36 touch-target-size (LaidDiagram mutation で意図発火)", () => {
  it("phases N 個 × 44 world > viewBox width で touch target 不足発火", () => {
    const diag = baseDiagram({
      states: [{ id: "s1", initial: 0 }],
      phases: Array.from({ length: 20 }, (_, i) => 段({ id: `p${i}`, duration: 800 })),
    });
    const laid = layout(diag);
    laid.viewBox.w = 500;
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["touch-target-size"]).toBeGreaterThan(0);
  });
});

describe("Axis 42 seo-metadata-quality (CdlDiagram input mutation で意図発火)", () => {
  it("diagram topic を空文字列にすると OGP meta 生成不可で発火", () => {
    const diag = baseDiagram({ topic: "" });
    const laid = layout(diag);
    const report = visualValidateLaid(laid, diag);
    expect(report.counts["seo-metadata-quality"]).toBeGreaterThan(0);
  });
});
