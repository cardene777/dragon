/**
 * 時間軸の図の置き場所 (#3165)。見た目の元は見本帳の試作 `docs/design/base/scenes/finality.js`。
 *
 * 下の帯に時間軸を置く。目盛り (`scale`) を左から同じ幅で並べ、印の列 (`rows`) を宣言した順に上から重ね、目盛りごとに細い印を 1 つ置く。
 * 印の下に節目 (`points`) の旗の丸を置き、名札と状態の字を丸の右に添える。節目どうしの線は 2 つの丸の間に横に引き、名前を線の下に置く。
 * 範囲の括弧 (`span`) は節目の下に、時刻の目盛りの線と字と区切り (`period`) の名前はさらに下に置く。範囲の囲み (`span` の `box`) は印の列を囲む。
 * 上の帯は拡大した目盛り (`zoom`) を列にして、宣言した箱を列ごとに同じ並びで縦に置く。線は `at` の列の箱から `into` の列 (無ければ同じ列) の箱へ引く。
 * 印の列と同じ名札の箱は、その列が空きにした目盛りの列で空きの枠になる。時間軸の上の拡大した範囲を枠で囲み、枠の上の角から上の帯へ点線でつなぐ。
 * 中身の帯は図の下に置く。
 */
import { FIGURE_TEXT } from "../figure-text";
import { COLOR_ORDER, type ColorKey, LOOK, TYPE } from "../look/values";
import type { Diagram, DiagramEvent } from "../schema";
import type { NotationLang } from "../words";
import { textBox, textWidth } from "./measure";
import {
  badgeOnPath,
  badgeRect,
  boxColors,
  boxWidth,
  edgeColor,
  type EdgeEvent,
  type Layout,
  layoutStrip,
  placeLabel,
  placeSlot,
  type Point,
  type Rect,
  replaceSameSpot,
  type SceneBadge,
  type SceneBox,
  type SceneEdge,
  type SceneLabel,
  type SceneRegion,
  seatCarriers,
  slotBoxWidth,
  slotRooms,
  stripNeed,
} from "./scene";

/** 時間軸。`x` から目盛り 1 つの幅 `unit` で `count` 個並べ、`line` の高さに時刻の目盛りの線を引く */
export interface TimeAxis {
  x: number;
  w: number;
  unit: number;
  count: number;
  line: number;
}

/** 印の列 */
export interface TimeRowPlaced extends Rect {
  id: string;
  name: string;
  color: ColorKey;
}

/** 目盛り 1 つの印。`empty` は空きの印。`colors` は色を変えた段と出来事と色 */
export interface TimeMark extends Rect {
  row: string;
  unit: number;
  empty: boolean;
  color: ColorKey;
  colors: { step: number; event: number; color: ColorKey }[];
}

/** 時刻の字。目盛りの境 `at` に置き、字の左端を `left` に、基準線を `y` に置く */
export interface TimeTick {
  at: number;
  x: number;
  text: string;
  left: number;
  y: number;
}

/** 区切り。`name` は区切りの名前と番号、`range` はその区切りの目盛りの番号の範囲。字は区切りの真ん中に置く */
export interface TimePeriodPlaced extends Rect {
  index: number;
  from: number;
  to: number;
  name: string;
  range: string;
  nameY: number;
  rangeY: number;
}

/** 節目。置いた目盛り `unit` の印の下の旗の丸。`text` は名札と状態の字が占める所、`changes` は状態の字と色を変えた段と出来事 */
export interface TimePointPlaced {
  id: string;
  unit: number;
  cx: number;
  cy: number;
  r: number;
  text: Rect;
  changes: { step: number; event: number; text: string; color?: ColorKey }[];
}

/** 拡大の帯の箱。`row` は同じ名札の印の列、`empty` はその列が空きにした目盛りの列の箱 */
export interface TimeBox extends SceneBox {
  row?: string;
  empty?: boolean;
}

/** 拡大の帯の列。目盛り `unit` の列に、宣言した箱を同じ並びで置く。`head` は列の上の字 */
export interface TimeColumn extends Rect {
  unit: number;
  head: string;
  boxes: TimeBox[];
}

/** 拡大の帯。軸の上の拡大した範囲の枠 `frame` と、枠から帯へつなぐ点線 `guides`。`empty` は空きの枠の字、`headY` は列の上の字の基準線 */
export interface TimeZoom {
  from: number;
  to: number;
  frame: Rect;
  guides: Point[][];
  columns: TimeColumn[];
  empty: string;
  headY: number;
}

/** 範囲の括弧 (`bracket`) か囲み (`box`)。`until` は消える段 (無ければ最後の段まで残る)。`textY` は字の基準線 */
export interface TimeSpanPlaced extends Rect {
  step: number;
  event: number;
  kind: "bracket" | "box";
  from: number;
  to: number;
  text: string;
  textRect: Rect;
  textY: number;
  until?: number;
  color: ColorKey;
}

/** 拡大の帯の線の両端の箱。`column` は線を出す列、`into` は受ける列の目盛り */
export interface TimeWire {
  step: number;
  event: number;
  from: TimeBox;
  to: TimeBox;
  column: number;
  into: number;
}

export interface TimeLayout extends Layout {
  kind: "time";
  axis: TimeAxis;
  rows: TimeRowPlaced[];
  marks: TimeMark[];
  ticks: TimeTick[];
  /** 細かい目盛りの線を引く境 */
  minor: number[];
  periods: TimePeriodPlaced[];
  points: TimePointPlaced[];
  zoom?: TimeZoom;
  spans: TimeSpanPlaced[];
  wires: TimeWire[];
  /** 針の線の上端と下端 */
  needle: { y1: number; y2: number };
}


const SECONDS = { d: 86400, h: 3600, min: 60, s: 1, ms: 0.001 } as const;
type TimeUnit = keyof typeof SECONDS;
const UNITS = Object.keys(SECONDS) as TimeUnit[];

/** 単位の長さの字 (`12s` など) の、秒と単位。読めない字は 1 秒 */
function durationOf(text: string): { seconds: number; unit: TimeUnit } {
  const m = /^([0-9]+(?:\.[0-9]+)?)(ms|s|min|h|d)$/u.exec(text);
  if (!m) return { seconds: 1, unit: "s" };
  const unit = m[2] as TimeUnit;
  return { seconds: Number(m[1]) * SECONDS[unit], unit };
}

/**
 * 並べる時刻を同じ単位で書く単位。一番遅い時刻が 2 以上になる一番大きい単位で、どの単位でも 2 に届かなければ目盛りの長さの単位。
 * 1 で選ぶと、72 秒の軸が 0.2 分刻みの字になって読みにくいため
 */
const unitFor = (max: number, fallback: TimeUnit): TimeUnit => UNITS.find((u) => max / SECONDS[u] >= 2 - 1e-9) ?? fallback;

const timeText = (seconds: number, unit: TimeUnit, lang: NotationLang): string => `${Number((seconds / SECONDS[unit]).toFixed(2))} ${FIGURE_TEXT[lang].timeUnits[unit]}`;

/** 時刻の字を置く境。区切りがあれば区切りの境ごとに、無ければ字が `LOOK.time.ticks` 個に収まる切りのよい間ごとに置く */
function majorTicks(count: number, period: number | undefined, unitPx: number): { at: number[]; step: number } {
  let step = 1;
  if (period) step = period * Math.max(1, Math.ceil(count / period / 8));
  else {
    for (let k = 1; ; k *= 10) {
      const found = [k, k * 2, k * 5].find((n) => count / n <= LOOK.time.ticks);
      if (found !== undefined) {
        step = found;
        break;
      }
    }
  }
  const at: number[] = [];
  for (let u = 0; u <= count; u += step) at.push(u);
  const last = at[at.length - 1] as number;
  if (last !== count && (count - last) * unitPx >= LOOK.time.minorPx) at.push(count);
  return { at, step };
}

/** 細かい目盛りの線を引く境。時刻の字の間を割り切る間のうち、`LOOK.time.minorPx` 以上離れる一番細かい間で引く */
function minorTicks(count: number, step: number, unitPx: number, majors: number[]): number[] {
  const by = Array.from({ length: step - 1 }, (_, k) => k + 1).find((d) => step % d === 0 && d * unitPx >= LOOK.time.minorPx);
  if (by === undefined) return [];
  const out: number[] = [];
  for (let u = by; u < count; u += by) if (!majors.includes(u)) out.push(u);
  return out;
}

/** 段ごとの、段の始まりと終わりに針がいる境 */
function needleSteps(diagram: Diagram): [number, number][] {
  let at = 0;
  return diagram.steps.map((step) => {
    const from = at;
    for (const event of step.events) if (event.type === "now") at = Math.max(at, event.to + 1);
    return [from, at];
  });
}

export function layoutTime(diagram: Diagram, lang: NotationLang = "ja"): TimeLayout {
  const T = LOOK.time;
  const { margin, gap } = LOOK;
  const R = LOOK.region;
  const text = FIGURE_TEXT[lang];
  const spec = diagram.time ?? { scale: { unit: "", length: "1s", count: 1 }, rows: [] };
  const { scale } = spec;
  const count = Math.max(1, scale.count);
  const length = durationOf(scale.length);
  const width = Math.max(T.width, stripNeed(diagram) + margin * 2);

  // 印の列の名前を軸の左に置き、長い名前は軸を右へ寄せる
  const nameRight = Math.max(0, ...spec.rows.map((r) => textWidth(r.name, TYPE.timeRow)));
  const axisX = Math.max(T.axisX, margin + R.inset + nameRight + T.gutterGap);
  const axisW = width - T.right - axisX;
  const unit = axisW / count;

  const colors = boxColors(diagram);
  const rooms = slotRooms(diagram);
  const regions: SceneRegion[] = [];
  const boxes: TimeBox[] = [];
  const edges: SceneEdge[] = [];
  const wires: TimeWire[] = [];
  const rowIds = new Map(spec.rows.map((r) => [r.id, r]));

  // 拡大の帯
  let zoom: TimeZoom | undefined;
  let axisTop = margin;
  if (spec.zoom) {
    const { from, to } = spec.zoom;
    const n = to - from + 1;
    const colW = axisW / n;
    const top = margin;
    const headUnit = unitFor(to * length.seconds, length.unit);
    const columns: TimeColumn[] = [];
    for (let k = 0; k < n; k++) {
      const u = from + k;
      const x = axisX + k * colW;
      const placed = diagram.boxes.map((b, j): TimeBox => {
        const room = rooms.get(b.id);
        const w = Math.max(boxWidth(diagram, b.id, false), slotBoxWidth(room, b.icon !== undefined, LOOK.box.padX));
        const y = top + T.boxTop + j * (LOOK.box.h + T.boxGap);
        const row = rowIds.get(b.id);
        const box: TimeBox = {
          id: b.id,
          name: b.name,
          ...(b.sub !== undefined ? { sub: b.sub } : {}),
          ...(b.icon !== undefined ? { icon: b.icon } : {}),
          color: colors.get(b.id) ?? "slate",
          x: x + colW / 2 - w / 2,
          y,
          w,
          h: LOOK.box.h,
          cx: x + colW / 2,
          cy: y + LOOK.box.h / 2,
          ...(row ? { row: row.id } : {}),
          ...(row?.empty?.includes(u) ? { empty: true } : {}),
        };
        placeSlot(box, room);
        return box;
      });
      boxes.push(...placed);
      const head = `${scale.unit} ${(scale.from ?? 0) + u}${text.headJoin}${timeText(u * length.seconds, headUnit, lang)}`;
      columns.push({ unit: u, head, boxes: placed, x, y: top, w: colW, h: 0 });
    }
    const last = Math.max(top + T.boxTop, ...boxes.map((b) => b.y + b.h));
    const bottom = last + T.zoomBottom;
    for (const c of columns) c.h = bottom - top;
    regions.push({
      id: "zoom",
      lines: [text.zoom],
      note: `${n} ${scale.unit}`,
      icon: "clock",
      color: "blue",
      x: margin,
      y: top,
      w: width - margin * 2,
      h: bottom - top,
      header: { x: margin + R.inset, y: top + R.inset, w: Math.max(R.icon, textWidth(text.zoom, TYPE.regionName)), h: R.nameY - R.inset + R.line },
    });
    zoom = { from, to, frame: { x: 0, y: 0, w: 0, h: 0 }, guides: [], columns, empty: text.empty, headY: top + T.head };
    axisTop = bottom + T.zoomGap;
  }

  // 時間軸の帯の印の列と印
  const rowsTop = axisTop + T.rowsTop;
  const rows: TimeRowPlaced[] = spec.rows.map((r, k) => ({
    id: r.id,
    name: r.name,
    // 色を書かない列は、同じ名札の箱の色にそろえる。印と拡大の帯の箱が同じ物だと見て分かるため
    color: r.color ?? colors.get(r.id) ?? (COLOR_ORDER[k % COLOR_ORDER.length] as ColorKey),
    x: axisX,
    y: rowsTop + k * (T.row + T.rowGap),
    w: axisW,
    h: T.row,
  }));
  const rowsBottom = rows.length > 0 ? Math.max(...rows.map((r) => r.y + r.h)) : rowsTop;
  const markW = Math.min(T.markMax, Math.max(T.markMin, unit * T.markRatio));
  const marks: TimeMark[] = rows.flatMap((row, k) =>
    Array.from({ length: count }, (_, u): TimeMark => ({
      row: row.id,
      unit: u,
      empty: spec.rows[k]?.empty?.includes(u) === true,
      color: row.color,
      colors: [],
      x: axisX + (u + 0.5) * unit - markW / 2,
      y: row.y,
      w: markW,
      h: row.h,
    })),
  );
  diagram.steps.forEach((step, s) =>
    step.events.forEach((event, e) => {
      if (event.type !== "mark") return;
      for (const m of marks) if (m.row === event.row && m.unit >= event.from && m.unit <= event.to && !m.empty) m.colors.push({ step: s, event: e, color: event.color });
    }),
  );

  // 拡大した範囲の枠と、枠から上の帯への点線
  if (zoom) {
    const frame = { x: axisX + zoom.from * unit - T.frame, y: rowsTop - T.frame, w: (zoom.to - zoom.from + 1) * unit + T.frame * 2, h: rowsBottom - rowsTop + T.frame * 2 };
    const band = Math.max(...zoom.columns.map((c) => c.y + c.h));
    zoom.frame = frame;
    zoom.guides = [
      [
        [frame.x, frame.y],
        [axisX, band],
      ],
      [
        [frame.x + frame.w, frame.y],
        [axisX + axisW, band],
      ],
    ];
  }

  // 節目
  const pointCy = rowsBottom + T.point.drop;
  const points: TimePointPlaced[] = (spec.points ?? []).map((p) => {
    const changes: TimePointPlaced["changes"] = [];
    diagram.steps.forEach((step, s) =>
      step.events.forEach((event, e) => {
        if (event.type === "swap" && event.box === p.id) changes.push({ step: s, event: e, text: event.text, ...(event.color ? { color: event.color } : {}) });
      }),
    );
    const cx = axisX + (p.at + 0.5) * unit;
    const tx = cx + T.point.text;
    const w = Math.max(textWidth(p.id, TYPE.pointName), ...changes.map((c) => textWidth(c.text, TYPE.pointState)));
    const top = pointCy + T.point.nameY - TYPE.pointName.size * 0.8;
    const bottom = pointCy + T.point.stateY + TYPE.pointState.size * 0.2;
    return { id: p.id, unit: p.at, cx, cy: pointCy, r: T.point.r, text: { x: tx, y: top, w, h: bottom - top }, changes };
  });
  const pointOf = new Map(points.map((p) => [p.id, p]));

  // 拡大の帯の線と節目どうしの線
  const colorAt = (id: string, step: number): ColorKey | undefined => {
    const point = pointOf.get(id);
    return point?.changes.filter((c) => c.step <= step && c.color).at(-1)?.color;
  };
  diagram.steps.forEach((step, s) =>
    step.events.forEach((event, e) => {
      if (event.type !== "edge") return;
      if (event.at === undefined) {
        const a = pointOf.get(event.from);
        const b = pointOf.get(event.to);
        if (!a || !b || a === b) return;
        const right = b.cx > a.cx;
        const x0 = right ? Math.max(a.cx + a.r, a.text.x + a.text.w + T.point.link) : a.cx - a.r - T.point.end;
        const x1 = right ? b.cx - b.r - T.point.end : Math.min(b.cx - b.r, b.text.x + b.text.w + T.point.link);
        const edge: SceneEdge = { step: s, event: e, from: event.from, to: event.to, points: [[x0, a.cy], [x1, b.cy]], color: event.carry.kind === "coin" ? "coin" : (colorAt(event.to, s) ?? "slate"), carry: event.carry };
        if (event.carry.kind !== "none") edge.settle = [x1 - (right ? 1 : -1) * (LOOK.carrier.coinR + LOOK.edge.arrow), b.cy];
        edges.push(edge);
        return;
      }
      const wired = wire(event, zoom);
      if (!wired) return;
      const edge: SceneEdge = { step: s, event: e, from: event.from, to: event.to, points: wired.points, color: edgeColor(event, colors), carry: event.carry };
      seat(edge, wired.from, wired.to, rooms);
      edges.push(edge);
      wires.push({ step: s, event: e, from: wired.from, to: wired.to, column: event.at, into: event.into ?? event.at });
    }),
  );

  const layout: TimeLayout = {
    kind: "time",
    width,
    height: 0,
    regions,
    boxes,
    lifelines: [],
    edges,
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    axis: { x: axisX, w: axisW, unit, count, line: 0 },
    rows,
    marks,
    ticks: [],
    minor: [],
    periods: [],
    points,
    ...(zoom ? { zoom } : {}),
    spans: [],
    wires,
    needle: { y1: rowsTop - T.needle.over, y2: rowsBottom + T.needle.over },
  };

  // 段の番号を置いてから、線の名前を番号と節目を避けて置く
  const marksBottom = rowsBottom;
  const named = diagram.steps.some((step) => step.events.some((e) => e.type === "edge" && e.at === undefined && e.label !== undefined));
  // 節目の無い図は、印の下に針を進める段の番号を置く間を空ける
  const { r: badgeR, inset } = LOOK.badge;
  let y = points.length > 0 ? pointCy + T.point.r + (named ? T.point.room : T.point.plain) : marksBottom + (badgeR + inset) * 2;

  // 範囲の括弧と囲み。括弧は消えていない括弧と重ならない段に置く
  const spans: TimeSpanPlaced[] = [];
  const events = diagram.steps.flatMap((step, s) => step.events.flatMap((event, e) => (event.type === "span" ? [{ s, e, event }] : [])));
  for (const { s, e, event } of events) {
    const kind = event.shape === "box" ? "box" : "bracket";
    const later = events.find((o) => o.s > s && (o.event.shape === "box" ? "box" : "bracket") === kind && o.event.from <= event.to && event.from <= o.event.to);
    const color: ColorKey = event.color ?? "slate";
    const x0 = axisX + event.from * unit;
    const x1 = axisX + (event.to + 1) * unit;
    const base = { step: s, event: e, kind, from: event.from, to: event.to, text: event.text, color, ...(later ? { until: later.s } : {}) } as const;
    if (kind === "box") {
      const B = T.box;
      const rect = { x: x0 - B.pad, y: rowsTop - B.pad, w: x1 - x0 + B.pad * 2, h: rowsBottom - rowsTop + B.pad * 2 };
      const w = textWidth(event.text, TYPE.tag) + B.tagPadX * 2;
      const textRect = { x: rect.x + B.tagX, y: rect.y - B.tagH / 2, w, h: B.tagH };
      spans.push({ ...base, ...rect, textRect, textY: rect.y + LOOK.baseline.tag });
    } else spans.push({ ...base, x: x0, y: 0, w: x1 - x0, h: T.bracket.tick, textRect: { x: 0, y: 0, w: 0, h: 0 }, textY: 0 });
  }
  layout.spans = spans;
  layout.badges = badgesOf(diagram, layout, needleSteps(diagram));
  layout.labels = labelsOf(diagram, layout);
  y = Math.max(y, ...layout.labels.map((l) => l.y + l.h + LOOK.label.soft));

  // 括弧を段に積む。同じ時刻に見える括弧と、字まで含めて重なる括弧は下の段へ送る
  const lanes: TimeSpanPlaced[][] = [];
  for (const span of spans.filter((x) => x.kind === "bracket")) {
    const w = textWidth(span.text, TYPE.spanText);
    const cx = Math.min(axisX + axisW - w / 2, Math.max(axisX + w / 2, span.x + span.w / 2));
    const reach = { x: Math.min(span.x, cx - w / 2), w: Math.max(span.x + span.w, cx + w / 2) - Math.min(span.x, cx - w / 2) };
    const clash = (other: TimeSpanPlaced): boolean => {
      const seen = other.until === undefined || other.until > span.step;
      const ox = Math.min(other.x, other.textRect.x);
      const ow = Math.max(other.x + other.w, other.textRect.x + other.textRect.w) - ox;
      return seen && reach.x < ox + ow && ox < reach.x + reach.w;
    };
    let lane = lanes.findIndex((list) => !list.some(clash));
    if (lane < 0) {
      lanes.push([]);
      lane = lanes.length - 1;
    }
    (lanes[lane] as TimeSpanPlaced[]).push(span);
    span.y = y + T.bracket.gap + lane * T.bracket.lane;
    span.textY = span.y + T.bracket.tick + T.bracket.text;
    span.textRect = textBox(span.text, cx, span.textY, TYPE.spanText, "middle");
  }
  if (lanes.length > 0) y = Math.max(...spans.filter((x) => x.kind === "bracket").map((x) => x.textRect.y + x.textRect.h));

  // 時刻の目盛りの線と字と区切り
  const axisLine = y + T.axisGap;
  layout.axis.line = axisLine;
  const majors = majorTicks(count, spec.period?.length, unit);
  const tickY = axisLine + T.tickY;
  const tickUnit = unitFor(count * length.seconds, length.unit);
  layout.ticks = majors.at.map((at) => {
    const label = timeText(at * length.seconds, tickUnit, lang);
    const w = textWidth(label, TYPE.timeTick);
    const x = axisX + at * unit;
    const left = at === 0 ? x : at === count ? x - w : Math.min(axisX + axisW - w, Math.max(axisX, x - w / 2));
    return { at, x, text: label, left, y: tickY };
  });
  layout.minor = minorTicks(count, majors.step, unit, majors.at);
  let bottom = tickY + TYPE.timeTick.size * 0.2;
  if (spec.period) {
    const P = spec.period;
    const list: TimePeriodPlaced[] = [];
    for (let index = 0, from = 0; from < count; index++, from += P.length) {
      const to = Math.min(count, from + P.length) - 1;
      const name = `${P.name} ${(P.from ?? 0) + index}`;
      const first = (scale.from ?? 0) + from;
      const range = `${scale.unit} ${text.range(String(first), String((scale.from ?? 0) + to))}`;
      list.push({ index, from, to, name, range, x: axisX + from * unit, y: axisLine, w: (to - from + 1) * unit, h: 0, nameY: tickY, rangeY: tickY + T.rangeY });
    }
    // 区切りの名前が時刻の字に掛かる時は、時刻の字の下の行へ送る
    const tickRects = layout.ticks.map((t) => textBox(t.text, t.left, t.y, TYPE.timeTick));
    const clash = list.some((p) => {
      const r = textBox(p.name, p.x + p.w / 2, p.nameY, TYPE.timePeriod, "middle");
      return tickRects.some((t) => r.x < t.x + t.w + T.nameGap && t.x < r.x + r.w + T.nameGap);
    });
    for (const p of list) {
      if (clash) {
        p.nameY = tickY + T.rangeY + 2;
        p.rangeY = p.nameY + T.rangeY;
      }
      p.h = p.rangeY + TYPE.timeRange.size * 0.2 - axisLine;
    }
    layout.periods = list;
    bottom = Math.max(bottom, ...list.map((p) => p.rangeY + TYPE.timeRange.size * 0.2));
  }
  const axisBottom = bottom + T.bottom;
  regions.push({ id: "axis", lines: [], color: "slate", x: margin, y: axisTop, w: width - margin * 2, h: axisBottom - axisTop, header: { x: margin + R.inset, y: axisTop + R.inset, w: 0, h: 0 } });

  const strip = layoutStrip(diagram, margin, axisBottom + gap, width - margin * 2);
  if (strip) layout.strip = strip;
  layout.height = (strip ? strip.y + strip.h : axisBottom) + margin;
  // 中身の帯だけを書き換える段の番号は帯の左上に置くので、帯を置いた後に決め直す
  layout.badges = badgesOf(diagram, layout, needleSteps(diagram));
  return layout;
}

/**
 * 拡大の帯の線。`at` の列の箱から、`into` の列 (無ければ同じ列) の箱へ引く。
 * 同じ列で隣り合う箱は縦に結び、間に箱を挟む時は列の右を回る。別の列の箱は、向き合う縁どうしを真っ直ぐ結ぶ
 */
function wire(event: EdgeEvent, zoom: TimeZoom | undefined): { points: Point[]; from: TimeBox; to: TimeBox } | undefined {
  if (!zoom || event.at === undefined) return undefined;
  const into = event.into ?? event.at;
  const fromColumn = zoom.columns.find((c) => c.unit === event.at);
  const toColumn = zoom.columns.find((c) => c.unit === into);
  const from = fromColumn?.boxes.find((b) => b.id === event.from);
  const to = toColumn?.boxes.find((b) => b.id === event.to);
  if (!fromColumn || !toColumn || !from || !to || from === to) return undefined;
  const jf = fromColumn.boxes.indexOf(from);
  const jt = toColumn.boxes.indexOf(to);
  const down = jt > jf;
  if (fromColumn === toColumn) {
    if (Math.abs(jt - jf) === 1) return { from, to, points: [[from.cx, down ? from.y + from.h + 1 : from.y - 1], [to.cx, down ? to.y - 1 : to.y + to.h + 1]] };
    const lane = Math.min(fromColumn.x + fromColumn.w - LOOK.gap, Math.max(from.x + from.w, to.x + to.w) + LOOK.gap);
    return {
      from,
      to,
      points: [
        [from.x + from.w + 1, from.cy],
        [lane, from.cy],
        [lane, to.cy],
        [to.x + to.w + 1, to.cy],
      ],
    };
  }
  const right = toColumn.x > fromColumn.x;
  if (jf === jt) return { from, to, points: [[right ? from.x + from.w + 1 : from.x - 1, from.cy], [right ? to.x - 1 : to.x + to.w + 1, to.cy]] };
  const fx = from.cx + ((right ? 1 : -1) * from.w) / 4;
  const tx = to.cx - ((right ? 1 : -1) * to.w) / 4;
  return { from, to, points: [[fx, down ? from.y + from.h + 1 : from.y - 1], [tx, down ? to.y - 1 : to.y + to.h + 1]] };
}

/** 拡大の帯の線の運ぶ物を、出る列の箱の置き場で待たせ、受ける列の箱の置き場に留める。同じ名札の箱が列ごとに在るので、箱を 1 つずつ渡す */
function seat(edge: SceneEdge, from: TimeBox, to: TimeBox, rooms: ReturnType<typeof slotRooms>): void {
  const arrive = { ...edge };
  seatCarriers([arrive], new Map([[edge.to, to]]), rooms);
  const leave = { ...edge };
  seatCarriers([leave], new Map([[edge.from, from]]), rooms);
  if (arrive.settle) edge.settle = arrive.settle;
  if (leave.wait) edge.wait = leave.wait;
}

/**
 * 段の番号。線を引く段は段で最初に引く線の上に置き、運ぶ物が線の始まりで待つ時は運ぶ物を避けて進める。
 * 線の無い段は、針を進める段なら針が進む範囲の真ん中の印と節目の間に、範囲の括弧なら括弧の左に、範囲の囲みなら囲みの左上の角に、
 * 節目の状態を変える段なら節目の丸の左に、印の色を変える段なら印の列の上に、中身の帯だけを書き換える段なら帯の左上に置く。
 * 何も起きない段は前の段の番号と同じ所に置いて数字を入れ替える
 */
function badgesOf(diagram: Diagram, layout: TimeLayout, needle: [number, number][]): SceneBadge[] {
  const { r, inset } = LOOK.badge;
  const { axis } = layout;
  const taken: Point[] = [];
  const out: SceneBadge[] = [];
  const top = Math.min(...layout.rows.map((row) => row.y), layout.needle.y1 + LOOK.time.needle.over);
  const bottom = Math.max(...layout.rows.map((row) => row.y + row.h), top);
  // 節目があれば印と節目の丸の間に、無ければ印の下に空けた間に置く
  const between = layout.points[0] ? (bottom + layout.points[0].cy - layout.points[0].r) / 2 : bottom + r + inset;
  diagram.steps.forEach((step, s) => {
    const push = (p: Point, color: ColorKey): void => {
      taken.push(p);
      out.push({ step: s, x: p[0], y: p[1], color });
    };
    const edge = layout.edges.filter((e) => e.step === s).sort((a, b) => a.event - b.event)[0];
    if (edge) {
      // 線の始まりで待つ運ぶ物 (置き場を持たない節目から出る物) を、番号で隠さない
      const waits: Point[] = edge.carry.kind !== "none" && !edge.wait ? [edge.points[0] as Point] : [];
      const others = layout.edges.filter((e) => e !== edge).map((e) => e.points);
      push(badgeOnPath(edge.points, [...taken, ...waits], others), edge.color);
      return;
    }
    const [from, to] = needle[s] ?? [0, 0];
    if (to > from) {
      let x = axis.x + ((from + to) / 2) * axis.unit;
      // 節目から印へ下ろす点線の上に置かない
      const near = layout.points.find((p) => Math.abs(p.cx - x) < r + inset);
      if (near) x = near.cx + r + inset * 2;
      push([x, between], "slate");
      return;
    }
    for (const event of step.events) {
      const spot = spotOf(event, s, layout);
      if (spot) {
        push(spot.at, spot.color);
        return;
      }
    }
    if (layout.strip && step.events.some((e) => e.type === "strip")) {
      out.push({ step: s, x: layout.strip.x + inset, y: layout.strip.y + inset, color: "slate" });
      return;
    }
    const before = out[out.length - 1];
    out.push(before ? { ...before, step: s } : { step: s, x: axis.x - r - inset, y: top, color: "slate" });
  });
  return replaceSameSpot(out);
}

/** 線と針の無い段の出来事 1 つで、番号を置く所。置けない出来事は `undefined` */
function spotOf(event: DiagramEvent, step: number, layout: TimeLayout): { at: Point; color: ColorKey } | undefined {
  const { r, inset } = LOOK.badge;
  if (event.type === "span") {
    const span = layout.spans.find((x) => x.step === step && x.from === event.from && x.to === event.to && x.text === event.text);
    if (!span) return undefined;
    if (span.kind === "box") return { at: [span.x, span.y], color: span.color };
    return { at: [span.x - r - inset, span.y + span.h / 2], color: span.color };
  }
  if (event.type === "swap") {
    const point = layout.points.find((p) => p.id === event.box);
    if (point) return { at: [point.cx - point.r - inset - r, point.cy], color: event.color ?? "slate" };
  }
  if (event.type === "mark") {
    const row = layout.rows.find((x) => x.id === event.row);
    const top = Math.min(...layout.rows.map((x) => x.y));
    if (row) return { at: [layout.axis.x + ((event.from + event.to + 1) / 2) * layout.axis.unit, top - r - inset], color: event.color };
  }
  return undefined;
}

/**
 * 線の名前。節目どうしの線は線の下に、拡大の帯の線は線の右に置き、節目の丸と拡大の帯の箱を離し、
 * 節目の字と列の上の字と同じ段の線の名前と、同じ時刻に見えている段の番号を避ける
 */
function labelsOf(diagram: Diagram, layout: TimeLayout): SceneLabel[] {
  const labels: SceneLabel[] = [];
  const circles: Rect[] = layout.points.map((p) => ({ x: p.cx - p.r, y: p.cy - p.r, w: p.r * 2, h: p.r * 2 }));
  const texts: Rect[] = layout.points.map((p) => p.text);
  const heads: Rect[] = (layout.zoom?.columns ?? []).map((c) => textBox(c.head, c.x + c.w / 2, layout.zoom?.headY ?? 0, TYPE.timeHead, "middle"));
  for (const edge of layout.edges) {
    const source = diagram.steps[edge.step]?.events[edge.event];
    if (source?.type !== "edge" || source.label === undefined) continue;
    const seen = layout.badges.filter((b) => b.step <= edge.step).map((b) => badgeRect([b.x, b.y]));
    const side = source.labelSide ?? (source.at === undefined ? "below" : undefined);
    labels.push(
      placeLabel(
        { step: edge.step, event: edge.event, text: source.label, points: edge.points, color: edge.color, ...(side ? { side } : {}), flip: source.at !== undefined },
        { hard: [...circles, ...layout.boxes], soft: [...texts, ...heads, ...labels.filter((l) => l.step === edge.step)], touch: seen },
      ),
    );
  }
  return labels;
}
