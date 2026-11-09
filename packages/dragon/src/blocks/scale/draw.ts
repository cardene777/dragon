/**
 * 目盛りと針の描き方と、時間軸の図のブロックの描き方が共に受ける描く状態 (#3165、#3348)。
 *
 * 区切りの地は 1 つおきに薄く塗り、時刻の目盛りの線と字と区切りの名前と番号を軸に置く。
 * 範囲の括弧は次の括弧が来る段まで、範囲の囲みは最後まで出す。針は時刻の表の針の動きを辿り、繰り返す前に左端へ戻る。
 * 針と時刻の目盛りの線と字は、時間軸の囲みの枠の内に収める部品として記録する。崩れの確かめが枠に掛かる部品を名指すため (#3527)。
 * 時間軸の図を描く部品 (`render/time.ts`) は描く状態 (`TimeKit`) を 1 つ組み、各ブロックの描き方を今の層の順に呼ぶ。
 * 描き方は描いた物を層 (`base`、`lit`、`node`、`top`) に積み、呼ぶ順が動きの名前の番号を決める。
 * この file は時間軸の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { TimeLayout } from "../../kinds/time/layout";
import { hasWide, textBox } from "../../layout/measure";
import type { Rect } from "../../layout/scene";
import { LOOK, TYPE } from "../../look/values";
import type { SubChange } from "../box/draw";
import { partRadius } from "../../render/corner";
import { ALWAYS, type FramedPart, type Shown } from "../../render/ink";
import { type Ctx, esc, r1, write } from "../../render/parts";
import type { DiagramModel } from "../../schema";
import type { Span, Timeline } from "../../timeline";
import { cs } from "../color/draw";

/** 時間軸の図のブロックの描き方が受ける、描く状態 */
export interface TimeKit {
  readonly layout: TimeLayout;
  readonly diagram: DiagramModel;
  readonly timeline: Timeline;
  readonly ctx: Ctx;
  readonly subs: Map<string, SubChange[]>;
  /** 層。下から、地と印と目盛り (`base`)、線 (`lit`)、箱と節目 (`node`)、札と針 (`top`) */
  readonly base: string[];
  readonly lit: string[];
  readonly node: string[];
  readonly top: string[];
  /** 段 `step` の出来事 `event` が起きる時刻 */
  readonly at: (step: number, event: number) => number | undefined;
  /** 目盛りごとの、針が過ぎる時刻 */
  readonly passed: ReadonlyMap<number, number>;
  /** 印の列 `row` の目盛り `u` の印を塗る時刻 */
  readonly filled: (row: string, u: number) => number | undefined;
  /** 印の列の並びの上端と下端 */
  readonly rowsTop: number;
  readonly rowsBottom: number;
}

/** 和文を含む字に、同じ大きさと太さの和文の字の class を足す */
export const ja = (cls: string, text: string): string => (hasWide(text) ? `${cls} ${cls}j` : cls);

/** 真っ直ぐ進む動きの並びから、向きの変わらない間の点を除く。keyframes の数を減らすため */
export function simplify(keys: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const key of keys) {
    const a = out[out.length - 2];
    const b = out[out.length - 1];
    if (a && b) {
      const s1 = b[0] === a[0] ? Number.NaN : (b[1] - a[1]) / (b[0] - a[0]);
      const s2 = key[0] === b[0] ? Number.NaN : (key[1] - b[1]) / (key[0] - b[0]);
      if (Number.isFinite(s1) && Number.isFinite(s2) && Math.abs(s1 - s2) < 1e-9) out[out.length - 1] = key;
      else out.push(key);
    } else out.push(key);
  }
  return out;
}

/** 真っ直ぐ進む動き `keys` の、時刻 `t` の値 */
export function valueAt(keys: [number, number][], t: number): number {
  const first = keys[0];
  if (!first) return 0;
  if (t <= first[0]) return first[1];
  for (let k = 1; k < keys.length; k++) {
    const [t1, v1] = keys[k] as [number, number];
    const [t0, v0] = keys[k - 1] as [number, number];
    if (t <= t1) return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
  }
  return (keys[keys.length - 1] as [number, number])[1];
}

/** 時間軸の囲みの枠の内に収める部品を記録する (#3527)。崩れの確かめ (`render/breaks.ts`) が、枠の線に近すぎる部品を段と名前で知らせる */
export function frame(k: TimeKit, part: FramedPart, rect: Rect, shown: Shown[] = ALWAYS): void {
  const panel = k.layout.regions.find((r) => r.id === "axis");
  if (panel) k.ctx.framed.push({ part, rect, frame: panel, shown });
}

/** 区切りの地。1 つおきに薄く塗る */
export function periodShades(k: TimeKit): void {
  const T = LOOK.time;
  for (const p of k.layout.periods)
    if (p.index % 2 === 1)
      k.base.push(
        `<rect class="dg-tm-ep" x="${r1(p.x)}" y="${r1(k.rowsTop - T.shade)}" width="${r1(p.w)}" height="${r1(k.rowsBottom - k.rowsTop + T.shade * 2)}" rx="${partRadius(k.ctx.corner, 4)}"/>`,
      );
}

/** 時刻の目盛りの線と字と、区切りの名前と番号 */
export function axisTicks(k: TimeKit): void {
  const T = LOOK.time;
  const { layout, ctx, base } = k;
  const { axis } = layout;
  const x = (u: number): number => r1(axis.x + u * axis.unit);
  const majors = (layout.longTicks ?? layout.ticks.map((t) => t.at)).map((u) => `M ${x(u)} ${r1(axis.line - T.major / 2)} V ${r1(axis.line + T.major / 2)}`);
  const minors = layout.minor.map((u) => `M ${x(u)} ${r1(axis.line - T.minor / 2)} V ${r1(axis.line + T.minor / 2)}`);
  base.push(`<path class="dg-tm-ax" d="M ${x(0)} ${r1(axis.line)} H ${x(axis.count)} ${[...majors, ...minors].join(" ")}"/>`);
  // 軸の線と目盛りの線は、軸の両端に長い目盛りの線の長さで、線の太さを持って引く
  const half = LOOK.stroke.timeAxis / 2;
  frame(k, { kind: "ticks" }, { x: axis.x - half, y: axis.line - T.major / 2, w: axis.count * axis.unit + half * 2, h: T.major });
  for (const t of layout.ticks) {
    base.push(write(ctx.ink, ja("dg-tm-tk", t.text), t.left, t.y, t.text, TYPE.timeTick));
    frame(k, { kind: "text", text: t.text }, textBox(t.text, t.left, t.y, TYPE.timeTick));
  }
  for (const p of layout.periods) {
    base.push(write(ctx.ink, ja("dg-tm-en", p.name), p.x + p.w / 2, p.nameY, p.name, TYPE.timePeriod, ALWAYS, "middle"));
    base.push(write(ctx.ink, ja("dg-tm-er", p.range), p.x + p.w / 2, p.rangeY, p.range, TYPE.timeRange, ALWAYS, "middle"));
    frame(k, { kind: "text", text: p.name }, textBox(p.name, p.x + p.w / 2, p.nameY, TYPE.timePeriod, "middle"));
    frame(k, { kind: "text", text: p.range }, textBox(p.range, p.x + p.w / 2, p.rangeY, TYPE.timeRange, "middle"));
  }
}

/** 範囲の括弧と囲み。括弧は次の括弧が来る段まで、囲みは最後まで出し、囲みの字は縁の札にする */
export function spans(k: TimeKit): void {
  const { layout, timeline, ctx, base, top } = k;
  const { m, ink } = ctx;
  for (const span of layout.spans) {
    const a = k.at(span.step, span.event);
    if (a === undefined) continue;
    const until = span.until === undefined ? undefined : (timeline.steps[span.until] as Span).start;
    const shown: Shown[] = [[a, until ?? Number.POSITIVE_INFINITY]];
    const vis = until === undefined ? m.vis(a) : m.vis(a, until, { within: true });
    if (span.kind === "bracket") {
      const [x0, x1, y0, y1] = [r1(span.x + 1), r1(span.x + span.w - 1), r1(span.y), r1(span.y + span.h)];
      const words = write(ink, ja("dg-tm-bt", span.text), span.textRect.x + span.textRect.w / 2, span.textY, span.text, TYPE.spanText, shown, "middle");
      base.push(`<g class="dg-a" data-span="${span.step}" style="${cs(span.color)};${vis}"><path class="dg-tm-br" d="M ${x0} ${y0} L ${x0} ${y1} L ${x1} ${y1} L ${x1} ${y0}"/>${words}</g>`);
      continue;
    }
    base.push(
      `<g class="dg-a" data-span="${span.step}" style="${cs(span.color)};${vis}"><rect class="dg-tm-bx" x="${r1(span.x)}" y="${r1(span.y)}" width="${r1(span.w)}" height="${r1(span.h)}" rx="${partRadius(ctx.corner, 6)}"/></g>`,
    );
    const tag = span.textRect;
    ink.push({ text: span.text, rect: tag, shown, boxed: true });
    top.push(
      `<g class="dg-tg dg-popc dg-a" style="${cs(span.color)};${until === undefined ? m.pop(a) : m.pop(a, until)}"><rect x="${r1(tag.x)}" y="${r1(tag.y)}" width="${r1(tag.w)}" height="${tag.h}" rx="${partRadius(ctx.corner, tag.h / 2)}"/><text x="${r1(tag.x + tag.w / 2)}" y="${r1(span.textY)}" text-anchor="middle">${esc(span.text)}</text></g>`,
    );
  }
}

/** 針。時刻の表の針の動きを辿り、繰り返す前に左端へ戻る */
export function needle(k: TimeKit): void {
  const { layout, timeline, ctx } = k;
  const { m } = ctx;
  const { axis } = layout;
  const keys = timeline.needle ?? [];
  const moved = simplify(keys.filter(([t]) => t < m.total));
  const end = moved[moved.length - 1]?.[1] ?? 0;
  const path: [number, number, number][] = [...moved.map(([t, u]): [number, number, number] => [t, axis.x + u * axis.unit, 0]), [m.last, axis.x + end * axis.unit, 0], [m.total, axis.x, 0]];
  const { y1, y2 } = layout.needle;
  const N = LOOK.time.needle;
  // 止め絵ごとに針の頭と終わりの点がいる所を記録する。続く止め絵で同じ所に止まる針は、最初の止め絵から1つにまとめる
  const { stills } = timeline;
  const at = stills.map((t) => axis.x + valueAt(moved, t) * axis.unit);
  at.forEach((x, s) => {
    if (s > 0 && x === at[s - 1]) return;
    let e = s;
    while (at[e + 1] === x) e++;
    const shown: Shown[] = [[stills[s] as number, stills[e + 1] ?? Number.POSITIVE_INFINITY]];
    frame(k, { kind: "needle" }, { x: x - N.head * 0.75, y: y1 - N.head, w: N.head * 1.5, h: N.head }, shown);
    frame(k, { kind: "needle" }, { x: x - N.dot, y: axis.line - N.dot, w: N.dot * 2, h: N.dot * 2 }, shown);
  });
  k.top.push(
    `<g class="dg-a" data-needle="" style="${m.move(path)}"><line class="dg-tm-nd" x1="0" y1="${r1(y1)}" x2="0" y2="${r1(y2)}"/><path class="dg-tm-nh" d="M ${-N.head * 0.75} ${r1(y1 - N.head)} L ${N.head * 0.75} ${r1(y1 - N.head)} L 0 ${r1(y1)} Z"/><circle class="dg-tm-nh" cy="${r1(axis.line)}" r="${N.dot}"/></g>`,
  );
}
