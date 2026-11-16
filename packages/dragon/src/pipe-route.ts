/**
 * 配管の図の管の道を、縦と横の線の格子の上で探す (#3418)。
 *
 * 管は格子の点から隣の点へ縦か横に進み、折れるたびに値を足す。後ろへは戻らない。
 * 障害の四角 (広げた縁を含む) の中を通る道と、置いた線と重なるか近すぎる道は選ばない。
 * 置いた線を直角に越えてよいかと越える時の値は、頼む側 (`Ask.cross`) が線の種類ごとに決める。値の管はほかの値の管を越えず、呼び出しの管は値の管を越えてよい。
 * 重なってよい組 (`group`) が同じ線どうしは、重なって走る道を選べる。同じ者から出る呼び出しの管は 1 本の本管を分け合い、
 * 同じ槽を端に持つ同じトークンの値の管は 1 本の幹を分け合う。重なって走る所は値を減らして数え (`Ask.share`)、幹から枝が分かれる形にする。
 * 同じ組の線も、直角に突き抜けて越える道は選ばない。突き抜けると十字の継ぎ目に見え、どの枝がどこへ行くかが読めない。
 * 並べ方 (`layout.ts`) が格子の線と障害と管の端を渡し、この file は道だけを返す。部品の置き場所は決めない
 */
import type { Point, Rect } from "./layout/scene";

/** 進む向き。0 が右、1 が下、2 が左、3 が上 */
export type Dir = 0 | 1 | 2 | 3;
const DX = [1, 0, -1, 0] as const;
const DY = [0, 1, 0, -1] as const;
/** 置いた線の種類。値の管、呼び出しの管、名札から囲いへの点線、トークンの箱から管への短い管、書き込む管、呼び出しの管の弁が描く形の縁 */
export type LineKind = "value" | "call" | "tie" | "stub" | "write" | "valve";

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
  /**
   * 同じ組の置いた線と重なって走る辺の長さに掛ける割合。1 より小さいと、後から引く管は先に引いた同じ組の管の道を幹として共に通り、
   * 相手の近くで枝分かれする。省くと 1 で、重なっても値は減らない
   */
  share?: number;
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

/**
 * 値の小さい順に取り出す山。値が同じ物の順は、入れ替えて並べ直す山と同じ。
 * 入れた時の道の値 (`g`) も持ち、取り出した物の `g` を `poppedG` で返す。
 * 道を探すたびに山を作らず、型付きの配列を使い回す (#3472)。並べ方は配列で持っていた時と同じで、取り出す順は変わらない
 */
class Heap {
  private costs = new Float64Array(1024);
  private states = new Int32Array(1024);
  private gs = new Float64Array(1024);
  private n = 0;
  /** 最後に取り出した物を入れた時の道の値 */
  poppedG = 0;

  clear(): void {
    this.n = 0;
  }

  size(): number {
    return this.n;
  }

  push(cost: number, state: number, g: number): void {
    if (this.n === this.costs.length) this.grow();
    const { costs, states, gs } = this;
    let i = this.n++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      const pc = costs[p] as number;
      if (pc <= cost) break;
      costs[i] = pc;
      states[i] = states[p] as number;
      gs[i] = gs[p] as number;
      i = p;
    }
    costs[i] = cost;
    states[i] = state;
    gs[i] = g;
  }

  pop(): number {
    const { costs, states, gs } = this;
    const top = states[0] as number;
    this.poppedG = gs[0] as number;
    const m = --this.n;
    if (m > 0) {
      const lastC = costs[m] as number;
      const lastS = states[m] as number;
      const lastG = gs[m] as number;
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
        gs[i] = gs[k] as number;
        i = k;
      }
      costs[i] = lastC;
      states[i] = lastS;
      gs[i] = lastG;
    }
    return top;
  }

  private grow(): void {
    const size = this.costs.length * 2;
    const costs = new Float64Array(size);
    const states = new Int32Array(size);
    const gs = new Float64Array(size);
    costs.set(this.costs);
    states.set(this.states);
    gs.set(this.gs);
    this.costs = costs;
    this.states = states;
    this.gs = gs;
  }
}
const open = new Heap();

/**
 * 置いた線と格子の辺の関わり。`cross` は直角に越えるか触れる、`along` は平行に `d` だけ離れて並ぶ。
 * `cross` の `d` は、辺が線分の端の間を越える時 0、線分の端に触れる時 1
 */
interface Mark {
  laid: number;
  rel: "cross" | "along";
  d: number;
}

/** 障害も印も無い辺が返す空の列。辺ごとに空の配列を作らない (#3472) */
const NONE: readonly never[] = [];

/** 道を探す作業の配列。格子の点の数で決まる大きさを持ち、Router を作り直しても使い回す (#3472) */
interface Work {
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
  hJoin: Int32Array;
  vJoin: Int32Array;
  /** 点ごとの終わりまでの見積もりと、それを求めた探しの番号 */
  guessSeen: Uint32Array;
  guessVal: Float64Array;
}
let shared: Work | undefined;
/** 道を探すたびに 1 つ進める番号。作業の配列を Router の間で使い回すため、全ての Router で 1 つの番号を数える */
let epoch = 0;

/** `cells` 個の格子の点を探せる作業の配列。前に作った配列が足りる時は使い回す */
function workFor(cells: number): Work {
  if (shared && shared.hSeen.length >= cells) return shared;
  const size = cells * 4;
  shared = {
    seen: new Uint32Array(size),
    best: new Float64Array(size),
    from: new Int32Array(size),
    goal: new Uint32Array(size),
    goalCost: new Float64Array(size),
    hSeen: new Uint32Array(cells),
    hCost: new Float64Array(cells),
    vSeen: new Uint32Array(cells),
    vCost: new Float64Array(cells),
    hHug: new Uint8Array(cells),
    vHug: new Uint8Array(cells),
    hJoin: new Int32Array(cells),
    vJoin: new Int32Array(cells),
    guessSeen: new Uint32Array(cells),
    guessVal: new Float64Array(cells),
  };
  // 新しい配列の番号は全て 0 なので、0 より大きい番号から数え直す
  epoch = 0;
  return shared;
}

export class Router {
  readonly xs: readonly number[];
  readonly ys: readonly number[];
  readonly laid: Laid[] = [];
  private readonly nx: number;
  private readonly ny: number;
  /** 横の辺 (i, j)-(i+1, j) と縦の辺 (i, j)-(i, j+1) が通る障害。障害の無い辺は持たない (#3472) */
  private readonly hObs: (number[] | undefined)[];
  private readonly vObs: (number[] | undefined)[];
  private readonly hMarks: (Mark[] | undefined)[];
  private readonly vMarks: (Mark[] | undefined)[];
  /** 障害の広げた縁の上を通る辺 */
  private readonly hRail: Uint8Array;
  private readonly vRail: Uint8Array;
  /** `edgeCost` が最後に見た辺が、縁かほかの線の隣の筋か */
  private lastRail = false;
  /** `edgeCost` が最後に見た辺が、同じ組の置いた線と重なって走るか */
  private lastShared = false;
  /** `edgeCost` が最後に見た辺が直角に越えるか触れる、同じ組の置いた線分の番号。無ければ -1 */
  private lastJoin = -1;

  constructor(xs: readonly number[], ys: readonly number[], obstacles: readonly Obstacle[]) {
    this.xs = xs;
    this.ys = ys;
    this.nx = xs.length;
    this.ny = ys.length;
    // 辺の数だけ空の配列を作ると、開いた箱を持つ図では Router ごとに 10 万個を超え、作るだけで描く時間の 1 割を使った (#3472)
    this.hObs = new Array<number[] | undefined>(this.nx * this.ny);
    this.vObs = new Array<number[] | undefined>(this.nx * this.ny);
    this.hMarks = new Array<Mark[] | undefined>(this.nx * this.ny);
    this.vMarks = new Array<Mark[] | undefined>(this.nx * this.ny);
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
          if ((xs[i + 1] as number) > x0 + 1e-6) (this.hObs[j * this.nx + i] ??= []).push(k);
      for (let i = lowerBound(xs, x0 + 1e-6); i < this.nx && (xs[i] as number) < x1 - 1e-6; i++)
        for (let j = Math.max(0, lowerBound(ys, y0) - 1); j < this.ny - 1 && (ys[j] as number) < y1 - 1e-6; j++)
          if ((ys[j + 1] as number) > y0 + 1e-6) (this.vObs[j * this.nx + i] ??= []).push(k);
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
          if ((this.ys[j + 1] as number) >= y - 0.25) (this.vMarks[j * this.nx + i] ??= []).push({ laid: index, rel: "cross", d: (this.xs[i] as number) > lo + 0.5 && (this.xs[i] as number) < hi - 0.5 ? 0 : 1 });
      // 横の辺のうち、近くを平行に走る物
      for (let j = lowerBound(this.ys, y - reach); j < this.ny && (this.ys[j] as number) <= y + reach; j++)
        for (let i = Math.max(0, lowerBound(this.xs, lo) - 1); i < this.nx - 1 && (this.xs[i] as number) < hi; i++)
          if ((this.xs[i + 1] as number) > lo) (this.hMarks[j * this.nx + i] ??= []).push({ laid: index, rel: "along", d: Math.abs((this.ys[j] as number) - y) });
    } else {
      const x = l.a[0];
      const lo = Math.min(l.a[1], l.b[1]);
      const hi = Math.max(l.a[1], l.b[1]);
      for (let j = lowerBound(this.ys, lo - 0.25); j < this.ny && (this.ys[j] as number) <= hi + 0.25; j++)
        for (let i = Math.max(0, lowerBound(this.xs, x) - 1); i < this.nx - 1 && (this.xs[i] as number) <= x + 0.25; i++)
          if ((this.xs[i + 1] as number) >= x - 0.25) (this.hMarks[j * this.nx + i] ??= []).push({ laid: index, rel: "cross", d: (this.ys[j] as number) > lo + 0.5 && (this.ys[j] as number) < hi - 0.5 ? 0 : 1 });
      for (let i = lowerBound(this.xs, x - reach); i < this.nx && (this.xs[i] as number) <= x + reach; i++)
        for (let j = Math.max(0, lowerBound(this.ys, lo) - 1); j < this.ny - 1 && (this.ys[j] as number) < hi; j++)
          if ((this.ys[j + 1] as number) > lo) (this.vMarks[j * this.nx + i] ??= []).push({ laid: index, rel: "along", d: Math.abs((this.xs[i] as number) - x) });
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
    const obs = (horizontal ? this.hObs : this.vObs)[index] ?? NONE;
    for (const o of obs) if (!ask.allow?.has(o)) return undefined;
    let extra = 0;
    this.lastRail = ((horizontal ? this.hRail : this.vRail)[index] as number) === 1;
    this.lastShared = false;
    this.lastJoin = -1;
    /** この辺で越える値を足した組。幹を共に通る何本もの線を越える時も、1 本を越える値だけを足す */
    let charged: string[] | undefined;
    for (const m of (horizontal ? this.hMarks : this.vMarks)[index] ?? NONE) {
      const l = this.laid[m.laid] as Laid;
      if (l.group === ask.group) {
        // 同じ組の線は重ねて共に通ってよいが、少しずれて並ぶと二重の線に見えるため、重ならない時は間を取る
        if (m.rel === "along") {
          if (m.d > 0.5 && m.d < (l.width + ask.width) / 2 + ask.gap) return undefined;
          if (m.d <= 0.5) this.lastShared = true;
        } else if (m.d === 0 && this.lastJoin < 0) this.lastJoin = m.laid;
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
      if (charged?.includes(l.group)) continue;
      (charged ??= []).push(l.group);
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
    let join = -1;
    while (i !== ti || j !== tj) {
      const d: Dir = ti > i ? 0 : ti < i ? 2 : tj > j ? 1 : 3;
      const ni = i + DX[d];
      const nj = j + DY[d];
      const horizontal = d === 0 || d === 2;
      const index = horizontal ? j * this.nx + Math.min(i, ni) : Math.min(j, nj) * this.nx + i;
      if (this.edgeCost(ask, horizontal, index) === undefined) return false;
      // 同じ組の線を突き抜けない
      if (this.lastJoin >= 0 && this.lastJoin === join) return false;
      join = this.lastJoin;
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
    const { seen, best, from, goal, goalCost, hSeen, hCost, vSeen, vCost, hHug, vHug, hJoin, vJoin, guessSeen, guessVal } = workFor(nx * ny);
    const hug = ask.hug ?? 0;
    const share = ask.share ?? 1;
    const ep = ++epoch;
    const bestOf = (st: number): number => (seen[st] === ep ? (best[st] as number) : Number.POSITIVE_INFINITY);
    open.clear();
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
    // 見積もりは点と終わりの端だけで決まるため、同じ探しの中では点ごとに 1 度だけ求める。
    // 山に入れるたびに全ての終わりの端と比べると、開いた箱を持つ図では探しの時間の多くを使った (#3472)
    const guess = (i: number, j: number): number => {
      const node = j * nx + i;
      if (guessSeen[node] === ep) return guessVal[node] as number;
      const x = this.xs[i] as number;
      const y = this.ys[j] as number;
      let m = Number.POSITIVE_INFINITY;
      for (let k = 0; k < ex.length; k++) {
        const v = Math.abs((ex[k] as number) - x) + Math.abs((ey[k] as number) - y);
        if (v < m) m = v;
      }
      // 寄り添う辺は長さを減らして数えるため、見積もりも同じ割合で減らし、見積もりが本当の値を超えないようにする。
      // 同じ組の線と重なる辺はさらに減らして数えるが、見積もりは減らさない。見積もりが本当の値を超える所では、
      // 相手へ向かう幹を先に辿るため幹を共に通る道が早く見つかり、探す点の数も増えない
      const v = m * (1 - hug);
      guessSeen[node] = ep;
      guessVal[node] = v;
      return v;
    };
    /** 辺を通る時に足す値。通れない辺は -1。同じ探しの中では辺の値は変わらないため、1 度だけ求める */
    const edge = (horizontal: boolean, index: number): number => {
      const stamp = horizontal ? hSeen : vSeen;
      const cost = horizontal ? hCost : vCost;
      if (stamp[index] === ep) return cost[index] as number;
      const extra = this.edgeCost(ask, horizontal, index);
      stamp[index] = ep;
      cost[index] = extra === undefined ? -1 : extra;
      // 辺の走り方。0 はほかの線から離れて走る、1 は縁かほかの線の隣の筋に寄り添う、2 は同じ組の線と重なって走る
      (horizontal ? hHug : vHug)[index] = this.lastShared ? 2 : this.lastRail ? 1 : 0;
      (horizontal ? hJoin : vJoin)[index] = this.lastJoin;
      return cost[index];
    };
    /** 辺の長さに掛ける割合 */
    const rate = (run: number): number => (run === 2 ? share : run === 1 ? 1 - hug : 1);
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
      return len * rate((horizontal ? hHug : vHug)[index] as number) + extra;
    };
    /**
     * 点 (i, j) へ向き d で入った辺と、そのまま d へ進む辺が、同じ組の同じ線分を直角に越えるか。
     * 越えると同じ組の線を突き抜けて十字の継ぎ目になるため、その進み方を選ばない
     */
    const piercing = (i: number, j: number, d: Dir): boolean => {
      const horizontal = d === 0 || d === 2;
      const pi = i - DX[d];
      const pj = j - DY[d];
      const ni = i + DX[d];
      const nj = j + DY[d];
      if (pi < 0 || pj < 0 || ni < 0 || nj < 0 || pi >= nx || pj >= ny || ni >= nx || nj >= ny) return false;
      const joins = horizontal ? hJoin : vJoin;
      const stamp = horizontal ? hSeen : vSeen;
      const before = horizontal ? j * nx + Math.min(i, pi) : Math.min(j, pj) * nx + i;
      const after = horizontal ? j * nx + Math.min(i, ni) : Math.min(j, nj) * nx + i;
      if (stamp[before] !== ep || stamp[after] !== ep) return false;
      const a = joins[before] as number;
      return a >= 0 && a === joins[after];
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
        open.push(g + guess(ni, nj), state, g);
      }
    }
    let found = -1;
    let foundCost = Number.POSITIVE_INFINITY;
    const bend = ask.bend;
    while (open.size() > 0) {
      const state = open.pop();
      const g = best[state] as number;
      if (g >= foundCost) break;
      // 後から小さい値で入れ直した状態の古い物は飛ばす。新しい物は値が小さいため先に取り出して同じ値で広げ終えており、
      // 広げ直しても山に入れる物も辺の覚えも変わらない (#3472)。終わりの状態は、新しい物を広げずに終えた時があるため飛ばさない
      const isGoal = goal[state] === ep;
      if (!isGoal && open.poppedG > g) continue;
      const node = state >> 2;
      const d = (state & 3) as Dir;
      if (isGoal && g + (goalCost[state] as number) < foundCost) {
        found = state;
        foundCost = g + (goalCost[state] as number);
        continue;
      }
      const i = node % nx;
      const j = (node - i) / nx;
      // そのまま進む、右へ折れる、左へ折れるの順に試す
      for (let t = 0; t < 3; t++) {
        const nd = (t === 0 ? d : t === 1 ? (d + 1) & 3 : (d + 3) & 3) as Dir;
        const c = stepCost(i, j, nd);
        if (c < 0 || (t === 0 && piercing(i, j, d))) continue;
        const ni = i + DX[nd];
        const nj = j + DY[nd];
        const ng = t === 0 ? g + c : g + c + bend;
        const ns = (nj * nx + ni) * 4 + nd;
        if (seen[ns] !== ep || ng < (best[ns] as number)) {
          seen[ns] = ep;
          best[ns] = ng;
          from[ns] = state;
          open.push(ng + guess(ni, nj), ns, ng);
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
 * 前と後ろの線が逆向きに走る短い段差 (U の形) は、格子 (`grid`) を渡した時だけ、U の底の線を段差の向きに格子の線までずらして段差を `min` まで伸ばす。
 * 端の点は動かさない
 */
export function unjog(points: readonly Point[], min: number, ok: (a: Point, b: Point) => boolean, grid?: { xs: readonly number[]; ys: readonly number[] }): Point[] {
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
      // 前と後ろの線が両方在る時は、同じ向きに走る段差 (Z の形) を詰める。逆向き (U の形) を詰めると線が重なるため、U の底をずらして段差を伸ばす
      if (before && after) {
        const sameWay = near(before[0], p[0]) ? Math.sign(p[1] - before[1]) === Math.sign(after[1] - q[1]) : Math.sign(p[0] - before[0]) === Math.sign(after[0] - q[0]);
        if (!sameWay) {
          const grown = grid ? stretch(pts, i, min, ok, grid) : undefined;
          if (grown) {
            pts = grown;
            changed = true;
          }
          continue;
        }
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
          continue;
        }
      }
      // 詰められない Z の形の段差は、前の線を段差と逆の向きへ、または後ろの線を段差の向きへずらして `min` まで伸ばす。
      // 前と後ろの線の筋が、それぞれ別の部品の際で決まっていて揃えられない時に残る
      if (before && after && len > 0.5) {
        const grown = widen(pts, i, min, ok, grid);
        if (grown) {
          pts = grown;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return pts;
}

/**
 * U の形の短い段差 (`pts[i]` から `pts[i + 1]`) を `min` まで伸ばす。段差の後ろの線を段差の向きへ、段差の前の線を逆の向きへ、
 * 格子の線までずらす。ずらした線と、その先の線が `min` 以上で通れる時だけ採る。端の点は動かさない
 */
function stretch(pts: readonly Point[], i: number, min: number, ok: (a: Point, b: Point) => boolean, grid: { xs: readonly number[]; ys: readonly number[] }): Point[] | undefined {
  const p = pts[i] as Point;
  const q = pts[i + 1] as Point;
  const vertical = near(p[0], q[0]);
  const axis = vertical ? 1 : 0;
  const lines = vertical ? grid.ys : grid.xs;
  const dir = Math.sign(q[axis] - p[axis]);
  const at = (v: Point, c: number): Point => (vertical ? [v[0], c] : [c, v[1]]);
  // 段差の終わりを先へ。後ろの線 (q から after) を段差の向きにずらし、その先の線 (after から a2) が短くなる
  const after = pts[i + 2];
  const a2 = pts[i + 3];
  if (after && a2) {
    const ends = lines.filter((c) => (c - p[axis]) * dir >= min).sort((u, v) => Math.abs(u - p[axis]) - Math.abs(v - p[axis]));
    for (const c of ends.slice(0, 4)) {
      const q2 = at(q, c);
      const after2 = at(after, c);
      const rest = (a2[axis] - c) * Math.sign(a2[axis] - after[axis]);
      if (rest < min || Math.sign(a2[axis] - c) !== Math.sign(a2[axis] - after[axis])) continue;
      if (ok(p, q2) && ok(q2, after2) && ok(after2, a2)) return simplify([...pts.slice(0, i + 1), q2, after2, ...pts.slice(i + 3)]);
    }
  }
  // 段差の始まりを手前へ。前の線 (before から p) を段差の逆の向きにずらし、その手前の線 (b2 から before) が短くなる
  const before = pts[i - 1];
  const b2 = pts[i - 2];
  if (before && b2) {
    const starts = lines.filter((c) => (q[axis] - c) * dir >= min).sort((u, v) => Math.abs(u - q[axis]) - Math.abs(v - q[axis]));
    for (const c of starts.slice(0, 4)) {
      const p2 = at(p, c);
      const before2 = at(before, c);
      const rest = (c - b2[axis]) * Math.sign(before[axis] - b2[axis]);
      if (rest < min || Math.sign(c - b2[axis]) !== Math.sign(before[axis] - b2[axis])) continue;
      if (ok(b2, before2) && ok(before2, p2) && ok(p2, q)) return simplify([...pts.slice(0, i - 1), before2, p2, ...pts.slice(i + 1)]);
    }
  }
  return undefined;
}

/**
 * Z の形の短い段差 (`pts[i]` から `pts[i + 1]`) を `min` まで伸ばす。段差の前の線を段差と逆の向きへずらすか、
 * 後ろの線を段差の向きへずらす。ずらす先は、格子 (`grid`) を渡した時は格子の線、渡さない時は段差がちょうど `min` になる所。
 * ずらした線と、その前と後ろの線が `ok` で通れる時だけ採る。端の点は動かさない
 */
function widen(
  pts: readonly Point[],
  i: number,
  min: number,
  ok: (a: Point, b: Point) => boolean,
  grid?: { xs: readonly number[]; ys: readonly number[] },
): Point[] | undefined {
  const p = pts[i] as Point;
  const q = pts[i + 1] as Point;
  const axis = near(p[0], q[0]) ? 1 : 0;
  const dir = Math.sign(q[axis] - p[axis]);
  const at = (v: Point, c: number): Point => (axis === 1 ? [v[0], c] : [c, v[1]]);
  const lines = grid ? (axis === 1 ? grid.ys : grid.xs) : undefined;
  /** 基の点 `from` から `dir` の逆 (`sign` が -1) か同じ向き (1) へ、`min` 以上離れた筋。近い順 */
  const targets = (from: number, sign: number): number[] =>
    lines
      ? lines.filter((c) => (c - from) * sign * dir >= min - 0.5).sort((u, v) => Math.abs(u - from) - Math.abs(v - from)).slice(0, 4)
      : [from + sign * dir * min];
  const before = pts[i - 1];
  const b2 = pts[i - 2];
  if (before && b2)
    for (const c of targets(q[axis], -1)) {
      const mb = at(before, c);
      const mp = at(p, c);
      if (ok(b2, mb) && ok(mb, mp) && ok(mp, q)) return simplify([...pts.slice(0, i - 1), mb, mp, ...pts.slice(i + 1)]);
    }
  const after = pts[i + 2];
  const a2 = pts[i + 3];
  if (after && a2)
    for (const c of targets(p[axis], 1)) {
      const mq = at(q, c);
      const ma = at(after, c);
      if (ok(p, mq) && ok(mq, ma) && ok(ma, a2)) return simplify([...pts.slice(0, i + 1), mq, ma, ...pts.slice(i + 3)]);
    }
  return undefined;
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
