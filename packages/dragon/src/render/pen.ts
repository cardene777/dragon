/**
 * 手描きのペンの線 (#3643)。
 *
 * 描いた図の SVG の字のうち、形の要素 (`rect`、`circle`、`ellipse`、`line`、`polygon`、`polyline`、`path`) を、
 * ゆるく揺れる 1 本の `path` に描き替える。揺らさないのは、絵柄の線と、図の地の枠と寄って追う窓の枠と、定義の置き場 (`defs` など) の中の形。
 * 字 (`text`) には触れない。
 *
 * 揺れは線に沿った 2 つの波を足した量だけ、線の向きと直角にずらす。波の位相は形の値から作るので、同じ形は何度描いても同じ形に揺れ、
 * 重ねて描いた同じ形の層 (光る線と下の線) も同じ形に揺れる。
 * 開いた線の端と、まっすぐな線どうしの折れ目と、尖った角では揺れを 0 まで細め、元の点をそのまま通る。矢じりの先と線の端は動かない。
 * 閉じた形で角を持たない物 (円と角の丸い箱) は、波の長さを 1 周に収まる長さに揃え、閉じ目で揺れを繋ぐ。
 *
 * 形の名前を名指す CSS の規則 (`.dg-tg rect`) は、描き替えた `path` に当たらなくなる。
 * 描き替えた形には元の名前を `data-dg` に残し、規則の中の形の名前をその印を名指す形に書き替える (`penCss`)。
 * 書き替えた選び方は `:where()` で包むので、規則どうしの強さの順は元のまま変わらない。
 */
import { LOOK } from "../look/values";
import { GLYPH_LINES } from "./corner";

type Point = [number, number];

/** 揺らさない形の class。絵柄の線 (列の図の戻る印の絵を含む)、図の地の枠、寄って追う窓の枠、再生の部品が足す重なりの囲み */
const KEPT = [...GLYPH_LINES, "dg-lb-glyph", "dg-bg", "dg-vp-frame", "dg-spot"];
/** 形を描かず、切り抜きや模様や見た目の規則の定義だけを持つ置き場 */
const DEFINITIONS = new Set(["defs", "clipPath", "mask", "pattern", "symbol", "marker", "filter", "style"]);
const SHAPES = new Set(["rect", "circle", "ellipse", "line", "polygon", "polyline", "path"]);
/** 形の名前ごとの、形を決める属性 */
const GEOMETRY: Record<string, readonly string[]> = {
  rect: ["x", "y", "width", "height", "rx", "ry"],
  circle: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  line: ["x1", "y1", "x2", "y2"],
  polygon: ["points"],
  polyline: ["points"],
  path: ["d"],
};

/** 1 つの区切り (M から次の M まで) の線。`pins` は揺らさずに通る点 (端と折れ目と尖った角) の番号 */
interface Run {
  points: Point[];
  /** 点ごとに、元の命令の終わりの点か */
  ends: boolean[];
  /** 点ごとに、その点へ来る線がまっすぐか */
  straight: boolean[];
  closed: boolean;
}

/** 数を小数 `digits` 桁までの字にする */
const fmt = (v: number, digits: number): string => {
  const scale = digits === 2 ? 100 : 10;
  const n = Math.round(v * scale) / scale;
  return String(n === 0 ? 0 : n);
};
/** 元の位置に残す点 (線の端と折れ目と角) は、元の値を変えないよう小数 2 桁で書く */
const pt = (p: Point): string => `${fmt(p[0], 2)},${fmt(p[1], 2)}`;
/** 揺らした点と制御点は小数 1 桁で書く。図の座標の 0.1 は画面で見分けられず、SVG の字を小さく保つ */
const near = (x: number, y: number): string => `${fmt(x, 1)},${fmt(y, 1)}`;
const dist = (a: Point, b: Point): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** 形の値の字から作る 32 bit の種 */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 種から 0 以上 1 未満の数を順に返す */
function random(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 区切りの線を組む道具。曲線と弧は細かい折れ線にして足す */
class Outline {
  runs: Run[] = [];
  private run(): Run {
    const last = this.runs[this.runs.length - 1];
    if (last) return last;
    const made: Run = { points: [[0, 0]], ends: [true], straight: [true], closed: false };
    this.runs.push(made);
    return made;
  }
  get at(): Point {
    const run = this.run();
    return run.points[run.points.length - 1] as Point;
  }
  move(p: Point): void {
    this.runs.push({ points: [p], ends: [true], straight: [true], closed: false });
  }
  line(p: Point): void {
    const run = this.run();
    run.points.push(p);
    run.ends.push(true);
    run.straight.push(true);
  }
  /** 曲線の上の点を `at(t)` (t は 0 から 1) で受け、長さに応じた数に刻んで足す */
  curve(at: (t: number) => Point, rough: number): void {
    const run = this.run();
    const n = Math.max(4, Math.min(48, Math.ceil(rough / 4)));
    for (let i = 1; i <= n; i++) {
      run.points.push(at(i / n));
      run.ends.push(i === n);
      run.straight.push(false);
    }
  }
  close(): void {
    const run = this.run();
    const first = run.points[0] as Point;
    if (dist(this.at, first) > 1e-6) this.line(first);
    run.closed = true;
  }
}

/** 終わりの点 `to` までの弧 (SVG の `A`) を、中心と角度の形に直して刻む */
function arc(o: Outline, rx: number, ry: number, turn: number, large: boolean, sweep: boolean, to: Point): void {
  const from = o.at;
  if (dist(from, to) < 1e-9) return;
  if (rx === 0 || ry === 0) return o.line(to);
  let a = Math.abs(rx);
  let b = Math.abs(ry);
  const phi = (turn * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (from[0] - to[0]) / 2;
  const dy = (from[1] - to[1]) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const grow = (x1 * x1) / (a * a) + (y1 * y1) / (b * b);
  if (grow > 1) {
    a *= Math.sqrt(grow);
    b *= Math.sqrt(grow);
  }
  const num = a * a * b * b - a * a * y1 * y1 - b * b * x1 * x1;
  const den = a * a * y1 * y1 + b * b * x1 * x1;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cx1 = (k * a * y1) / b;
  const cy1 = (-k * b * x1) / a;
  const cx = cos * cx1 - sin * cy1 + (from[0] + to[0]) / 2;
  const cy = sin * cx1 + cos * cy1 + (from[1] + to[1]) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number): number => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const start = angle(1, 0, (x1 - cx1) / a, (y1 - cy1) / b);
  let delta = angle((x1 - cx1) / a, (y1 - cy1) / b, (-x1 - cx1) / a, (-y1 - cy1) / b);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  o.curve((t) => {
    if (t === 1) return to;
    const th = start + delta * t;
    const ex = a * Math.cos(th);
    const ey = b * Math.sin(th);
    return [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy];
  }, Math.abs(delta) * Math.max(a, b));
}

/** path の `d` を区切りの線に読む。読めない字が在る時は `undefined` */
function readPath(d: string): Run[] | undefined {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/gu) ?? [];
  if (tokens.join("") !== d.replace(/[\s,]/gu, "")) return undefined;
  const o = new Outline();
  let i = 0;
  let cmd = "";
  /** 今の点と、区切りの始めの点 */
  let cur: Point = [0, 0];
  let start: Point = [0, 0];
  /** 閉じた後に M を挟まず描く時は、区切りの始めの点から新しい区切りを始める */
  let closed = false;
  /** 前の曲線の 2 つ目の制御点。`S` と `T` が向きを継ぐ */
  let control: Point | undefined;
  const isNum = (): boolean => i < tokens.length && !/^[A-Za-z]$/u.test(tokens[i] ?? "");
  const num = (): number => Number(tokens[i++]);
  const go = (p: Point, c?: Point): void => {
    cur = p;
    control = c;
  };
  while (i < tokens.length) {
    if (!isNum()) cmd = tokens[i++] ?? "";
    else if (cmd === "") return undefined;
    const rel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();
    if (upper === "Z") {
      o.close();
      closed = true;
      go(start);
      continue;
    }
    if (!isNum()) return undefined;
    const p = (x: number, y: number): Point => (rel ? [cur[0] + x, cur[1] + y] : [x, y]);
    if (upper === "M") {
      start = p(num(), num());
      o.move(start);
      closed = false;
      go(start);
      cmd = rel ? "l" : "L";
      continue;
    }
    if (closed) {
      o.move(start);
      closed = false;
    }
    const from = cur;
    const mirror = (): Point => (control ? [2 * from[0] - control[0], 2 * from[1] - control[1]] : from);
    switch (upper) {
      case "L": {
        const to = p(num(), num());
        o.line(to);
        go(to);
        break;
      }
      case "H": {
        const x = num();
        const to: Point = [rel ? from[0] + x : x, from[1]];
        o.line(to);
        go(to);
        break;
      }
      case "V": {
        const y = num();
        const to: Point = [from[0], rel ? from[1] + y : y];
        o.line(to);
        go(to);
        break;
      }
      case "C":
      case "S": {
        const c1 = upper === "C" ? p(num(), num()) : mirror();
        const c2 = p(num(), num());
        const to = p(num(), num());
        o.curve((t) => {
          const u = 1 - t;
          const [a, b, c] = [u * u * u, 3 * u * u * t, 3 * u * t * t];
          return [a * from[0] + b * c1[0] + c * c2[0] + t * t * t * to[0], a * from[1] + b * c1[1] + c * c2[1] + t * t * t * to[1]];
        }, dist(from, c1) + dist(c1, c2) + dist(c2, to));
        go(to, c2);
        break;
      }
      case "Q":
      case "T": {
        const c = upper === "Q" ? p(num(), num()) : mirror();
        const to = p(num(), num());
        o.curve((t) => {
          const u = 1 - t;
          return [u * u * from[0] + 2 * u * t * c[0] + t * t * to[0], u * u * from[1] + 2 * u * t * c[1] + t * t * to[1]];
        }, dist(from, c) + dist(c, to));
        go(to, c);
        break;
      }
      case "A": {
        const rx = num();
        const ry = num();
        const turn = num();
        const large = num() !== 0;
        const sweep = num() !== 0;
        const to = p(num(), num());
        arc(o, rx, ry, turn, large, sweep, to);
        go(to);
        break;
      }
      default:
        return undefined;
    }
  }
  return o.runs;
}

const numberOf = (attrs: Map<string, string>, name: string): number | undefined => {
  const raw = attrs.get(name);
  if (raw === undefined) return 0;
  return /^\s*[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\s*$/u.test(raw) ? Number(raw) : undefined;
};

/** 形の要素を区切りの線に読む。値を読めない形 (割合で書いた大きさなど) は `undefined` */
function outlineOf(tag: string, attrs: Map<string, string>): Run[] | undefined {
  const n = (name: string): number | undefined => numberOf(attrs, name);
  const o = new Outline();
  switch (tag) {
    case "path":
      return readPath(attrs.get("d") ?? "");
    case "line": {
      const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map(n);
      if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return undefined;
      o.move([x1, y1]);
      o.line([x2, y2]);
      return o.runs;
    }
    case "polygon":
    case "polyline": {
      const values = (attrs.get("points") ?? "").trim().split(/[\s,]+/u).filter((v) => v !== "").map(Number);
      if (values.some((v) => !Number.isFinite(v)) || values.length < 2) return undefined;
      o.move([values[0] as number, values[1] as number]);
      for (let i = 2; i + 1 < values.length; i += 2) o.line([values[i] as number, values[i + 1] as number]);
      if (tag === "polygon") o.close();
      return o.runs;
    }
    case "rect": {
      const [x, y, w, h] = ["x", "y", "width", "height"].map(n);
      if (x === undefined || y === undefined || w === undefined || h === undefined) return undefined;
      const rxRaw = attrs.has("rx") ? n("rx") : undefined;
      const ryRaw = attrs.has("ry") ? n("ry") : undefined;
      if ((attrs.has("rx") && rxRaw === undefined) || (attrs.has("ry") && ryRaw === undefined)) return undefined;
      const rx = Math.min(w / 2, Math.max(0, rxRaw ?? ryRaw ?? 0));
      const ry = Math.min(h / 2, Math.max(0, ryRaw ?? rxRaw ?? 0));
      if (rx > 0 && ry > 0) {
        o.move([x + rx, y]);
        o.line([x + w - rx, y]);
        arc(o, rx, ry, 0, false, true, [x + w, y + ry]);
        o.line([x + w, y + h - ry]);
        arc(o, rx, ry, 0, false, true, [x + w - rx, y + h]);
        o.line([x + rx, y + h]);
        arc(o, rx, ry, 0, false, true, [x, y + h - ry]);
        o.line([x, y + ry]);
        arc(o, rx, ry, 0, false, true, [x + rx, y]);
        o.close();
        return o.runs;
      }
      o.move([x, y]);
      o.line([x + w, y]);
      o.line([x + w, y + h]);
      o.line([x, y + h]);
      o.close();
      return o.runs;
    }
    case "circle":
    case "ellipse": {
      const [cx, cy] = ["cx", "cy"].map(n);
      const rx = tag === "circle" ? n("r") : n("rx");
      const ry = tag === "circle" ? n("r") : n("ry");
      if (cx === undefined || cy === undefined || rx === undefined || ry === undefined) return undefined;
      o.move([cx + rx, cy]);
      o.curve((t) => (t === 1 ? [cx + rx, cy] : [cx + rx * Math.cos(2 * Math.PI * t), cy + ry * Math.sin(2 * Math.PI * t)]), 2 * Math.PI * Math.max(rx, ry));
      o.close();
      return o.runs;
    }
    default:
      return undefined;
  }
}

/** 区切りの線のうち、揺らさずに通る点の番号。開いた線の端と、まっすぐな線どうしの折れ目と、尖った角 */
function pinsOf(run: Run): number[] {
  const { points, ends, straight, closed } = run;
  const last = points.length - 1;
  const pins: number[] = [];
  const turnAt = (i: number): number => {
    const prev = closed && i === 0 ? last - 1 : i - 1;
    const next = closed && i === last ? 1 : i + 1;
    const a = points[prev];
    const p = points[i] as Point;
    const b = points[next];
    if (!a || !b) return 0;
    const t = Math.atan2(b[1] - p[1], b[0] - p[0]) - Math.atan2(p[1] - a[1], p[0] - a[0]);
    return Math.abs(Math.atan2(Math.sin(t), Math.cos(t)));
  };
  for (let i = 0; i <= last; i++) {
    if (!ends[i]) continue;
    if (!closed && (i === 0 || i === last)) {
      pins.push(i);
      continue;
    }
    if (closed && i === last) continue;
    // まっすぐな線どうしの折れ目は、曲がりが緩くても元の折れ目のまま残す。曲線との継ぎ目は尖った時だけ残す
    const into = closed && i === 0 ? straight[last] : straight[i];
    const out = closed && i === 0 ? straight[1] : straight[i + 1];
    if ((into === true && out === true) || turnAt(i) > LOOK.pen.turn) pins.push(i);
  }
  return pins;
}

/** 区切りの線を揺らした `d` の 1 区切り */
function wobble(run: Run, seed: number): string {
  const points = run.points;
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push((lengths[i - 1] as number) + dist(points[i - 1] as Point, points[i] as Point));
  const total = lengths[lengths.length - 1] as number;
  const pins = pinsOf(run);
  const straightOnly = (): string => `M${pt(points[0] as Point)}${points.slice(1).filter((_, i) => run.ends[i + 1]).map((p) => `L${pt(p)}`).join("")}${run.closed ? "Z" : ""}`;
  const P = LOOK.pen;
  if (total <= P.least) return straightOnly();
  const next = random(seed);
  const phases = P.waves.map(() => next() * Math.PI * 2);
  const amp = P.amp * Math.min(1, Math.max(P.short, total / P.full));
  // 角を持たない閉じた形は、波の長さを 1 周に収まる長さに揃える
  const periodic = run.closed && pins.length === 0;
  const waves = periodic ? P.waves.map(([w, k]) => [total / Math.max(1, Math.round(total / w)), k] as const) : P.waves;
  /** 線の始めから長さ `s` の所の点 */
  const at = (s: number): Point => {
    let lo = 0;
    let hi = lengths.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if ((lengths[mid] as number) <= s) lo = mid;
      else hi = mid;
    }
    const a = points[lo] as Point;
    const b = points[hi] as Point;
    const span = (lengths[hi] as number) - (lengths[lo] as number);
    const t = span > 0 ? Math.min(1, Math.max(0, (s - (lengths[lo] as number)) / span)) : 0;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  const offset = (s: number): number => amp * waves.reduce((sum, [w, k], j) => sum + k * Math.sin((2 * Math.PI * s) / w + (phases[j] as number)), 0);
  /** 長さ `from` から `to` までを揺らした点。`taperFrom` と `taperTo` は両端で揺れを細める長さ (0 なら細めない) */
  const stretch = (from: number, to: number, taperFrom: number, taperTo: number): Point[] => {
    const k = Math.max(1, Math.round((to - from) / P.step));
    const out: Point[] = [];
    for (let j = 0; j <= k; j++) {
      const s = from + ((to - from) * j) / k;
      const p = j === 0 ? at(from) : j === k ? at(to) : at(s);
      const edge = Math.min(1, taperFrom > 0 ? (s - from) / taperFrom : 1, taperTo > 0 ? (to - s) / taperTo : 1);
      if (edge <= 0) {
        out.push(p);
        continue;
      }
      // 向きは区間の内で測り、角を越えた向きを混ぜない
      const a = at(Math.max(from, s - 1.5));
      const b = at(Math.min(to, s + 1.5));
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const off = offset(s) * edge;
      out.push([p[0] - ((b[1] - a[1]) / len) * off, p[1] + ((b[0] - a[0]) / len) * off]);
    }
    return out;
  };
  /** 点の並びを、点を全て通る滑らかな曲線 (Catmull-Rom を 3 次の曲線に直した形) の `C` の並びにする。`loop` は 1 周して繋ぐ */
  const curves = (q: Point[], loop: boolean): string => {
    let d = "";
    const last = q.length - 1;
    for (let i = 0; i < last; i++) {
      const p1 = q[i] as Point;
      const p2 = q[i + 1] as Point;
      const p0 = (i > 0 ? q[i - 1] : loop ? q[last - 1] : p1) as Point;
      const p3 = (i + 2 <= last ? q[i + 2] : loop ? q[1] : p2) as Point;
      d += `C${near(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)} ${near(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)} ${i + 1 === last ? pt(p2) : near(p2[0], p2[1])}`;
    }
    return d;
  };
  if (periodic) {
    const q = stretch(0, total, 0, 0);
    return `M${pt(q[0] as Point)}${curves(q, true)}Z`;
  }
  // 揺らさずに通る点で区間に分け、区間ごとに揺らす。閉じた形は最初の点から 1 周する
  const marks = pins.map((i) => lengths[i] as number);
  if (run.closed && pins[0] !== 0) {
    // 閉じた形の始めの点が揺らす点の時は、最初の揺らさない点から 1 周するよう点の並びを回す。
    // 点へ来る線の形は、始めの点だけ閉じる線 (最後の点へ来る線) が持つ
    const shift = pins[0] as number;
    const last = points.length - 1;
    const order = [...Array.from({ length: last - shift }, (_, k) => shift + k), ...Array.from({ length: shift + 1 }, (_, k) => k)];
    return wobble(
      {
        points: order.map((j) => points[j] as Point),
        ends: order.map((j) => run.ends[j] === true),
        straight: order.map((j) => (j === 0 ? run.straight[last] : run.straight[j]) === true),
        closed: true,
      },
      seed,
    );
  }
  if (run.closed) marks.push(total);
  const isEnd = (s: number): boolean => !run.closed && (s === 0 || s === total);
  let d = `M${pt(points[0] as Point)}`;
  for (let m = 0; m + 1 < marks.length; m++) {
    const from = marks[m] as number;
    const to = marks[m + 1] as number;
    if (to - from <= 1e-9) continue;
    const q = stretch(from, to, isEnd(from) ? P.end : P.corner, isEnd(to) ? P.end : P.corner);
    d += curves(q, false);
  }
  return `${d}${run.closed ? "Z" : ""}`;
}

/** 開きの印の属性を名前と値に読む */
function attributes(text: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const m of text.matchAll(/\s+([^\s=/>]+)(?:="([^"]*)")?/gu)) attrs.set(m[1] as string, m[2] ?? "");
  return attrs;
}

/** 形の要素の開きの印を、揺らした `path` の開きの印にする。描き替えない時は `undefined` */
function penShape(tag: string, text: string): string | undefined {
  const attrs = attributes(text);
  const classes = (attrs.get("class") ?? "").split(/\s+/u);
  if (classes.some((c) => KEPT.includes(c))) return undefined;
  const runs = outlineOf(tag, attrs);
  if (!runs) return undefined;
  const geometry = GEOMETRY[tag] ?? [];
  const seed = hash(`${tag}|${geometry.map((name) => attrs.get(name) ?? "").join("|")}`);
  const d = runs.map((run, i) => wobble(run, seed + i * 7919)).join("");
  const kept = [...attrs].filter(([name]) => !geometry.includes(name));
  // 線の要素は面を持たない。path にすると塗りの既定の黒が付くので、どの規則より強い style で塗りを外す
  const style = tag === "line" ? [["style", `${attrs.get("style")?.replace(/;?\s*$/u, ";") ?? ""}fill:none`] as [string, string]] : [];
  const rest = kept.filter(([name]) => !(tag === "line" && name === "style"));
  // 線の端はペン先の丸い形にする。継ぎ目は元のまま残し、尖った角を尖ったまま描く
  const caps: [string, string][] = attrs.has("stroke-linecap") ? [] : [["stroke-linecap", "round"]];
  const marks: [string, string][] = tag === "path" ? [] : [["data-dg", tag]];
  return `<path${[...rest, ...style, ...marks, ...caps].map(([name, value]) => ` ${name}="${value}"`).join("")} d="${d}"`;
}

/**
 * 形の要素と定義の置き場の開きと閉じの印。属性の値は `>` を含みうる (`data-mind-link="app>input"`) ので、引用符の中を飛ばして印の終わりを探す。
 * 他の要素の印は読まずに飛ばす
 */
const MARKS = /<(\/?)(rect|circle|ellipse|line|polygon|polyline|path|defs|clipPath|mask|pattern|symbol|marker|filter|style)(?=[\s/>])((?:[^>"]|"[^"]*")*?)(\/?)>/gu;

/** 描いた SVG の字 `markup` の形を、手描きのペンの線に描き替える。定義の置き場の中の形と、揺らさない class の形はそのまま残す */
export function penLines(markup: string): string {
  let hidden = 0;
  /** 中身を持つ形の要素の閉じの印を、`path` の閉じの印にする */
  const closing: string[] = [];
  return markup.replace(MARKS, (all, close: string, name: string, text: string, self: string) => {
    if (close) {
      if (DEFINITIONS.has(name)) hidden = Math.max(0, hidden - 1);
      if (SHAPES.has(name) && closing[closing.length - 1] === name) {
        closing.pop();
        return "</path>";
      }
      return all;
    }
    if (DEFINITIONS.has(name)) {
      if (!self) hidden++;
      return all;
    }
    if (hidden > 0 || !SHAPES.has(name)) return all;
    const drawn = penShape(name, text);
    if (drawn === undefined) return all;
    if (!self) closing.push(name);
    return `${drawn}${self ? "/" : ""}>`;
  });
}

const TAG = /(^|[\s,>+~(])(rect|circle|ellipse|line|polygon|polyline|path)(?=$|[\s,>+~.:#[)])/gu;

/** 見た目の規則の選び方の中の形の名前を、描き替えた `path` の印 (`data-dg`) を名指す形にする。強さは元の名前と同じ */
export function penCss(css: string): string {
  return css.replace(/(^|[{}])([^{}]*)(?=\{)/gu, (_all, brace: string, selector: string) =>
    `${brace}${selector.replace(TAG, (_m, before: string, tag: string) => `${before}${tag === "path" ? "path:where(:not([data-dg]))" : `path:where([data-dg="${tag}"])`}`)}`,
  );
}

/** 描いた図の SVG を手描きのペンの線で描き直す。見た目の規則は形の名前を書き替え、形は揺らした `path` に描き替える */
export const penSvg = (svg: string): string =>
  penLines(svg.replace(/<style>([^<]*)<\/style>/gu, (_all, css: string) => `<style>${penCss(css)}</style>`));
