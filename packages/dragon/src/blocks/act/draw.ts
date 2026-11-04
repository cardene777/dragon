/**
 * 箱の中の処理の描き方 (#3345)。
 *
 * 時系列図の処理は、その段の間だけ生存線の上の札に出す。ほかの図の種類の処理は箱の下の字に出し、
 * 箱の下の字の移り変わり (`blocks/note/draw.ts` の `subChanges`) が処理の字も組む。
 */
import type { SceneAction } from "../../layout/scene";
import { LOOK } from "../../look/values";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, esc, r1 } from "../../render/parts";
import { cs } from "../color/draw";
import type { Span } from "../../timeline";

/** 時系列図の箱の中の処理の札。その段の間だけ生存線の上に出す。`again` を渡すと (止め絵を選んだ図、#3200)、その間に同じ札をもう 1 つ出す。 */
export function action(a: SceneAction, at: number, until: number, ctx: Ctx, again?: Span): string {
  const shown: Shown[] = again
    ? [
        [at, until],
        [again.start, again.end],
      ]
    : [[at, until]];
  ctx.ink.push({ text: a.text, rect: a, shown, boxed: true });
  return shown
    .map(
      ([from, to]) =>
        `<g class="dg-act dg-a" style="${cs(a.color)};${ctx.m.rise(from, to, true)}"><rect x="${r1(a.x)}" y="${r1(a.y)}" width="${r1(a.w)}" height="${a.h}" rx="${partRadius(ctx.corner, LOOK.action.radius)}"/><text x="${r1(a.x + a.w / 2)}" y="${r1(a.y + a.h / 2 + LOOK.baseline.action)}" text-anchor="middle">${esc(a.text)}</text></g>`,
    )
    .join("");
}
