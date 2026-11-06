/**
 * 確認の描き方 (#3389、#3398)。
 *
 * `check` を行う者ごとに 1 つの計器を、その者を呼んだ管の上か、トークンの Contract の値の管の上に置く。
 * 計器は落ちる側と通る側の目盛りの帯と針を持ち、確かめた段で針が振れて、通ったか (緑のレ点) 落ちたか (桃色の ×) の印が付く。
 * 確かめた段の後も針と印を残し、値の管の計器は比べた式を上に残す。
 * 畳んだ箱の札 (`card`) も同じ札の形で描くので、この file が持ち、畳みのブロックの描き方が読む。
 * この file は配管の図を描く部品 (`render/pipe.ts`) と配管の図のブロックの描き方だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeGauge, PipeText } from "../../kinds/pipe/layout";
import type { Rect } from "../../layout/scene";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import type { ColorKey } from "../../look/values";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { wide } from "../write/draw";

const P = PIPE_LOOK;
const G = PIPE_LOOK.gauge;

/** 畳んだ箱の札の左の印 (2 枚の重なった紙)。`(x, y)` が真ん中 */
const foldIcon = (x: number, y: number): string =>
  `<path class="dg-pp-ic" d="M ${r1(x - 8)} ${r1(y - 3)} h 12 v 11 h -12 Z M ${r1(x - 4)} ${r1(y - 3)} v -5 h 12 v 11 h -4"/>`;

/** 札。枠と左の印と、上の小さな字 (`title`) と下の大きな字 (`value`) */
export function card(c: Rect & { title: PipeText; value: PipeText }, color: ColorKey, ctx: Ctx, shown: Shown[], attrs: string, cls = "dg-pp-card"): string {
  return (
    `<g${attrs} style="${cs(color)}">` +
    `<rect class="${cls}" x="${r1(c.x)}" y="${r1(c.y)}" width="${r1(c.w)}" height="${r1(c.h)}" rx="${partRadius(ctx.corner, P.radius)}" ${ctx.sh}/>` +
    foldIcon(c.x + P.card.padX + P.card.icon / 2, c.y + c.h / 2) +
    write(ctx.ink, `dg-pp-k1${wide(c.title.text)}`, c.title.x, c.title.base, c.title.text, PIPE_TYPE.cardTitle, shown) +
    write(ctx.ink, `dg-pp-k2 dg-pp-k3${wide(c.value.text)}`, c.value.x, c.value.base, c.value.text, PIPE_TYPE.fold, shown) +
    `</g>`
  );
}

/** 円の弧。`a0` 度から `a1` 度まで、真上を 0 度に右回り */
function arc(cx: number, cy: number, a0: number, a1: number, r: number): string {
  const at = (a: number): [number, number] => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = at(a0);
  const [x1, y1] = at(a1);
  return `M ${r1(x0)} ${r1(y0)} A ${r1(r)} ${r1(r)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${r1(x1)} ${r1(y1)}`;
}

/**
 * 計器。`swing` を渡すと針がその style の動きで振れ、`lit` を渡すと通ったかの印がその style の動きで出る。
 * 針は `data-pipe-needle`、印は `data-pipe-lamp` を持つ。`attrs` は部品の印
 */
export function gauge(g: PipeGauge, ctx: Ctx, shown: Shown[], attrs: string, swing = "", lit = ""): string {
  const { cx, cy, r } = g;
  const needle = `<path class="dg-pp-needle" d="M ${r1(cx - 2.5)} ${r1(cy)} L ${r1(cx)} ${r1(cy - r + G.needle)} L ${r1(cx + 2.5)} ${r1(cy)} Z"/>`;
  const turned = swing
    ? `<g class="dg-a" data-pipe-needle="" style="transform-origin:${r1(cx)}px ${r1(cy)}px;${swing}">${needle}</g>`
    : `<g data-pipe-needle="" transform="rotate(${g.angle} ${r1(cx)} ${r1(cy)})">${needle}</g>`;
  const { x: lx, y: ly, r: lr } = g.lamp;
  const mark = g.ok
    ? `M ${r1(lx - 5)} ${r1(ly)} l 3.5 4 l 7 -8`
    : `M ${r1(lx - 4.5)} ${r1(ly - 4.5)} l 9 9 M ${r1(lx + 4.5)} ${r1(ly - 4.5)} l -9 9`;
  const lamp = `<g data-pipe-lamp=""${lit ? ` class="dg-a" style="${lit}"` : ""}><circle class="dg-pp-lamp" cx="${r1(lx)}" cy="${r1(ly)}" r="${lr}"/><path class="dg-pp-lampm" d="${mark}"/></g>`;
  return (
    `<g${attrs} class="dg-pp-gauge${g.ok ? "" : " dg-pp-gfail"}" style="${cs(g.ok ? "violet" : "rose")}">` +
    (g.stem ? `<line class="dg-pp-gstem" x1="${r1(cx)}" y1="${r1(g.stem.y1)}" x2="${r1(cx)}" y2="${r1(g.stem.y2)}"/>` : "") +
    `<circle class="dg-pp-face" cx="${r1(cx)}" cy="${r1(cy)}" r="${r}"/>` +
    `<path class="dg-pp-zone dg-pp-zbad" d="${arc(cx, cy, -125, -12, r - G.zone)}"/><path class="dg-pp-zone dg-pp-zgood" d="${arc(cx, cy, -4, 125, r - G.zone)}"/>` +
    `${turned}<circle class="dg-pp-hub" cx="${r1(cx)}" cy="${r1(cy)}" r="${G.hub}"/>${lamp}` +
    (g.read ? write(ctx.ink, "dg-pp-gread", g.read.x, g.read.base, g.read.text, PIPE_TYPE.read, shown) : "") +
    `</g>`
  );
}
