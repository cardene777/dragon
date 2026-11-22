/**
 * 表どうしの関係の図の全体図に描く部品 (#3849)。
 * 結びの線を線で描き、その上に表を地、表の頭の行 (表の名前の行) を表の色の札で描く
 */
import type { OverviewShape } from "../parts";
import type { ErLayout } from "./layout";

export function erOverview(layout: ErLayout): OverviewShape[] {
  return [
    ...layout.links.map((link): OverviewShape => ({ line: link.points, color: "slate" })),
    ...layout.tables.map((t): OverviewShape => ({ rect: t, band: true, color: t.color })),
    ...layout.tables.map((t): OverviewShape => ({ rect: { x: t.x, y: t.y, w: t.w, h: (t.rows[0]?.y ?? t.y + t.h) - t.y }, band: false, color: t.color })),
  ];
}
