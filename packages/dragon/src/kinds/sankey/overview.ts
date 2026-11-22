/**
 * 量の行き先の図の全体図に描く部品 (#3849)。
 * 棒と帯の見た目は、帯を元の図と同じ曲線のまま半透明に塗り、その上に棒を札で描く。
 * 段ごとの帯の見た目 (`[shape: rows]`) は下りる帯を半透明に塗り、行の区画を札 (まだ分けていない残りは地) で描く。
 * 面積で割る四角の見た目 (`[shape: treemap]`) は子の区画に分けた区画を地、分けていない区画を札で描く
 */
import type { Point } from "../../layout/scene";
import type { OverviewShape } from "../parts";
import { bandPoint, type SankeyBand, type SankeyLayout } from "./layout";

/** 帯を曲線に沿って分ける数。全体図の大きさでは曲線の折れ目が見えない数 */
const RIBBON_STEPS = 24;

/** 帯の形。上の縁を出どころから行き先へ、下の縁を行き先から出どころへ、帯の真ん中と同じ曲線でたどる */
function ribbon(band: SankeyBand): Point[] {
  const edge = (side: 0 | 1, t: number): Point => bandPoint({ x1: band.x1, x2: band.x2, a: [band.a[side], band.a[side]], b: [band.b[side], band.b[side]] }, t);
  const ts = Array.from({ length: RIBBON_STEPS + 1 }, (_, i) => i / RIBBON_STEPS);
  return [...ts.map((t) => edge(0, t)), ...[...ts].reverse().map((t) => edge(1, t))];
}

/** 四角 `x` `w` `y1` `y2` の四隅 */
const corners = (x: number, w: number, y1: number, y2: number): Point[] => [
  [x, y1],
  [x + w, y1],
  [x + w, y2],
  [x, y2],
];

export function sankeyOverview(layout: SankeyLayout): OverviewShape[] {
  if (layout.arrangement === "rows") {
    return [
      ...(layout.drops ?? []).map((drop): OverviewShape => ({ area: corners(drop.x, drop.w, drop.y1, drop.y2), color: drop.color })),
      ...(layout.rows ?? []).flatMap((row) => row.sections.map((s): OverviewShape => ({ rect: s, band: s.kind === "rest", color: s.color }))),
    ];
  }
  if (layout.arrangement === "treemap") {
    return (layout.tiles ?? []).filter((tile) => tile.kind === "box").map((tile): OverviewShape => ({ rect: tile, band: tile.split !== undefined, color: tile.color }));
  }
  return [
    ...layout.bands.map((band): OverviewShape => ({ area: ribbon(band), color: band.color })),
    ...layout.nodes.map((n): OverviewShape => ({ rect: n, band: false, color: n.color })),
  ];
}
