/**
 * 段ごとの始まりと長さと、線、運ぶ物、線の名前、段の番号が見える時刻の表。SVG の動きはこの表から組む。
 *
 * 段の長さは本文の字数で決め、段で起きることが全部済んでから少し留まる長さを下限にする。
 * 運ぶ物は主役 (封筒と札は 1 つ、硬貨は別の 1 つ) ごとに途切れず見え続ける。着いた後は
 * 次の同じ主役が出発するまで着いた先に留まり、次が無ければ終わりまで留まる。
 * 線の名前はその段の間だけ出し、同じ段に何本あっても同時に見えるのは 2 つまでにする。
 * 状態遷移図では、段が終わった後も線の名前を最後の段まで薄く残す (#3171)。薄い名前は 2 つまでの数に入れない。
 * 状態遷移図では、主役の運ぶ物が乗っている状態を光らせ、運ぶ物が出た状態には少し後に済んだ印を出す (#3163)。
 * 枝分かれの図では、commit を積む出来事と枝を切る出来事も線と同じ間で引く (#3164)。
 * 時間軸の図では、針を進める出来事 (`now`) で針を目盛り 1 つずつ決まった秒数で進める (#3165)。針が進む目盛りの列の線は、
 * 段の中の書いた順に依らず、針がその目盛りに入った時に引き、線を引き終えるまで針は次の目盛りへ進まない。
 * 針を進める出来事より後に書いた出来事は、針が止まってから起こす。物差しの欄は、針が進む段では針の進みに比例して満ち、
 * 区切りの境から進む時は 0 から満ち直す。針が進まない段では値を書いた時に変わる。
 * 札を動かす線が運ぶ枝の札は運ぶ物の表に載せない。札は同じ時刻にいくつも出ていて、どの札も主役ではないので、
 * 枝分かれの図を描く部品が札ごとに動かす。線に書いた運ぶ物 (`tag` と `carry`) だけを表に載せる。
 */
import { ratioOf } from "./layout/scene";
import { MOTION } from "./look/values";
import type { Diagram } from "./schema";
import { STATE_ENDS } from "./words";

/** 秒で表した、見えている間。`end` の時刻は含まない。 */
export interface Span {
  start: number;
  end: number;
}

/** 線を引いている間。`start` で引き始め、`drawn` で引き終わり、`end` (段の終わり) まで濃く残す。枝分かれの図では commit を積む出来事と枝を切る出来事も持つ */
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
  /** 時間軸の図だけが持つ (#3165)。針の動き。[時刻, 目盛りの境の位置] の並びで、間は真っ直ぐ進む */
  needle?: [number, number][];
  /** 時間軸の図だけが持つ。針が目盛りを過ぎた (右の境に着いた) 時刻 */
  units?: { unit: number; passed: number }[];
  /** 時間軸の図だけが持つ。物差しの欄の満ち具合の動き。[時刻, 割合] の並びで、間は真っ直ぐ変わる */
  meters?: { field: string; keys: [number, number][] }[];
}

interface Planned {
  edges: { event: number; a: number; b: number; carries: boolean; coin: boolean; named: boolean }[];
  events: { event: number; at: number }[];
  busy: number;
  /** 時間軸の図の、針の動き ([段の始まりからの時刻, 境の位置]) と、針が目盛りを過ぎた時刻 */
  sweep?: { keys: [number, number][]; passed: { unit: number; at: number }[] };
}

type EdgeEvent = Extract<Diagram["steps"][number]["events"][number], { type: "edge" }>;

/** 時間軸の図の段を組む時に渡す、段の始まりの針の位置と、目盛り 1 つを進む秒数 */
interface Needle {
  from: number;
  speed: number;
}

/**
 * 段の中で起きることの時刻 (段の始まりから)。線は少しずつずらして引き、書き換えは直前の線が着いてから起こす。
 * 時間軸の図では `needle` を渡し、針を進める出来事の所で針を目盛り 1 つずつ進める。針が進む目盛りの列の線はその目盛りに入った時に引く
 */
function plan(step: Diagram["steps"][number], needle?: Needle): Planned {
  const out: Planned = { edges: [], events: [], busy: 0 };
  let cursor = MOTION.edgeAt;
  let arrived: number | undefined;
  let changes = 0;
  let settled = Number.NEGATIVE_INFINITY;
  const line = (e: number, event: EdgeEvent, a: number): number => {
    const carries = event.carry.kind !== "none";
    const b = a + (carries ? MOTION.drawCarry : MOTION.draw);
    out.edges.push({ event: e, a, b, carries, coin: event.carry.kind === "coin", named: event.label !== undefined });
    out.busy = Math.max(out.busy, b);
    return b;
  };
  const nows = needle ? step.events.flatMap((event, e) => (event.type === "now" ? [{ e, to: event.to }] : [])) : [];
  const p0 = needle?.from ?? 0;
  const p1 = Math.max(p0, ...nows.map((n) => n.to + 1));
  const pulled = (event: Diagram["steps"][number]["events"][number]): event is EdgeEvent => event.type === "edge" && event.at !== undefined && event.at >= p0 && event.at < p1;
  step.events.forEach((event, e) => {
    if (needle && e === nows[0]?.e) {
      // 針は、前に書いた書き換えが起きてから動き出す
      let t = Math.max(cursor, settled + MOTION.change);
      const keys: [number, number][] = [[t, p0]];
      const passed: { unit: number; at: number }[] = [];
      for (let u = p0; u < p1; u++) {
        const entry = t;
        const lines = step.events.flatMap((ev, k) => (pulled(ev) && ev.at === u ? [{ k, ev }] : []));
        const done = lines.reduce((latest, l, j) => Math.max(latest, line(l.k, l.ev, entry + MOTION.stagger * j)), entry);
        const end = Math.max(entry + needle.speed, lines.length > 0 ? done + MOTION.time.wait : entry);
        if (end - needle.speed > entry + 1e-9) keys.push([end - needle.speed, u]);
        keys.push([end, u + 1]);
        passed.push({ unit: u, at: end });
        t = end;
      }
      out.sweep = { keys, passed };
      out.busy = Math.max(out.busy, t);
      cursor = t + MOTION.time.after;
      arrived = t;
      changes = 0;
      return;
    }
    if (event.type === "now" || (needle && pulled(event))) return;
    // 枝分かれの図の commit を積む出来事と枝を切る出来事は、親から引く線と同じ間で引く
    if (event.type === "commit" || event.type === "branch") {
      const a = cursor;
      const b = a + MOTION.draw;
      out.edges.push({ event: e, a, b, carries: false, coin: false, named: false });
      cursor = a + MOTION.stagger;
      arrived = b;
      changes = 0;
      out.busy = Math.max(out.busy, b);
    } else if (event.type === "edge") {
      const a = cursor;
      arrived = line(e, event, a);
      cursor = a + MOTION.stagger;
      changes = 0;
    } else if (event.type === "action") {
      out.events.push({ event: e, at: cursor });
      out.busy = Math.max(out.busy, cursor + MOTION.action);
      cursor += MOTION.action;
      changes = 0;
    } else {
      const at = (arrived ?? cursor) + MOTION.change * changes++;
      out.events.push({ event: e, at });
      out.busy = Math.max(out.busy, at);
      settled = Math.max(settled, at);
    }
  });
  // 針が進む目盛りの列の線は書いた順と別に引くので、引き始める順に並べ直す
  out.edges.sort((x, y) => x.a - y.a);
  return out;
}

export function buildTimeline(diagram: Diagram): Timeline {
  const time = diagram.kind === "time" ? diagram.time : undefined;
  const T = MOTION.time;
  const speed = time ? Math.min(T.unitMax, Math.max(T.unitMin, T.axis / Math.max(1, time.scale.count))) : 0;
  let at = 0;
  const plans = diagram.steps.map((step) => {
    if (!time) return plan(step);
    const p = plan(step, { from: at, speed });
    at = p.sweep?.keys[p.sweep.keys.length - 1]?.[1] ?? at;
    return p;
  });
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
      // 枝分かれの図の、札を書かない線が運ぶ札は、枝分かれの図を描く部品が札ごとに動かす
      const event = diagram.steps[s]?.events[edge.event];
      const own = diagram.kind === "git" && event?.type === "edge" && event.carry.kind === "tag" && event.carry.text === event.from;
      if (edge.carries && !own) departures.push({ step: s, event: edge.event, who: edge.coin ? "coin" : "main", a, b: span.start + edge.b });
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
  const needle: [number, number][] = [[0, 0]];
  const units: { unit: number; passed: number }[] = [];
  plans.forEach((p, s) => {
    const start = (steps[s] as Span).start;
    for (const [t, position] of p.sweep?.keys ?? []) needle.push([start + t, position]);
    for (const u of p.sweep?.passed ?? []) units.push({ unit: u.unit, passed: start + u.at });
  });
  needle.push([total, at]);

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
    ...(time ? { needle, units, meters: meterTimes(diagram, plans, steps) } : {}),
  };
}

/**
 * 時間軸の図の物差しの欄の満ち具合 (#3165)。段で最後に書いた値へ向かって変わる。
 * 針が進む段では針の進みに比例して満ち、区切りの境から進む時はその境で 0 に戻ってから満ち直す。針が進まない段では値を書いた時に変わる
 */
function meterTimes(diagram: Diagram, plans: Planned[], steps: Span[]): { field: string; keys: [number, number][] }[] {
  const length = diagram.time?.period?.length;
  return (diagram.strip?.meters ?? []).map(({ field }) => {
    const keys: [number, number][] = [[0, 0]];
    let value = 0;
    plans.forEach((p, s) => {
      const start = (steps[s] as Span).start;
      const sets = (diagram.steps[s]?.events ?? []).flatMap((event, e) => {
        const ratio = event.type === "strip" && event.field === field && event.value !== undefined ? ratioOf(event.value) : undefined;
        return ratio === undefined ? [] : [{ e, ratio }];
      });
      const set = sets[sets.length - 1];
      if (!set) return;
      const sweep = p.sweep?.keys ?? [];
      const first = sweep[0];
      const lastKey = sweep[sweep.length - 1];
      if (first && lastKey && lastKey[1] > first[1]) {
        const [p0, p1] = [first[1], lastKey[1]];
        let base = value;
        let from = p0;
        const boundary = length ? Math.floor((p1 - 1e-9) / length) * length : 0;
        if (boundary > 0 && boundary >= p0) {
          const tb = start + (sweep.find(([, position]) => position === boundary)?.[0] ?? first[0]);
          const prev = (keys[keys.length - 1] as [number, number])[0];
          keys.push([Math.max(prev, tb - MOTION.time.reset), value], [tb, 0]);
          base = 0;
          from = boundary;
        }
        for (const [t, position] of sweep) if (position >= from) keys.push([start + t, base + ((set.ratio - base) * (position - from)) / (p1 - from)]);
      } else {
        const at = start + (p.events.find((x) => x.event === set.e)?.at ?? 0);
        keys.push([at, value], [at + MOTION.fade, set.ratio]);
      }
      value = set.ratio;
    });
    return { field, keys };
  });
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
