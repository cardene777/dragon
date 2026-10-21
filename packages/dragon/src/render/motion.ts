/**
 * 時刻の点の並びから CSS の keyframes を組む道具。見本帳の `engine.js` の `kf` / `vis` / `rise` / `pop` / `move` を写す。
 *
 * 動きは全て 1 周 `total` 秒の keyframes で、点の時刻は 1 周の中の割合 (%) に直す。
 * 性質ごとに独立して補間されるので、点ごとに変える性質だけを書く。
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
  ) {}

  private pct(t: number): number {
    return +((Math.min(Math.max(t, 0), this.total) / this.total) * 100).toFixed(3);
  }

  /** keyframes を 1 つ足し、その名前を付ける style の字を返す。 */
  kf(points: Frame[]): string {
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
