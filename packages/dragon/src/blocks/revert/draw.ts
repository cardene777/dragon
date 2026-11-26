/**
 * 取り消しの描き方 (#3389、#3398)。
 *
 * `revert` の段で、落ちた呼び出しの内側の変更 (槽、値の札、イベント、流れた分) は取り消しの印を付けて元の値へ戻る。
 * 戻った槽は桃色の縁で描き、取り消す前の水位に桃色の点線を引く。落ちた理由は、その段の吹き出しが桃色の縁で大きく書く。
 * 落ちの連なりの元の箱には、桃色の×の印と落ちた理由を持つ取り消しの札を添える (#3974)。札は図の中に在るので、吹き出しと操作の帯を隠した図でも理由が読める。
 * この file は槽の描き方 (`hold/draw.ts`) と配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeRevertTag } from "../../kinds/pipe/layout";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { wide } from "../write/draw";

/** 取り消す前の水位の線。槽の左の外から右の外まで */
export const undoneMark = (x1: number, x2: number, y: number): string =>
  `<line class="dg-pp-mark dg-pp-mark-rolled" x1="${r1(x1)}" y1="${r1(y)}" x2="${r1(x2)}" y2="${r1(y)}"/>`;

/**
 * 取り消しの札 (#3974)。図の中の札 (`dg-pp-lab`) と同じ枠と字を桃色で描き、左に確認の計器の落ちた印 (`dg-pp-lamp`) と同じ×の丸を置く。
 * 今の部品の class だけで描くので、札を持たない図の絵と CSS は変わらない。`shown` は札の字が見える時刻、`attrs` は部品の印
 */
export function revertTag(t: PipeRevertTag, ctx: Ctx, shown: Shown[], attrs: string): string {
  const U = PIPE_LOOK.undo;
  const cx = t.x + PIPE_LOOK.chip.padX + U.r;
  const cy = t.y + t.h / 2;
  const d = U.r * 0.45;
  return (
    `<g${attrs} class="dg-pp-labg" data-pipe-revert="${esc(t.party)}" style="${cs("rose")}">` +
    `<rect class="dg-pp-lab" x="${r1(t.x)}" y="${r1(t.y)}" width="${r1(t.w)}" height="${r1(t.h)}" rx="${partRadius(ctx.corner, PIPE_LOOK.chip.rx)}"/>` +
    `<g data-pipe-revert-mark=""><circle class="dg-pp-lamp" cx="${r1(cx)}" cy="${r1(cy)}" r="${U.r}" style="fill:var(--c)"/>` +
    `<path class="dg-pp-lampm" d="M ${r1(cx - d)} ${r1(cy - d)} L ${r1(cx + d)} ${r1(cy + d)} M ${r1(cx + d)} ${r1(cy - d)} L ${r1(cx - d)} ${r1(cy + d)}"/></g>` +
    write(ctx.ink, `dg-pp-labt${wide(t.text)}`, cx + U.r + U.gap, cy + PIPE_TYPE.chip.size * 0.35, t.text, PIPE_TYPE.chip, shown) +
    `</g>`
  );
}
