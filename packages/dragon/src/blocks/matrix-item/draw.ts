/**
 * 2つの軸で置く図の課題の札と、置く前の一覧の描き方 (#3622)。
 *
 * 置く前の一覧は区画の左の枠で、上に題を書く。課題の札は一覧の席に描き、区画へ置いた段で、その段の線を引く時刻から一覧の席から区画の席へ滑る。
 * 札は置く前は灰色の点と縁で、区画へ向かい始めた時から置いた区画の色の点と縁になり、置いた段の間だけ太い縁を重ねる。
 * 別の区画へ置き直すと、前の区画の席から次の区画の席へ滑り、色も次の区画の色に替わる。繰り返す前に、札は一覧の席へ戻る。
 * 札の字の記録 (`ctx.ink`) は、札が留まっている所ごとに見えている間を分けて残す。滑っている途中は数えない。
 * 札と一覧の所は並べ方 (`kinds/matrix/layout.ts`) が持つ。
 * この file は 2つの軸で置く図を描く部品 (`render/matrix.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { MatrixCard, MatrixLayout } from "../../kinds/matrix/layout";
import { textBox } from "../../layout/measure";
import type { Rect } from "../../layout/scene";
import { MATRIX_LOOK, MATRIX_TYPE } from "../../look/matrix";
import { EASE, MOTION } from "../../look/values";
import { partRadius } from "../../render/corner";
import { ALWAYS } from "../../render/ink";
import { type Ctx, esc, r1, write } from "../../render/parts";
import type { Span } from "../../timeline";
import { cs } from "../color/draw";

/** 札を区画へ置く出来事 (`step` 段の `event` 番目) の、滑り始める時刻と着く時刻と、その段 */
export function placeTime(ctx: Ctx, step: number, event: number): { start: number; drawn: number; span: Span } {
  const span = ctx.t.steps[step] as Span;
  const time = ctx.t.edges.find((e) => e.step === step && e.event === event);
  return { start: time?.start ?? span.start, drawn: time?.drawn ?? span.start + MOTION.lineup.slide, span };
}

/** 置く前の一覧の枠と題 */
export function drawList(list: NonNullable<MatrixLayout["list"]>, ctx: Ctx): string {
  const L = MATRIX_LOOK.list;
  const y = list.y + L.head / 2 + MATRIX_TYPE.list.size * MATRIX_LOOK.baseline;
  return (
    `<g data-matrix-list=""><rect class="dg-mx-list" x="${r1(list.x)}" y="${r1(list.y)}" width="${r1(list.w)}" height="${r1(list.h)}" rx="${r1(partRadius(ctx.corner, L.radius))}"/>` +
    `${write(ctx.ink, "dg-mx-lt", list.x + L.padX, y, list.title, MATRIX_TYPE.list)}</g>`
  );
}

/** 課題の札 1 つ。一覧の席に描き、置いた段ごとに区画の席へ滑らせる */
function cardOf(card: MatrixCard, ctx: Ctx): string {
  const { m } = ctx;
  const C = MATRIX_LOOK.card;
  const rect = (r: Rect): string => `x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${C.h}" rx="${r1(partRadius(ctx.corner, C.radius))}"`;
  const home = rect(card);
  const ty = card.y + C.h / 2 + MATRIX_TYPE.card.size * MATRIX_LOOK.baseline;
  const times = card.moves.map((move) => ({ move, ...placeTime(ctx, move.step, move.event) }));

  // 札の字が留まっている所と間。滑っている途中は数えない
  const stays: { at: Rect; shown: [number, number] }[] = [{ at: card, shown: [0, times[0]?.start ?? Number.POSITIVE_INFINITY] }];
  times.forEach((t, k) => stays.push({ at: { x: t.move.x, y: t.move.y, w: card.w, h: C.h }, shown: [t.drawn, times[k + 1]?.start ?? Number.POSITIVE_INFINITY] }));
  for (const stay of stays) {
    const dx = stay.at.x - card.x;
    const dy = stay.at.y - card.y;
    ctx.ink.push({ text: card.name, rect: textBox(card.name, card.x + C.padL + dx, ty + dy, MATRIX_TYPE.card), shown: [stay.shown], frame: { name: card.name, rect: stay.at } });
  }

  // 一覧の席から区画の席へ滑り、繰り返す前に一覧の席へ戻る
  let dx = 0;
  let dy = 0;
  const points: [number, number, number, number?, string?][] = [[0, 0, 0]];
  for (const t of times) {
    points.push([t.start, dx, dy, 1, EASE.inOut]);
    dx = t.move.x - card.x;
    dy = t.move.y - card.y;
    points.push([t.drawn, dx, dy]);
  }
  if (times.length > 0) points.push([m.last, dx, dy, 1, EASE.inOut], [m.total, 0, 0]);
  const slide = times.length > 0 ? `;${m.move(points)}` : "";

  // 区画へ向かい始めた時から次の区画へ向かうまで、その区画の色の縁と点を重ね、置いた段の間だけ太い縁を重ねる
  const dot = `<circle class="dg-mx-dot" cx="${r1(card.x + C.dotX)}" cy="${r1(card.y + C.h / 2)}" r="${C.dot}"/>`;
  const colored = times
    .map((t, k) => {
      const until = times[k + 1]?.start ?? m.last;
      return (
        `<g class="dg-a" style="${cs(t.move.color)};${m.vis(t.start, until)}"><rect class="dg-mx-cl" ${home}/>${dot}</g>` +
        `<rect class="dg-mx-cn dg-a" ${home} style="${cs(t.move.color)};${m.vis(t.start, t.span.end, { within: true })}"/>`
      );
    })
    .join("");
  return (
    `<g class="dg-a" data-matrix-item="${esc(card.id)}" style="${cs(MATRIX_LOOK.idle)}${slide}">` +
    `<rect class="dg-mx-card" ${home} ${ctx.sh}/><rect class="dg-mx-co" ${home}/>${dot}${colored}` +
    `${write(undefined, "dg-mx-t", card.x + C.padL, ty, card.name, MATRIX_TYPE.card, ALWAYS)}</g>`
  );
}

/** 課題の札の全て。書いた順に描き、後に書いた札を上に重ねる */
export const drawCards = (cards: readonly MatrixCard[], ctx: Ctx): string => cards.map((card) => cardOf(card, ctx)).join("");
