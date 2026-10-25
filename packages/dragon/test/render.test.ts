/**
 * 原本の JSON から図を描き、段に合わせて動かす (#2985)。
 *
 * 動きは時刻の表 (`timeline`) が決め、SVG の動きはこの表から組む。
 * 運ぶ物、線の名前、段の番号がいつ見えるかを、表を 0.25 秒ごとに数えて確かめる (見本帳の `probe.mjs` と同じ範囲)。
 */
import { describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { covers, draw, type Rendered, sampleTimes, type Span } from "./render-support";

interface EdgeEvent {
  type: string;
  label?: string;
}
interface Source {
  steps: { events: EdgeEvent[] }[];
}

const oauth = (): Json => exampleJson("oauth.json");
const ccip = (): Json => exampleJson("ccip.json");

const edge = (from: string, to: string, carry: Json, label?: string): Json => ({ type: "edge", from, to, ...(label ? { label } : {}), carry });

/** 運ぶ物の無い線と、箱の中の処理だけの段を持つ時系列図。 */
function quiet(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "静かな段を持つ図",
    boxes: [
      { id: "a", name: "送る側" },
      { id: "b", name: "受ける側" },
    ],
    steps: [
      { title: "送る", body: "送る側が要求を送る。", events: [edge("a", "b", { kind: "envelope" }, "要求")] },
      { title: "合図だけ返す", body: "受ける側は何も運ばない合図を返す。", events: [edge("b", "a", { kind: "none" }, "合図")] },
      { title: "考える", body: "受ける側が中で処理する。", events: [{ type: "action", box: "b", label: "処理する" }] },
      { title: "値を送る", body: "送る側が値を送る。", events: [edge("a", "b", { kind: "tag", text: "値" }, "値")] },
    ],
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 1 つの段に名前を持つ線が 2 本ある時系列図。 */
function twoLabels(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "名前が 2 つ並ぶ図",
    boxes: [
      { id: "a", name: "左" },
      { id: "b", name: "中" },
      { id: "c", name: "右" },
    ],
    steps: [
      { title: "2 本送る", body: "左から中へ、中から右へ同時に送る。", events: [edge("a", "b", { kind: "envelope" }, "1 本目"), edge("b", "c", { kind: "envelope" }, "2 本目")] },
      { title: "返す", body: "右から左へ返す。", events: [edge("c", "a", { kind: "envelope" }, "返事")] },
    ],
    sequence: { lifelines: ["a", "b", "c"] },
  };
}

const render = (diagram: Json): Rendered => draw("renderDiagram")(diagram);
const within = (span: Span, step: Span): boolean => span.start >= step.start - 1e-9 && span.end <= step.end + 1e-9;

/** 段が数どおりに並び、各段の線と番号がその段の間に動くこと。 */
function expectStepsInOrder(diagram: Json, count: number): void {
  const { timeline } = render(diagram);
  const source = diagram as unknown as Source;
  expect(timeline.steps).toHaveLength(count);
  timeline.steps.forEach((step, i) => {
    expect(step.end, `段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
    if (i > 0) expect(step.start, `段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
  });
  expect(timeline.total).toBeGreaterThanOrEqual(timeline.steps[count - 1]?.end ?? Number.POSITIVE_INFINITY);

  source.steps.forEach((step, s) => {
    step.events.forEach((event, e) => {
      if (event.type !== "edge") return;
      const drawn = timeline.edges.filter((span) => span.step === s && span.event === e);
      expect(drawn, `段 ${s + 1} の ${e + 1} 番目の線`).toHaveLength(1);
      const [line] = drawn;
      const span = timeline.steps[s];
      expect(Boolean(line && span && within(line, span)), `段 ${s + 1} の ${e + 1} 番目の線がその段の間に引かれる`).toBe(true);
    });
  });
}

describe("段の順に動く", () => {
  it("oauth-renders-12-steps", () => {
    expectStepsInOrder(oauth(), 12);
  });

  it("ccip-renders-13-steps", () => {
    expectStepsInOrder(ccip(), 13);
  });
});

describe("見える物の数", () => {
  it("carrier-stays-visible", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()], ["静かな段を持つ図", quiet()]] as const) {
      const { timeline } = render(diagram);
      const times = sampleTimes(timeline);
      const empty = times.filter((t) => !timeline.carriers.some((span) => covers(span, t)));
      expect(empty.length / times.length, `${name} で運ぶ物が見えない時刻 ${empty.slice(0, 5).join(", ")}`).toBeLessThanOrEqual(0.02);
    }
  });

  it("labels-show-only-during-their-step", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()], ["名前が 2 つ並ぶ図", twoLabels()]] as const) {
      const { timeline } = render(diagram);
      const source = diagram as unknown as Source;
      const named = source.steps.flatMap((step) => step.events.filter((event) => event.type === "edge" && event.label)).length;
      expect(timeline.labels, `${name} の線の名前の数`).toHaveLength(named);
      for (const label of timeline.labels) {
        const span = timeline.steps[label.step];
        expect(span !== undefined && within(label, span), `${name} の段 ${label.step + 1} の名前`).toBe(true);
      }
      for (const t of sampleTimes(timeline)) {
        const shown = timeline.labels.filter((span) => covers(span, t)).length;
        expect(shown, `${name} の ${t} 秒に見える線の名前`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("badges-hidden-before-their-step", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()], ["静かな段を持つ図", quiet()]] as const) {
      const { timeline } = render(diagram);
      expect(timeline.badges.map((badge) => badge.step), `${name} の番号`).toEqual(timeline.steps.map((_, i) => i));
      for (const badge of timeline.badges) {
        const step = timeline.steps[badge.step];
        expect(badge.appears, `${name} の段 ${badge.step + 1} の番号`).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
        expect(badge.appears, `${name} の段 ${badge.step + 1} の番号`).toBeLessThan(step?.end ?? Number.NEGATIVE_INFINITY);
      }
    }
  });
});

/** 段の番号の丸の半径 (`look/values.ts` の `badge.r`)。 */
const BADGE_R = 9.5;

const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;

/** 線を持たず、処理の札だけを持つ段の番号。 */
function actionOnlySteps(layout: Rendered["layout"]): number[] {
  return layout.badges.map((badge) => badge.step).filter((s) => !layout.edges.some((e) => e.step === s) && layout.actions.some((a) => a.step === s));
}

/** 点が折れ線のどこかの区間の上に在るか。 */
function onPath(x: number, y: number, points: [number, number][]): boolean {
  return points.slice(1).some(([x2, y2], i) => {
    const [x1, y1] = points[i] as [number, number];
    const cross = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
    const inside = Math.min(x1, x2) - 1e-6 <= x && x <= Math.max(x1, x2) + 1e-6 && Math.min(y1, y2) - 1e-6 <= y && y <= Math.max(y1, y2) + 1e-6;
    return Math.abs(cross) < 1e-6 && inside;
  });
}

describe("段の番号の置き場 (#3017)", () => {
  it("oauth-action-steps-are-2-6-8", () => {
    expect(actionOnlySteps(render(oauth()).layout).map((s) => s + 1)).toEqual([2, 6, 8]);
  });

  it("action-step-badge-on-lifeline", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["静かな段を持つ図", quiet()]] as const) {
      const { layout } = render(diagram);
      const steps = actionOnlySteps(layout);
      expect(steps.length, `${name} の処理だけの段`).toBeGreaterThan(0);
      for (const s of steps) {
        const badge = layout.badges.find((b) => b.step === s);
        const action = layout.actions.find((a) => a.step === s);
        const lifeline = layout.lifelines.find((l) => l.id === action?.box);
        expect(Boolean(badge && lifeline && near(badge.x, lifeline.x)), `${name} の段 ${s + 1} の丸が ${action?.box} の生存線の上に在る (丸 ${badge?.x}、生存線 ${lifeline?.x})`).toBe(true);
        expect(Boolean(badge && action && near(badge.y, action.y + action.h / 2)), `${name} の段 ${s + 1} の丸が札と同じ高さに在る`).toBe(true);
      }
    }
  });

  it("action-label-right-of-badge", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["静かな段を持つ図", quiet()]] as const) {
      const { layout } = render(diagram);
      for (const s of actionOnlySteps(layout)) {
        const badge = layout.badges.find((b) => b.step === s);
        const action = layout.actions.find((a) => a.step === s);
        // 札は丸の右端から 4px の所に置く。離れると札がどの丸のものか分からなくなる (#3099)
        expect(badge && action && action.x - (badge.x + BADGE_R), `${name} の段 ${s + 1} の札の左端 ${action?.x} が丸の右端 ${badge && badge.x + BADGE_R} から 4px の所に無い`).toBeCloseTo(4, 5);
      }
    }
  });

  it("edge-step-badge-on-its-line", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()], ["静かな段を持つ図", quiet()]] as const) {
      const { layout } = render(diagram);
      for (const badge of layout.badges) {
        const edge = layout.edges.find((e) => e.step === badge.step);
        if (!edge) continue;
        expect(onPath(badge.x, badge.y, edge.points), `${name} の段 ${badge.step + 1} の丸がその段の最初の線の上に在る`).toBe(true);
      }
    }
  });
});
