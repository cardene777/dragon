/**
 * 回り続ける図の全体図に描く部品 (#3849)。輪の見た目は箱を持つので、描く本体が箱を描く。
 * 輪を開いた帯の見た目 (`shape: band`) は、次の回へ戻る矢印を線、山形を札で描く。
 * 時計の文字盤の見た目 (`shape: clock`) は、手順の弧を元の図と同じ帯の形のまま半透明に塗り、手順の名前の所を札で描く
 */
import type { Point } from "../../layout/scene";
import type { ColorKey } from "../../look/values";
import type { OverviewShape } from "../parts";
import type { BandLayout, ClockLayout } from "./layout";

/** 弧を分ける角度 (度)。全体図の大きさでは弧の折れ目が見えない細かさ */
const ARC_STEP = 4;

/** 文字盤の真ん中から 12 時を 0 にして右回りに `a` 度、半径 `r` の点 (`render/clock.ts` と同じ向き) */
const at = (cx: number, cy: number, r: number, a: number): Point => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];

/** 内の半径 `inner` から外の半径 `r` までの、角度 `a` から `b` までの帯の形 */
function ring(layout: ClockLayout, a: number, b: number): Point[] {
  const { cx, cy, r, inner } = layout.ring;
  const n = Math.max(1, Math.ceil(Math.abs(b - a) / ARC_STEP));
  const angles = Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  return [...angles.map((t) => at(cx, cy, r, t)), ...[...angles].reverse().map((t) => at(cx, cy, inner, t))];
}

export function bandOverview(layout: BandLayout): OverviewShape[] {
  return [
    ...layout.returns.map((back): OverviewShape => ({ line: back.points, color: "slate" })),
    ...layout.segments.map((s): OverviewShape => ({ rect: s, band: false, color: s.color })),
  ];
}

export function clockOverview(layout: ClockLayout): OverviewShape[] {
  const colors = new Map<string, ColorKey>(layout.sectors.map((s) => [s.id, s.color]));
  return [
    ...layout.sectors.map((s): OverviewShape => ({ area: ring(layout, s.from, s.to), color: s.color })),
    ...layout.names.map((name): OverviewShape => ({ rect: name, band: false, color: colors.get(name.id) ?? "slate" })),
  ];
}
