/**
 * 箱と線と名前の置き場所を自動で決める (#2985)。
 *
 * 部品どうしは 10px 以上離す。線の名前が線より長い時は線の脇へ寄せ、書き手が寄せの指示
 * (`labelSide`) で側を書いた時はその側へ置く。
 */
import { describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { draw, gap, type Layout, longestSegment } from "./render-support";

const edge = (from: string, to: string, label: string, labelSide?: string): Json => ({
  type: "edge",
  from,
  to,
  label,
  ...(labelSide ? { labelSide } : {}),
  carry: { kind: "envelope" },
});

/** 同じ区画で隣り合う 2 つの箱を、2 つの箱より長い名前の線で結ぶ構成図。 */
function longLabel(): Json {
  return {
    version: 1,
    kind: "architecture",
    title: "長い名前の線",
    regions: [{ id: "r", name: "区画" }],
    boxes: [
      { id: "a", name: "入口", region: "r" },
      { id: "b", name: "出口", region: "r" },
    ],
    steps: [{ title: "流す", body: "入口から出口へ流す。", events: [edge("a", "b", "とても長い名前を持つ線で二つの箱の間には収まらない")] }],
  };
}

/** 1 つの区画に 4 つの箱を並べ、中ほどの 2 つを長い名前の線で結ぶ構成図。線に沿ってずらしても両隣の箱に掛かる。 */
function crowdedRow(): Json {
  return {
    version: 1,
    kind: "architecture",
    title: "並んだ箱の間の長い名前",
    regions: [{ id: "r", name: "区画" }],
    boxes: [
      { id: "a", name: "左", region: "r" },
      { id: "b", name: "中の左", region: "r" },
      { id: "c", name: "中の右", region: "r" },
      { id: "d", name: "右", region: "r" },
    ],
    steps: [{ title: "流す", body: "中の左から中の右へ流す。", events: [edge("b", "c", "とても長い名前を持つ線で二つの箱の間には収まらない")] }],
  };
}

const layoutOf = (diagram: Json): Layout => draw("renderDiagram")(diagram).layout;

function expectGaps(name: string, layout: Layout): void {
  const { boxes, labels } = layout;
  expect(boxes.length, `${name} の箱`).toBeGreaterThan(1);
  boxes.forEach((a, i) => {
    for (const b of boxes.slice(i + 1)) expect(gap(a, b), `${name} の ${a.id} と ${b.id}`).toBeGreaterThanOrEqual(10);
  });
  for (const label of labels) {
    for (const box of boxes) {
      expect(gap(label, box), `${name} の線の名前「${label.text}」と ${box.id}`).toBeGreaterThanOrEqual(10);
    }
  }
}

describe("離す", () => {
  it("layout-keeps-10px-gap", () => {
    expectGaps("OAuth", layoutOf(exampleJson("oauth.json")));
    expectGaps("CCIP", layoutOf(exampleJson("ccip.json")));

    // 線より長い名前は、線の脇へ寄せても箱から 10px 以上離れ、図の中に収まる
    const long = layoutOf(longLabel());
    expect(long.labels).toHaveLength(1);
    expectGaps("長い名前の線", long);
    const [label] = long.labels;
    if (!label) return;
    expect(label.x).toBeGreaterThanOrEqual(0);
    expect(label.x + label.w).toBeLessThanOrEqual(long.width);

    // 線に沿ってずらすだけでは両隣の箱に掛かる名前も、線から離して箱から 10px 以上離す
    const crowded = layoutOf(crowdedRow());
    expect(crowded.labels).toHaveLength(1);
    expectGaps("並んだ箱の間の長い名前", crowded);
  });
});

/** 3 本の生存線に、上と下の指示を持つ横の線を引く時系列図。 */
function sequenceSides(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "上と下の指示",
    boxes: [
      { id: "a", name: "左" },
      { id: "b", name: "中" },
      { id: "c", name: "右" },
    ],
    steps: [
      { title: "上に置く", body: "名前を線の上に置く。", events: [edge("a", "b", "上の名前", "above")] },
      { title: "下に置く", body: "名前を線の下に置く。", events: [edge("b", "c", "下の名前", "below")] },
    ],
    sequence: { lifelines: ["a", "b", "c"] },
  };
}

/** 上下に重ねた 2 つの区画の箱を縦の線で結び、左と右の指示を持つ構成図。左の指示は図の左端の線に付く。 */
function architectureSides(side: "left" | "right"): Json {
  return {
    version: 1,
    kind: "architecture",
    title: "左右の指示",
    regions: [
      { id: "top", name: "上の区画" },
      { id: "bottom", name: "下の区画" },
    ],
    boxes: [
      { id: "a", name: "上の箱", region: "top" },
      { id: "b", name: "下の箱", region: "bottom" },
    ],
    steps: [{ title: "下へ流す", body: "上の箱から下の箱へ流す。", events: [edge("a", "b", "脇に置く名前", side)] }],
  };
}

describe("寄せの指示", () => {
  it("layout-honors-label-side-hint", () => {
    const seq = layoutOf(sequenceSides());
    for (const [step, side] of [
      [0, "above"],
      [1, "below"],
    ] as const) {
      const line = seq.edges.find((e) => e.step === step);
      const label = seq.labels.find((l) => l.step === step);
      expect(line && label, `段 ${step + 1} の線と名前`).toBeTruthy();
      if (!line || !label) return;
      const segment = longestSegment(line.points);
      expect(segment.vertical, "時系列図の線は横").toBe(false);
      const y = segment.a[1];
      // 名前は線から 12px 離す。離れすぎると名前がどの線のものか分からなくなる (#3099)
      const apart = side === "above" ? y - (label.y + label.h) : label.y - y;
      expect(apart, `${side === "above" ? "上" : "下"}の名前と線の間が 12px でない`).toBeCloseTo(12, 5);
    }

    // 指示した側が図の左端でも、名前はその側に置かれ、図の外へ出ない
    for (const side of ["left", "right"] as const) {
      const arch = layoutOf(architectureSides(side));
      const [line] = arch.edges;
      const [label] = arch.labels;
      expect(line && label, `${side} の線と名前`).toBeTruthy();
      if (!line || !label) return;
      const segment = longestSegment(line.points);
      expect(segment.vertical, "上下の区画を結ぶ線は縦").toBe(true);
      const x = segment.a[0];
      // 縦の線の脇の名前は線から 14px 離す (#3099)
      const apart = side === "left" ? x - (label.x + label.w) : label.x - x;
      expect(apart, `${side === "left" ? "左" : "右"}の名前と線の間が 14px でない`).toBeCloseTo(14, 5);
      expect(label.x, `${side} の名前が図の左に出ない`).toBeGreaterThanOrEqual(0);
      expect(label.x + label.w, `${side} の名前が図の右に出ない`).toBeLessThanOrEqual(arch.width);
    }
  });
});
