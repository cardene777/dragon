/**
 * 形の輪郭 (#3484)。SVG の path の字を折れ線の輪にし、点が形の内にあるかと、形の縁までの距離を測る。
 *
 * 崩れの確かめ (`breaks.ts`) が、足した箱のブロックの見えている形 (アーチや六角形) と、硬貨の枠や字や番号の丸を比べるために使う。
 * 曲線と弧は短い線に分けて近似する。形の内外は SVG の塗りの既定 (nonzero) と同じ決まりで決める。
 */
import type { Point } from "../layout/scene";

/** path の数。符号と小数と指数を持つ */
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/u;
/** 曲線 1 本を分ける数 */
const CURVE_STEPS = 16;

/** 弧を短い線に分けた点。始まりの点は含めない (SVG の仕様の、端点から中心を求める式) */
function arcPoints(x1: number, y1: number, rx0: number, ry0: number, rotation: number, large: boolean, sweep: boolean, x2: number, y2: number): Point[] {
  if (rx0 === 0 || ry0 === 0 || (x1 === x2 && y1 === y2)) return [[x2, y2]];
  let rx = Math.abs(rx0);
  let ry = Math.abs(ry0);
  const phi = (rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const scale = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (scale > 1) {
    rx *= Math.sqrt(scale);
    ry *= Math.sqrt(scale);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number): number => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const start = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  else if (sweep && delta < 0) delta += 2 * Math.PI;
  const steps = Math.max(CURVE_STEPS / 2, Math.ceil(Math.abs(delta) / (Math.PI / CURVE_STEPS)));
  const out: Point[] = [];
  for (let k = 1; k <= steps; k++) {
    const t = start + (delta * k) / steps;
    out.push([cos * rx * Math.cos(t) - sin * ry * Math.sin(t) + cx, sin * rx * Math.cos(t) + cos * ry * Math.sin(t) + cy]);
  }
  return out;
}

/** 2 次か 3 次の曲線を短い線に分けた点。始まりの点は含めない */
function curvePoints(p0: Point, controls: Point[], end: Point): Point[] {
  const out: Point[] = [];
  for (let k = 1; k <= CURVE_STEPS; k++) {
    const t = k / CURVE_STEPS;
    const u = 1 - t;
    const at = (axis: 0 | 1): number => {
      const [c1, c2] = controls;
      if (c2 === undefined) return u * u * p0[axis] + 2 * u * t * (c1 as Point)[axis] + t * t * end[axis];
      return u * u * u * p0[axis] + 3 * u * u * t * (c1 as Point)[axis] + 3 * u * t * t * c2[axis] + t * t * t * end[axis];
    };
    out.push([at(0), at(1)]);
  }
  return out;
}

/**
 * SVG の path の字を、閉じた折れ線の輪の並びにする。`M` ごとに新しい輪を始め、閉じていない輪も塗りと同じく閉じたものとみなす。
 * 読めない字に当たったら、そこまでの輪を返す (描く前に `isUserPath` で path の文法の字だけと確かめている)
 */
export function flattenPath(d: string): Point[][] {
  const rings: Point[][] = [];
  let ring: Point[] = [];
  let i = 0;
  let command = "";
  let at: Point = [0, 0];
  let start: Point = [0, 0];
  /** 前の曲線の後ろの制御点と、その曲線が 3 次か。`S` と `T` が映して使う */
  let control: { at: Point; cubic: boolean } | undefined;
  const skip = (): void => {
    while (i < d.length && /[\s,]/u.test(d[i] as string)) i++;
  };
  const read = (): number | undefined => {
    skip();
    const found = NUMBER.exec(d.slice(i));
    if (!found) return undefined;
    i += found[0].length;
    return Number(found[0]);
  };
  /** 弧の 2 つの印は区切り無しで続けて書ける (`a4 4 0 10 8 0`) ので、1 字ずつ読む */
  const flag = (): boolean | undefined => {
    skip();
    const ch = d[i];
    if (ch !== "0" && ch !== "1") return undefined;
    i++;
    return ch === "1";
  };
  const many = (count: number): number[] | undefined => {
    const out: number[] = [];
    for (let k = 0; k < count; k++) {
      const value = read();
      if (value === undefined) return undefined;
      out.push(value);
    }
    return out;
  };
  const push = (points: Point[]): void => {
    if (ring.length === 0) ring.push(at);
    ring.push(...points);
    at = points[points.length - 1] ?? at;
  };
  for (;;) {
    skip();
    if (i >= d.length) break;
    const ch = d[i] as string;
    if (/[A-Za-z]/u.test(ch)) {
      command = ch;
      i++;
    } else if (command === "M") command = "L";
    else if (command === "m") command = "l";
    else if (command === "" || command === "Z" || command === "z") break;
    const relative = command === command.toLowerCase();
    const base = (p: Point): Point => (relative ? [at[0] + p[0], at[1] + p[1]] : p);
    const upper = command.toUpperCase();
    let next: Point | undefined;
    if (upper === "Z") {
      if (ring.length > 1) rings.push(ring);
      ring = [];
      at = start;
      control = undefined;
      continue;
    }
    if (upper === "M") {
      const v = many(2);
      if (!v) break;
      if (ring.length > 1) rings.push(ring);
      at = base([v[0] as number, v[1] as number]);
      start = at;
      ring = [at];
      control = undefined;
      continue;
    }
    if (upper === "L" || upper === "H" || upper === "V") {
      const v = many(upper === "L" ? 2 : 1);
      if (!v) break;
      const [a, b] = v as [number, number];
      next = upper === "L" ? base([a, b]) : upper === "H" ? [relative ? at[0] + a : a, at[1]] : [at[0], relative ? at[1] + a : a];
      push([next]);
      control = undefined;
      continue;
    }
    if (upper === "C" || upper === "S" || upper === "Q" || upper === "T") {
      const v = many({ C: 6, S: 4, Q: 4, T: 2 }[upper]);
      if (!v) break;
      const points: Point[] = [];
      for (let k = 0; k < v.length; k += 2) points.push(base([v[k] as number, v[k + 1] as number]));
      const cubic = upper === "C" || upper === "S";
      // `S` は前の 3 次の曲線の、`T` は前の 2 次の曲線の制御点を映す。前が同じ次数の曲線でなければ今の点を使う
      const mirror: Point = control && control.cubic === cubic ? [2 * at[0] - control.at[0], 2 * at[1] - control.at[1]] : at;
      const controls = upper === "C" ? points.slice(0, 2) : upper === "S" ? [mirror, points[0] as Point] : upper === "Q" ? [points[0] as Point] : [mirror];
      push(curvePoints(at, controls, points[points.length - 1] as Point));
      control = { at: controls[controls.length - 1] as Point, cubic };
      continue;
    }
    if (upper === "A") {
      const radii = many(3);
      const large = flag();
      const sweep = flag();
      const end = many(2);
      if (!radii || large === undefined || sweep === undefined || !end) break;
      const [rx, ry, rotation] = radii as [number, number, number];
      next = base([end[0] as number, end[1] as number]);
      push(arcPoints(at[0], at[1], rx, ry, rotation, large, sweep, next[0], next[1]));
      control = undefined;
      continue;
    }
    break;
  }
  if (ring.length > 1) rings.push(ring);
  return rings;
}

/** 輪の辺を、閉じる辺も含めて 1 本ずつ */
function* edgesOf(rings: Point[][]): Generator<[Point, Point]> {
  for (const ring of rings)
    for (let k = 0; k < ring.length; k++) yield [ring[k] as Point, ring[(k + 1) % ring.length] as Point];
}

/** 点 `p` が形の内にあるか。SVG の塗りの既定 (nonzero) と同じく、輪が点を回る数で決める */
export function insideRings(rings: Point[][], [px, py]: Point): boolean {
  let winding = 0;
  for (const [a, b] of edgesOf(rings)) {
    const cross = (b[0] - a[0]) * (py - a[1]) - (px - a[0]) * (b[1] - a[1]);
    if (a[1] <= py) {
      if (b[1] > py && cross > 0) winding++;
    } else if (b[1] <= py && cross < 0) winding--;
  }
  return winding !== 0;
}

/** 点 `p` から形の縁までの距離。形の内の点は負の値にする */
export function signedDistance(rings: Point[][], p: Point): number {
  let best = Number.POSITIVE_INFINITY;
  for (const [a, b] of edgesOf(rings)) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len));
    best = Math.min(best, Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)));
  }
  return insideRings(rings, p) ? -best : best;
}
