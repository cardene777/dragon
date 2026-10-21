/**
 * 置き場所を決めた結果 (場面) の形と、図の種類に依らず使う置き方。
 *
 * 座標は字が原寸の時の px で、左上を (0, 0) にする。線の名前は線の脇から箱を避けて置き、
 * 中身の帯は図の下に横いっぱいに置く。
 */
import type { Family } from "../look/fonts";
import { COLOR_ORDER, type ColorKey, LOOK, TYPE } from "../look/values";
import type { Carry, Diagram, DiagramEvent, LabelSide } from "../schema";
import { hasWide, textWidth } from "./measure";

export type Point = [number, number];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneBox extends Rect {
  id: string;
  name: string;
  sub?: string;
  icon?: string;
  color: ColorKey;
  cx: number;
  cy: number;
}

export interface SceneRegion extends Rect {
  id: string;
  /** 名前を折り返した行 */
  lines: string[];
  note?: string;
  icon?: string;
  color: ColorKey;
  /** 名前と印が占める所 */
  header: Rect;
}

/** 線。`step` と `event` は原本の `steps[step].events[event]` を指す。 */
export interface SceneEdge {
  step: number;
  event: number;
  from: string;
  to: string;
  points: Point[];
  color: ColorKey;
  carry: Carry;
  /** 着いた運ぶ物が留まる点。無ければ線の終わり */
  settle?: Point;
}

export interface SceneLabel extends Rect {
  step: number;
  event: number;
  text: string;
  family: Family;
  color: ColorKey;
}

/** 時系列図の箱の中の処理。生存線の上に札で出す。 */
export interface SceneAction extends Rect {
  step: number;
  event: number;
  box: string;
  text: string;
  color: ColorKey;
}

export interface SceneBadge {
  step: number;
  x: number;
  y: number;
  color: ColorKey;
}

export interface SceneLifeline {
  id: string;
  x: number;
  y1: number;
  y2: number;
}

export interface SceneField {
  name: string;
  x: number;
  y: number;
  w: number;
}

export interface SceneStrip extends Rect {
  title: string;
  fields: SceneField[];
}

export interface Layout {
  kind: Diagram["kind"];
  width: number;
  height: number;
  regions: SceneRegion[];
  boxes: SceneBox[];
  lifelines: SceneLifeline[];
  edges: SceneEdge[];
  labels: SceneLabel[];
  actions: SceneAction[];
  badges: SceneBadge[];
  strip?: SceneStrip;
}

export type EdgeEvent = Extract<DiagramEvent, { type: "edge" }>;

/** 段と線の位置を添えた線の並び。段の順、段の中は起きる順。 */
export function edgesOf(diagram: Diagram): { step: number; event: number; edge: EdgeEvent }[] {
  return diagram.steps.flatMap((step, s) =>
    step.events.flatMap((event, e) => (event.type === "edge" ? [{ step: s, event: e, edge: event }] : [])),
  );
}

/** 箱の色。書いていなければ区画の色、区画も無ければ並んだ順に分類の色を配る。 */
export function boxColors(diagram: Diagram): Map<string, ColorKey> {
  const regions = regionColors(diagram);
  const colors = new Map<string, ColorKey>();
  diagram.boxes.forEach((box, i) => {
    const fromRegion = box.region === undefined ? undefined : regions.get(box.region);
    colors.set(box.id, box.color ?? fromRegion ?? (COLOR_ORDER[i % COLOR_ORDER.length] as ColorKey));
  });
  return colors;
}

export function regionColors(diagram: Diagram): Map<string, ColorKey> {
  const colors = new Map<string, ColorKey>();
  (diagram.regions ?? []).forEach((region, i) => colors.set(region.id, region.color ?? (COLOR_ORDER[i % COLOR_ORDER.length] as ColorKey)));
  return colors;
}

/** 線の色。硬貨を運ぶ線は硬貨の色、それ以外は送る側の箱の色。 */
export const edgeColor = (edge: EdgeEvent, colors: Map<string, ColorKey>): ColorKey =>
  edge.carry.kind === "coin" ? "coin" : (colors.get(edge.from) ?? "slate");

/** 箱の幅。名前、下の小さな字、書き換わる字、中で出す処理のどれもが収まる幅。 */
export function boxWidth(diagram: Diagram, id: string, withActions: boolean): number {
  const box = diagram.boxes.find((b) => b.id === id);
  if (!box) return LOOK.box.minW;
  const lines = [textWidth(box.name, TYPE.boxName), textWidth(box.sub ?? "", TYPE.boxSub)];
  for (const step of diagram.steps) {
    for (const event of step.events) {
      if (event.type === "swap" && event.box === id) lines.push(textWidth(event.text, TYPE.boxSubStrong));
      if (withActions && event.type === "action" && event.box === id) lines.push(textWidth(event.label, TYPE.boxSubStrong));
    }
  }
  return Math.max(LOOK.box.minW, Math.max(...lines) + LOOK.box.padX * 2);
}

/** 2 つの四角の隙間。重なる時は負。縦か横のどちらかで離れていれば、その離れ方の大きい方。 */
export function gapBetween(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  return Math.max(dx, dy);
}

/** 折れ線のうち一番長い区間。 */
export function longest(points: Point[]): { a: Point; b: Point; vertical: boolean } {
  let best = { a: points[0] as Point, b: (points[1] ?? points[0]) as Point, length: -1 };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length > best.length) best = { a, b, length };
  }
  return { a: best.a, b: best.b, vertical: Math.abs(best.b[0] - best.a[0]) < Math.abs(best.b[1] - best.a[1]) };
}

/** 折れ線の長さと、始まりから `distance` 進んだ点。 */
export function along(points: Point[], distance: number): Point {
  let left = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= length && length > 0) return [a[0] + ((b[0] - a[0]) * left) / length, a[1] + ((b[1] - a[1]) * left) / length];
    left -= length;
  }
  return points[points.length - 1] as Point;
}

export function pathLength(points: Point[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return sum;
}

/** 段の番号を置く点。線の始まりから少し進んだ所。短い線は始まりに置くと箱と重なるので中ほど。 */
export function badgeOnPath(points: Point[]): Point {
  const length = pathLength(points);
  return along(points, length < LOOK.badge.short ? length / 2 : LOOK.badge.along);
}

export interface LabelRequest {
  step: number;
  event: number;
  text: string;
  points: Point[];
  side?: LabelSide;
  color: ColorKey;
}

export interface Obstacles {
  /** 10px 以上離す物 (箱) */
  hard: Rect[];
  /** 重ならなければよい物 (区画の名前、同じ段の線の名前) */
  soft: Rect[];
}

export const labelStyle = (text: string) => (hasWide(text) ? TYPE.labelJa : TYPE.label);

/**
 * 線の名前を置く。線の一番長い区間の中ほどから、寄せの指示の側 (無ければ横の線は上、縦の線は右) へ
 * 離して置く。箱や区画の名前に掛かる時は、指示の側へさらに離し、線に沿ってもずらして空きを探す。
 */
export function placeLabel(request: LabelRequest, obstacles: Obstacles): SceneLabel {
  const w = textWidth(request.text, labelStyle(request.text)) + LOOK.label.padX * 2;
  const h = LOOK.label.h;
  const segment = longest(request.points);
  const mx = (segment.a[0] + segment.b[0]) / 2;
  const my = (segment.a[1] + segment.b[1]) / 2;
  const side = request.side ?? (segment.vertical ? "right" : "above");
  const { offset, side: sideGap } = LOOK.label;
  const base: Rect =
    side === "above"
      ? { x: mx - w / 2, y: my - offset - h / 2, w, h }
      : side === "below"
        ? { x: mx - w / 2, y: my + offset - h / 2, w, h }
        : side === "left"
          ? { x: mx - sideGap - w, y: my - h / 2, w, h }
          : { x: mx + sideGap, y: my - h / 2, w, h };
  // 離す向き (指示の側) と、ずらす向き (それに直交する向き)
  const away: Point = side === "above" ? [0, -1] : side === "below" ? [0, 1] : side === "left" ? [-1, 0] : [1, 0];
  const slideAxis: Point = [Math.abs(away[1]), Math.abs(away[0])];
  const slideMax = side === "above" || side === "below" ? w : h * 4;
  const clear = (rect: Rect): boolean =>
    obstacles.hard.every((box) => gapBetween(rect, box) >= LOOK.gap) && obstacles.soft.every((other) => gapBetween(rect, other) >= LOOK.label.soft);
  const { search, searchMax } = LOOK.label;
  for (let d = 0; d <= searchMax; d += search) {
    for (let s = 0; s <= slideMax; s += search) {
      for (const sign of s === 0 ? [1] : [1, -1]) {
        const rect = { x: base.x + away[0] * d + slideAxis[0] * s * sign, y: base.y + away[1] * d + slideAxis[1] * s * sign, w, h };
        if (clear(rect)) return { ...rect, step: request.step, event: request.event, text: request.text, family: labelStyle(request.text).family, color: request.color };
      }
    }
  }
  return { ...base, step: request.step, event: request.event, text: request.text, family: labelStyle(request.text).family, color: request.color };
}

/** 中身の帯の欄の幅。欄の名前と、入る値と札を並べた最も長い形が収まる幅。 */
function fieldWidth(diagram: Diagram, name: string): number {
  let value = 0;
  let tag = 0;
  for (const step of diagram.steps) {
    for (const event of step.events) {
      if (event.type !== "strip" || event.field !== name) continue;
      if (event.value !== undefined) value = Math.max(value, textWidth(event.value, hasWide(event.value) ? TYPE.fieldValueJa : TYPE.fieldValue));
      if (event.tag !== undefined) tag = Math.max(tag, textWidth(event.tag, TYPE.tag) + LOOK.strip.tagPadX * 2);
    }
  }
  const both = value + (tag > 0 ? (value > 0 ? LOOK.strip.tagGap : 0) + tag : 0);
  return Math.max(textWidth(name, TYPE.fieldName), both);
}

/** 1 行に並べた時に帯が要る幅。 */
export function stripNeed(diagram: Diagram): number {
  if (!diagram.strip) return 0;
  const { titleX, fieldGap, pad } = LOOK.strip;
  const start = titleX + textWidth(diagram.strip.title, TYPE.stripTitle) + fieldGap;
  return start + diagram.strip.fields.reduce((sum, name) => sum + fieldWidth(diagram, name) + fieldGap, 0) - fieldGap + pad;
}

/** 中身の帯。欄は左から並べ、幅に収まらない欄は次の行へ送る。 */
export function layoutStrip(diagram: Diagram, x: number, y: number, width: number): SceneStrip | undefined {
  if (!diagram.strip) return undefined;
  const { titleX, fieldGap, pad, line, h } = LOOK.strip;
  const start = titleX + textWidth(diagram.strip.title, TYPE.stripTitle) + fieldGap;
  const fields: SceneField[] = [];
  let cx = start;
  let row = 0;
  for (const name of diagram.strip.fields) {
    const w = fieldWidth(diagram, name);
    if (cx > start && cx + w > width - pad) {
      cx = start;
      row++;
    }
    fields.push({ name, x: x + cx, y: y + row * line, w });
    cx += w + fieldGap;
  }
  return { x, y, w: width, h: h + row * line, title: diagram.strip.title, fields };
}

/** 場面の全ての物を (dx, dy) だけ動かす。区画と帯は動かさず、横いっぱいの形を保つ。 */
export function shiftContent(layout: Layout, dx: number, dy: number): void {
  const move = (rect: Rect): void => {
    rect.x += dx;
    rect.y += dy;
  };
  for (const box of layout.boxes) {
    move(box);
    box.cx += dx;
    box.cy += dy;
  }
  for (const region of layout.regions) {
    region.y += dy;
    move(region.header);
  }
  for (const line of layout.lifelines) {
    line.x += dx;
    line.y1 += dy;
    line.y2 += dy;
  }
  for (const edge of layout.edges) {
    edge.points = edge.points.map(([px, py]) => [px + dx, py + dy]);
    if (edge.settle) edge.settle = [edge.settle[0] + dx, edge.settle[1] + dy];
  }
  for (const label of layout.labels) move(label);
  for (const action of layout.actions) move(action);
  for (const badge of layout.badges) {
    badge.x += dx;
    badge.y += dy;
  }
  if (layout.strip) {
    layout.strip.y += dy;
    for (const field of layout.strip.fields) {
      field.x += dx;
      field.y += dy;
    }
  }
}

/** 線も処理も無い段の番号。書き換わる箱の左上か、中身の帯の左上か、最初の箱の左上。 */
export function cornerBadge(events: DiagramEvent[], step: number, layout: Layout): SceneBadge {
  const { inset } = LOOK.badge;
  for (const event of events) {
    const id = event.type === "swap" || event.type === "action" ? event.box : undefined;
    const box = layout.boxes.find((b) => b.id === id);
    if (box) return { step, x: box.x + inset, y: box.y + inset, color: box.color };
  }
  if (layout.strip && events.some((event) => event.type === "strip")) return { step, x: layout.strip.x + inset, y: layout.strip.y + inset, color: "slate" };
  const box = layout.boxes[0] as SceneBox;
  return { step, x: box.x + inset, y: box.y + inset, color: box.color };
}
