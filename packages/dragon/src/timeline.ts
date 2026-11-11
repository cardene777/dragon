/**
 * 段ごとの始まりと長さと、線、運ぶ物、線の名前、段の番号が見える時刻の表。SVG の動きはこの表から組む。
 *
 * 段の長さは本文の字数で決め、段で起きることが全部済んでから少し留まる長さを下限にする。
 * 運ぶ物が見えている間は、運ぶ物のブロック (`blocks/carry/timing.ts`) が線を引く時刻から出す (#3345)。
 * 線の名前はその段の間だけ出し、同じ段に何本あっても同時に見えるのは 2 つまでにする。
 * 状態遷移図では、段が終わった後も線の名前を最後の段まで薄く残す (#3171)。薄い名前は 2 つまでの数に入れない。
 * 止め絵を選んだ図では、最後の段で起きることが済んでから繰り返す前まで (`whole`)、全ての段の線の名前を最後の段と同じ濃さで出す (#3200)。
 * その間に見えている名前は繰り返す前まで延ばし、見えていない名前は同じ間に出し直す (`again`)。状態遷移図の薄い名前はその間の前で消す。
 * 状態遷移図では、主役の運ぶ物が乗っている状態を光らせ、運ぶ物が出た状態には少し後に済んだ印を出す (#3163)。
 * 枝分かれの図では、commit を積む出来事と枝を切る出来事も線と同じ間で引く (#3164)。
 * 時間軸の図では、針を進める出来事 (`now`) で針を目盛り 1 つずつ決まった秒数で進める (#3165)。針が進む目盛りの列の線は、
 * 段の中の書いた順に依らず、針がその目盛りに入った時に引き、線を引き終えるまで針は次の目盛りへ進まない。
 * 針を進める出来事より後に書いた出来事は、針が止まってから起こす。物差しの欄は、針が進む段では針の進みに比例して満ち、
 * 区切りの境から進む時は 0 から満ち直す。針が進まない段では値を書いた時に変わる。
 * 列の図 (#3239) の列の並びを書く出来事と、封と札の出来事も線と同じ表に載せ、並びは滑り終えるまで、封は覆い終えるまでを引く間にする。
 * 試す図 (#3337) の送る、押す、書き換える出来事も線と同じ表に載せ、送るは網を運ばれて待ち行列へ入り終えるまで、
 * 押すはチップがブロックへ移り終えるまで、書き換えるは値が変わり終えるまでを引く間にする。同じ段の出来事は前の出来事が済んでから起こす。
 * 配管の図 (#3389) の出来事は、段の中で書いた順に決まった間 (`MOTION.pipe`) ずつずらして起こし、描く部品がその時刻に部品を替える。
 * 量の図 (#3560) の値の出来事は、段の中の全ての値を段の始まりから同時に変え、弧と棒が `MOTION.chart.move` 秒で新しい値へ動き終えるまでを引く間にする。
 * 札を動かす線が運ぶ枝の札は運ぶ物の表に載せない。札は同じ時刻にいくつも出ていて、どの札も主役ではないので、
 * 枝分かれの図を描く部品が札ごとに動かす。線に書いた運ぶ物 (`tag` と `carry`) だけを表に載せる。
 * 手順の図 (#3561) の運ぶ物を書かない線は、封筒の代わりに段の印の点が走る。点が走る間 (`marks`) と、運ぶ物と光る間の手順の図の分は、
 * 手順の図の描く部品 (`render/flow.ts` の `flowTimes`) がこの表を受け取って直す。
 */
import { type CarrierTime, carrierTimes, type Departure } from "./blocks/carry/timing";
import { ratioOf } from "./layout/scene";
import { MOTION } from "./look/values";
import type { DiagramModel } from "./schema";
import { STATE_ENDS } from "./words";

export type { CarrierTime };

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

export interface LabelTime extends Span {
  step: number;
  event: number;
  /** 状態遷移図だけが持つ。段が終わった後に薄く残す間 */
  after?: Span;
  /** 止め絵を選んだ図だけが持つ。最後の段で起きることが済んでから、最後の段と同じ濃さで出し直す間 (#3200) */
  again?: Span;
}

/** 処理、箱の字の書き換え、中身の帯の値が起きる時刻。 */
export interface EventTime {
  step: number;
  event: number;
  at: number;
}

/**
 * 手順の図の段の印の点が 1 本の線を走る間 (#3561)。`depart` に線の始まりを出て `arrive` に線の終わりへ着き、着くと消える。
 * 同じ段で着いた箱から続けて出る線は、前の線の点が着いてから走り出す
 */
export interface MarkTime {
  step: number;
  event: number;
  depart: number;
  arrive: number;
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
  /** 止め絵を選んだ図だけが持つ。最後の段で起きることが済んでから繰り返す前まで、全ての段の線の名前と箱の中の処理を出す間 (#3200) */
  whole?: Span;
  /** 状態遷移図だけが持つ */
  states?: StateTime[];
  /** 手順の図だけが持つ (#3561)。段の印の点が走る線と間で、手順の図の描く部品が足す (`render/flow.ts` の `flowTimes`) */
  marks?: MarkTime[];
  /** 時間軸の図だけが持つ (#3165)。針の動き。[時刻, 目盛りの境の位置] の並びで、間は真っ直ぐ進む */
  needle?: [number, number][];
  /** 時間軸の図だけが持つ。針が目盛りを過ぎた (右の境に着いた) 時刻 */
  units?: { unit: number; passed: number }[];
  /** 時間軸の図だけが持つ。物差しの欄の満ち具合の動き。[時刻, 割合] の並びで、間は真っ直ぐ変わる */
  meters?: { field: string; keys: [number, number][] }[];
  /** 作業 (#3562) を持つ時間軸の図だけが持つ。作業の棒の濃く塗った割合の動き。[時刻, 割合] の並びで、間は真っ直ぐ変わる */
  tasks?: { task: string; keys: [number, number][] }[];
}

interface Planned {
  edges: { event: number; a: number; b: number; carries: boolean; coin: boolean; named: boolean }[];
  events: { event: number; at: number }[];
  busy: number;
  /** 時間軸の図の、針の動き ([段の始まりからの時刻, 境の位置]) と、針が目盛りを過ぎた時刻 */
  sweep?: { keys: [number, number][]; passed: { unit: number; at: number }[] };
}

type EdgeEvent = Extract<DiagramModel["steps"][number]["events"][number], { type: "edge" }>;

/** 列の図の出来事の長さ */
const LINEUP_LENGTH = { line: MOTION.lineup.slide, seal: MOTION.lineup.seal, open: MOTION.fade, pick: MOTION.fade, stamp: MOTION.popFade } as const;

/** 配管の図の出来事の種類 (#3389)。段の中で書いた順に 1 つずつ起こす */
const PIPE_EVENTS: ReadonlySet<string> = new Set(["call", "return", "revert", "move", "write", "check", "emit", "calc"]);

/** 試す図の出来事の長さ。送る出来事は網を通る時に網を運ばれる長さを足す (`tryTrip`) */
export function tryLength(type: "ask" | "press" | "item", trip: boolean): number {
  const T = MOTION.try;
  return type === "ask" ? (trip ? T.trip : 0) + T.settle : type === "press" ? T.build : T.edit;
}

/** 時間軸の図の段を組む時に渡す、段の始まりの針の位置と、目盛り 1 つを進む秒数 */
interface Needle {
  from: number;
  speed: number;
}

/**
 * 段の中で起きることの時刻 (段の始まりから)。線は少しずつずらして引き、書き換えは直前の線が着いてから起こす。
 * 時間軸の図では `needle` を渡し、針を進める出来事の所で針を目盛り 1 つずつ進める。針が進む目盛りの列の線はその目盛りに入った時に引く
 */
function plan(step: DiagramModel["steps"][number], needle?: Needle, trip = false, forks?: ReadonlySet<string>): Planned {
  const out: Planned = { edges: [], events: [], busy: 0 };
  let cursor: number = MOTION.edgeAt;
  let arrived: number | undefined;
  let changes = 0;
  let settled = Number.NEGATIVE_INFINITY;
  /** 手順の図の判断が今の段で線を出した時刻 (#3579) */
  const forkedAt = new Map<string, number>();
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
  const pulled = (event: DiagramModel["steps"][number]["events"][number]): event is EdgeEvent => event.type === "edge" && event.at !== undefined && event.at >= p0 && event.at < p1;
  const pipes = step.events.filter((event) => PIPE_EVENTS.has(event.type)).length;
  const beat = Math.min(MOTION.pipe.beat, MOTION.pipe.most / Math.max(1, pipes));
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
    // 列の図の役が動く出来事 (#3351) は、段の始まりから終わりまで役の札を光らせるだけで、段の中の時刻を取らない
    if (event.type === "role") return;
    // 量の図の値の出来事 (#3560) は、段の全ての値を同じ時刻に変え、弧と棒が動き終えるまで段を留める
    if (event.type === "set") {
      out.events.push({ event: e, at: MOTION.edgeAt });
      out.busy = Math.max(out.busy, MOTION.edgeAt + MOTION.chart.move);
      return;
    }
    // 配管の図の出来事 (#3389) は、前の出来事から決まった間を置いて起こす
    if (PIPE_EVENTS.has(event.type)) {
      out.events.push({ event: e, at: cursor });
      out.busy = Math.max(out.busy, cursor + beat);
      cursor += beat;
      return;
    }
    // 試す図の出来事 (#3337) は、前の出来事が済んでから起こす
    if (event.type === "ask" || event.type === "press" || event.type === "item") {
      const a = cursor;
      const b = a + tryLength(event.type, trip);
      out.edges.push({ event: e, a, b, carries: false, coin: false, named: false });
      cursor = b;
      arrived = b;
      changes = 0;
      out.busy = Math.max(out.busy, b);
      return;
    }
    if (event.type === "line" || event.type === "seal" || event.type === "open" || event.type === "pick" || event.type === "stamp") {
      const a = cursor;
      const b = a + LINEUP_LENGTH[event.type];
      out.edges.push({ event: e, a, b, carries: false, coin: false, named: false });
      cursor = a + MOTION.lineup.stagger;
      arrived = b;
      changes = 0;
      out.busy = Math.max(out.busy, b);
      return;
    }
    // 枝分かれの図の commit を積む出来事と枝を切る出来事と枝を消す出来事 (#3632) と、木の図の葉と親を出す出来事と、考えを広げる地図の考え (#3619) は、
    // 親から引く線と同じ間で引く。枝を消す出来事は、消える札と点線の丸に変わる commit がこの間を使う
    if (event.type === "commit" || event.type === "branch" || event.type === "delete" || event.type === "leaf" || event.type === "node" || event.type === "idea") {
      const a = cursor;
      const b = a + MOTION.draw;
      out.edges.push({ event: e, a, b, carries: false, coin: false, named: false });
      cursor = a + MOTION.stagger;
      arrived = b;
      changes = 0;
      out.busy = Math.max(out.busy, b);
    } else if (event.type === "edge") {
      // 手順の図の判断から同じ段に書いた線は、同じ時刻に走り出す (#3579)
      const together = forkedAt.get(event.from);
      const a = together ?? cursor;
      arrived = line(e, event, a);
      if (together === undefined) cursor = a + MOTION.stagger;
      if (forks?.has(event.from)) forkedAt.set(event.from, a);
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

/** 時刻の表を作る。`still` を立てると、最後の段の止め絵に全ての段の線の名前と箱の中の処理を出す間 (`whole`) を持つ (#3200) */
export function buildTimeline(diagram: DiagramModel, still = false): Timeline {
  const time = diagram.kind === "time" ? diagram.time : undefined;
  const T = MOTION.time;
  const speed = time ? Math.min(T.unitMax, Math.max(T.unitMin, T.axis / Math.max(1, time.scale.count))) : 0;
  let at = 0;
  // 試す図の入力の帯が網を通るなら、送る出来事は網を運ばれる長さを持つ
  const trip = diagram.try?.parts.some((p) => p.type === "ask" && p.via !== undefined) ?? false;
  const forks = diagram.kind === "flow" ? new Set((diagram.flow?.choices ?? []).map((c) => c.id)) : undefined;
  const plans = diagram.steps.map((step) => {
    if (!time) return plan(step, undefined, trip, forks);
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
  const lastSpan = steps[steps.length - 1];
  const whole = still && lastSpan ? { start: lastSpan.start + (plans[plans.length - 1]?.busy ?? 0), end: last } : undefined;
  // 状態遷移図の薄い名前は、全ての段の名前を出し直す前に消す
  const faint = whole?.start ?? last;

  const edges: EdgeTime[] = [];
  const labels: LabelTime[] = [];
  const events: EventTime[] = [];
  const departures: Departure[] = [];
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
    for (const label of named) {
      if (whole && label.end > whole.start) label.end = whole.end;
      else {
        if ((diagram.kind === "state" || diagram.kind === "flow") && label.end < faint) label.after = { start: label.end, end: faint };
        if (whole) label.again = whole;
      }
    }
    labels.push(...named);
    for (const event of p.events) events.push({ step: s, event: event.event, at: span.start + event.at });
  });

  const first = steps[0]?.start ?? 0;
  const carriers = carrierTimes(departures, first, last);
  // 手順の図も印が着いた箱と判断を光らせるが、済んだ印は出さない。判断のひし形の右上の角は形の外にあるため (#3561)
  const states = diagram.kind === "state" || diagram.kind === "flow" ? stateTimes(diagram, edges, steps, last, diagram.kind === "state") : undefined;
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
    ...(whole ? { whole } : {}),
    ...(states ? { states } : {}),
    ...(time ? { needle, units, meters: meterTimes(diagram, plans, steps), ...(time.tasks && time.tasks.length > 0 ? { tasks: taskTimes(time.tasks, needle) } : {}) } : {}),
  };
}

/**
 * 時間軸の図の作業の棒の濃く塗った割合 (#3562)。針が棒の左端の境から右端の境へ進む間に 0 から 1 へ伸び、針が戻る時は同じ所を戻る。
 * 針の動きの点ごとの割合に、針が棒の左端と右端の境を横切る時刻の点を足す
 */
function taskTimes(tasks: readonly { id: string; from: number; to: number }[], needle: [number, number][]): { task: string; keys: [number, number][] }[] {
  return tasks.map(({ id, from, to }) => {
    const share = (position: number): number => Math.min(1, Math.max(0, (position - from) / (to + 1 - from)));
    const keys: [number, number][] = [];
    needle.forEach(([t, position], k) => {
      const before = needle[k - 1];
      if (before) {
        const [t0, p0] = before;
        for (const edge of p0 < position ? [from, to + 1] : [to + 1, from]) {
          if ((p0 - edge) * (position - edge) < 0) keys.push([t0 + ((t - t0) * (edge - p0)) / (position - p0), share(edge)]);
        }
      }
      keys.push([t, share(position)]);
    });
    return { task: id, keys };
  });
}

/**
 * 時間軸の図の物差しの欄の満ち具合 (#3165)。段で最後に書いた値へ向かって変わる。
 * 針が進む段では針の進みに比例して満ち、区切りの境から進む時はその境で 0 に戻ってから満ち直す。針が進まない段では値を書いた時に変わる
 */
function meterTimes(diagram: DiagramModel, plans: Planned[], steps: Span[]): { field: string; keys: [number, number][] }[] {
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
 * 光が消えた少し後に済んだ印を出す。同じ状態へ戻る線では光ったまま、最後に着いた状態は終わりまで光る。
 * 着いた段のうちに次の線が走り出す時は、着いた時からその段の終わりまで光る (#3575)。
 * 物が状態を移るのは線を辿った時なので、運ぶ物の種類 (硬貨や、運ばない線) を問わず全ての線で数える。
 * `done` を立てない時 (手順の図、#3561) は済んだ印を出さない。
 */
function stateTimes(diagram: DiagramModel, edges: EdgeTime[], steps: Span[], last: number, done = true): StateTime[] {
  const times = new Map<string, StateTime>();
  const of = (box: string): StateTime => {
    const found = times.get(box) ?? { box, lit: [] };
    times.set(box, found);
    return found;
  };
  const stepEnd = (at: number): number => steps.find((s) => at >= s.start && at < s.end)?.end ?? last;
  let on: { box: string; since: number } | undefined;
  for (const edge of edges) {
    const event = diagram.steps[edge.step]?.events[edge.event];
    if (event?.type !== "edge" || event.from === event.to) continue;
    if (on) {
      const left = of(on.box);
      const end = edge.start > on.since ? edge.start : stepEnd(on.since);
      left.lit.push({ start: on.since, end });
      if (done && on.box === event.from && left.done === undefined) left.done = end + MOTION.done;
      on = undefined;
    }
    if (!isEnd(event.to)) on = { box: event.to, since: edge.drawn };
  }
  if (on) of(on.box).lit.push({ start: on.since, end: last });
  return [...times.values()];
}
