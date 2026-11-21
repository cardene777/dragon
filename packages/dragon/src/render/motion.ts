/**
 * 時刻の点の並びから CSS の keyframes を組む道具。見本帳の `engine.js` の `kf` / `vis` / `rise` / `pop` / `move` を写す。
 *
 * 動きは全て 1 周 `total` 秒の keyframes で、点の時刻は 1 周の中の割合 (%) に直す。
 * 性質ごとに独立して補間されるので、点ごとに変える性質だけを書く。
 *
 * 止める時刻 `freeze` を渡すと (頁に止めて置く図、#3812)、keyframes を組まず、その時刻の性質ごとの値を style の字で返す。
 * 頁が動きを切る規則 (`animation: none`) を持っても、止めて置く図の形は動く前の形に戻らない。
 * 動いている途中の時刻では、前の点の緩急どおりに前後の点の数を補う。
 */
import { EASE, LOOK, MOTION } from "../look/values";

export type Props = Record<string, string | number>;
export type Frame = [time: number, props: Props, ease?: string];

const r2 = (v: number): number => Math.round(v * 100) / 100;

export class Motion {
  readonly frames: string[] = [];
  private count = 0;

  constructor(
    private readonly prefix: string,
    readonly total: number,
    readonly last: number,
    private readonly freeze?: number,
  ) {}

  private pct(t: number): number {
    return +((Math.min(Math.max(t, 0), this.total) / this.total) * 100).toFixed(3);
  }

  /** keyframes を 1 つ足し、その名前を付ける style の字を返す。止める時刻を持つ時は、その時刻の値の style の字を返す */
  kf(points: Frame[]): string {
    if (this.freeze !== undefined) return frozen(points, this.freeze);
    const name = `${this.prefix}-${this.count++}`;
    const at = new Map<number, { props: Props; ease?: string }>();
    for (const [t, props, ease] of [...points].sort((a, b) => a[0] - b[0])) {
      const p = this.pct(t);
      const cur = at.get(p) ?? { props: {} };
      Object.assign(cur.props, props);
      if (ease) cur.ease = ease;
      at.set(p, cur);
    }
    const body = [...at]
      .map(([p, { props, ease }]) => {
        const d = Object.entries(props).map(([k, v]) => `${k}:${v}`);
        if (ease) d.push(`animation-timing-function:${ease}`);
        return `${p}%{${d.join(";")}}`;
      })
      .join("");
    this.frames.push(`@keyframes ${name}{${body}}`);
    return `animation-name:${name}`;
  }

  /** `a` で出て `b` から消える。`within` を立てると `b` までに消え終わる。 */
  vis(a: number, b = this.last, o: { f?: number; on?: Props; off?: Props; ein?: string; within?: boolean } = {}): string {
    const f = o.f ?? MOTION.fade;
    const on = o.on ?? {};
    const off = o.off ?? {};
    const out = o.within ? Math.max(a + f, b - f) : b;
    return this.kf([
      [0, { opacity: 0, ...off }],
      [a, { opacity: 0, ...off }, o.ein ?? EASE.out],
      [a + f, { opacity: 1, ...on }],
      [out, { opacity: 1, ...on }, EASE.inOut],
      [Math.min(out + f, this.total), { opacity: 0, ...off }],
      [this.total, { opacity: 0, ...off }],
    ]);
  }

  /** 少し下から浮いて出る。 */
  rise(a: number, b = this.last, within = false): string {
    return this.vis(a, b, { on: { transform: "translateY(0)" }, off: { transform: `translateY(${LOOK.rise}px)` }, within });
  }

  /** 小さな所から弾んで出る。 */
  pop(a: number, b = this.last): string {
    return this.vis(a, b, { f: MOTION.popFade, ein: EASE.pop, on: { transform: "scale(1)" }, off: { transform: `scale(${LOOK.popFrom})` } });
  }

  /** 初めから出ていて `b` で消える。 */
  until(b: number): string {
    const f = MOTION.untilFade;
    return this.kf([
      [0, { opacity: 1 }],
      [b, { opacity: 1 }, EASE.inOut],
      [b + f, { opacity: 0 }],
      [this.last, { opacity: 0 }],
      [this.total, { opacity: 1 }],
    ]);
  }

  /** 点を辿って動く。`[時刻, x, y, 大きさ, 次の点までの緩急]` の並び。 */
  move(points: [number, number, number, number?, string?][], extra: Frame[] = []): string {
    return this.kf(
      points.map(([t, x, y, s = 1, ease]): Frame => [t, { transform: `translate(${r2(x)}px,${r2(y)}px) scale(${s})` }, ease]).concat(extra),
    );
  }

  /** `a` から `b` まで見え、`fade` 秒で消える。 */
  blink(a: number, b: number, fade: number): Frame[] {
    return [
      [0, { opacity: 0 }],
      [a - 0.01, { opacity: 0 }],
      [a, { opacity: 1 }],
      [b, { opacity: 1 }],
      [b + fade, { opacity: 0 }],
      [this.total, { opacity: 0 }],
    ];
  }
}

/** `cubic-bezier(x1,y1,x2,y2)` の緩急で、進み `x` (0 から 1) の時の値の進み。書いていない区間は等速 (`.dg-a` の既定) */
function eased(spec: string | undefined, x: number): number {
  const m = /cubic-bezier\(([^)]+)\)/u.exec(spec ?? "");
  if (!m) return x;
  const [x1, y1, x2, y2] = (m[1] as string).split(",").map(Number) as [number, number, number, number];
  const at = (t: number, a: number, b: number): number => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid, x1, x2) < x) lo = mid;
    else hi = mid;
  }
  return at((lo + hi) / 2, y1, y2);
}

/** 2 つの値の字の間の、進み `k` の値。数の並びの形が同じ時だけ数を補い、違う時は前の値を保つ */
function between(a: string, b: string, k: number): string {
  if (a === b || k <= 0) return a;
  if (k >= 1) return b;
  const num = /-?\d*\.?\d+(?:e[-+]?\d+)?/giu;
  const as = a.match(num) ?? [];
  const bs = b.match(num) ?? [];
  if (as.length === 0 || as.length !== bs.length || a.replace(num, "#") !== b.replace(num, "#")) return a;
  let i = 0;
  return a.replace(num, (v) => {
    const to = Number(bs[i++]);
    return String(Math.round((Number(v) + (to - Number(v)) * k) * 1000) / 1000);
  });
}

/** 点の並び `points` の、時刻 `t` の性質ごとの値の style の字。性質は最初に出た順に並べる */
function frozen(points: Frame[], t: number): string {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const props: string[] = [];
  for (const [, p] of sorted) for (const k of Object.keys(p)) if (!props.includes(k)) props.push(k);
  return props
    .map((prop) => {
      const own = sorted.filter(([, p]) => prop in p);
      const before = own.filter(([at]) => at <= t).at(-1) ?? own[0];
      const after = own.find(([at]) => at > t);
      if (!before) return "";
      const from = String(before[1][prop]);
      if (!after || before[0] > t) return `${prop}:${from}`;
      const k = eased(before[2], (t - before[0]) / (after[0] - before[0]));
      return `${prop}:${between(from, String(after[1][prop]), k)}`;
    })
    .filter((d) => d !== "")
    .join(";");
}
