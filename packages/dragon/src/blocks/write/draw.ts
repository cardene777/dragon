/**
 * 値の札の描き方 (#3389)。
 *
 * 残高でない値は、持つ Contract の列の下に値の札で描く。上に値の名前を小さく、下に今の値を書き、書き替えた札は前の値を消し線で残す。
 * 暫定の札は縁を点線にして左の端を斜線で塗り、確定した札は緑の縁、取り消した札は桃色の縁で描く。
 * `write` の段では、書いた者の名札から書き替えた札まで書き込む管を引く。処理を借りる呼び出しの内側の書き込みは、呼んだ側の札へ向く。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipePlate, PipeWrite } from "../../kinds/pipe/layout";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, pathOf, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { hatchId, shortened, STATE_COLOR } from "../hold/draw";

const P = PIPE_LOOK;

/** 値の札。`attrs` は部品の印 (段の始まりの写しは持たない) */
export function plate(p: PipePlate, ctx: Ctx, shown: Shown[], attrs: string): string {
  const radius = partRadius(ctx.corner, P.radius);
  const band =
    p.state === "provisional"
      ? `<rect class="dg-pp-pband" x="${r1(p.x)}" y="${r1(p.y)}" width="${P.plate.padX / 2}" height="${r1(p.h)}" fill="url(#${hatchId(ctx)})"/>`
      : "";
  const was = p.was
    ? write(ctx.ink, "dg-pp-was", p.was.x, p.was.base, p.was.text, PIPE_TYPE.was, shown) +
      (p.strike ? `<rect class="dg-pp-x" x="${r1(p.strike.x)}" y="${r1(p.strike.y)}" width="${r1(p.strike.w)}" height="${r1(p.strike.h)}"/>` : "")
    : "";
  return (
    `<g${attrs} style="${cs(STATE_COLOR[p.state])}">` +
    `<rect class="dg-pp-plate dg-pp-plate-${p.state}" x="${r1(p.x)}" y="${r1(p.y)}" width="${r1(p.w)}" height="${r1(p.h)}" rx="${radius}" ${ctx.sh}/>${band}` +
    write(ctx.ink, `dg-pp-pn${wide(p.label.text)}`, p.label.x, p.label.base, p.label.text, PIPE_TYPE.plateName, shown) +
    write(ctx.ink, `dg-pp-pv dg-pp-pv-${p.state}${wide(p.text.text)}`, p.text.x, p.text.base, p.text.text, PIPE_TYPE.plateValue, shown) +
    `${was}</g>`
  );
}

/** 和文を含む字に足す class。等幅の字は和文を持たないので、和文の字で描く */
export const wide = (text: string): string => ([...text].some((ch) => (ch.codePointAt(0) ?? 0) >= 0x2e80) ? " dg-pp-j" : "");

/** 書き込む管。書いた者の名札の下から、書き替えた札の上の端まで */
export function writePipe(w: PipeWrite, ctx: Ctx, attrs: string): string {
  const a = P.flow.arrow;
  const [ex, ey] = w.points[w.points.length - 1] ?? [0, 0];
  return (
    `<g${attrs} style="${cs("amber")}"><path class="dg-pp-wr" d="${pathOf(shortened(w.points, a), ctx.corner)}"/>` +
    `<path class="dg-pp-wh" d="M ${r1(ex - a)} ${r1(ey - a)} L ${r1(ex)} ${r1(ey)} L ${r1(ex + a)} ${r1(ey - a)} Z"/></g>`
  );
}
