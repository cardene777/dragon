/**
 * 配管の図の管の道を、縦と横の線の格子の上で探す (#3418)。
 *
 * 管は格子の点から隣の点へ縦か横に進み、折れるたびに値を足す。後ろへは戻らない。
 * 障害の四角 (広げた縁を含む) の中を通る道と、置いた線と重なるか近すぎる道は選ばない。
 * 置いた線を直角に越えてよいかと越える時の値は、頼む側 (`Ask.cross`) が線の種類ごとに決める。値の管はほかの値の管を越えず、呼び出しの管は値の管を越えてよい。
 * 重なってよい組 (`group`) が同じ線どうしは、重なっても近くても選ぶ。同じ者から出る呼び出しの管は 1 本の本管を分け合う。
 * 並べ方 (`layout.ts`) が格子の線と障害と管の端を渡し、この file は道だけを返す。部品の置き場所は決めない
 */
import type { Point, Rect } from "./layout/scene";

/** 進む向き。0 が右、1 が下、2 が左、3 が上 */
export type Dir = 0 | 1 | 2 | 3;
const DX = [1, 0, -1, 0] as const;
const DY = [0, 1, 0, -1] as const;

/** 置いた線の種類。値の管、呼び出しの管、名札から囲いへの点線、トークンの箱から管への短い管 */
export type LineKind = "value" | "call" | "tie" | "stub" | "write";

/** 置いた線の 1 本の線分。`group` が同じ線どうしは重なってよい */
export interface Laid {
  a: Point;
  b: Point;
  owner: string;
  group: string;
  kind: LineKind;
  width: number;
}

/** 管の端。始まりは `at` から `dir` の向きに出て、終わりは `dir` の向きに進んで `at` に入る。`cost` はこの端を使う時に足す値 */
export interface End {
  at: Point;
  dir: Dir;
  cost?: number;
}

export interface Ask {
  owner: string;
  group: string;
  kind: LineKind;
  width: number;
  starts: readonly End[];
  ends: readonly End[];
  /** 通ってよい障害の番号 */
  allow?: ReadonlySet<number>;
  /** 置いた線を直角に越える時に足す値。`undefined` は越えない */
  cross: (l: Laid) => number | undefined;
  /** 平行な線と縁どうしの間の下限 */
  gap: number;
  /** 折れる時に足す値 */
  bend: number;
  /**
   * 障害の縁と、ほかの線の隣の筋に沿って走る時に、長さを減らす割合。0 より大きいと、管は縁と先に引いた管に寄り添って束になり、
   * 内側から順に引いた管が入れ子に並ぶ。値が同じ道が幾つも在る時に、どれを選ぶかを決める
   */
  hug?: number;
}

/** 道を探す障害。`pad` だけ広げた四角の中を通らない */
export interface Obstacle {
  rect: Rect;
  pad: number;
}

const near = (a: number, b: number): boolean => Math.abs(a - b) < 0.5;

/** 並べた数の中で `v` 以上の最初の番号 */
function lowerBound(list: readonly number[], v: number): number {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((list[mid] as number) < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** 数を並べ、`min` より近い数を 1 つにまとめる。`keep` の数は必ず残す */
export function gridLines(values: readonly number[], keep: readonly number[], min: number): number[] {
  // 残す値は丸めない。丸めると槽の縁が縁の内側へずれ、口から外へ出る辺が槽の中と数えられる
  const out: number[] = [];
  for (const v of [...keep].sort((a, b) => a - b)) if (out.length === 0 || v - (out[out.length - 1] as number) > 0.01) out.push(v);
  for (const v of [...values].sort((a, b) => a - b)) {
    const i = lowerBound(out, v);
    const lo = out[i - 1];
    const hi = out[i];
    if ((lo !== undefined && v - lo < min) || (hi !== undefined && hi - v < min)) continue;
    out.splice(i, 0, v);
  }
  return out;
}

interface Heap {
  push(cost: number, state: number): void;
  pop(): number | undefined;
  size(): number;
}

/** 値の小さい順に取り出す山。値が同じ物の順は、入れ替えて並べ直す山と同じ */
function heap(): Heap {
  const costs: number[] = [];
  const states: number[] = [];
  return {
    push(cost, state) {
      let i = costs.length;
      costs.push(cost);
      states.push(state);
      while (i > 0) {
        const p = (i - 1) >> 1;
        const pc = costs[p] as number;
        if (pc <= cost) break;
        costs[i] = pc;
        states[i] = states[p] as number;
        i = p;
      }
      costs[i] = cost;
      states[i] = state;
    },
    pop() {
      const n = costs.length;
      if (n === 0) return undefined;
      const top = states[0];
      const lastC = costs.pop() as number;
      const lastS = states.pop() as number;
      const m = n - 1;
      if (m > 0) {
        let i = 0;
        for (;;) {
          const l = i * 2 + 1;
          const r = l + 1;
          let k = i;
          let kc = lastC;
          if (l < m && (costs[l] as number) < kc) {
            k = l;
            kc = costs[l] as number;
          }
          if (r < m && (costs[r] as number) < kc) {
            k = r;
            kc = costs[r] as number;
          }
          if (k === i) break;
          costs[i] = kc;
          states[i] = states[k] as number;
          i = k;
        }
        costs[i] = lastC;
        states[i] = lastS;
      }
      return top;
    },
    size: () => costs.length,
  };
}

/** 置いた線と格子の辺の関わり。`cross` は直角に越えるか触れる、`along` は平行に `d` だけ離れて並ぶ */
interface Mark {
  laid: number;
  rel: "cross" | "along";
  d: number;
}

export class Router {
  readonly xs: readonly number[];
  readonly ys: readonly number[];
  readonly laid: Laid[] = [];
  private readonly nx: number;
  private readonly ny: number;
  /** 横の辺 (i, j)-(i+1, j) と縦の辺 (i, j)-(i, j+1) が通る障害 */
  private readonly hObs: number[][];
  private readonly vObs: number[][];
  private readonly hMarks: Mark[][];
  private readonly vMarks: Mark[][];
  /** 障害の広げた縁の上を通る辺 */
  private readonly hRail: Uint8Array;
  private readonly vRail: Uint8Array;
  /** `edgeCost` が最後に見た辺が、縁かほかの線の隣の筋か */
  private lastRail = false;
  /** 道を探すたびに 1 つ進める番号。探した状態と辺の値の覚えは、この番号が合う時だけ使う */
  private epoch = 0;
  private work?: {
    seen: Uint32Array;
    best: Float64Array;
    from: Int32Array;
    goal: Uint32Array;
    goalCost: Float64Array;
    hSeen: Uint32Array;
    hCost: Float64Array;
    vSeen: Uint32Array;
    vCost: Float64Array;
    hHug: Uint8Array;
    vHug: Uint8Array;
  };

  constructor(xs: readonly number[], ys: readonly number[], obstacles: readonly Obstacle[]) {
    this.xs = xs;
    this.ys = ys;
    this.nx = xs.length;
    this.ny = ys.length;
    this.hObs = Array.from({ length: this.nx * this.ny }, () => []);
    this.vObs = Array.from({ length: this.nx * this.ny }, () => []);
    this.hMarks = Array.from({ length: this.nx * this.ny }, () => []);
    this.vMarks = Array.from({ length: this.nx * this.ny }, () => []);
    this.hRail = new Uint8Array(this.nx * this.ny);
    this.vRail = new Uint8Array(this.nx * this.ny);
    obstacles.forEach((o) => {
      const x0 = o.rect.x - o.pad;
      const x1 = o.rect.x + o.rect.w + o.pad;
      const y0 = o.rect.y - o.pad;
      const y1 = o.rect.y + o.rect.h + o.pad;
      // 上と下の縁の上を走る横の辺と、左と右の縁の上を走る縦の辺
      for (const y of [y0, y1]) {
        const j = this.iy(y);
        if (j < 0) continue;
        for (let i = Math.max(0, lowerBound(xs, x0 - 0.25)); i < this.nx - 1 && (xs[i + 1] as number) <= x1 + 0.25; i++) this.hRail[j * this.nx + i] = 1;
      }
      for (const x of [x0, x1]) {
        const i = this.ix(x);
        if (i < 0) continue;
        for (let j = Math.max(0, lowerBound(ys, y0 - 0.25)); j < this.ny - 1 && (ys[j + 1] as number) <= y1 + 0.25; j++) this.vRail[j * this.nx + i] = 1;
      }
    });
    obstacles.forEach((o, k) => {
      const x0 = o.rect.x - o.pad;
      const x1 = o.rect.x + o.rect.w + o.pad;
      const y0 = o.rect.y - o.pad;
      const y1 = o.rect.y + o.rect.h + o.pad;
      // 横の辺は、高さが四角の中で、横の範囲が四角と重なる物
      for (let j = lowerBound(ys, y0 + 1e-6); j < this.ny && (ys[j] as number) < y1 - 1e-6; j++)
        for (let i = Math.max(0, lowerBound(xs, x0) - 1); i < this.nx - 1 && (xs[i] as number) < x1 - 1e-6; i++)
          if ((xs[i + 1] as number) > x0 + 1e-6) (this.hObs[j * this.nx + i] as number[]).push(k);
      for (let i = lowerBound(xs, x0 + 1e-6); i < this.nx && (xs[i] as number) < x1 - 1e-6; i++)
        for (let j = Math.max(0, lowerBound(ys, y0) - 1); j < this.ny - 1 && (ys[j] as number) < y1 - 1e-6; j++)
          if ((ys[j + 1] as number) > y0 + 1e-6) (this.vObs[j * this.nx + i] as number[]).push(k);
    });
  }

  private ix(x: number): number {
    const i = lowerBound(this.xs, x - 0.25);
    return i < this.nx && near(this.xs[i] as number, x) ? i : -1;
  }
  private iy(y: number): number {
    const j = lowerBound(this.ys, y - 0.25);
    return j < this.ny && near(this.ys[j] as number, y) ? j : -1;
  }

  /** 線分を置き、関わる格子の辺に印を付ける。線分は縦か横 */
  private mark(index: number): void {
    const l = this.laid[index] as Laid;
    const reach = l.width / 2 + 40;
    if (near(l.a[1], l.b[1])) {
      const y = l.a[1];
      const lo = Math.min(l.a[0], l.b[0]);
      const hi = Math.max(l.a[0], l.b[0]);
      // 縦の辺のうち、線分の横の範囲の中を通り、高さが線分にかかる物
      for (let i = lowerBound(this.xs, lo - 0.25); i < this.nx && (this.xs[i] as number) <= hi + 0.25; i++)
        for (let j = Math.max(0, lowerBound(this.ys, y) - 1); j < this.ny - 1 && (this.ys[j] as number) <= y + 0.25; j++)
          if ((this.ys[j + 1] as number) >= y - 0.25) (this.vMarks[j * this.nx + i] as Mark[]).push({ laid: index, rel: "cross", d: 0 });
      // 横の辺のうち、近くを平行に走る物
      for (let j = lowerBound(this.ys, y - reach); j < this.ny && (this.ys[j] as number) <= y + reach; j++)
        for (let i = Math.max(0, lowerBound(this.xs, lo) - 1); i < this.nx - 1 && (this.xs[i] as number) < hi; i++)
          if ((this.xs[i + 1] as number) > lo) (this.hMarks[j * this.nx + i] as Mark[]).push({ laid: index, rel: "along", d: Math.abs((this.ys[j] as number) - y) });
    } else {
      const x = l.a[0];
      const lo = Math.min(l.a[1], l.b[1]);
      const hi = Math.max(l.a[1], l.b[1]);
      for (let j = lowerBound(this.ys, lo - 0.25); j < this.ny && (this.ys[j] as number) <= hi + 0.25; j++)
        for (let i = Math.max(0, lowerBound(this.xs, x) - 1); i < this.nx - 1 && (this.xs[i] as number) <= x + 0.25; i++)
          if ((this.xs[i + 1] as number) >= x - 0.25) (this.hMarks[j * this.nx + i] as Mark[]).push({ laid: index, rel: "cross", d: 0 });
      for (let i = lowerBound(this.xs, x - reach); i < this.nx && (this.xs[i] as number) <= x + reach; i++)
        for (let j = Math.max(0, lowerBound(this.ys, lo) - 1); j < this.ny - 1 && (this.ys[j] as number) < hi; j++)
          if ((this.ys[j + 1] as number) > lo) (this.vMarks[j * this.nx + i] as Mark[]).push({ laid: index, rel: "along", d: Math.abs((this.xs[i] as number) - x) });
    }
  }

  /** 線を置く。後から探す道は、この線と重ならず、越えるかは頼む側が決める */
  lay(points: readonly Point[], line: Omit<Laid, "a" | "b">): void {
    for (let k = 1; k < points.length; k++) {
      const a = points[k - 1] as Point;
      const b = points[k] as Point;
      if (near(a[0], b[0]) && near(a[1], b[1])) continue;
      this.laid.push({ ...line, a, b });
      this.mark(this.laid.length - 1);
    }
  }

  /** 辺を通る時に足す値。通れない辺は `undefined` */
  private edgeCost(ask: Ask, horizontal: boolean, index: number): number | undefined {
    const obs = (horizontal ? this.hObs : this.vObs)[index] as number[];
    for (const o of obs) if (!ask.allow?.has(o)) return undefined;
    let extra = 0;
    this.lastRail = ((horizontal ? this.hRail : this.vRail)[index] as number) === 1;
    for (const m of (horizontal ? this.hMarks : this.vMarks)[index] as Mark[]) {
      const l = this.laid[m.laid] as Laid;
      if (l.group === ask.group) {
        // 同じ組の線は重ねて共に通ってよいが、少しずれて並ぶと二重の線に見えるため、重ならない時は間を取る
        if (m.rel === "along" && m.d > 0.5 && m.d < (l.width + ask.width) / 2 + ask.gap) return undefined;
        continue;
      }
      if (m.rel === "along") {
        const least = (l.width + ask.width) / 2 + ask.gap;
        if (m.d < least) return undefined;
        // 隣の筋。間の下限から、この線の太さの分までの離れ
        if (m.d < least + ask.width) this.lastRail = true;
        continue;
      }
      const c = ask.cross(l);
      if (c === undefined) return undefined;
      extra += c;
    }
    return extra;
  }

  /** 格子の上の真っすぐな線分 a-b を、頼む側の決まりで通れるか。端が格子に無い時は通れないとする */
  passable(ask: Ask, a: Point, b: Point): boolean {
    let i = this.ix(a[0]);
    let j = this.iy(a[1]);
    const ti = this.ix(b[0]);
    const tj = this.iy(b[1]);
    if (i < 0 || j < 0 || ti < 0 || tj < 0 || (i !== ti && j !== tj)) return false;
    while (i !== ti || j !== tj) {
      const d: Dir = ti > i ? 0 : ti < i ? 2 : tj > j ? 1 : 3;
      const ni = i + DX[d];
      const nj = j + DY[d];
      const horizontal = d === 0 || d === 2;
      const index = horizontal ? j * this.nx + Math.min(i, ni) : Math.min(j, nj) * this.nx + i;
      if (this.edgeCost(ask, horizontal, index) === undefined) return false;
      i = ni;
      j = nj;
    }
    return true;
  }

  /**
   * 始まりの端のどれかから終わりの端のどれかまでの、値の最も小さい道。端は格子の点に在る。
   * 道が無ければ `undefined`。返す点は折れる所だけ
   */
  route(ask: Ask): Point[] | undefined {
    const { nx, ny } = this;
    const size = nx * ny * 4;
    this.work ??= {
      seen: new Uint32Array(size),
      best: new Float64Array(size),
      from: new Int32Array(size),
      goal: new Uint32Array(size),
      goalCost: new Float64Array(size),
      hSeen: new Uint32Array(nx * ny),
      hCost: new Float64Array(nx * ny),
      vSeen: new Uint32Array(nx * ny),
      vCost: new Float64Array(nx * ny),
      hHug: new Uint8Array(nx * ny),
      vHug: new Uint8Array(nx * ny),
    };
    const { seen, best, from, goal, goalCost, hSeen, hCost, vSeen, vCost, hHug, vHug } = this.work;
    const hug = ask.hug ?? 0;
    const ep = ++this.epoch;
    const bestOf = (st: number): number => (seen[st] === ep ? (best[st] as number) : Number.POSITIVE_INFINITY);
    const open = heap();
    let goals = 0;
    for (const e of ask.ends) {
      const i = this.ix(e.at[0]);
      const j = this.iy(e.at[1]);
      if (i < 0 || j < 0) continue;
      const st = (j * nx + i) * 4 + e.dir;
      // 同じ点と向きの終わりが 2 つ在る時は、後に書いた方の値を使う
      goal[st] = ep;
      goalCost[st] = e.cost ?? 0;
      goals++;
    }
    if (goals === 0) return undefined;
    const ex = Float64Array.from(ask.ends, (e) => e.at[0]);
    const ey = Float64Array.from(ask.ends, (e) => e.at[1]);
    const guess = (i: number, j: number): number => {
      const x = this.xs[i] as number;
      const y = this.ys[j] as number;
      let m = Number.POSITIVE_INFINITY;
      for (let k = 0; k < ex.length; k++) {
        const v = Math.abs((ex[k] as number) - x) + Math.abs((ey[k] as number) - y);
        if (v < m) m = v;
      }
      // 寄り添う辺は長さを減らして数えるため、見積もりも同じ割合で減らし、見積もりが本当の値を超えないようにする
      return m * (1 - hug);
    };
    /** 辺を通る時に足す値。通れない辺は -1。同じ探しの中では辺の値は変わらないため、1 度だけ求める */
    const edge = (horizontal: boolean, index: number): number => {
      const stamp = horizontal ? hSeen : vSeen;
      const cost = horizontal ? hCost : vCost;
      if (stamp[index] === ep) return cost[index] as number;
      const extra = this.edgeCost(ask, horizontal, index);
      stamp[index] = ep;
      cost[index] = extra === undefined ? -1 : extra;
      (horizontal ? hHug : vHug)[index] = this.lastRail ? 1 : 0;
      return cost[index];
    };
    /** 点 (i, j) から向き d に 1 つ進む値。進めない時は -1 */
    const stepCost = (i: number, j: number, d: Dir): number => {
      const ni = i + DX[d];
      const nj = j + DY[d];
      if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) return -1;
      const horizontal = d === 0 || d === 2;
      const index = horizontal ? j * nx + Math.min(i, ni) : Math.min(j, nj) * nx + i;
      const extra = edge(horizontal, index);
      if (extra < 0) return -1;
      const len = horizontal ? Math.abs((this.xs[ni] as number) - (this.xs[i] as number)) : Math.abs((this.ys[nj] as number) - (this.ys[j] as number));
      return len * (((horizontal ? hHug : vHug)[index] as number) === 1 ? 1 - hug : 1) + extra;
    };
    for (const s of ask.starts) {
      const i = this.ix(s.at[0]);
      const j = this.iy(s.at[1]);
      if (i < 0 || j < 0) continue;
      const c = stepCost(i, j, s.dir);
      if (c < 0) continue;
      const ni = i + DX[s.dir];
      const nj = j + DY[s.dir];
      const state = (nj * nx + ni) * 4 + s.dir;
      const g = c + (s.cost ?? 0);
      if (g < bestOf(state)) {
        seen[state] = ep;
        best[state] = g;
        from[state] = -2 - ((j * nx + i) * 4 + s.dir);
        open.push(g + guess(ni, nj), state);
      }
    }
    let found = -1;
    let foundCost = Number.POSITIVE_INFINITY;
    while (open.size() > 0) {
      const state = open.pop() as number;
      const g = best[state] as number;
      if (g >= foundCost) break;
      const node = state >> 2;
      const d = (state & 3) as Dir;
      if (goal[state] === ep && g + (goalCost[state] as number) < foundCost) {
        found = state;
        foundCost = g + (goalCost[state] as number);
        continue;
      }
      const i = node % nx;
      const j = (node - i) / nx;
      // そのまま進む、右へ折れる、左へ折れるの順に試す
      for (let t = 0; t < 3; t++) {
        const nd = (t === 0 ? d : t === 1 ? (d + 1) % 4 : (d + 3) % 4) as Dir;
        const c = stepCost(i, j, nd);
        if (c < 0) continue;
        const ni = i + DX[nd];
        const nj = j + DY[nd];
        const ng = g + c + (nd === d ? 0 : ask.bend);
        const ns = (nj * nx + ni) * 4 + nd;
        if (ng < bestOf(ns)) {
          seen[ns] = ep;
          best[ns] = ng;
          from[ns] = state;
          open.push(ng + guess(ni, nj), ns);
        }
      }
    }
    if (found < 0) return undefined;
    const states: number[] = [];
    let s = found;
    for (;;) {
      states.push(s);
      const f = from[s] as number;
      if (f <= -2) {
        states.push(-2 - f);
        break;
      }
      s = f;
    }
    states.reverse();
    const pts: Point[] = states.map((st) => {
      const node = st >> 2;
      const i = node % nx;
      return [this.xs[i] as number, this.ys[(node - i) / nx] as number];
    });
    return simplify(pts);
  }
}

/**
 * 道の途中の、`min` より短い段差を消す。段差の前か後ろの線を段差の分だけずらし、ずらした線が `ok` で通れる時だけ採る。
 * 端の点は動かさない
 */
export function unjog(points: readonly Point[], min: number, ok: (a: Point, b: Point) => boolean): Point[] {
  let pts = simplify(points);
  for (let guard = 0; guard < 8; guard++) {
    let changed = false;
    for (let i = 0; i + 1 < pts.length && !changed; i++) {
      const p = pts[i] as Point;
      const q = pts[i + 1] as Point;
      const len = Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]);
      if (len >= min) continue;
      const before = pts[i - 1];
      const after = pts[i + 2];
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      // 前と後ろの線が両方在る時は、同じ向きに走る段差 (Z の形) だけを扱う。逆向き (U の形) をずらすと線が重なる
      if (before && after) {
        const sameWay = near(before[0], p[0]) ? Math.sign(p[1] - before[1]) === Math.sign(after[1] - q[1]) : Math.sign(p[0] - before[0]) === Math.sign(after[0] - q[0]);
        if (!sameWay) continue;
      }
      // 前の線をずらす。前の線の始まり (端の点でもよい) は動かさない
      if (before && i - 2 >= 0) {
        const b2 = pts[i - 2] as Point;
        const moved: Point = [before[0] + dx, before[1] + dy];
        if (ok(b2, moved) && ok(moved, q)) {
          pts = simplify([...pts.slice(0, i - 1), moved, ...pts.slice(i + 1)]);
          changed = true;
          continue;
        }
      }
      // 後ろの線をずらす。後ろの線の終わり (端の点でもよい) は動かさない
      if (after && i + 3 <= pts.length - 1) {
        const a2 = pts[i + 3] as Point;
        const moved: Point = [after[0] - dx, after[1] - dy];
        if (ok(p, moved) && ok(moved, a2)) {
          pts = simplify([...pts.slice(0, i + 1), moved, ...pts.slice(i + 3)]);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return pts;
}

/** 一直線に並ぶ点を外し、折れる所と端だけを残す */
export function simplify(points: readonly Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && near(last[0], p[0]) && near(last[1], p[1])) continue;
    const prev = out[out.length - 2];
    if (prev && last && ((near(prev[0], last[0]) && near(last[0], p[0])) || (near(prev[1], last[1]) && near(last[1], p[1])))) out[out.length - 1] = p;
    else out.push(p);
  }
  return out;
}
