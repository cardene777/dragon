/**
 * 原本の JSON から図を描き、段に合わせて動かす (#2985)。
 *
 * 動きは時刻の表 (`timeline`) が決め、SVG の動きはこの表から組む。
 * 運ぶ物、線の名前、段の番号がいつ見えるかを、表を 0.25 秒ごとに数えて確かめる (見本帳の `probe.mjs` と同じ範囲)。
 */
import { describe, expect, it } from "vitest";
import { LOOK } from "../src/look/values";
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

/** 1 つの段に名前を持つ線が 3 本ある時系列図。3 つ目の名前が出る時に 1 つ目を消す。 */
function threeLabels(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "名前が 3 つ並ぶ図",
    boxes: [
      { id: "a", name: "左" },
      { id: "b", name: "中" },
      { id: "c", name: "右" },
    ],
    steps: [
      {
        title: "3 本送る",
        body: "左から中へ、中から右へ送り、右から左へ返す。",
        events: [edge("a", "b", { kind: "envelope" }, "1 本目"), edge("b", "c", { kind: "envelope" }, "2 本目"), edge("c", "a", { kind: "envelope" }, "3 本目")],
      },
    ],
    sequence: { lifelines: ["a", "b", "c"] },
  };
}

/** 本文の長さだけが違う 3 つの段を持つ時系列図。どの段も運ぶ物の無い線を 1 本だけ引く。 */
function bodies(): Json {
  const step = (title: string, body: string): Json => ({ title, body, events: [edge("a", "b", { kind: "none" })] });
  return {
    version: 1,
    kind: "sequence",
    title: "本文の長さが違う段",
    boxes: [
      { id: "a", name: "送る側" },
      { id: "b", name: "受ける側" },
    ],
    steps: [step("短い本文", "合図を送る。"), step("100 字の本文", "本文の字".repeat(25)), step("400 字の本文", "本文の字".repeat(100))],
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 線が着いた後に、受ける側の箱の下の字を続けて 2 度書き換える時系列図。 */
function quickSwaps(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "続けて書き換える図",
    boxes: [
      { id: "a", name: "送る側", sub: "待つ" },
      { id: "b", name: "受ける側", sub: "空" },
    ],
    steps: [
      {
        title: "送って書き換える",
        body: "送る側が送り、受ける側の字を続けて書き換える。",
        events: [edge("a", "b", { kind: "envelope" }), { type: "swap", box: "b", text: "すぐ替わる字" }, { type: "swap", box: "b", text: "残る字" }],
      },
    ],
    sequence: { lifelines: ["a", "b"] },
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
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()], ["名前が 2 つ並ぶ図", twoLabels()], ["名前が 3 つ並ぶ図", threeLabels()]] as const) {
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

/** 段の中で線を引き終え、書き換えが済む時刻。処理だけの段は処理を始める時刻。 */
function settled(timeline: Rendered["timeline"], s: number): number {
  const step = timeline.steps[s] as Span;
  return Math.max(step.start, ...timeline.edges.filter((e) => e.step === s).map((e) => e.drawn), ...timeline.events.filter((e) => e.step === s).map((e) => e.at));
}

describe("段の長さ", () => {
  it("step-length-follows-body", () => {
    const lengths = render(bodies()).timeline.steps.map((span) => span.end - span.start);
    // 段は本文を読める長さにする。短い本文でも 2.2 秒は見せ、1 字ごとに 0.025 秒伸ばし、5 秒で止める (`look/values.ts` の `MOTION`)
    expect(lengths[0], "本文の短い段").toBeCloseTo(2.2, 6);
    expect(lengths[1], "本文が 100 字の段").toBeCloseTo(3.7, 6);
    expect(lengths[2], "本文が 400 字の段").toBeCloseTo(5, 6);
  });

  it("intro-shows-whole-figure-first", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()]] as const) {
      // 最初の段の前の 1.4 秒は、どの段も始めずに図の全体を見せる
      expect(render(diagram).timeline.steps[0]?.start, `${name} の最初の段の始まり`).toBeCloseTo(1.4, 6);
    }
  });

  it("step-dwells-after-last-change", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()], ["静かな段を持つ図", quiet()]] as const) {
      const { timeline } = render(diagram);
      timeline.steps.forEach((span, s) => {
        // 段で起きることが全部見えてから 1.2 秒は留める。すぐ次の段へ移ると、何が起きたかを見る間が無い
        expect(span.end - settled(timeline, s), `${name} の段 ${s + 1} が、線を引き終えて書き換えが済んでから留まる長さ`).toBeGreaterThanOrEqual(1.2 - 1e-9);
      });
    }
  });

  it("still-shows-whole-step", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()], ["静かな段を持つ図", quiet()]] as const) {
      const { timeline } = render(diagram);
      expect(timeline.stills, `${name} の止め絵の数`).toHaveLength(timeline.steps.length);
      timeline.steps.forEach((span, s) => {
        const still = timeline.stills[s] ?? Number.NaN;
        // 止め絵は、その段で起きることが全部見えた後で、次の段が始まる前に撮る
        expect(still, `${name} の段 ${s + 1} の止め絵が、線を引き終えて書き換えが済んだ後に在る`).toBeGreaterThanOrEqual(settled(timeline, s));
        expect(still, `${name} の段 ${s + 1} の止め絵が、段の終わりより前に在る`).toBeLessThan(span.end);
      });
    }
  });
});

describe("箱の下の字", () => {
  it("quick-swap-text-not-drawn", () => {
    const { svg, timeline } = render(quickSwaps());
    const [first, second] = timeline.events;
    expect(first && second && second.at - first.at, "2 度の書き換えの間").toBeCloseTo(0.12, 6);
    // 0.8 秒より早く次の字に替わる字は読めないので出さない
    expect(svg, "すぐ替わる字").not.toContain("すぐ替わる字");
    expect(svg, "残る字").toContain("残る字");
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

const lengthOf = (points: [number, number][]): number => points.slice(1).reduce((sum, [x2, y2], i) => sum + Math.hypot(x2 - (points[i]?.[0] ?? x2), y2 - (points[i]?.[1] ?? y2)), 0);

/** 折れ線の始まりから、線の上の点までの道のり。点が線の上に無ければ NaN。 */
function distanceAlong(x: number, y: number, points: [number, number][]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as [number, number];
    const b = points[i] as [number, number];
    if (onPath(x, y, [a, b])) return sum + Math.hypot(x - a[0], y - a[1]);
    sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return Number.NaN;
}

describe("段の番号の置き場 (#3017)", () => {
  it("short-line-badge-at-start", () => {
    const { layout } = render(ccip());
    const short = layout.badges.flatMap((badge) => {
      const line = layout.edges.find((e) => e.step === badge.step);
      return line && lengthOf(line.points) < LOOK.badge.short ? [{ badge, line }] : [];
    });
    expect(short.length, "CCIP の 44 より短い線に置いた番号").toBeGreaterThan(0);
    for (const { badge, line } of short) {
      // 短い線も始まりに置く。中ほどに置くと、往復する 2 本の短い線で 2 つの番号が同じ高さに並んで重なる (#3189)。
      // 出る箱の縁から番号の半径と 1px だけ進めるので、丸は出る箱に掛からない
      expect(distanceAlong(badge.x, badge.y, line.points), `段 ${badge.step + 1} の丸の、線の始まりからの道のり`).toBeCloseTo(LOOK.badge.r + 1, 6);
      const from = layout.boxes.find((b) => b.id === line.from);
      if (!from) throw new Error(`段 ${badge.step + 1} の線が出る箱が無い`);
      const gap = Math.hypot(Math.max(from.x - badge.x, 0, badge.x - (from.x + from.w)), Math.max(from.y - badge.y, 0, badge.y - (from.y + from.h)));
      expect(gap, `段 ${badge.step + 1} の丸が出る箱に掛かる`).toBeGreaterThanOrEqual(LOOK.badge.r);
    }
  });

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

describe("線の形と模様 (#3171)", () => {
  const order = (): Json => exampleJson("order.json");

  it("lines-round-their-bends", () => {
    let rounded = 0;
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()], ["注文", order()]] as const) {
      const { svg } = render(diagram);
      const ds = [...svg.matchAll(/class="dg-(?:e|e-on dg-a|path)"[^>]*? d="([^"]*)"/gu)].map((m) => m[1] as string);
      expect(ds.length, `${name} に線が無い`).toBeGreaterThan(0);
      for (const d of ds) {
        expect(d, `${name} の線が直角の角を持つ: ${d}`).not.toMatch(/L -?[\d.]+ -?[\d.]+ L/u);
        if (d.includes(" Q ")) rounded++;
      }
    }
    expect(rounded, "曲がりを丸めた線が 1 本も無い").toBeGreaterThan(0);
  });

  it("non-state-lines-keep-dotted-texture", () => {
    for (const [name, diagram] of [["OAuth", oauth()], ["CCIP", ccip()]] as const) {
      const { svg, layout, timeline } = render(diagram);
      const taken = layout.edges.filter((e) => e.points.length > 0).length;
      expect((svg.match(/class="dg-e-on dg-a"/gu) ?? []).length, `${name} の色の線の数`).toBe(taken);
      expect(svg, `${name} の済んだ線が薄く残らない`).toMatch(/opacity:0\.45/u);
      for (const cls of ["dg-e-past", "dg-bdp-g", "dg-cap-past", "dg-fv-now"]) expect(svg, `${name} に状態遷移図だけの部品 ${cls} が出る`).not.toContain(`class="${cls}`);
      expect(
        timeline.labels.every((l) => !("after" in l)),
        `${name} の線の名前が段の後に残る`,
      ).toBe(true);
    }
  });
});
