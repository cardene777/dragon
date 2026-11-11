/**
 * 回り続ける図 (#3623) の時刻と、輪の真ん中の字と、見た目の規則を描く部品。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 段の中の線の札は、走り出す前に箱の脇で待たず、線を引き始める時に弧の上に出て、その段の終わりに消える。走った弧は光ったまま残るので、札は残さない。
 * 段ごとに光らせる箱は、その段の手順 (札が着いた手順) の箱だけにする。
 * 輪の真ん中には中身の帯の題を薄い色で書き、その下に最初の欄の値を大きく、2 つ目からの欄の値を小さく書く。欄の名前は書かず、値だけを出す。
 * 値は次の値が来るまで出し、最初に書いた後で変わった値は、変わった段の間だけその段の手順の色で書く。
 * この file は回り続ける図の描く部品 (`kinds/cycle.ts`) が出し、見本帳を開いた時に読む塊に入れない。
 * 見た目の規則は回り続ける図の SVG にだけ書き、回り続ける図だけが使う class に付ける
 */
import { drawArcs } from "../blocks/ring/draw";
import type { FieldChange } from "../blocks/strip/draw";
import { cs } from "../blocks/color/draw";
import { cycleValueStyle, type CycleLayout } from "../kinds/cycle/layout";
import { hasWide, textBox } from "../layout/measure";
import { CYCLE_LOOK, CYCLE_TYPE } from "../look/cycle";
import { MOTION } from "../look/values";
import type { DiagramModel } from "../schema";
import type { Timeline } from "../timeline";
import { type Ctx, cssFont as font, esc, r1, write } from "./parts";

const S = CYCLE_LOOK.stroke;

/** 回り続ける図の見た目の規則。弧、光った弧、札が走る段の太い弧、輪の真ん中の題と値 */
export const CYCLE_CSS = [
  `.dg-cy-arc,.dg-cy-head path{fill:none;stroke:var(--line);stroke-width:${S.arc};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-cy-lit path{fill:none;stroke:var(--c);stroke-width:${S.lit};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-cy-run path{fill:none;stroke:var(--c);stroke-width:${S.run};stroke-linecap:round}`,
  `.dg-cy-t{${font(CYCLE_TYPE.title)};fill:var(--mute)}`,
  `.dg-cy-v{${font(CYCLE_TYPE.lead)};fill:var(--ink)}`,
  `.dg-cy-vj{${font(CYCLE_TYPE.leadJa)};fill:var(--ink)}`,
  `.dg-cy-r{${font(CYCLE_TYPE.rest)};fill:var(--ink2)}`,
].join("");

/**
 * 回り続ける図の時刻の表。図の種類を問わず組んだ表 (`buildTimeline`) を受け取り、札の見えている間を直す。
 * 札は線を引き始める時に出て (走り出しを待たない)、その段の終わりに消える
 */
export function cycleTimes(diagram: DiagramModel, t: Timeline): Timeline {
  return {
    ...t,
    carriers: t.carriers.map((c) => {
      const span = t.steps[c.step];
      return { ...c, start: c.depart, end: Math.max(c.arrive, span?.end ?? c.end) };
    }),
  };
}

/** 段ごとに光らせる箱。その段の手順の箱だけを、その段で光らせる */
function litSteps(layout: CycleLayout): Map<string, number[]> {
  const on = new Map<string, number[]>();
  layout.current.forEach((id, step) => on.set(id, [...(on.get(id) ?? []), step]));
  return on;
}

/** 輪の真ん中の字。帯の題と、欄ごとの値の移り変わり (`changes`)。値は欄ごとに 1 つの部品 (`data-field`) にまとめる */
function centre(layout: CycleLayout, changes: ReadonlyMap<string, FieldChange[]>, ctx: Ctx): string {
  const { m } = ctx;
  const { cx } = layout.ring;
  const c = layout.centre;
  const parts: string[] = [];
  if (c.title) parts.push(write(ctx.ink, "dg-cy-t", cx, c.title.y, c.title.text, CYCLE_TYPE.title, undefined, "middle"));
  for (const row of c.rows) {
    const list = (changes.get(row.field) ?? []).flatMap((change) => {
      const text = change.value ?? change.tag;
      return text === undefined ? [] : [{ ...change, text }];
    });
    list.forEach((change, k) => {
      const next = list[k + 1]?.at;
      const until = next === undefined ? m.last : next - MOTION.untilFade;
      const style = cycleValueStyle(change.text, row.lead);
      const cls = row.lead ? (hasWide(change.text) ? "dg-cy-vj" : "dg-cy-v") : "dg-cy-r";
      ctx.ink.push({ text: change.text, rect: textBox(change.text, cx, row.y, style, "middle"), shown: [[change.at, next === undefined ? Number.POSITIVE_INFINITY : until]] });
      // 最初に書いた後で変わった値は、変わった段の間だけその段の手順の色で書き、段が終わると元の色へ戻す
      const base = row.lead ? "var(--ink)" : "var(--ink2)";
      const attrs =
        k === 0
          ? ` class="${cls}"`
          : ` class="${cls} dg-a" style="${cs(change.color)};${m.kf([
              [0, { fill: "var(--ct)" }],
              [Math.max(change.until - MOTION.untilFade, change.at), { fill: "var(--ct)" }],
              [change.until, { fill: base }],
              [m.total, { fill: base }],
            ])}"`;
      const text = `<text${attrs} x="${r1(cx)}" y="${r1(row.y)}" text-anchor="middle">${esc(change.text)}</text>`;
      parts.push(`<g data-field="${esc(row.field)}" class="dg-a" style="${m.rise(change.at, until)}">${text}</g>`);
    });
  }
  return parts.join("");
}

/**
 * 回り続ける図の弧と輪の真ん中の字と、段ごとに光らせる箱。中身の帯の値の移り変わり (`changes`) は描く所 (`render/draw.ts`) が出して渡す。
 * この部品が中身の帯を描く処理を読むと、1行の入口でその処理が本体から最初に読む別の file に分かれ、最初に読む量が増える (#3657)
 */
export function drawCycle(layout: CycleLayout, changes: ReadonlyMap<string, FieldChange[]>, ctx: Ctx): { base: string; on: Map<string, number[]>; css: string } {
  return { base: `${drawArcs(layout, ctx)}${centre(layout, changes, ctx)}`, on: litSteps(layout), css: CYCLE_CSS };
}
