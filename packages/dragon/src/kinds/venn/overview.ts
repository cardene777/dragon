/**
 * 集合の重なりの図の全体図に描く部品 (#3849)。
 * 円を半透明の地で描き、重なった所を元の図と同じく混ざった色に見せ、名前の字の所を札で描く。
 * 点で数える見た目 (`[shape: dots]`) は点の図の共通の部品が描く
 */
import { dotsOverview } from "../../layout/dots";
import type { OverviewShape } from "../parts";
import type { VennLayout } from "./layout";

export function vennOverview(layout: VennLayout): OverviewShape[] {
  const { circles, dots } = layout.venn;
  if (dots) return dotsOverview(dots);
  return [
    ...circles.map((c): OverviewShape => ({ disc: { cx: c.cx, cy: c.cy, r: c.r }, band: true, color: c.color })),
    ...circles.map((c): OverviewShape => ({ rect: c.label.rect, band: false, color: c.color })),
  ];
}
