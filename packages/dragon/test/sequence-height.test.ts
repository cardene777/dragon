/**
 * 時系列図を縦に詰める (#3177)。
 *
 * 時系列図は、線の名前の札と線の離れを 6 にし、行と行の間、段の切れ目、頭の箱から最初の線まで、最後の線から生存線の終わりまでを詰める。
 * 構成図と状態遷移図の線の名前の離れは変えない。
 */
import { describe, expect, it } from "vitest";
import type { Json } from "./diagram-support";
import { draw, type Layout } from "./render-support";

const edge = (from: string, to: string, label?: string): Json => ({ type: "edge", from, to, ...(label === undefined ? {} : { label }), carry: { kind: "none" } });

/** 1 段目に名前を持つ線と名前の無い線、2 段目に名前を持つ線を持つ時系列図 */
function rows(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "行の間",
    boxes: [
      { id: "a", name: "左" },
      { id: "b", name: "中" },
      { id: "c", name: "右" },
    ],
    steps: [
      { title: "呼ぶ", body: "左が中を呼び、中が右へ渡す。", events: [edge("a", "b", "呼ぶ"), edge("b", "c")] },
      { title: "返す", body: "右が左へ返す。", events: [edge("c", "a", "返す")] },
    ],
    sequence: { lifelines: ["a", "b", "c"] },
  };
}

/** 2 つの箱を横の線で結び、線の上に名前を持つ構成図 */
function architecture(): Json {
  return {
    version: 1,
    kind: "architecture",
    title: "名前の離れ",
    boxes: [
      { id: "a", name: "左" },
      { id: "b", name: "右" },
    ],
    steps: [{ title: "呼ぶ", body: "左が右を呼ぶ。", events: [edge("a", "b", "呼ぶ")] }],
  };
}

/** 始まりから 2 つの状態を横に渡る状態遷移図 */
function state(): Json {
  return {
    version: 1,
    kind: "state",
    title: "名前の離れ",
    boxes: [
      { id: "a", name: "受付" },
      { id: "b", name: "発送" },
    ],
    steps: [
      { title: "受ける", body: "受け付ける。", events: [edge("start", "a", "受ける")] },
      { title: "送る", body: "送る。", events: [edge("a", "b", "送る")] },
    ],
  };
}

const layoutOf = (diagram: Json): Layout => draw("renderDiagram")(diagram).layout;

/** 段 `step` の横の線の高さと、その線の上に置いた名前の札の下端からの離れ */
function above(layout: Layout, step: number): number {
  const line = layout.edges.find((e) => e.step === step);
  const label = layout.labels.find((l) => l.step === step);
  if (!line || !label) throw new Error(`段 ${step + 1} の線か名前が無い`);
  const [, y] = line.points[line.points.length - 1] as [number, number];
  return y - (label.y + label.h);
}

describe("時系列図を縦に詰める (#3177)", () => {
  it("sequence-rows-packed", () => {
    const layout = layoutOf(rows());
    const head = layout.boxes[0];
    const lifeline = layout.lifelines[0];
    expect(head && lifeline, "頭の箱か生存線が無い").toBeTruthy();
    if (!head || !lifeline) return;
    const ys = layout.edges.map((e) => (e.points[0] as [number, number])[1]);
    expect(ys, "線が 3 本無い").toHaveLength(3);
    const [first = 0, second = 0, third = 0] = ys;
    expect(first - (head.y + head.h), "頭の箱の下端から、上に名前を持つ最初の線まで").toBeCloseTo(36, 5);
    expect(second - first, "同じ段の名前の無い線と、前の線の間").toBeCloseTo(32, 5);
    expect(third - second, "上に名前を持つ次の段の線と、前の線の間").toBeCloseTo(48, 5);
    expect(lifeline.y2 - third, "最後の線から生存線の終わりまで").toBeCloseTo(20, 5);
  });

  it("architecture-and-state-label-gap-unchanged", () => {
    expect(above(layoutOf(architecture()), 0), "構成図の名前の札と線の間").toBeCloseTo(12, 5);
    expect(above(layoutOf(state()), 1), "状態遷移図の名前の札と線の間").toBeCloseTo(12, 5);
  });
});
