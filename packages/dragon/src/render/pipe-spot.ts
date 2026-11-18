/**
 * 配管の図の呼び出しの札の置き場所を探す道具 (#3737)。
 *
 * 札の候補は格子に並べ、候補ごとに障りの物と重なるか、重なる面積の和、道の点までの一番近い隔たりを測る。
 * 全部の物と全部の点を候補ごとに見ると、箱を開いた図では 1 回描くのに CPU を 1 秒近く使う。
 * ここでは候補の列ごとに横で重なる物だけを前もって絞り、道の点は札から遠い区間と点を外して、同じ式で同じ値を返す。
 * 値が同じなので、選ぶ札の場所は全部を見る時と変わらない。
 */
import type { Point, Rect } from "../layout/scene";

/** 札 `r` と物 `o` が、隙間 `gap` の内まで重なるか */
export const meets = (r: Rect, o: Rect, gap: number): boolean =>
  Math.min(r.x + r.w, o.x + o.w + gap) - Math.max(r.x, o.x - gap) > 0 && Math.min(r.y + r.h, o.y + o.h + gap) - Math.max(r.y, o.y - gap) > 0;

/** 札 `r` が物と隙間 `gap` の内まで重なる面積の和。並びの順に足す */
export function overlapOf(r: Rect, lists: readonly (readonly Rect[])[], gap: number): number {
  let sum = 0;
  for (const list of lists)
    for (const o of list) {
      const ix = Math.min(r.x + r.w, o.x + o.w + gap) - Math.max(r.x, o.x - gap);
      const iy = Math.min(r.y + r.h, o.y + o.h + gap) - Math.max(r.y, o.y - gap);
      if (ix > 0 && iy > 0) sum += ix * iy;
    }
  return sum;
}

/** 札 `r` から点までの隔たり。点が札の中に在る時は 0 */
export const far = (r: Rect, [px, py]: Point): number => Math.hypot(px - Math.max(r.x, Math.min(px, r.x + r.w)), py - Math.max(r.y, Math.min(py, r.y + r.h)));

/** 2つの四角の間の隔たり。重なる時は 0。四角 `b` の中のどの点から `a` までの隔たりもこれより短くならない */
export const gapOf = (a: Rect, b: Rect): number =>
  Math.hypot(Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w)), Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h)));

/** `lo` から `step` ずつ足して `hi` を超えない所までの値。札の候補の格子の 1 辺 */
export function gridOf(lo: number, hi: number, step: number): number[] {
  const out: number[] = [];
  for (let v = lo; v <= hi; v += step) out.push(v);
  return out;
}

/** 格子の 1 列で横に重なる物。`at` は物の番号 (並びの順)、`ix` は横の重なりの幅 */
interface Column {
  at: number[];
  ix: number[];
  blocked?: Uint8Array;
  overlap?: Float64Array;
}

/**
 * 幅 `w` 高さ `h` の札を、格子 `xs` × `ys` の点に置いた時の、物との重なり。`xs` と `ys` は `gridOf` が返す増える並び。
 * 物は `lists` の並びの順に見る (置いた札は障りの物の後ろに並べる)。
 *
 * 横の重なり `min(x + w, x1) - max(x, x0) > 0` は、x + w > x0 と x1 > x と x1 > x0 と x + w > x が全て成り立つ時だけ成り立つ。
 * 列が右へ進むほど x と x + w は増えるので、物を左端の順に並べて列を左から掃くと、x + w > x0 になった物は後の列でも成り立ち、
 * x1 > x でなくなった物は後の列でも成り立たない。縦の重なりも同じく 4 つの比べに分け、重なる行の始まりと終わりを 2 分探しで求める。
 * 面積の和は物の並びの順に足すので、`meets` と `overlapOf` と同じ答えになる
 */
export class SpotGrid {
  private readonly x0: number[] = [];
  private readonly x1: number[] = [];
  private readonly y0: number[] = [];
  private readonly y1: number[] = [];
  /** 行ごとの札の下端 */
  private readonly bottoms: Float64Array;
  private readonly columns: (Column | undefined)[];
  /** 横幅の在る物を左端の順に並べた番号と、次に掃き入れる所と、今の列で横に掛かりうる物 */
  private readonly order: number[];
  private next = 0;
  private active: number[] = [];
  private swept = -1;
  /** 物ごとの縦で掛かりうる行の始まりと終わり。まだ求めていない物は -1 */
  private readonly from: Int32Array;
  private readonly to: Int32Array;

  constructor(
    private readonly xs: readonly number[],
    private readonly ys: readonly number[],
    private readonly w: number,
    h: number,
    lists: readonly (readonly Rect[])[],
    gap: number,
  ) {
    for (const list of lists)
      for (const o of list) {
        this.x0.push(o.x - gap);
        this.x1.push(o.x + o.w + gap);
        this.y0.push(o.y - gap);
        this.y1.push(o.y + o.h + gap);
      }
    this.bottoms = Float64Array.from(ys, (y) => y + h);
    this.columns = new Array<Column | undefined>(xs.length);
    this.order = this.x0.map((_, k) => k).filter((k) => (this.x1[k] as number) > (this.x0[k] as number)).sort((a, b) => (this.x0[a] as number) - (this.x0[b] as number));
    this.from = new Int32Array(this.x0.length).fill(-1);
    this.to = new Int32Array(this.x0.length);
  }

  private column(i: number): Column {
    const had = this.columns[i];
    if (had) return had;
    const x = this.xs[i] as number;
    const right = x + this.w;
    // 左から順に求められた列は掃いて作り、戻って求められた列は全ての物を見る
    let pool: readonly number[] = this.order;
    if (i > this.swept) {
      while (this.next < this.order.length && right > (this.x0[this.order[this.next] as number] as number)) this.active.push(this.order[this.next++] as number);
      let keep = 0;
      for (const k of this.active) if ((this.x1[k] as number) > x) this.active[keep++] = k;
      this.active.length = keep;
      this.swept = i;
      pool = this.active;
    }
    const col: Column = { at: [], ix: [] };
    for (const k of pool) {
      const ix = Math.min(right, this.x1[k] as number) - Math.max(x, this.x0[k] as number);
      if (ix > 0) {
        col.at.push(k);
        col.ix.push(ix);
      }
    }
    this.columns[i] = col;
    return col;
  }

  /**
   * 物 `k` に縦で掛かりうる行の始まりと終わり (終わりは含まない)。y + h > y0 の行は後ろへ、y1 > y の行は前へ続く。
   * 行は列に依らないので、物ごとに 1 度だけ求めて `from` と `to` に覚える
   */
  private rowsOf(k: number): void {
    if ((this.from[k] as number) >= 0) return;
    const top = this.y0[k] as number;
    const bottom = this.y1[k] as number;
    if (!(bottom > top)) {
      this.from[k] = 0;
      this.to[k] = 0;
      return;
    }
    let lo = 0;
    let hi = this.ys.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((this.bottoms[mid] as number) > top) hi = mid;
      else lo = mid + 1;
    }
    this.from[k] = lo;
    hi = this.ys.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (!(bottom > (this.ys[mid] as number))) hi = mid;
      else lo = mid + 1;
    }
    this.to[k] = lo;
  }

  /** 列 `i` の行ごとに、札がどれかの物に隙間の内まで重なるか (重なる行が 1) */
  blockedColumn(i: number): Uint8Array {
    const col = this.column(i);
    if (!col.blocked) {
      const n = this.ys.length;
      const edges = new Int32Array(n + 1);
      for (const k of col.at) {
        this.rowsOf(k);
        const from = this.from[k] as number;
        const to = this.to[k] as number;
        if (from < to) {
          edges[from] = (edges[from] as number) + 1;
          edges[to] = (edges[to] as number) - 1;
        }
      }
      const blocked = new Uint8Array(n);
      let open = 0;
      for (let row = 0; row < n; row++) {
        open += edges[row] as number;
        blocked[row] = open > 0 && (this.bottoms[row] as number) > (this.ys[row] as number) ? 1 : 0;
      }
      col.blocked = blocked;
    }
    return col.blocked;
  }

  /** 格子の点 (`i`, `j`) の札が、どれかの物に隙間の内まで重なるか */
  blocked(i: number, j: number): boolean {
    return this.blockedColumn(i)[j] === 1;
  }

  /** 格子の点 (`i`, `j`) の札が物と隙間の内まで重なる面積の和 (`overlapOf` と同じ値) */
  overlap(i: number, j: number): number {
    const col = this.column(i);
    if (!col.overlap) {
      // 物の並びの順に、物が縦に掛かる行だけへ足す。どの行にも並びの順に足すので、足す順と丸めは全部を見る時と変わらない
      const byIndex = col.at.map((k, n): [number, number] => [k, col.ix[n] as number]).sort((a, b) => a[0] - b[0]);
      const sums = new Float64Array(this.ys.length);
      for (const [k, ix] of byIndex) {
        const top = this.y0[k] as number;
        const bottom = this.y1[k] as number;
        this.rowsOf(k);
        for (let row = this.from[k] as number; row < (this.to[k] as number); row++) {
          const iy = Math.min(this.bottoms[row] as number, bottom) - Math.max(this.ys[row] as number, top);
          if (iy > 0) sums[row] = (sums[row] as number) + ix * iy;
        }
      }
      col.overlap = sums;
    }
    return col.overlap[j] as number;
  }
}

/** 道の点と札の隔たりを測る升目の 1 辺 */
const CELL = 64;
const cellKey = (cx: number, cy: number): number => (cx + 4096) * 8192 + (cy + 4096);

/** `share` が求めた、区間の端からの割合の範囲 (0 から 1) */
const SHARE = new Float64Array(2);

/**
 * 区間の端 `a` から `b` へ動く点の座標が `lo` から `hi` の間に在りうる、端からの割合の範囲を `SHARE` に書く。
 * 区間がこの向きに動かず、座標が間の外に在る時は偽を返す
 */
function share(a: number, b: number, lo: number, hi: number): boolean {
  const d = b - a;
  if (d === 0) {
    SHARE[0] = 0;
    SHARE[1] = 1;
    return !(a < lo || a > hi);
  }
  const u = (lo - a) / d;
  const v = (hi - a) / d;
  SHARE[0] = Math.max(0, Math.min(u, v));
  SHARE[1] = Math.min(1, Math.max(u, v));
  return true;
}

/**
 * 呼び出しの道 `pts` の上に 12px より狭い刻みで並べた点。札から一番近い点を探す。
 * 札から一番近い隔たりより遠いと分かる区間と点は測らない。区間は外枠までの横と縦の離れの大きい方で、点は札をその隔たりだけ広げた枠の外かで分ける。
 * どちらも点までの隔たりより長くならないので、外した点はどれも一番近い隔たりより遠く、全部の点を順に見る時と同じ点を返す。端の丸めの差で外さないよう 1px 余す
 */
export class PathPoints {
  readonly along: Point[] = [];
  /** 区間ごとの外枠 */
  readonly spans: Rect[];
  /** 区間ごとの点の始まり。最後の区間の終わりを末尾に持つ */
  private readonly starts: number[] = [];
  private readonly ends: [Point, Point][] = [];
  /** 区間ごとの、札から外枠までの隔たりより短い値 */
  private readonly lows: Float64Array;
  /** `pointsNear` が求めた点の始まりと終わり */
  private from = 0;
  private to = 0;
  private cells?: Map<number, Point[]>;

  constructor(pts: readonly Point[]) {
    pts.slice(1).forEach((q, i) => {
      const p = pts[i] as Point;
      const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 12));
      this.starts.push(this.along.length);
      this.ends.push([p, q]);
      this.along.push(...Array.from({ length: n + 1 }, (_, k): Point => [p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n]));
    });
    this.starts.push(this.along.length);
    this.spans = pts.slice(1).map((q, i): Rect => {
      const p = pts[i] as Point;
      return { x: Math.min(p[0], q[0]), y: Math.min(p[1], q[1]), w: Math.abs(q[0] - p[0]), h: Math.abs(q[1] - p[1]) };
    });
    this.lows = new Float64Array(this.spans.length);
  }

  /**
   * 区間 `s` の点のうち、札 `r` を `reach` だけ広げた枠に入りうる点の始まりと終わり (終わりは含まない) を `from` と `to` に書く。
   * 点は区間の端から端へ同じ刻みで並ぶので、枠の端が区間のどこに当たるかから求め、丸めの差の分だけ 1 つ広げる
   */
  private pointsNear(s: number, r: Rect, reach: number): void {
    const start = this.starts[s] as number;
    const n = (this.starts[s + 1] as number) - start - 1;
    const [p, q] = this.ends[s] as [Point, Point];
    this.from = start;
    this.to = start;
    if (!share(p[0], q[0], r.x - reach, r.x + r.w + reach)) return;
    let t0 = SHARE[0] as number;
    let t1 = SHARE[1] as number;
    if (!share(p[1], q[1], r.y - reach, r.y + r.h + reach)) return;
    t0 = Math.max(t0, SHARE[0] as number);
    t1 = Math.min(t1, SHARE[1] as number);
    if (!(t0 <= t1)) return;
    this.from = start + Math.max(0, Math.floor(t0 * n) - 1);
    this.to = start + Math.min(n, Math.ceil(t1 * n) + 1) + 1;
  }

  /** 札 `r` から一番近い点と隔たり。同じ隔たりの点は先の点 */
  nearest(r: Rect): { point: Point; d: number } {
    const first = this.along[0] as Point;
    const d0 = far(r, first);
    // 外枠が一番近い区間の点から測った隔たりを、一番近い隔たりの上限にする
    let nearest = 0;
    let nan = Number.isNaN(d0);
    for (let s = 0; s < this.spans.length; s++) {
      const b = this.spans[s] as Rect;
      const low = Math.max(0, r.x - (b.x + b.w), b.x - (r.x + r.w), r.y - (b.y + b.h), b.y - (r.y + r.h)) - 1;
      this.lows[s] = low;
      if (Number.isNaN(low)) nan = true;
      else if (low < (this.lows[nearest] as number)) nearest = s;
    }
    // 数でない隔たりは比べると偽になり、全部の点を順に見る時は最初の点のままか読み飛ばされる。外し方が使えないので順に見る
    if (nan) return this.inOrder(r);
    let bound = d0;
    this.pointsNear(nearest, r, bound + 1);
    for (let k = this.from; k < this.to; k++) bound = Math.min(bound, far(r, this.along[k] as Point));
    // 上限より遠い区間と点は答えにならない。残りを道の順に見て、一番近い最初の点を取る
    let point = first;
    let d = d0;
    for (let s = 0; s < this.spans.length; s++) {
      if ((this.lows[s] as number) > bound) continue;
      this.pointsNear(s, r, bound + 1);
      for (let k = this.from; k < this.to; k++) {
        const p = this.along[k] as Point;
        const e = far(r, p);
        if (e < d) {
          d = e;
          point = p;
        }
      }
    }
    return { point, d };
  }

  /** 全部の点を順に見て、一番近い最初の点を返す */
  private inOrder(r: Rect): { point: Point; d: number } {
    let point = this.along[0] as Point;
    let d = far(r, point);
    for (const p of this.along) {
      const e = far(r, p);
      if (e < d) {
        d = e;
        point = p;
      }
    }
    return { point, d };
  }

  /**
   * 札 `r` から `reach` 以内の点で測った一番近い隔たり。`reach` 以内に点が無い時は `reach` より大きい値。
   * 点を 1 辺 64px の升目に分け、札を `reach` だけ広げた枠に掛かる升目の点だけを見る
   */
  nearestWithin(r: Rect, reach: number): number {
    if (!this.cells) {
      const cells = new Map<number, Point[]>();
      for (const p of this.along) {
        const key = cellKey(Math.floor(p[0] / CELL), Math.floor(p[1] / CELL));
        const list = cells.get(key);
        if (list) list.push(p);
        else cells.set(key, [p]);
      }
      this.cells = cells;
    }
    let near = Number.POSITIVE_INFINITY;
    for (let cx = Math.floor((r.x - reach) / CELL); cx <= Math.floor((r.x + r.w + reach) / CELL); cx++)
      for (let cy = Math.floor((r.y - reach) / CELL); cy <= Math.floor((r.y + r.h + reach) / CELL); cy++) for (const p of this.cells.get(cellKey(cx, cy)) ?? []) near = Math.min(near, far(r, p));
    return near;
  }
}
