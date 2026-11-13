/**
 * 回り続ける図の置き場所 (#3623)。見た目の元は step 2 で本人が選んだ動く試作の案A (手順の箱を輪の上に置き、隣どうしを弧の矢印で結ぶ)。
 *
 * 手順の箱は書いた順に、真上から右回りに輪の上へ等しい間で置き、箱の真ん中を輪の線の上に置く。
 * 隣どうしの箱は、輪の線のうち両端の箱の外に見える所を弧にして結び、弧の真ん中に右回りを指す山形の矢じりを置く。
 * 段の中の線の札は、その弧の上を送る側の箱の近くから受ける側の箱の近くへ走る。札の道は札が両端の箱に掛からない所だけにする。
 * 輪の真ん中には中身の帯の題と、段の中の `set` で書いた欄の値を置き、図の下に帯を置かない。
 * 段の番号は、その段で札が着いた手順 (札の無い段は前の段の手順、最初の段は最初の手順) の箱の横の、輪の外を向く側に置く。
 * 弧に掛かる時は、丸を輪の外へずらす。同じ手順の番号は同じ所で後の段の番号と入れ替える。
 * 輪の半径は下限から広げていき、箱どうしと、札の道と、真ん中の字が互いに離れて収まる最も小さな半径にする。
 * 図の種類の行に `shape: clock` を書いた図の時計の文字盤の見た目 (#3638) の置き場所 (`layoutClock`) と、
 * `shape: band` を書いた図の輪を開いた帯の見た目 (#3639) の置き場所 (`layoutBand`) は、この file の後ろの節が持つ
 */
import { niceStep, TIME_UNITS, type TimeUnit, timeOf, UNIT_WORDS } from "../../blocks/ring/limits";
import { hasWide, textBox, textWidth } from "../../layout/measure";
import {
  besideSameSpot,
  boxColors,
  boxWidth,
  carrierHalf,
  type EdgeEvent,
  edgesOf,
  gapBetween,
  type Layout,
  type Point,
  type Rect,
  type SceneBadge,
  type SceneBox,
  type SceneEdge,
  shapedSize,
} from "../../layout/scene";
import { BAND_LOOK, BAND_TYPE, CLOCK_LOOK, CLOCK_TYPE, CYCLE_LOOK, CYCLE_TYPE } from "../../look/cycle";
import { type ColorKey, LOOK, type TextStyle } from "../../look/values";
import type { DiagramModel } from "../../schema";
import type { NotationLang } from "../../words";
import type { KindOptions } from "../parts";

/** 隣どうしの手順を結ぶ弧。`points` は両端の箱の外に見える輪の線を細かく区切った点で、`head` は弧の真ん中の矢じりの所と向き (度) */
export interface CycleArc {
  from: string;
  to: string;
  points: Point[];
  head: { x: number; y: number; angle: number };
}

/** 輪の真ん中の欄の行。`y` は値の基準線で、`lead` は大きく書く最初の欄 */
export interface CycleRow {
  field: string;
  y: number;
  lead: boolean;
}

/** 輪の真ん中の字の置き場所。`title` は帯の題の基準線で、帯が無ければ無い */
export interface CycleCentre extends Rect {
  title?: { text: string; y: number };
  rows: CycleRow[];
}

export interface CycleLayout extends Layout {
  kind: "cycle";
  /** 輪の真ん中と半径 */
  ring: { cx: number; cy: number; r: number };
  arcs: CycleArc[];
  centre: CycleCentre;
  /** 段ごとの、その段の手順 (段の番号を添え、光らせる箱) の名札 */
  current: string[];
}

const R = CYCLE_LOOK.ring;
const TAU = Math.PI * 2;

/** 輪の真ん中から半径 `r` の、真上から右回りに角 `a` の点 */
const on = (r: number, a: number): Point => [r * Math.sin(a), -r * Math.cos(a)];

/** 点 `p` が四角 `rect` を `pad` だけ広げた内に在るか */
const within = ([x, y]: Point, rect: Rect, pad: number): boolean =>
  x >= rect.x - pad && x <= rect.x + rect.w + pad && y >= rect.y - pad && y <= rect.y + rect.h + pad;

/** 真ん中が `p` で半分の幅と高さが `half` の四角 */
const around = ([x, y]: Point, [hx, hy]: Point): Rect => ({ x: x - hx, y: y - hy, w: hx * 2, h: hy * 2 });

/** 点 `p` から線分 `a`-`b` までの距離 */
function toSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** 点 `p` から折れ線 `points` までの距離 */
const toLine = (p: Point, points: Point[]): number =>
  points.slice(1).reduce((best, q, k) => Math.min(best, toSegment(p, points[k] as Point, q)), Number.POSITIVE_INFINITY);

/** 角 `a` から `b` までを `n` 個に区切った輪の上の点 (両端を含む) */
const sample = (r: number, a: number, b: number, n: number): Point[] => Array.from({ length: n + 1 }, (_, k) => on(r, a + ((b - a) * k) / n));

/** 輪の真ん中の値の字の形。最初の欄の和文を含む値は和文の字で書く */
const valueStyle = (value: string, lead: boolean): TextStyle => (lead ? (hasWide(value) ? CYCLE_TYPE.leadJa : CYCLE_TYPE.lead) : CYCLE_TYPE.rest);

/** 欄ごとの、段の中の `set` で書いた値 */
function valuesOf(diagram: DiagramModel): Map<string, string[]> {
  const out = new Map<string, string[]>((diagram.strip?.fields ?? []).map((field) => [field, []]));
  for (const step of diagram.steps)
    for (const event of step.events) {
      if (event.type !== "strip") continue;
      const text = event.value ?? event.tag;
      if (text !== undefined) out.get(event.field)?.push(text);
    }
  return out;
}

/**
 * 輪の真ん中の字の置き場所。輪の真ん中を (0, 0) にした所で、題、最初の欄、2 つ目からの欄を上から並べ、字の固まりの真ん中を輪の真ん中に置く。
 * 字の固まりの幅は、どの段の値も収まる幅にする
 */
function centreOf(diagram: DiagramModel): CycleCentre {
  const strip = diagram.strip;
  if (!strip) return { x: 0, y: 0, w: 0, h: 0, rows: [] };
  const values = valuesOf(diagram);
  const C = CYCLE_LOOK.centre;
  const rows: CycleRow[] = strip.fields.map((field, k) => ({ field, lead: k === 0, y: k === 0 ? 0 : C.rest + (k - 1) * C.row }));
  const titleY = -C.lead;
  const boxes: Rect[] = [textBox(strip.title, 0, titleY, CYCLE_TYPE.title, "middle")];
  for (const row of rows) {
    const texts = values.get(row.field) ?? [];
    for (const value of texts) boxes.push(textBox(value, 0, row.y, valueStyle(value, row.lead), "middle"));
    if (texts.length === 0) boxes.push({ x: 0, y: row.y - CYCLE_TYPE.rest.size * 0.8, w: 0, h: CYCLE_TYPE.rest.size });
  }
  const top = Math.min(...boxes.map((b) => b.y));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  const w = Math.max(...boxes.map((b) => b.w));
  const shift = -(top + bottom) / 2;
  return {
    x: -w / 2,
    y: top + shift,
    w,
    h: bottom - top,
    title: { text: strip.title, y: titleY + shift },
    rows: rows.map((row) => ({ ...row, y: row.y + shift })),
  };
}

/** 半径 `r` の輪に置いた箱の四角。輪の真ん中を (0, 0) にした所 */
const placed = (sizes: { w: number; h: number }[], r: number): Rect[] =>
  sizes.map(({ w, h }, i) => {
    const [x, y] = on(r, (TAU * i) / sizes.length);
    return { x: x - w / 2, y: y - h / 2, w, h };
  });

interface Span {
  /** 弧が見え始める角と見え終わる角 */
  a: number;
  b: number;
}

/**
 * 箱 `from` の真ん中の角 `a0` から箱 `to` の真ん中の角 `b0` まで右回りに進む輪の線のうち、`clear(点)` が立つ所の最初と最後の角。
 * 輪の線を細かく区切って両端から探す。立つ所が無ければ `undefined`
 */
function clearSpan(r: number, a0: number, b0: number, clear: (p: Point) => boolean): Span | undefined {
  const step = 0.5 / r;
  let a = a0;
  while (a < b0 && !clear(on(r, a))) a += step;
  let b = b0;
  while (b > a && !clear(on(r, b))) b -= step;
  return b - a > step ? { a, b } : undefined;
}

/** 弧 `i` の見える所。箱の縁から `arcGap` 離れた所から始まり、次の箱の縁から `arcGap` 手前で終わる */
const arcSpan = (rects: Rect[], r: number, i: number): Span | undefined => {
  const n = rects.length;
  const a0 = (TAU * i) / n;
  return clearSpan(r, a0, a0 + TAU / n, (p) => !rects.some((rect) => within(p, rect, R.arcGap)));
};

/** 弧 `i` を走る、半分の幅と高さが `half` の札の道。札が両端の箱から `chipGap` 離れている所だけにする */
const runSpan = (rects: Rect[], r: number, i: number, arc: Span, half: Point): Span | undefined =>
  clearSpan(r, arc.a, arc.b, (p) => rects.every((rect) => gapBetween(around(p, half), rect) >= R.chipGap));

/** 弧の真ん中の矢じりが占める四角 */
const headRect = (p: Point): Rect => {
  const { back, half, tip } = CYCLE_LOOK.head;
  const reach = Math.max(back, half, tip);
  return around(p, [reach, reach]);
};

export function layoutCycle(diagram: DiagramModel): CycleLayout {
  const ids = diagram.boxes.map((b) => b.id);
  const n = ids.length;
  const colors = boxColors(diagram);
  const fits = ids.map((id) => shapedSize(diagram, id, boxWidth(diagram, id, true), true));
  const centre = centreOf(diagram);
  const edges = edgesOf(diagram).flatMap((x) => {
    const i = ids.indexOf(x.edge.from);
    return i < 0 ? [] : [{ ...x, arc: i, half: x.edge.carry.kind === "none" ? ([0, 0] as Point) : carrierHalf(x.edge.carry) }];
  });
  const halves = ids.map((_, i) => edges.filter((e) => e.arc === i).map((e) => e.half));

  /** 半径 `r` で、箱どうしと、弧と札の道と、真ん中の字が離れて収まるか */
  const fitsAt = (r: number): boolean => {
    const rects = placed(fits, r);
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) if (gapBetween(rects[i] as Rect, rects[j] as Rect) < R.boxGap) return false;
    const corners: Point[] = [
      [centre.x, centre.y],
      [centre.x + centre.w, centre.y],
      [centre.x, centre.y + centre.h],
      [centre.x + centre.w, centre.y + centre.h],
    ];
    if (centre.w > 0 && corners.some(([x, y]) => Math.hypot(x, y) > r - R.centreGap)) return false;
    if (centre.w > 0 && rects.some((rect) => gapBetween(centre, rect) < R.centreGap)) return false;
    for (let i = 0; i < n; i++) {
      const arc = arcSpan(rects, r, i);
      if (!arc) return false;
      const head = on(r, (arc.a + arc.b) / 2);
      if (halves[i]?.length === 0 && r * (arc.b - arc.a) < R.bare) return false;
      for (const half of halves[i] ?? []) {
        const run = runSpan(rects, r, i, arc, half);
        if (!run || r * (run.b - run.a) < R.run) return false;
        // 着いた札が留まる所は、弧の真ん中の矢じりに掛けない
        if (gapBetween(around(on(r, run.b), half), headRect(head)) < R.chipGap) return false;
      }
    }
    return true;
  };
  let r = R.least;
  while (r < R.most && !fitsAt(r)) r += R.grow;

  const rects = placed(fits, r);
  const boxes: SceneBox[] = ids.map((id, i) => {
    const source = diagram.boxes[i];
    const rect = rects[i] as Rect;
    const at = fits[i]?.at;
    return {
      id,
      name: source?.name ?? id,
      ...(source?.sub !== undefined ? { sub: source.sub } : {}),
      ...(source?.icon !== undefined ? { icon: source.icon } : {}),
      color: colors.get(id) ?? "slate",
      ...rect,
      ...(at ? { at } : {}),
      cx: rect.x + rect.w / 2,
      cy: rect.y + rect.h / 2,
    };
  });
  const spans = ids.map((_, i) => arcSpan(rects, r, i));
  const arcs: CycleArc[] = ids.flatMap((id, i) => {
    const span = spans[i];
    if (!span) return [];
    const mid = (span.a + span.b) / 2;
    const [x, y] = on(r, mid);
    return [{ from: id, to: ids[(i + 1) % n] as string, points: sample(r, span.a, span.b, R.samples), head: { x, y, angle: (mid * 180) / Math.PI } }];
  });
  const sceneEdges: SceneEdge[] = edges.flatMap(({ step, event, edge, arc, half }) => {
    const span = spans[arc];
    const run = span ? runSpan(rects, r, arc, span, half) : undefined;
    if (!run) return [];
    return [{ step, event, from: edge.from, to: edge.to, points: sample(r, run.a, run.b, LOOK.carrier.samples), color: colors.get(edge.to) ?? "slate", carry: edge.carry }];
  });
  /** 着いた札が留まる所 */
  const rests: Rect[] = sceneEdges.flatMap((e) => {
    const last = e.points[e.points.length - 1];
    return last && e.carry.kind !== "none" ? [around(last, carrierHalf(e.carry))] : [];
  });

  // 段ごとの手順。札が着いた手順、札の無い段は前の段の手順、最初の段は最初の手順
  const current: string[] = [];
  let now = ids[0] ?? "";
  diagram.steps.forEach((step) => {
    for (const event of step.events) if (event.type === "edge" && ids.includes(event.to)) now = event.to;
    current.push(now);
  });

  const { r: br } = LOOK.badge;
  const B = CYCLE_LOOK.badge;
  const heads = arcs.map((a) => headRect([a.head.x, a.head.y]));
  const spots = new Map<string, Point>();
  /**
   * 段の番号の丸を `p` に置くと、弧か札か箱か真ん中の字かほかの丸に掛かるか。
   * 丸を添える箱 `own` は、箱の横に置く時 (`beside`) は横の縁の間を空けているかを見て、箱の角に置く時は比べない
   */
  const blocked = (p: Point, own: string, beside: boolean): boolean =>
    arcs.some((a) => toLine(p, a.points) < br + B.clear) ||
    [...rests, ...heads, ...(centre.w > 0 ? [centre] : [])].some((rect) => gapBetween(around(p, [br, br]), rect) < LOOK.label.touch) ||
    boxes.some((box) => {
      const gap = gapBetween(around(p, [br, br]), box);
      if (box.id !== own) return gap < LOOK.label.touch;
      return beside && gap < B.beside - 0.5;
    }) ||
    [...spots.values()].some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < br * 2 + LOOK.badge.r + 1);
  /**
   * 手順の箱の番号の丸の所。箱の横の輪の外を向く側の、高さの真ん中から、弧に掛からない所まで輪の外へずらす。
   * 箱の横のどこも弧に掛かる時は、ほかの図の種類と同じく箱の角に丸の真ん中を置く
   */
  const spotOf = (box: SceneBox): Point => {
    const found = spots.get(box.id);
    if (found) return found;
    // 真上と真下の箱は、右回りに入ってくる弧の側 (真上は左、真下は右) に置く
    const side = Math.abs(box.cx) < 0.5 ? (box.cy < 0 ? -1 : 1) : Math.sign(box.cx);
    const x = side < 0 ? box.x - B.beside - br : box.x + box.w + B.beside + br;
    const out = box.cy > 0.5 ? 1 : -1;
    const beside: Point[] = [];
    for (let dy = 0; dy <= box.h / 2 + br; dy += B.slide) beside.push([x, box.cy + out * dy]);
    const corners: Point[] = [
      [box.x, box.y],
      [box.x + box.w, box.y],
      [box.x, box.y + box.h],
      [box.x + box.w, box.y + box.h],
    ];
    const spot: Point = beside.find((p) => !blocked(p, box.id, true)) ?? corners.find((p) => !blocked(p, box.id, false)) ?? [x, box.cy];
    spots.set(box.id, spot);
    return spot;
  };
  const byId = new Map(boxes.map((b) => [b.id, b]));
  const badges: SceneBadge[] = besideSameSpot(
    current.flatMap((id, step) => {
      const box = byId.get(id);
      if (!box) return [];
      const [x, y] = spotOf(box);
      return [{ step, x, y, color: box.color }];
    }),
    () => false,
    () => true,
  );

  // 図の枠。全ての部品を囲み、外周に余白を空ける
  const parts: Rect[] = [
    ...boxes,
    ...heads,
    ...rests,
    ...badges.map((b) => around([b.x, b.y], [br, br])),
    ...(centre.w > 0 ? [centre] : []),
    ...arcs.flatMap((a) => a.points.map((p) => around(p, [0, 0]))),
    ...sceneEdges.flatMap((e) => (e.carry.kind === "none" ? [] : e.points.map((p) => around(p, carrierHalf(e.carry))))),
  ];
  const left = Math.min(...parts.map((p) => p.x));
  const top = Math.min(...parts.map((p) => p.y));
  const right = Math.max(...parts.map((p) => p.x + p.w));
  const bottom = Math.max(...parts.map((p) => p.y + p.h));
  const { pad } = CYCLE_LOOK;
  const dx = pad - left;
  const dy = pad - top;
  const move = ([x, y]: Point): Point => [x + dx, y + dy];
  return {
    kind: "cycle",
    width: right - left + pad * 2,
    height: bottom - top + pad * 2,
    regions: [],
    boxes: boxes.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy, cx: b.cx + dx, cy: b.cy + dy })),
    lifelines: [],
    edges: sceneEdges.map((e) => ({ ...e, points: e.points.map(move) })),
    labels: [],
    actions: [],
    badges: badges.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy })),
    paths: [],
    ends: [],
    ring: { cx: dx, cy: dy, r },
    arcs: arcs.map((a) => ({ ...a, points: a.points.map(move), head: { ...a.head, x: a.head.x + dx, y: a.head.y + dy } })),
    centre: {
      ...centre,
      x: centre.x + dx,
      y: centre.y + dy,
      ...(centre.title ? { title: { ...centre.title, y: centre.title.y + dy } } : {}),
      rows: centre.rows.map((row) => ({ ...row, y: row.y + dy })),
    },
    current,
  };
}

/** 輪の真ん中の値の字の形 (描く部品が読む) */
export const cycleValueStyle = valueStyle;

/*
 * ここから下は時計の文字盤の見た目の置き場所 (#3638)。見た目の元は #3623 の step 2 で本人が選ばなかった動く試作の案B (`drawB`)。
 *
 * 手順は 12 時から書いた順に回る向き (既定は右回り、`turn: left` は左回り) へ、手順の長さを 1 周の長さ (長さの合計) で割った角度の弧で帯の上に置く。
 * 角度は 12 時を 0 にした度で、右回りに増え、左回りの図は減る。
 * 目盛りの数字は、1、2、5 に 10 の累乗を掛けた間隔のうち、1 周の長さより手前に置く数字が 6 個以下になる一番細かい間隔で 0 から置く。単位は箱に書いた中で一番大きい単位にする。
 * 針は段ごとに、その段の手順 (札が着いた手順、線の無い段は前の段の手順) の弧の始まりを指す。段の中の線ごとに、前の向きから受ける手順の始まりまで回る向きへ回し、
 * 回った分だけ向きを足していく。線の札は針の先に乗り、針と同じ道を走る。
 * 段の番号は、その段の手順の弧の真ん中の帯の上に置く。弧に入らない短い手順と、針の先に留まる札に掛かる番号は文字盤の外へ出し、短い線で弧と結ぶ。
 * 既定の幅では文字盤の外に手順の名前と長さを置き、外へ出した番号は名前の文字盤の側に添える。
 * 枠の幅が狭い (携帯の幅) 時は、文字盤を枠の幅いっぱいにし、名前の代わりに手順の番号を外に置き、番号と名前と長さの一覧を文字盤の下に積む。
 * 輪の真ん中の字は輪の見た目と同じ置き方 (`centreOf`) で文字盤の真ん中に置く
 */

/** 手順の弧。`from` と `to` は弧の両端の角度 */
export interface ClockSector {
  id: string;
  from: number;
  to: number;
  color: ColorKey;
}

/** 目盛りの数字。`value` は `unit` で数えた値、`x` と `y` は真ん中に揃えた字の基準線の所、`rect` は字の四角 */
export interface ClockTick {
  value: number;
  text: string;
  angle: number;
  x: number;
  y: number;
  rect: Rect;
}

/** 文字盤の外に置く字の 1 行。`x` は行の始まり、`y` は基準線 */
export interface ClockText {
  text: string;
  x: number;
  y: number;
  style: keyof typeof CLOCK_TYPE;
}

/** 文字盤の外に置く、手順の名前と長さ (既定の幅) か手順の番号 (携帯の幅) の字の固まり */
export interface ClockLabel extends Rect {
  id: string;
  texts: ClockText[];
}

/** 番号が弧に入らない手順の、弧から文字盤の外の番号への線 */
export interface ClockLead {
  id: string;
  from: Point;
  to: Point;
  color: ColorKey;
}

/** 携帯の幅の一覧の行。`y` は行の上の端 */
export interface ClockRow {
  id: string;
  number: string;
  name: string;
  time: string;
  y: number;
  color: ColorKey;
}

/** 段の中の線ごとの針の回り方。`from` から `to` の角度まで回る */
export interface ClockMove {
  step: number;
  event: number;
  from: number;
  to: number;
}

export interface ClockLayout extends Layout {
  kind: "cycle";
  shape: "clock";
  turn: "right" | "left";
  /** 文字盤の真ん中と、弧の帯の外の半径 `r` と内の半径 `inner` */
  ring: { cx: number; cy: number; r: number; inner: number };
  sectors: ClockSector[];
  ticks: ClockTick[];
  unit: TimeUnit;
  /** 針。`r` は針の先の半径、`from` は針の根の半径、`angles` は段ごとの向き、`moves` は線ごとの回り方 */
  hand: { r: number; from: number; angles: number[]; moves: ClockMove[] };
  /** 既定の幅の、文字盤の外の名前と長さ。携帯の幅では空 */
  names: ClockLabel[];
  /** 携帯の幅の、文字盤の外の手順の番号。既定の幅では空 */
  keys: ClockLabel[];
  leads: ClockLead[];
  /** 携帯の幅の、文字盤の下の一覧 */
  list?: Rect & { rows: ClockRow[] };
  centre: CycleCentre;
  /** 段ごとの、その段の手順の名札 */
  current: string[];
}

const C = CLOCK_LOOK;
const RAD = Math.PI / 180;

/** 文字盤の真ん中を (0, 0) にした所で、12 時から右回りに `a` 度、半径 `r` の点 */
const onDeg = (r: number, a: number): Point => [r * Math.sin(a * RAD), -r * Math.cos(a * RAD)];

/** 度を 0 以上 360 未満にする */
const norm = (a: number): number => ((a % 360) + 360) % 360;

/** 点 `p` から四角 `rect` までの距離。中に在る時は 0 */
const toRect = ([x, y]: Point, rect: Rect): number =>
  Math.hypot(
    Math.max(rect.x - x, 0, x - rect.x - rect.w),
    Math.max(rect.y - y, 0, y - rect.y - rect.h),
  );

/** 文字盤の真ん中から四角の一番近い所までの距離 */
const nearest = (rect: Rect): number => toRect([0, 0], rect);

/** 線分 `a`-`b` を 2 px ほどの間で区切った点 */
function along([ax, ay]: Point, [bx, by]: Point): Point[] {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2));
  return Array.from({ length: n + 1 }, (_, k): Point => [
    ax + ((bx - ax) * k) / n,
    ay + ((by - ay) * k) / n,
  ]);
}

/** 半径 `r` の点を、角度 `a` から `b` まで `CLOCK_LOOK.samples` 度ほどの間で区切った点 (両端を含む) */
function arcPoints(r: number, a: number, b: number): Point[] {
  const n = Math.max(2, Math.ceil(Math.abs(b - a) / C.samples));
  return Array.from({ length: n + 1 }, (_, k) => onDeg(r, a + ((b - a) * k) / n));
}

/** 字の行の並びの高さと幅。行の上の端から次の行の上の端まで、字の大きさに行の間を足す */
const LINE_GAP = 4;
function blockOf(lines: { text: string; style: keyof typeof CLOCK_TYPE }[]): {
  w: number;
  h: number;
  widths: number[];
} {
  const widths = lines.map((line) => textWidth(line.text, CLOCK_TYPE[line.style]));
  const h =
    lines.reduce((sum, line) => sum + CLOCK_TYPE[line.style].size, 0) +
    LINE_GAP * (lines.length - 1);
  return { w: Math.max(...widths), h, widths };
}

export function layoutClock(
  diagram: DiagramModel,
  lang: NotationLang,
  options: KindOptions,
): ClockLayout {
  const ids = diagram.boxes.map((b) => b.id);
  const colors = boxColors(diagram);
  const colorOf = (id: string): ColorKey => colors.get(id) ?? "slate";
  const times = diagram.boxes.map((b) => timeOf(b.time ?? "") ?? { value: 1, unit: "s" as const });
  const seconds = times.map((t) => t.value * TIME_UNITS[t.unit]);
  const total = seconds.reduce((a, b) => a + b, 0);
  const order = Object.keys(TIME_UNITS) as TimeUnit[];
  const unit = order[Math.max(...times.map((t) => order.indexOf(t.unit)))] as TimeUnit;
  const turn = diagram.cycle?.turn === "left" ? -1 : 1;

  // 手順の弧
  let done = 0;
  const sectors: ClockSector[] = ids.map((id, i) => {
    const from = (turn * 360 * done) / total;
    done += seconds[i] as number;
    return { id, from, to: (turn * 360 * done) / total, color: colorOf(id) };
  });
  const startOf = (id: string): number => sectors.find((s) => s.id === id)?.from ?? 0;

  // 針の回り方。線ごとに、今の向きから受ける手順の始まりまで回る向きへ回る
  let angle = 0;
  const moves: ClockMove[] = [];
  const angles: number[] = [];
  const current: string[] = [];
  let now = ids[0] ?? "";
  diagram.steps.forEach((step, s) => {
    step.events.forEach((event, i) => {
      if (event.type !== "edge" || !ids.includes(event.to)) return;
      const next = angle + turn * norm((startOf(event.to) - angle) * turn);
      moves.push({ step: s, event: i, from: angle, to: next });
      angle = next;
      now = event.to;
    });
    angles.push(angle);
    current.push(now);
  });

  // 目盛りの数字の値。1 周の長さより手前まで
  const span = total / TIME_UNITS[unit];
  const step = niceStep(span);
  const values: number[] = [];
  for (let k = 0; k * step < span - 1e-9; k++) values.push(Number((k * step).toPrecision(12)));

  const centre = centreOf(diagram);
  // 弧の帯の内の半径は、真ん中の字に掛からない半径 (`hole`) より小さくしない。既定の幅では `CLOCK_LOOK.inner` より小さくもしない
  const hole = Math.hypot(centre.w / 2, centre.h / 2) + C.centreGap;
  const least = Math.max(C.inner, hole) + C.band;
  const edgeOf = (s: number, e: number) => {
    const event = diagram.steps[s]?.events[e];
    return event?.type === "edge" ? event : undefined;
  };

  /** 半径 `r` の文字盤の、針の先に留まる札の四角と、目盛りの数字。数字は札に掛からない所まで外へずらす */
  const dialAt = (r: number): { rests: Rect[]; ticks: ClockTick[] } => {
    const rests = moves.flatMap((move) => {
      const carry = edgeOf(move.step, move.event)?.carry;
      return carry && carry.kind !== "none"
        ? [around(onDeg(r - C.tip, move.to), carrierHalf(carry))]
        : [];
    });
    const ticks = values.map((value): ClockTick => {
      const text = `${String(value)}${UNIT_WORDS[lang][unit]}`;
      const style = hasWide(text) ? CLOCK_TYPE.tickJa : CLOCK_TYPE.tick;
      const w = textWidth(text, style);
      const a = (turn * 360 * value) / span;
      let d = r + C.tickAt;
      for (;;) {
        const [x, y] = onDeg(d, a);
        const rect = { x: x - w / 2, y: y - style.size / 2, w, h: style.size };
        const clear =
          nearest(rect) > r + C.mark[1] && rests.every((rest) => gapBetween(rect, rest) >= C.apart);
        if (clear || d > r + C.farthest)
          return { value, text, angle: a, x, y: y + style.size * 0.3, rect };
        d += C.slide;
      }
    });
    return { rests, ticks };
  };
  /** 文字盤と目盛りの数字と札が占める横の幅 */
  const widthAt = (r: number): number => {
    const { rests, ticks } = dialAt(r);
    const rects = [...rests, ...ticks.map((t) => t.rect), { x: -r, y: -r, w: r * 2, h: r * 2 }];
    return Math.max(...rects.map((p) => p.x + p.w)) - Math.min(...rects.map((p) => p.x));
  };

  // 携帯の幅では、文字盤と目盛りの数字が枠の幅に収まる一番大きい半径から始め、外に置いた番号まで枠の幅に収まるまで半径を縮める
  const phone = options.width !== undefined && options.width < C.wide;
  if (!phone) return place(least);
  const width = options.width as number;
  const room = width - C.pad * 2;
  let r = Math.floor(room / 2);
  // 携帯の幅では、内の半径を真ん中の字に掛からない所まで小さくしてよい
  const smallest = hole + C.band;
  while (r > smallest && widthAt(r) > room) r -= 2;
  let laid = place(Math.max(r, smallest));
  while (r > smallest && laid.width > width) {
    r -= 2;
    laid = place(Math.max(r, smallest));
  }
  return laid;

  /** 弧の帯の外の半径を `r` にした文字盤の置き場所 */
  function place(r: number): ClockLayout {
    const inner = r - C.band;
    const tip = r - C.tip;
    const { rests, ticks } = dialAt(r);
    const br = LOOK.badge.r;

    /** 弧の上に置ける段の番号の所。弧に入らないか、針の先に留まる札に掛かれば `undefined` */
    const onArc = (sector: ClockSector): Point | undefined => {
      const at = inner + C.badgeAt;
      if (Math.abs(sector.to - sector.from) * RAD * at < 2 * (br + C.badgeRoom)) return undefined;
      const p = onDeg(at, (sector.from + sector.to) / 2);
      return rests.every((rest) => gapBetween(around(p, [br, br]), rest) >= C.badgeRoom)
        ? p
        : undefined;
    };

    // 文字盤の外の字の固まり。既定の幅は手順の名前と長さと箱の下の字、携帯の幅は手順の番号
    const labels: ClockLabel[] = [];
    const leads: ClockLead[] = [];
    const spots = new Map<string, Point>();
    /** 文字盤の外に置いた物。字の固まりと、外へ出した番号の丸と、引き出す線を区切った点 */
    const placed: Rect[] = [];
    const leadPoints: Point[] = [];
    const obstacles = (): Rect[] => [...ticks.map((t) => t.rect), ...rests, ...placed];
    sectors.forEach((sector, i) => {
      const box = diagram.boxes[i];
      const lines: { text: string; style: keyof typeof CLOCK_TYPE }[] = phone
        ? [{ text: String(i + 1), style: "key" }]
        : [
            { text: box?.name ?? sector.id, style: "name" },
            { text: box?.time ?? "", style: "time" },
            ...(box?.sub !== undefined ? [{ text: box.sub, style: "sub" as const }] : []),
          ];
      const { w, h, widths } = blockOf(lines);
      const arc = onArc(sector);
      const mid = (sector.from + sector.to) / 2;
      const off = arc ? 0 : br + C.badgeRoom;
      // 角度は真ん中から 4 度ずつ左右へずらして探す。線で結ばない字は、弧の両端の内に留める
      const half = Math.abs(sector.to - sector.from) / 2;
      const shifts = Array.from(
        { length: (C.shift / 4) * 2 + 1 },
        (_, k) => (k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * 4,
      ).filter((da) => !arc || Math.abs(da) < half);
      // 携帯の幅の番号は字が小さいので、目盛りの数字と同じ近さから探す
      const candidates: { d: number; a: number; cost: number }[] = [];
      for (let d = r + (phone ? C.tickAt : C.nameAt); d <= r + C.farthest; d += C.slide)
        for (const da of shifts)
          candidates.push({ d, a: mid + da, cost: d - r + Math.abs(da) * 2 });
      candidates.sort((x, y) => x.cost - y.cost);
      const rectAt = (
        d: number,
        a: number,
      ): { p: Point; a: number; rect: Rect; badge?: Rect; lead?: [Point, Point] } => {
        const p = onDeg(d, a);
        const sx = Math.sin(a * RAD);
        const top = Math.cos(a * RAD) > 0;
        const rect =
          sx > 0.35
            ? { x: p[0] + off, y: p[1] - h / 2, w, h }
            : sx < -0.35
              ? { x: p[0] - off - w, y: p[1] - h / 2, w, h }
              : { x: p[0] - w / 2, y: top ? p[1] - off - h : p[1] + off, w, h };
        if (arc) return { p, a, rect };
        const from = onDeg(r, mid);
        const dist = Math.hypot(p[0] - from[0], p[1] - from[1]);
        const to: Point = [
          p[0] - ((p[0] - from[0]) * br) / dist,
          p[1] - ((p[1] - from[1]) * br) / dist,
        ];
        return { p, a, rect, badge: around(p, [br, br]), lead: [from, to] };
      };
      const fits = ({ rect, badge, lead }: ReturnType<typeof rectAt>): boolean => {
        const blocks = obstacles();
        for (const part of badge ? [rect, badge] : [rect]) {
          if (nearest(part) <= r + C.mark[1] + 1) return false;
          if (blocks.some((o) => gapBetween(part, o) < C.apart)) return false;
          if (leadPoints.some((q) => toRect(q, part) < C.leadClear)) return false;
        }
        return (
          !lead ||
          along(lead[0], lead[1]).every((q) => blocks.every((o) => toRect(q, o) >= C.leadClear))
        );
      };
      const found =
        candidates.map((c) => rectAt(c.d, c.a)).find(fits) ?? rectAt(r + C.farthest, mid);
      const { rect, badge, lead } = found;
      // 字の行は、文字盤の右の字は左の端で、左の字は右の端で、上と下の字は真ん中で揃える
      const sx = Math.sin(found.a * RAD);
      let y = rect.y;
      const texts = lines.map((line, k): ClockText => {
        const style = CLOCK_TYPE[line.style];
        const lw = widths[k] as number;
        const x =
          sx > 0.35 ? rect.x : sx < -0.35 ? rect.x + rect.w - lw : rect.x + (rect.w - lw) / 2;
        const text = { text: line.text, x, y: y + style.size * 0.8, style: line.style };
        y += style.size + LINE_GAP;
        return text;
      });
      labels.push({ id: sector.id, ...rect, texts });
      placed.push(rect);
      if (badge && lead) {
        placed.push(badge);
        leadPoints.push(...along(lead[0], lead[1]));
        leads.push({ id: sector.id, from: lead[0], to: lead[1], color: sector.color });
      }
      spots.set(sector.id, arc ?? found.p);
    });

    // 段の番号。同じ手順の番号は同じ所で後の段の番号と入れ替える
    const badges: SceneBadge[] = besideSameSpot(
      current.flatMap((id, s) => {
        const p = spots.get(id);
        return p ? [{ step: s, x: p[0], y: p[1], color: colorOf(id) }] : [];
      }),
      () => false,
      () => true,
    );

    // 札は針の先に乗って、針と同じ道を走る
    const edges: SceneEdge[] = moves.flatMap((move) => {
      const edge = edgeOf(move.step, move.event);
      if (!edge) return [];
      return [
        {
          step: move.step,
          event: move.event,
          from: edge.from,
          to: edge.to,
          points: arcPoints(tip, move.from, move.to),
          color: colorOf(edge.to),
          carry: edge.carry,
        },
      ];
    });

    // 文字盤と、その外に置いた物の四角
    const dialParts: Rect[] = [
      { x: -r, y: -r, w: r * 2, h: r * 2 },
      ...ticks.map((t) => t.rect),
      ...rests,
      ...placed,
      ...badges.map((b) => around([b.x, b.y], [br, br])),
      ...(centre.w > 0 ? [centre] : []),
    ];
    const left = Math.min(...dialParts.map((p) => p.x));
    const right = Math.max(...dialParts.map((p) => p.x + p.w));
    const bottom = Math.max(...dialParts.map((p) => p.y + p.h));
    const top = Math.min(...dialParts.map((p) => p.y));

    // 携帯の幅の一覧。文字盤の下に、手順を書いた順に積む
    const list = phone
      ? {
          x: left,
          y: bottom + C.listGap,
          w: right - left,
          h: ids.length * C.row,
          rows: ids.map((id, i): ClockRow => {
            const box = diagram.boxes[i];
            return {
              id,
              number: String(i + 1),
              name: box?.name ?? id,
              time: box?.time ?? "",
              y: bottom + C.listGap + i * C.row,
              color: colorOf(id),
            };
          }),
        }
      : undefined;
    const dx = C.pad - left;
    const dy = C.pad - top;
    const move = ([x, y]: Point): Point => [x + dx, y + dy];
    const shift = <T extends Rect>(rect: T): T => ({ ...rect, x: rect.x + dx, y: rect.y + dy });
    const moveLabel = (label: ClockLabel): ClockLabel => ({
      ...shift(label),
      texts: label.texts.map((t) => ({ ...t, x: t.x + dx, y: t.y + dy })),
    });
    return {
      kind: "cycle",
      shape: "clock",
      turn: turn > 0 ? "right" : "left",
      width: right - left + C.pad * 2,
      height: (list ? list.y + list.h : bottom) - top + C.pad * 2,
      regions: [],
      boxes: [],
      lifelines: [],
      edges: edges.map((e) => ({ ...e, points: e.points.map(move) })),
      labels: [],
      actions: [],
      badges: badges.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy })),
      paths: [],
      ends: [],
      ring: { cx: dx, cy: dy, r, inner },
      sectors,
      ticks: ticks.map((t) => ({ ...t, x: t.x + dx, y: t.y + dy, rect: shift(t.rect) })),
      unit,
      hand: { r: tip, from: inner - C.handIn, angles, moves },
      names: phone ? [] : labels.map(moveLabel),
      keys: phone ? labels.map(moveLabel) : [],
      leads: leads.map((l) => ({ ...l, from: move(l.from), to: move(l.to) })),
      ...(list
        ? { list: { ...shift(list), rows: list.rows.map((row) => ({ ...row, y: row.y + dy })) } }
        : {}),
      centre: {
        ...centre,
        x: centre.x + dx,
        y: centre.y + dy,
        ...(centre.title ? { title: { ...centre.title, y: centre.title.y + dy } } : {}),
        rows: centre.rows.map((row) => ({ ...row, y: row.y + dy })),
      },
      current,
    };
  }
}

/*
 * ここから下は輪を開いた帯の見た目の置き場所 (#3639)。見た目の元は #3623 の step 2 で本人が選ばなかった動く試作の案C (`drawC`)。
 *
 * 手順は書いた順に左から右へ、等しい幅の山形で帯に並べる。山形の先は次の山形の切り込みに入り、帯の最初の山形は左の縁を平らにする。
 * 回ごとに帯を 1 本ずつ上から下へ積む。回は 0 から数え、最後の手順から最初の手順への線で 1 つ進む。
 * 帯ごとに、上から帯の頭 (中身の帯の題と、その回の欄の値)、目盛りの数字と段の番号の行、山形、手順の名前を置く。
 * 全ての箱に長さを書いた図は、手順の境目に始まる時刻の目盛りを 0 から置き、字は境目の時刻を整数か小数 1 桁で書ける一番大きい単位で書く。
 * 段の中の線の札は帯の真ん中の高さを、送る手順の山形の真ん中から受ける手順の山形の真ん中へ走る。
 * 最後の手順から最初の手順への線の札は、帯の右の端から外を回って帯の下を横切り、下の回の帯の左の端へ入る戻る矢印を辿って、次の回の最初の山形の真ん中で着く。
 * 段の番号は、その段の手順のその回の山形の真ん中の上に置く。
 * 枠の幅が狭い (携帯の幅) 時は、山形を枠の幅に収まるまで縮めて手順の番号を山形の中に書き、名前の代わりに番号と名前と長さの一覧を帯の下に積む
 */

/** 山形。`round` はその山形が在る回、`first` は帯の最初の山形 (左の縁を平らにする) */
export interface BandSegment extends Rect {
  id: string;
  round: number;
  color: ColorKey;
  first: boolean;
}

/** 回の帯。その回の山形の並びを囲む四角 */
export interface BandRow extends Rect {
  round: number;
}

/** 帯の上の目盛り。`value` は `unit` で数えた境目の時刻、`x` は境目の所、`y` は字の基準線、`mark` は印の上の端と下の端 */
export interface BandTick {
  round: number;
  value: number;
  text: string;
  x: number;
  y: number;
  rect: Rect;
  mark: [number, number];
}

/** 山形の下の手順の名前と箱の下の字。字は `x` を真ん中に揃え、`y` は基準線 */
export interface BandName extends Rect {
  id: string;
  round: number;
  texts: { text: string; x: number; y: number; style: "name" | "sub" }[];
}

/** 帯の頭の欄。`x` は字の左の端、`lead` は大きく書く最初の欄 */
export interface BandField {
  field: string;
  x: number;
  lead: boolean;
}

/** 帯の頭。`base` は字の基準線で、題と欄の値を左から並べる。四角は字の並びを囲む */
export interface BandHead extends Rect {
  round: number;
  base: number;
  title: { text: string; x: number };
  fields: BandField[];
}

/** 回 `round` から次の回へ戻る矢印。帯の右の端から下の回の帯の左の端までの折れ線 */
export interface BandReturn {
  round: number;
  points: Point[];
}

export interface BandLayout extends Layout {
  kind: "cycle";
  shape: "band";
  bands: BandRow[];
  segments: BandSegment[];
  /** 全ての箱に長さを書いた図の目盛り。長さを書かない図では空 */
  ticks: BandTick[];
  unit?: TimeUnit;
  /** 既定の幅の、山形の下の名前。携帯の幅では空 */
  names: BandName[];
  /** 中身の帯を持つ図の、回ごとの帯の頭 */
  heads: BandHead[];
  returns: BandReturn[];
  /** 携帯の幅の、山形の中の番号の基準線の、山形の上の縁からの高さ */
  keyAt?: number;
  /** 携帯の幅の、帯の下の一覧 */
  list?: Rect & { rows: ClockRow[] };
  /** 段ごとの、その段の手順の名札と回 */
  current: string[];
  rounds: number[];
}

/** 帯の頭の値の字の形。最初の欄の和文を含む値は和文の字で書く */
export const bandValueStyle = (value: string, lead: boolean): TextStyle =>
  lead ? (hasWide(value) ? BAND_TYPE.leadJa : BAND_TYPE.lead) : BAND_TYPE.rest;

/** 目盛りの字の形 */
export const bandTickStyle = (text: string): TextStyle => (hasWide(text) ? BAND_TYPE.tickJa : BAND_TYPE.tick);

/** 境目の時刻 (秒) を全て整数か小数 1 桁で書ける一番大きい単位 */
function bandUnit(bounds: number[]): TimeUnit {
  const order = (Object.keys(TIME_UNITS) as TimeUnit[]).reverse();
  const fits = (unit: TimeUnit): boolean =>
    bounds.every((s) => {
      const v = (s / TIME_UNITS[unit]) * 10;
      return Math.abs(v - Math.round(v)) < 1e-6;
    });
  return order.find(fits) ?? "ms";
}

export function layoutBand(diagram: DiagramModel, lang: NotationLang, options: KindOptions): BandLayout {
  const B = BAND_LOOK;
  const ids = diagram.boxes.map((b) => b.id);
  const n = ids.length;
  const colors = boxColors(diagram);
  const colorOf = (id: string): ColorKey => colors.get(id) ?? "slate";
  const phone = options.width !== undefined && options.width < B.wide;

  // 段ごとの手順と回。札が着いた手順、線の無い段は前の段の手順。最後の手順から最初の手順への線で回が 1 つ進む
  const current: string[] = [];
  const rounds: number[] = [];
  const runs: { step: number; event: number; edge: EdgeEvent; round: number; wrap: boolean }[] = [];
  let now = ids[0] ?? "";
  let round = 0;
  for (const { step, event, edge } of edgesOf(diagram)) {
    while (current.length < step) {
      current.push(now);
      rounds.push(round);
    }
    if (!ids.includes(edge.to)) continue;
    const wrap = edge.from === ids[n - 1] && edge.to === ids[0];
    runs.push({ step, event, edge, round, wrap });
    if (wrap) round += 1;
    now = edge.to;
  }
  while (current.length < diagram.steps.length) {
    current.push(now);
    rounds.push(round);
  }
  const count = round + 1;

  // 目盛り。全ての箱に長さを書いた図だけが持つ
  const times = diagram.boxes.map((b) => (b.time === undefined ? undefined : timeOf(b.time)));
  const timed = n > 0 && times.every((t) => t !== undefined);
  const bounds: number[] = [0];
  if (timed) for (const t of times) bounds.push((bounds[bounds.length - 1] as number) + (t?.value ?? 0) * TIME_UNITS[t?.unit ?? "s"]);
  const unit = timed ? bandUnit(bounds) : undefined;
  const tickTexts = unit
    ? bounds.map((s) => {
        const value = Math.round((s / TIME_UNITS[unit]) * 10) / 10;
        return { value, text: `${String(value)}${UNIT_WORDS[lang][unit]}` };
      })
    : [];
  const tickWidths = tickTexts.map((t) => textWidth(t.text, bandTickStyle(t.text)));
  const tickWidest = Math.max(0, ...tickWidths);

  // 帯の頭の欄。欄の値の幅は、どの段の値も収まる幅にする
  const strip = diagram.strip;
  const values = valuesOf(diagram);
  const titleWidth = strip ? textWidth(strip.title, BAND_TYPE.title) : 0;
  const fieldWidths = (strip?.fields ?? []).map((field, k) =>
    Math.max(0, ...(values.get(field) ?? []).map((value) => textWidth(value, bandValueStyle(value, k === 0)))),
  );

  // 名前の幅。携帯の幅では名前を下の一覧に置く
  const nameWidth = phone
    ? 0
    : Math.max(0, ...diagram.boxes.map((b) => Math.max(textWidth(b.name, BAND_TYPE.name), b.sub === undefined ? 0 : textWidth(b.sub, BAND_TYPE.sub))));
  const h = phone ? B.phoneH : B.h;
  const br = LOOK.badge.r;
  // 戻る矢印は、帯の左の端の目盛りの字に掛からない所まで外を回る
  const out = Math.max(B.out, (tickWidths[0] ?? 0) / 2 + B.apart, (tickWidths[tickWidths.length - 1] ?? 0) / 2 + B.apart);

  const widest = Math.max(B.pitch, nameWidth + B.nameGap, tickWidest + B.apart);
  if (!phone) return place(widest);
  const width = options.width as number;
  let pitch = Math.min(widest, (width - B.pad * 2 - out * 2 + B.gap - B.point) / Math.max(n, 1));
  let laid = place(pitch);
  while (pitch > B.point * 2 && laid.width > width) {
    pitch -= 2;
    laid = place(pitch);
  }
  return laid;

  /** 山形を `pitch` の間で並べた置き場所 */
  function place(pitch: number): BandLayout {
    const w = pitch - B.gap + B.point;
    const bandW = pitch * (n - 1) + w;
    // 目盛りの数字は番号と同じ行に置き、番号に掛かる時は上の行へ移す
    const shared = (pitch + B.gap - B.point) / 2 >= tickWidest / 2 + br + B.apart;
    const tickStyleSize = BAND_TYPE.tick.size;
    const tickUp = unit === undefined ? 0 : shared ? 0 : B.tickRow;
    // 山形の上の縁から、番号と目盛りの行の上の端と、帯の頭の基準線までの高さ
    const tickBase = B.badgeAt + tickUp - tickStyleSize * 0.35;
    const rowTop = Math.max(B.badgeAt + br, unit === undefined ? 0 : tickBase + tickStyleSize * 0.8);
    const headBase = rowTop + B.headGap;
    const headSize = Math.max(BAND_TYPE.title.size, BAND_TYPE.lead.size, BAND_TYPE.leadJa.size, BAND_TYPE.rest.size);
    const above = strip ? headBase + headSize * 0.8 : rowTop;
    // 山形の下の縁から、名前の下の端までの高さ
    const hasSub = !phone && diagram.boxes.some((b) => b.sub !== undefined);
    const below = phone ? 0 : B.nameAt + (hasSub ? B.subAt + BAND_TYPE.sub.size * 0.2 : BAND_TYPE.name.size * 0.2);
    const stride = above + h + below + B.cross * 2;
    const topOf = (r: number): number => above + r * stride;
    const midOf = (r: number): number => topOf(r) + h / 2;

    const bands: BandRow[] = Array.from({ length: count }, (_, r) => ({ round: r, x: 0, y: topOf(r), w: bandW, h }));
    const segments: BandSegment[] = bands.flatMap((band) =>
      ids.map((id, i) => ({ id, round: band.round, color: colorOf(id), first: i === 0, x: pitch * i, y: band.y, w, h })),
    );
    const segOf = (id: string, r: number): BandSegment | undefined => segments.find((s) => s.id === id && s.round === r);
    const centre = (s: BandSegment | undefined): Point => (s ? [s.x + s.w / 2, s.y + s.h / 2] : [0, 0]);

    const ticks: BandTick[] = bands.flatMap((band) =>
      tickTexts.map(({ value, text }, k): BandTick => {
        const x = k < n ? pitch * k : pitch * (n - 1) + w;
        const y = band.y - tickBase;
        return { round: band.round, value, text, x, y, rect: textBox(text, x, y, bandTickStyle(text), "middle"), mark: [y + 3, band.y - B.mark] };
      }),
    );

    const names: BandName[] = phone
      ? []
      : segments.map((seg, i) => {
          const box = diagram.boxes[i % n];
          const cx = seg.x + seg.w / 2;
          const lines = [
            { text: box?.name ?? seg.id, style: "name" as const },
            ...(box?.sub !== undefined ? [{ text: box.sub, style: "sub" as const }] : []),
          ];
          let y = seg.y + seg.h + B.nameAt;
          const texts = lines.map((line, k) => {
            if (k > 0) y += B.subAt;
            return { text: line.text, x: cx, y, style: line.style };
          });
          const rects = texts.map((t) => textBox(t.text, t.x, t.y, BAND_TYPE[t.style], "middle"));
          const left = Math.min(...rects.map((r) => r.x));
          const top = Math.min(...rects.map((r) => r.y));
          return {
            id: seg.id,
            round: seg.round,
            texts,
            x: left,
            y: top,
            w: Math.max(...rects.map((r) => r.x + r.w)) - left,
            h: Math.max(...rects.map((r) => r.y + r.h)) - top,
          };
        });

    const heads: BandHead[] = strip
      ? bands.map((band) => {
          const base = band.y - headBase;
          let x = titleWidth + B.fieldGap;
          const fields = strip.fields.map((field, k) => {
            const at = x;
            x += (fieldWidths[k] ?? 0) + B.fieldGap;
            return { field, x: at, lead: k === 0 };
          });
          return { round: band.round, base, title: { text: strip.title, x: 0 }, fields, x: 0, y: base - headSize * 0.8, w: x - B.fieldGap, h: headSize };
        })
      : [];

    // 戻る矢印。帯の右の端から外を回って帯の下を横切り、下の回の帯の左の端へ入る
    const returns: BandReturn[] = bands.slice(0, -1).map((band) => {
      const cross = band.y + h + below + B.cross;
      const next = midOf(band.round + 1);
      const mid = midOf(band.round);
      return {
        round: band.round,
        points: [
          [bandW + 2, mid],
          [bandW + out, mid],
          [bandW + out, cross],
          [-out, cross],
          [-out, next],
          [-2, next],
        ],
      };
    });

    // 札の道。段の中の線は帯の真ん中を山形の真ん中から真ん中へ、最後の手順から最初の手順への線は戻る矢印を辿る
    const edges: SceneEdge[] = runs.map(({ step, event, edge, round: r, wrap }) => {
      const from = centre(segOf(edge.from, r));
      const to = centre(segOf(edge.to, wrap ? r + 1 : r));
      const back = wrap ? (returns.find((x) => x.round === r)?.points ?? []) : [];
      return { step, event, from: edge.from, to: edge.to, points: [from, ...back, to], color: colorOf(edge.to), carry: edge.carry };
    });

    // 段の番号。その段の手順のその回の山形の真ん中の上。同じ手順の番号は同じ所で後の段の番号と入れ替える
    const badges: SceneBadge[] = besideSameSpot(
      current.flatMap((id, s) => {
        const seg = segOf(id, rounds[s] ?? 0);
        return seg ? [{ step: s, x: seg.x + seg.w / 2, y: seg.y - B.badgeAt, color: colorOf(id) }] : [];
      }),
      () => false,
      () => true,
    );

    // 携帯の幅の一覧。帯の下に、手順を書いた順に積む
    const last = bands[bands.length - 1] as BandRow;
    const listTop = last.y + h + B.listGap;
    const list = phone
      ? {
          x: 0,
          y: listTop,
          w: bandW,
          h: n * B.row,
          rows: ids.map((id, i): ClockRow => {
            const box = diagram.boxes[i];
            return { id, number: String(i + 1), name: box?.name ?? id, time: box?.time ?? "", y: listTop + i * B.row, color: colorOf(id) };
          }),
        }
      : undefined;

    // 図の枠。全ての部品と、走る札と留まる札を囲み、外周に余白を空ける
    const parts: Rect[] = [
      ...segments,
      ...ticks.map((t) => t.rect),
      ...names,
      ...heads,
      ...badges.map((b) => around([b.x, b.y], [br, br])),
      ...returns.flatMap((x) => x.points.map((p) => around(p, [B.headHalf, B.headHalf]))),
      ...edges.flatMap((e) => (e.carry.kind === "none" ? [] : e.points.map((p) => around(p, carrierHalf(e.carry))))),
      ...(list ? [list] : []),
    ];
    const left = Math.min(...parts.map((p) => p.x));
    const top = Math.min(...parts.map((p) => p.y));
    const right = Math.max(...parts.map((p) => p.x + p.w));
    const bottom = Math.max(...parts.map((p) => p.y + p.h));
    const dx = B.pad - left;
    const dy = B.pad - top;
    const move = ([x, y]: Point): Point => [x + dx, y + dy];
    const shift = <T extends Rect>(rect: T): T => ({ ...rect, x: rect.x + dx, y: rect.y + dy });
    return {
      kind: "cycle",
      shape: "band",
      width: right - left + B.pad * 2,
      height: bottom - top + B.pad * 2,
      regions: [],
      boxes: [],
      lifelines: [],
      edges: edges.map((e) => ({ ...e, points: e.points.map(move) })),
      labels: [],
      actions: [],
      badges: badges.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy })),
      paths: [],
      ends: [],
      bands: bands.map(shift),
      segments: segments.map(shift),
      ticks: ticks.map((t) => ({ ...t, x: t.x + dx, y: t.y + dy, rect: shift(t.rect), mark: [t.mark[0] + dy, t.mark[1] + dy] })),
      ...(unit ? { unit } : {}),
      names: names.map((x) => ({ ...shift(x), texts: x.texts.map((t) => ({ ...t, x: t.x + dx, y: t.y + dy })) })),
      heads: heads.map((x) => ({ ...shift(x), base: x.base + dy, title: { ...x.title, x: x.title.x + dx }, fields: x.fields.map((f) => ({ ...f, x: f.x + dx })) })),
      returns: returns.map((x) => ({ ...x, points: x.points.map(move) })),
      ...(phone ? { keyAt: B.keyAt } : {}),
      ...(list ? { list: { ...shift(list), rows: list.rows.map((row) => ({ ...row, y: row.y + dy })) } } : {}),
      current,
      rounds,
    };
  }
}
