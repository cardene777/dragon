/**
 * 回り続ける図の置き場所 (#3623)。見た目の元は step 2 で本人が選んだ動く試作の案A (手順の箱を輪の上に置き、隣どうしを弧の矢印で結ぶ)。
 *
 * 手順の箱は書いた順に、真上から右回りに輪の上へ等しい間で置き、箱の真ん中を輪の線の上に置く。
 * 隣どうしの箱は、輪の線のうち両端の箱の外に見える所を弧にして結び、弧の真ん中に右回りを指す山形の矢じりを置く。
 * 段の中の線の札は、その弧の上を送る側の箱の近くから受ける側の箱の近くへ走る。札の道は札が両端の箱に掛からない所だけにする。
 * 輪の真ん中には中身の帯の題と、段の中の `set` で書いた欄の値を置き、図の下に帯を置かない。
 * 段の番号は、その段で札が着いた手順 (札の無い段は前の段の手順、最初の段は最初の手順) の箱の横の、輪の外を向く側に置く。
 * 弧に掛かる時は、丸を輪の外へずらす。同じ手順の番号は同じ所で後の段の番号と入れ替える。
 * 輪の半径は下限から広げていき、箱どうしと、札の道と、真ん中の字が互いに離れて収まる最も小さな半径にする
 */
import { hasWide, textBox } from "../../layout/measure";
import {
  besideSameSpot,
  boxColors,
  boxWidth,
  carrierHalf,
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
import { CYCLE_LOOK, CYCLE_TYPE } from "../../look/cycle";
import { LOOK, type TextStyle } from "../../look/values";
import type { DiagramModel } from "../../schema";

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
