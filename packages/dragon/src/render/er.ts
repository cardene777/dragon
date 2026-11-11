/**
 * 表どうしの関係の図 (#3618) の時刻と、見た目の規則と、描く部品の束ね。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 段の中の線の札は、走り出す前に表の脇で待たず、線を引き始める時に結びの線の上に出て、線の真ん中で止まり、その段の終わりに消える。
 * 光った結びの線は後の段にも残るので、札は残さない。
 * 結びの線は表の下に、表と式の札は線の上に描く。段の番号と札は描く本体 (`render/draw.ts`) がほかの図の種類と同じく描く。
 * この file は表どうしの関係の図の描く部品 (`kinds/er.ts`) が出し、見本帳を開いた時に読む塊に入れない。
 * 見た目の規則は表どうしの関係の図の SVG にだけ書き、表どうしの関係の図だけが使う class に付ける
 */
import { drawLinks, drawNotes, drawTables } from "../blocks/table/draw";
import type { ErLayout } from "../kinds/er/layout";
import { ER_LOOK, ER_TYPE } from "../look/er";
import type { DiagramModel } from "../schema";
import type { Timeline } from "../timeline";
import { type Ctx, cssFont as font } from "./parts";

const S = ER_LOOK.stroke;
const X = ER_LOOK.mix;
const mix = (pct: number, b: string): string => `color-mix(in srgb,var(--c) ${pct}%,${b})`;

/** 表どうしの関係の図の見た目の規則。表の見出しと行と印、選んだ行と枠、結びの線と光った線、式の札 */
export const ER_CSS = [
  `.dg-er-head{fill:${mix(X.head, "var(--surf)")}}`,
  `.dg-er-sep{fill:none;stroke:var(--hair);stroke-width:1}`,
  `.dg-er-t{${font(ER_TYPE.title)};fill:var(--ink)}`,
  `.dg-er-f{${font(ER_TYPE.field)};fill:var(--ink2)}`,
  `.dg-er-v{${font(ER_TYPE.value)};fill:var(--ink)}`,
  `.dg-er-vj{${font(ER_TYPE.valueJa)}}`,
  ".dg-er-vc{fill:var(--ct)}",
  `.dg-er-mk{fill:${mix(X.mark, "var(--surf)")};stroke:${mix(X.mark * 3, "transparent")}}`,
  `.dg-er-mkt{${font(ER_TYPE.mark)};fill:var(--ct)}`,
  `.dg-er-pick{fill:${mix(X.pick, "var(--surf)")}}`,
  ".dg-er-frame{fill:none}",
  `.dg-er-lit{fill:none;stroke:var(--c);stroke-width:${S.kept}}`,
  `.dg-er-now{fill:none;stroke:var(--c);stroke-width:${S.now}}`,
  `.dg-er-ln path{fill:none;stroke:var(--line);stroke-width:${S.link};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-er-lit-ln path{fill:none;stroke:var(--c);stroke-width:${S.lit};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-er-run path{fill:none;stroke:var(--c);stroke-width:${S.run};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-er-note{fill:${mix(X.note, "var(--surf)")};stroke:var(--c)}`,
  `.dg-er-arrow{fill:none;stroke:var(--c);stroke-width:${S.arrow};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-er-nc{${font(ER_TYPE.caption)};fill:var(--mute)}`,
  `.dg-er-nt{${font(ER_TYPE.note)};fill:var(--ct)}`,
  `.dg-er-ntj{${font(ER_TYPE.noteJa)}}`,
].join("");

/**
 * 表どうしの関係の図の時刻の表。図の種類を問わず組んだ表 (`buildTimeline`) を受け取り、札の見えている間を直す。
 * 札は線を引き始める時に出て (走り出しを待たない)、その段の終わりに消える
 */
export function erTimes(_diagram: DiagramModel, t: Timeline): Timeline {
  return {
    ...t,
    carriers: t.carriers.map((c) => {
      const span = t.steps[c.step];
      return { ...c, start: c.depart, end: Math.max(c.arrive, span?.end ?? c.end) };
    }),
  };
}

/** 表どうしの関係の図の結びの線 (表の下に描く物) と、表と式の札 (線の上に描く物) と、見た目の規則 */
export function drawEr(layout: ErLayout, diagram: DiagramModel, ctx: Ctx): { base: string; node: string; css: string } {
  return { base: drawLinks(layout, ctx), node: `${drawTables(layout, diagram, ctx)}${drawNotes(layout, ctx)}`, css: ER_CSS };
}
