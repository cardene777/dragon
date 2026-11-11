/**
 * 輪の弧の描き方 (#3623)。
 *
 * 隣どうしの手順を結ぶ弧は、輪の線のうち両端の箱の外に見える所を細い灰の線で描き、弧の真ん中に右回りを指す山形の矢じりを置く。
 * 段の中の線の札が弧を走ると、弧と矢じりはその段から受ける側の手順の色で光り、後の段でも光ったまま残る。札が走る段の間は、弧を太く描く。
 * 弧の所と矢じりの向きは並べ方 (`kinds/cycle/layout.ts`) が持つ。
 * この file は回り続ける図の描く部品 (`kinds/cycle.ts`) が出し、見本帳を開いた時に読む塊に入れない
 */
import type { CycleArc, CycleLayout } from "../../kinds/cycle/layout";
import { CYCLE_LOOK } from "../../look/cycle";
import type { Point } from "../../layout/scene";
import { ALWAYS } from "../../render/ink";
import { type Ctx, r1 } from "../../render/parts";
import { cs } from "../color/draw";

/** 弧の線。輪の半径で、見える所の始まりから終わりまで右回りに引く */
function arcPath(arc: CycleArc, r: number): string {
  const first = arc.points[0] as Point;
  const last = arc.points[arc.points.length - 1] as Point;
  return `M${r1(first[0])} ${r1(first[1])}A${r1(r)} ${r1(r)} 0 0 1 ${r1(last[0])} ${r1(last[1])}`;
}

/** 弧の真ん中の山形の矢じり。先が右回りの向きを指す */
function headPath(arc: CycleArc): string {
  const { back, half, tip } = CYCLE_LOOK.head;
  const { x, y, angle } = arc.head;
  return `<path d="M${-back} ${-half}L${tip} 0L${-back} ${half}" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)})"/>`;
}

/**
 * 輪の弧を全て描き、描いた弧を線の記録 (`ctx.traces`) に残す。弧ごとに 1 つの部品 (`data-arc="<送る側>><受ける側>"`) にまとめ、
 * 灰の弧と矢じり、光った弧 (`dg-cy-lit`)、札が走る段の太い弧 (`dg-cy-run`) の順に重ねる
 */
export function drawArcs(layout: CycleLayout, ctx: Ctx): string {
  const { m, t } = ctx;
  const r = layout.ring.r;
  return layout.arcs
    .map((arc) => {
      ctx.traces.push({ from: arc.from, to: arc.to, points: arc.points, shown: ALWAYS });
      const d = arcPath(arc, r);
      const color = layout.boxes.find((b) => b.id === arc.to)?.color ?? "slate";
      const runs = layout.edges.flatMap((e) => {
        if (e.from !== arc.from || e.to !== arc.to) return [];
        const time = t.edges.find((x) => x.step === e.step && x.event === e.event);
        const span = t.steps[e.step];
        return time && span ? [{ start: time.start, end: span.end }] : [];
      });
      const first = runs.reduce((a, run) => Math.min(a, run.start), Number.POSITIVE_INFINITY);
      const lit =
        runs.length === 0
          ? ""
          : `<g class="dg-cy-lit dg-a" style="${cs(color)};${m.vis(first)}"><path d="${d}"/>${headPath(arc)}</g>` +
            runs.map((run) => `<g class="dg-cy-run dg-a" style="${cs(color)};${m.vis(run.start, run.end, { within: true })}"><path d="${d}"/></g>`).join("");
      return `<g data-arc="${arc.from}>${arc.to}"><path class="dg-cy-arc" d="${d}"/><g class="dg-cy-head">${headPath(arc)}</g>${lit}</g>`;
    })
    .join("");
}
