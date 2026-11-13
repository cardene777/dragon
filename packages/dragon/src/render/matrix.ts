/**
 * 2つの軸で置く図 (#3622) の区画と、軸と置く前の一覧と課題の札を組んで描く部品と、見た目の規則。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 区画は区画の色を薄く敷いた角の丸い四角で、左上に名前を書く。札を受けた段の間だけ、色を濃くして太い縁を重ねて光らせる。
 * 軸の描き方は軸のブロック (`blocks/axis/draw.ts`)、課題の札と置く前の一覧の描き方は課題のブロック (`blocks/matrix-item/draw.ts`) が持つ。
 * 点数で点を打つ見た目 (#3637) の描き方は `render/matrix-scatter.ts` が持ち、区画を光らせる間はこの file と同じ数え方を使う。
 * この file は 2つの軸で置く図の描く部品 (`kinds/matrix.ts`) が出し、見本帳を開いた時に読む塊に入れない。
 * 見た目の規則は 2つの軸で置く図の SVG にだけ書き、2つの軸で置く図だけが使う class に付ける
 */
import { drawAxes } from "../blocks/axis/draw";
import { cs } from "../blocks/color/draw";
import { drawCards, drawList, placeTime } from "../blocks/matrix-item/draw";
import type { MatrixArea, MatrixLayout } from "../kinds/matrix/layout";
import { MATRIX_LOOK, MATRIX_TYPE } from "../look/matrix";
import { EASE, MOTION } from "../look/values";
import { partRadius } from "./corner";
import { type AreaGlow, drawScatter } from "./matrix-scatter";
import { ALWAYS } from "./ink";
import type { Frame } from "./motion";
import { type Ctx, cssFont as font, esc, r1, write } from "./parts";

const S = MATRIX_LOOK.stroke;
const A = MATRIX_LOOK.area;

/** 2つの軸で置く図の見た目の規則。一覧の枠と題、区画の地と光った区画、区画の名前と下の字、軸の線と字、札の地と縁と点と名前 */
export const MATRIX_CSS = [
  `.dg-mx-list{fill:var(--sunk);stroke:var(--hair);stroke-width:${S.area}}`,
  `.dg-mx-lt{${font(MATRIX_TYPE.list)};fill:var(--mute)}`,
  `.dg-mx-area{fill:var(--c);fill-opacity:${MATRIX_LOOK.tint.base};stroke:var(--c);stroke-width:${S.area}}`,
  `.dg-mx-glow{fill:var(--c);fill-opacity:${MATRIX_LOOK.tint.glow};stroke:var(--c);stroke-width:${S.glow}}`,
  `.dg-mx-name{${font(MATRIX_TYPE.area)};fill:var(--ct)}`,
  `.dg-mx-sub{${font(MATRIX_TYPE.sub)};fill:var(--mute)}`,
  `.dg-mx-ax{fill:none;stroke:var(--line);stroke-width:${S.axis};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-mx-an{${font(MATRIX_TYPE.axis)};fill:var(--ink2)}`,
  `.dg-mx-ae{${font(MATRIX_TYPE.end)};fill:var(--mute)}`,
  ".dg-mx-card{fill:var(--surf)}",
  `.dg-mx-co{fill:none;stroke:var(--line);stroke-width:${S.card}}`,
  `.dg-mx-cl{fill:none;stroke:var(--c);stroke-width:${S.card}}`,
  `.dg-mx-cn{fill:none;stroke:var(--c);stroke-width:${S.now}}`,
  ".dg-mx-dot{fill:var(--c)}",
  `.dg-mx-t{${font(MATRIX_TYPE.card)};fill:var(--ink)}`,
].join("");

/** 区画へ課題を置く出来事。札を置く見た目は札の動き、点数で点を打つ見た目は打った点から集める */
type Place = { step: number; event: number; area: string };

/** 図の全ての、区画へ課題を置く出来事 */
const placesOf = (layout: MatrixLayout): Place[] =>
  layout.shape === "scatter" ? (layout.dots ?? []).flatMap((dot) => dot.plots.map((p) => ({ ...p, area: dot.area }))) : layout.cards.flatMap((card) => card.moves);

/** 区画が課題を受けた段ごとの、光る間。その段で最初に課題を置き始める時刻から、段の終わりまで */
function glowRanges(places: readonly Place[], area: string, ctx: Ctx): [number, number][] {
  const out = new Map<number, [number, number]>();
  for (const place of places) {
    if (place.area !== area) continue;
    const { start, span } = placeTime(ctx, place.step, place.event);
    const [a = start] = out.get(place.step) ?? [];
    out.set(place.step, [Math.min(a, start), span.end]);
  }
  return [...out.values()].sort((x, y) => x[0] - y[0]);
}

/** 光る間 `ranges` の間だけ濃く出る動き。間の終わりから `MOTION.fade` 秒で消える */
function glowFrames(ranges: [number, number][], ctx: Ctx): string {
  const frames: Frame[] = [[0, { opacity: 0 }]];
  for (const [a, b] of ranges) frames.push([a, { opacity: 0 }, EASE.out], [a + MOTION.fade, { opacity: 1 }], [b, { opacity: 1 }, EASE.inOut], [Math.min(b + MOTION.fade, ctx.m.total), { opacity: 0 }]);
  frames.push([ctx.m.total, { opacity: 0 }]);
  return ctx.m.kf(frames);
}

/** 課題を受けた段の間だけ区画に重ねる濃い地。課題を受けない区画は描かない */
const glowOf =
  (places: readonly Place[], ctx: Ctx): AreaGlow =>
  (area, cls, rect) => {
    const ranges = glowRanges(places, area.id, ctx);
    return ranges.length > 0 ? `<rect class="${cls} dg-a" data-matrix-glow="${esc(area.id)}" ${rect} style="${glowFrames(ranges, ctx)}"/>` : "";
  };

/** 区画 1 つ。薄い地と縁、札を受けた段の間だけ重ねる濃い地と太い縁、左上の名前と下の字 */
function areaOf(area: MatrixArea, glowAt: AreaGlow, ctx: Ctx): string {
  const rect = `x="${r1(area.x)}" y="${r1(area.y)}" width="${r1(area.w)}" height="${r1(area.h)}" rx="${r1(partRadius(ctx.corner, A.radius))}"`;
  const glow = glowAt(area, "dg-mx-glow", rect);
  // 下の字が在る区画は、名前の行を少し上げて下の字の行を空ける
  const nameY = area.y + (area.sub !== undefined ? A.head / 2 - 2 : A.head / 2) + MATRIX_TYPE.area.size * MATRIX_LOOK.baseline;
  const sub = area.sub !== undefined ? write(ctx.ink, "dg-mx-sub", area.x + A.padX, area.y + A.head - 2 + A.subH / 2 + MATRIX_TYPE.sub.size * MATRIX_LOOK.baseline, area.sub, MATRIX_TYPE.sub) : "";
  return (
    `<g data-matrix-area="${esc(area.id)}" style="${cs(area.color)}"><rect class="dg-mx-area" ${rect}/>${glow}` +
    `${write(ctx.ink, "dg-mx-name", area.x + A.padX, nameY, area.name, MATRIX_TYPE.area, ALWAYS)}${sub}</g>`
  );
}

/**
 * 2つの軸で置く図の区画と軸と一覧 (`base`) と、課題の札 (`node`) と、見た目の規則。札は区画の上に描く。
 * 点数で点を打つ見た目は `render/matrix-scatter.ts` が描く
 */
export function drawMatrix(layout: MatrixLayout, ctx: Ctx): { base: string; node: string; css: string } {
  const glow = glowOf(placesOf(layout), ctx);
  if (layout.shape === "scatter") return drawScatter(layout, ctx, MATRIX_CSS, glow);
  return {
    base: `${layout.list ? drawList(layout.list, ctx) : ""}${layout.areas.map((area) => areaOf(area, glow, ctx)).join("")}${drawAxes(layout.axes, ctx)}`,
    node: drawCards(layout.cards, ctx),
    css: MATRIX_CSS,
  };
}
