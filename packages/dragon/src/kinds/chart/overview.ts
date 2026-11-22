/**
 * 量の図の全体図に描く部品 (#3849)。
 * 折れ線の見た目 (`[shape: line]`) は目盛りの範囲を地、項目ごとの折れ線を線、値の在る点を点で描く。
 * 漏斗の見た目 (`[shape: funnel]`) は最後の段の長さの棒を札、減った分の四角を地で描く。
 * 棒の見た目 (`[shape: bar]`) は棒の通り道を地、最後の段の長さの棒を札で描く。
 * 点で数える見た目 (`[shape: dots]`) は点の図の共通の部品が描く。輪の見た目は寄って追う形にならない幅に収まるので描かない
 */
import { dotsOverview } from "../../layout/dots";
import type { Point } from "../../layout/scene";
import { CHART_LOOK } from "../../look/chart";
import type { ColorKey } from "../../look/values";
import type { OverviewShape } from "../parts";
import type { ChartLayout } from "./layout";

/** 折れ線の点の半径 */
const POINT_R = 5;

export function chartOverview(layout: ChartLayout): OverviewShape[] {
  const plan = layout.chart;
  const colorOf = (id: string): ColorKey => plan.items.find((item) => item.id === id)?.color ?? "slate";
  const last = plan.lengths?.[plan.lengths.length - 1] ?? [];
  if (plan.dots) return dotsOverview(plan.dots);
  if (plan.line) {
    const { ticks, grid, series } = plan.line;
    const ys = ticks.map((t) => t.y);
    const top = Math.min(...ys);
    const spots = (s: (typeof series)[number]): Point[] => s.points.flatMap((p) => (p ? [[p.x, p.y] satisfies Point] : []));
    return [
      ...(ys.length > 0 ? [{ rect: { x: grid.x1, y: top, w: grid.x2 - grid.x1, h: Math.max(...ys) - top }, band: true, color: "slate" } satisfies OverviewShape] : []),
      ...series.map((s): OverviewShape => ({ line: spots(s), color: colorOf(s.item) })),
      ...series.flatMap((s) => spots(s).map(([cx, cy]): OverviewShape => ({ disc: { cx, cy, r: POINT_R }, band: false, color: colorOf(s.item) }))),
    ];
  }
  if (plan.funnel) {
    const f = plan.funnel;
    const h = CHART_LOOK.funnel.h;
    return [
      ...f.gaps.map((gap): OverviewShape => ({ rect: gap.rect, band: true, color: "rose" })),
      ...plan.items.flatMap((item, i): OverviewShape[] => {
        const row = f.rows[i];
        return row && row.first >= 0 ? [{ rect: { x: f.bar.x, y: row.y - h / 2, w: last[i] ?? f.bar.w, h }, band: false, color: item.color }] : [];
      }),
    ];
  }
  if (plan.bars) {
    return plan.bars.flatMap((row, i): OverviewShape[] => [
      { rect: row.track, band: true, color: colorOf(row.item) },
      { rect: { ...row.track, w: last[i] ?? 0 }, band: false, color: colorOf(row.item) },
    ]);
  }
  return [];
}
