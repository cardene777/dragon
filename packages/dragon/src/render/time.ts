/**
 * 時間軸の図 (#3165) を描く部品。見本帳の試作 `docs/design/base/scenes/finality.js` の時間軸と拡大の帯と節目を写す。
 *
 * 描く状態 (`TimeKit`) を 1 つ組み、目盛り、拡大の帯、印の列、節目のブロックの描き方 (`blocks/<名前>/draw.ts`) を層の順に呼ぶ (#3348)。
 * 呼ぶ順は区切りの地、拡大の帯の列、印の列、作業の棒 (#3562)、拡大した範囲の枠、目盛り、範囲、節目、節目どうしの線、針で、この順が動きの名前の番号を決める。
 * 作業の棒の見た目の規則は、作業を持つ図だけが返す (`css`)。
 * 拡大の帯の箱へ線が初めて届く時刻と、印を塗る時刻は、拡大の帯と印の列の両方が使うのでここで数える。
 */
import type { SubChange } from "../blocks/box/draw";
import { cs } from "../blocks/color/draw";
import { markRows } from "../blocks/row/draw";
import { pointLines, points } from "../blocks/point/draw";
import { TASK_CSS, taskBars } from "../blocks/task/draw";
import { axisTicks, needle, periodShades, simplify, spans, type TimeKit, valueAt } from "../blocks/scale/draw";
import { zoomColumns, zoomLens } from "../blocks/zoom/draw";
import { linesOf, type TimeBox, type TimeLayout } from "../kinds/time/layout";
import { EASE, LOOK, MOTION, TYPE } from "../look/values";
import type { DiagramModel } from "../schema";
import type { Span, Timeline } from "../timeline";
import { partRadius } from "./corner";
import { ALWAYS } from "./ink";
import { type Ctx, r1, write } from "./parts";

export { simplify, valueAt };

export function drawTime(
  layout: TimeLayout,
  diagram: DiagramModel,
  timeline: Timeline,
  ctx: Ctx,
  subs: Map<string, SubChange[]>,
): { base: string; lit: string; node: string; top: string; css: string } {
  const passed = new Map((timeline.units ?? []).map((u) => [u.unit, u.passed]));
  const at = (step: number, event: number): number | undefined =>
    timeline.events.find((t) => t.step === step && t.event === event)?.at;
  const drawnOf = (step: number, event: number): number | undefined =>
    timeline.edges.find((t) => t.step === step && t.event === event)?.drawn;

  // 拡大の帯の箱へ、線が初めて届く時刻
  const arrivals = new Map<TimeBox, number>();
  for (const w of layout.wires) {
    const drawn = drawnOf(w.step, w.event);
    if (drawn !== undefined)
      arrivals.set(w.to, Math.min(arrivals.get(w.to) ?? Number.POSITIVE_INFINITY, drawn));
  }
  /** 印の列 `row` の目盛り `u` の印を塗る時刻。同じ名札の箱へ線が届くか、針が目盛りを過ぎるか、早い方 */
  const filled = (row: string, u: number): number | undefined => {
    const box = layout.zoom?.columns.find((c) => c.unit === u)?.boxes.find((b) => b.id === row);
    const times = [passed.get(u), box ? arrivals.get(box) : undefined].filter(
      (t): t is number => t !== undefined,
    );
    return times.length > 0 ? Math.min(...times) : undefined;
  };

  // 印の列と作業の行。作業を持たない図は印の列だけ
  const lines = linesOf(layout);
  const kit: TimeKit = {
    layout,
    diagram,
    timeline,
    ctx,
    subs,
    base: [],
    lit: [],
    node: [],
    top: [],
    at,
    passed,
    filled,
    rowsTop: Math.min(...lines.map((r) => r.y)),
    rowsBottom: Math.max(...lines.map((r) => r.y + r.h)),
  };
  // 呼ぶ順が動きの名前の番号を決めるので、移す前の順のまま呼ぶ
  periodShades(kit);
  zoomColumns(kit);
  markRows(kit);
  taskBars(kit);
  zoomLens(kit);
  axisTicks(kit);
  spans(kit);
  points(kit);
  pointLines(kit);
  needle(kit);
  const { base, lit, node, top } = kit;
  return { base: base.join(""), lit: lit.join(""), node: node.join(""), top: top.join(""), css: (layout.tasks ?? []).length > 0 ? TASK_CSS : "" };
}

/** 中身の帯の物差しの欄 (#3165)。棒を満ち具合の動きで伸ばし、`line` の割合の所に線の印と字を置く */
export function meterField(
  field: { x: number; y: number; meter: { line: number; text: string; x: number; w: number } },
  keys: [number, number][],
  ctx: Ctx,
): string {
  const { m } = ctx;
  const M = LOOK.time.meter;
  const { x, w, line, text } = field.meter;
  const y = field.y + M.y;
  const kf = m.kf([
    ...simplify(keys).map(([t, v]): [number, Record<string, string>] => [
      t,
      { transform: `scaleX(${r1(v * 1000) / 1000})` },
    ]),
    [m.last, { transform: `scaleX(${r1(valueAt(keys, m.last) * 1000) / 1000})` }, EASE.inOut],
    [m.total, { transform: "scaleX(0)" }],
  ]);
  const lx = x + w * line;
  return (
    `<rect class="dg-tm-mt" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${M.h}" rx="${partRadius(ctx.corner, M.h / 2)}"/>` +
    `<rect class="dg-tm-mf dg-a" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${M.h}" rx="${partRadius(ctx.corner, M.h / 2)}" style="${cs(M.color)};${kf}"/>` +
    `<line class="dg-tm-mk" x1="${r1(lx)}" y1="${r1(y - M.mark)}" x2="${r1(lx)}" y2="${r1(y + M.h + M.mark)}"/>` +
    write(ctx.ink, "dg-tm-ml", lx, field.y + M.textY, text, TYPE.meterLine, ALWAYS, "middle")
  );
}

/**
 * 時間軸の図で、寄って追う窓が段の終わりに見せる所。印の列を必ず入れ、段の番号と段で動く物を窓に収まる間だけ足す。
 * 針を動かす段は針も必ず入れる。針を動かさない段は段の番号の丸を起点にする。針の所に窓が残ると、離れた節目で起きたことが読めないため (#3284)
 */
export function timeFocus(
  layout: TimeLayout,
  timeline: Timeline,
  step: number,
  parts: { x: number; y: number; w: number; h: number }[],
  vw: number,
  vh: number,
): { x: number; y: number; w: number; h: number } {
  const span = timeline.steps[step] as Span;
  const position = valueAt(timeline.needle ?? [], span.end - MOTION.still);
  const badge = layout.badges.find((b) => b.step === step);
  // 値の表の中の丸は窓の外に出すので、起点にしない
  const anchored =
    badge &&
    valueAt(timeline.needle ?? [], span.start) === position &&
    !(layout.strip && badge.y >= layout.strip.y);
  const ax = anchored ? badge.x : layout.axis.x + position * layout.axis.unit;
  const lines = linesOf(layout);
  const top = Math.min(...lines.map((r) => r.y));
  const bottom = Math.max(...lines.map((r) => r.y + r.h));
  let held = { x: ax - 1, y: top, w: 2, h: bottom - top };
  const near = (p: { x: number; y: number; w: number; h: number }): number =>
    Math.hypot(Math.max(0, p.x - ax, ax - p.x - p.w), Math.max(0, p.y - top, top - p.y - p.h));
  // 札が変わる節目も段で動く物に数える。節目は頭の箱でないので、図全体の動く物の一覧に入っていない
  const changed = layout.points
    .filter((point) => point.changes.some((change) => change.step === step))
    .map((point) => ({
      x: point.cx - point.r,
      y: point.cy - point.r,
      w: point.text.x + point.text.w - point.cx + point.r,
      h: point.r * 2,
    }));
  const extra = [
    ...(badge
      ? [
          {
            x: badge.x - LOOK.badge.r,
            y: badge.y - LOOK.badge.r,
            w: LOOK.badge.r * 2,
            h: LOOK.badge.r * 2,
          },
        ]
      : []),
    ...[...parts, ...changed].sort((a, b) => near(a) - near(b)),
  ];
  for (const p of extra) {
    const x = Math.min(held.x, p.x);
    const y = Math.min(held.y, p.y);
    const next = {
      x,
      y,
      w: Math.max(held.x + held.w, p.x + p.w) - x,
      h: Math.max(held.y + held.h, p.y + p.h) - y,
    };
    if (next.w <= vw && next.h <= vh) held = next;
  }
  return held;
}
