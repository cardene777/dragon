/**
 * 段ごとの始まりと長さと、線、運ぶ物、線の名前、段の番号が見える時刻の表。SVG の動きはこの表から組む。
 *
 * 段の長さは本文の字数で決め、段で起きることが全部済んでから少し留まる長さを下限にする。
 * 運ぶ物は主役 (封筒と札は 1 つ、硬貨は別の 1 つ) ごとに途切れず見え続ける。着いた後は
 * 次の同じ主役が出発するまで着いた先に留まり、次が無ければ終わりまで留まる。
 * 線の名前はその段の間だけ出し、同じ段に何本あっても同時に見えるのは 2 つまでにする。
 * 状態遷移図では、段が終わった後も線の名前を最後の段まで薄く残す (#3171)。薄い名前は 2 つまでの数に入れない。
 * 状態遷移図では、主役の運ぶ物が乗っている状態を光らせ、運ぶ物が出た状態には少し後に済んだ印を出す (#3163)。
 */
import { MOTION } from "./look/values";
import type { Diagram } from "./schema";
import { STATE_ENDS } from "./words";

/** 秒で表した、見えている間。`end` の時刻は含まない。 */
export interface Span {
  start: number;
  end: number;
}

/** 線を引いている間。`start` で引き始め、`drawn` で引き終わり、`end` (段の終わり) まで濃く残す。 */
export interface EdgeTime extends Span {
  step: number;
  event: number;
  drawn: number;
}

/** 運ぶ物が見えている間。`depart` に出発し `arrive` に着く。出発を待つ間と、着いた先で留まる間も含む。 */
export interface CarrierTime extends Span {
  step: number;
  event: number;
  who: "main" | "coin";
  depart: number;
  arrive: number;
}

export interface LabelTime extends Span {
  step: number;
  event: number;
  /** 状態遷移図だけが持つ。段が終わった後に薄く残す間 */
  after?: Span;
}

/** 処理、箱の字の書き換え、中身の帯の値が起きる時刻。 */
export interface EventTime {
  step: number;
  event: number;
  at: number;
}

/** 状態遷移図の状態ごとの、光っている間と、済んだ印が出る時刻。運ぶ物が出ていない状態は `done` を持たない */
export interface StateTime {
  box: string;
  lit: Span[];
  done?: number;
}

export interface Timeline {
  /** 1 周の長さ */
  total: number;
  /** 繰り返す前に消えていく所の始まり */
  last: number;
  steps: Span[];
  edges: EdgeTime[];
  carriers: CarrierTime[];
  labels: LabelTime[];
  badges: { step: number; appears: number }[];
  events: EventTime[];
  /** 段ごとの止め絵の時刻。その段で起きることが全部見えている */
  stills: number[];
  /** 状態遷移図だけが持つ */
  states?: StateTime[];
}

interface Planned {
  edges: { event: number; a: number; b: number; carries: boolean; coin: boolean; named: boolean }[];
  events: { event: number; at: number }[];
  busy: number;
}

/** 段の中で起きることの時刻 (段の始まりから)。線は少しずつずらして引き、書き換えは直前の線が着いてから起こす。 */
function plan(step: Diagram["steps"][number]): Planned {
  const out: Planned = { edges: [], events: [], busy: 0 };
  let cursor = MOTION.edgeAt;
  let arrived: number | undefined;
  let changes = 0;
  step.events.forEach((event, e) => {
    if (event.type === "edge") {
      const carries = event.carry.kind !== "none";
      const a = cursor;
      const b = a + (carries ? MOTION.drawCarry : MOTION.draw);
      out.edges.push({ event: e, a, b, carries, coin: event.carry.kind === "coin", named: event.label !== undefined });
      cursor = a + MOTION.stagger;
      arrived = b;
      changes = 0;
      out.busy = Math.max(out.busy, b);
    } else if (event.type === "action") {
      out.events.push({ event: e, at: cursor });
      out.busy = Math.max(out.busy, cursor + MOTION.action);
      cursor += MOTION.action;
      changes = 0;
    } else {
      const at = (arrived ?? cursor) + MOTION.change * changes++;
      out.events.push({ event: e, at });
      out.busy = Math.max(out.busy, at);
    }
  });
  return out;
}

export function buildTimeline(diagram: Diagram): Timeline {
  const plans = diagram.steps.map(plan);
  const steps: Span[] = [];
  let t = MOTION.intro;
  diagram.steps.forEach((step, s) => {
    const read = Math.min(MOTION.stepMax, Math.max(MOTION.stepMin, MOTION.stepBase + [...step.body].length * MOTION.perChar));
    const length = Math.max(read, (plans[s]?.busy ?? 0) + MOTION.dwell);
    steps.push({ start: t, end: t + length });
    t += length;
  });
  const end = t;
  const total = Math.ceil(end + MOTION.outro);
  const last = total - MOTION.tail;

  const edges: EdgeTime[] = [];
  const labels: LabelTime[] = [];
  const events: EventTime[] = [];
  const departures: { step: number; event: number; who: "main" | "coin"; a: number; b: number }[] = [];
  plans.forEach((p, s) => {
    const span = steps[s] as Span;
    const named: LabelTime[] = [];
    for (const edge of p.edges) {
      const a = span.start + edge.a;
      edges.push({ step: s, event: edge.event, start: a, drawn: span.start + edge.b, end: span.end });
      if (edge.carries) departures.push({ step: s, event: edge.event, who: edge.coin ? "coin" : "main", a, b: span.start + edge.b });
      if (edge.named) named.push({ step: s, event: edge.event, start: a + MOTION.labelDelay, end: span.end });
    }
    // 3 つ目の名前が出る時に 1 つ目を消す
    named.forEach((label, k) => {
      const later = named[k + 2];
      if (later) label.end = Math.min(label.end, later.start);
    });
    if (diagram.kind === "state") for (const label of named) label.after = { start: label.end, end: last };
    labels.push(...named);
    for (const event of p.events) events.push({ step: s, event: event.event, at: span.start + event.at });
  });

  const first = steps[0]?.start ?? 0;
  const hasMain = departures.some((d) => d.who === "main");
  const carriers: CarrierTime[] = [];
  for (const who of ["main", "coin"] as const) {
    const list = departures.filter((d) => d.who === who);
    list.forEach((d, k) => {
      const next = list[k + 1];
      // 主役の最初の運ぶ物は、最初の段の始まりから出発点で待つ (何も見えない時間を作らないため)
      const waits = k === 0 && (who === "main" || !hasMain);
      carriers.push({
        step: d.step,
        event: d.event,
        who,
        depart: d.a,
        arrive: d.b,
        start: waits ? Math.min(first, d.a) : d.a,
        end: next ? Math.max(next.a, d.b) : last,
      });
    });
  }
  carriers.sort((x, y) => x.depart - y.depart);
  const states = diagram.kind === "state" ? stateTimes(diagram, edges, last) : undefined;

  return {
    total,
    last,
    steps,
    edges,
    carriers,
    labels,
    badges: steps.map((span, s) => ({ step: s, appears: span.start })),
    events,
    stills: steps.map((span) => span.end - MOTION.still),
    ...(states ? { states } : {}),
  };
}

const isEnd = (id: string): boolean => (STATE_ENDS as readonly string[]).includes(id);

/**
 * 状態遷移図の状態が光る間。段の線を引き終えて状態へ着いた時から、その状態を出る線を引き始めるまで光り、
 * 出た少し後に済んだ印を出す。同じ状態へ戻る線では光ったまま、最後に着いた状態は終わりまで光る。
 * 物が状態を移るのは線を辿った時なので、運ぶ物の種類 (硬貨や、運ばない線) を問わず全ての線で数える。
 */
function stateTimes(diagram: Diagram, edges: EdgeTime[], last: number): StateTime[] {
  const times = new Map<string, StateTime>();
  const of = (box: string): StateTime => {
    const found = times.get(box) ?? { box, lit: [] };
    times.set(box, found);
    return found;
  };
  let on: { box: string; since: number } | undefined;
  for (const edge of edges) {
    const event = diagram.steps[edge.step]?.events[edge.event];
    if (event?.type !== "edge" || event.from === event.to) continue;
    if (on) {
      const left = of(on.box);
      left.lit.push({ start: on.since, end: edge.start });
      if (on.box === event.from && left.done === undefined) left.done = edge.start + MOTION.done;
      on = undefined;
    }
    if (!isEnd(event.to)) on = { box: event.to, since: edge.drawn };
  }
  if (on) of(on.box).lit.push({ start: on.since, end: last });
  return [...times.values()];
}
