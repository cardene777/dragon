/**
 * 役の描き方 (#3351、#3348)。
 *
 * 役の札は箱の上に並べ、役が動く段にだけ縁と地に色を付ける。名前の下に一言を書く。
 * 光る動きは、列の図を描く部品 (`render/lineup.ts`) が役の動く段の時刻から組んで渡す。
 * この file は列の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupRoleCard } from "../../kinds/lineup/layout";
import { TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { type Ctx, esc } from "../../render/parts";
import { cs } from "../color/draw";
import { lineupFrame, lines } from "../item/draw";

/** 役の札 `role`。`lit` は役が動く段にだけ縁と地に色を付ける動き (動く段の無い役は `undefined`) */
export function roleCard(role: LineupRoleCard, lit: string | undefined, ctx: Ctx): string {
  const N = LINEUP_LOOK;
  const ring =
    lit === undefined
      ? ""
      : `<g class="dg-a" data-lineup-role-ring="${esc(role.id)}" style="${lit}">${lineupFrame(ctx.corner, "dg-halo", role, N.radius)}${lineupFrame(ctx.corner, "dg-ln-lit", role, N.radius)}</g>`;
  return (
    `<g data-lineup-role="${esc(role.id)}" style="${cs(N.role.color)}">${lineupFrame(ctx.corner, "dg-ln-role", role, N.radius, ` ${ctx.sh}`)}${ring}` +
    `${lines(ctx, "dg-ln-rn", role.title, TYPE.roleName)}${role.note ? lines(ctx, "dg-ln-rt", role.note, TYPE.roleNote) : ""}</g>`
  );
}
