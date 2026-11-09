/**
 * 量の図の値の描き方 (#3560)。
 *
 * 段を送ると、弧と棒は段の始まりから `MOTION.chart.move` 秒で、前の段の値から新しい値へ動く。最初の段の前は値が無く、
 * 繰り返す前に 0 へ戻る。値が 0 の弧と棒は長さを 0 にし、濃さも 0 にして出さない。
 * ドーナツの弧は輪の円の線を `stroke-dasharray` の長さで切り、`stroke-dashoffset` で始まりの角度へ送る。円は 12 時の向きから描くよう回してある。
 * 隣の弧と続いて 1 本に見えないよう、弧の両端を `gap` の半分ずつ削る。
 * 横棒は一番大きい値の棒の長さの四角を、左端を軸に `scaleX` で値の割合まで縮める。
 * ドーナツの凡例の割合と横棒の端の値は段ごとの字で、同じ字が続く段は 1 つの字にまとめて出したままにする。
 * この file は量の図を描く部品 (`render/chart.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { ChartArc } from "../../kinds/chart/layout";
import { CHART_LOOK } from "../../look/chart";
import { EASE, MOTION } from "../../look/values";
import type { Frame, Props } from "../../render/motion";
import type { Ctx } from "../../render/parts";
import type { Span } from "../../timeline";

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** 段 `s` の値が動き始める時刻 */
export const movesAt = (ctx: Ctx, s: number): number => (ctx.t.steps[s] as Span).start + MOTION.edgeAt;

/**
 * 段ごとの見え方 `states` を、段の始まりから動いて移る keyframes の点にする。`empty` は最初の段の前と繰り返す前の見え方で、
 * 最初の段は `empty(states[0])` から、繰り返す前は最後の段の見え方から `empty(最後)` へ動く
 */
function stepFrames(ctx: Ctx, states: Props[], empty: (state: Props) => Props): Frame[] {
  const { m } = ctx;
  const first = states[0] ?? {};
  const frames: Frame[] = [[0, empty(first)]];
  let before = empty(first);
  states.forEach((state, s) => {
    const a = movesAt(ctx, s);
    frames.push([a, before, EASE.inOut], [a + MOTION.chart.move, state]);
    before = state;
  });
  frames.push([m.last, before, EASE.inOut], [m.total, empty(before)]);
  return frames;
}

/** ドーナツの弧の段ごとの見え方。`c` は輪の円の線の長さ */
function arcState(arc: ChartArc, c: number): Props {
  const length = (arc.sweep / 360) * c;
  const gap = Math.min(CHART_LOOK.donut.gap, length);
  return { "stroke-dasharray": `${r2(length - gap)} ${r2(c)}`, "stroke-dashoffset": r2(-((arc.start / 360) * c + gap / 2)), opacity: arc.sweep > 0 ? 1 : 0 };
}

/** 1 つの項目のドーナツの弧の動き。`arcs` は段ごとの弧、`r` は輪の線の真ん中の半径 */
export function arcMotion(arcs: ChartArc[], r: number, ctx: Ctx): string {
  const c = 2 * Math.PI * r;
  const empty = (state: Props): Props => ({ ...state, "stroke-dasharray": `0 ${r2(c)}`, opacity: 0 });
  return ctx.m.kf(stepFrames(ctx, arcs.map((arc) => arcState(arc, c)), empty));
}

/** 1 つの項目の横棒の動き。`ratios` は段ごとの、一番大きい値の棒に対する長さの割合 */
export function barMotion(ratios: number[], ctx: Ctx): string {
  const state = (ratio: number): Props => ({ transform: `scaleX(${Math.round(ratio * 1000) / 1000})`, opacity: ratio > 0 ? 1 : 0 });
  return ctx.m.kf(stepFrames(ctx, ratios.map(state), () => state(0)));
}

/** 同じ字が続く段のまとまり。`from` から `to` までの段 (`to` を含む) に字 `text` を出す */
export interface TextRun {
  from: number;
  to: number;
  text: string;
}

/** 段ごとの字を、同じ字が続く段のまとまりにする。字の無い段 (`undefined`) は出さない */
export function textRuns(texts: (string | undefined)[]): TextRun[] {
  const runs: TextRun[] = [];
  texts.forEach((text, s) => {
    const last = runs.at(-1);
    if (text === undefined) return;
    if (last && last.text === text && last.to === s - 1) last.to = s;
    else runs.push({ from: s, to: s, text });
  });
  return runs;
}

/** まとまりの字が見えている間。`appear` は段の始まりから字が出るまでで、最後の段の字は繰り返す前まで出す */
export function runSpan(run: TextRun, appear: number, ctx: Ctx): [number, number] {
  const { t, m } = ctx;
  const start = (t.steps[run.from] as Span).start + appear;
  const end = run.to === t.steps.length - 1 ? m.last : (t.steps[run.to] as Span).end;
  return [start, end];
}
