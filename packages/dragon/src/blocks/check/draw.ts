/**
 * 確認の描き方 (#3389)。
 *
 * `check` の段で、行う者の列の下に計器の札を出し、比べる式 (`0.05 WETH ≥ 0.04 WETH`) と結果の印を書く。計器はその段だけ出す。
 * 段の後は、行う者の名札の右上の角と図の上の端の行に確認の印を残す。通った確認は紫の印、落ちた確認は桃色の印で描く。
 * 名札の下の札 (計器、換算、取り消し、畳んだ箱) は同じ形なので、札の枠と印と 2 行の字を描く部品 (`card`) をこの file が持ち、ほかのブロックの描き方が読む。
 * この file は配管の図を描く部品 (`render/pipe.ts`) と配管の図のブロックの描き方だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeCheckMark, PipeGauge, PipeLamp, PipeText } from "../../kinds/pipe/layout";
import type { Rect } from "../../layout/scene";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import type { ColorKey, TextStyle } from "../../look/values";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { wide } from "../write/draw";

const P = PIPE_LOOK;

/** 札の左の印の形 */
type CardIcon = "gauge" | "convert" | "undo" | "fold";

/** 札の左の印。`(x, y)` が真ん中 */
function iconOf(icon: CardIcon, x: number, y: number): string {
  const p = (d: string): string => `<path class="dg-pp-ic" d="${d}"/>`;
  switch (icon) {
    case "gauge":
      return p(`M ${r1(x - 9)} ${r1(y + 4)} A 9 9 0 0 1 ${r1(x + 9)} ${r1(y + 4)} M ${r1(x)} ${r1(y + 4)} L ${r1(x + 5)} ${r1(y - 3)}`);
    case "convert":
      return p(
        `M ${r1(x - 8)} ${r1(y - 1)} A 8 8 0 0 1 ${r1(x + 6)} ${r1(y - 5)} M ${r1(x + 6)} ${r1(y - 5)} L ${r1(x + 7)} ${r1(y - 10)} M ${r1(x + 6)} ${r1(y - 5)} L ${r1(x + 1)} ${r1(y - 6)} ` +
          `M ${r1(x + 8)} ${r1(y + 1)} A 8 8 0 0 1 ${r1(x - 6)} ${r1(y + 5)} M ${r1(x - 6)} ${r1(y + 5)} L ${r1(x - 7)} ${r1(y + 10)} M ${r1(x - 6)} ${r1(y + 5)} L ${r1(x - 1)} ${r1(y + 6)}`,
      );
    case "undo":
      return p(`M ${r1(x - 6)} ${r1(y - 6)} L ${r1(x + 6)} ${r1(y + 6)} M ${r1(x + 6)} ${r1(y - 6)} L ${r1(x - 6)} ${r1(y + 6)}`);
    case "fold":
      return p(`M ${r1(x - 8)} ${r1(y - 3)} h 12 v 11 h -12 Z M ${r1(x - 4)} ${r1(y - 3)} v -5 h 12 v 11 h -4`);
  }
}

/** 通ったか落ちたかの印 (レ点か ×)。`(x, y)` が真ん中、`size` は一辺 */
function okMark(ok: boolean, x: number, y: number, size: number, cls = "dg-pp-mk"): string {
  const h = size / 2;
  const d = ok
    ? `M ${r1(x - h)} ${r1(y)} L ${r1(x - h / 3)} ${r1(y + h * 0.66)} L ${r1(x + h)} ${r1(y - h * 0.66)}`
    : `M ${r1(x - h * 0.8)} ${r1(y - h * 0.8)} L ${r1(x + h * 0.8)} ${r1(y + h * 0.8)} M ${r1(x + h * 0.8)} ${r1(y - h * 0.8)} L ${r1(x - h * 0.8)} ${r1(y + h * 0.8)}`;
  return `<path class="${cls}" d="${d}"/>`;
}

/** 名札の下の札。枠と左の印と、上の小さな字 (`title`) と下の大きな字 (`value`) */
export function card(
  c: Rect & { title: PipeText; value: PipeText },
  color: ColorKey,
  icon: CardIcon,
  ctx: Ctx,
  shown: Shown[],
  attrs: string,
  cls = "dg-pp-card",
  valueStyle: TextStyle = icon === "fold" ? PIPE_TYPE.fold : PIPE_TYPE.cardValue,
  after = "",
): string {
  return (
    `<g${attrs} style="${cs(color)}">` +
    `<rect class="${cls}" x="${r1(c.x)}" y="${r1(c.y)}" width="${r1(c.w)}" height="${r1(c.h)}" rx="${partRadius(ctx.corner, P.radius)}" ${ctx.sh}/>` +
    iconOf(icon, c.x + P.card.padX + P.card.icon / 2, c.y + c.h / 2) +
    write(ctx.ink, `dg-pp-k1${wide(c.title.text)}`, c.title.x, c.title.base, c.title.text, PIPE_TYPE.cardTitle, shown) +
    write(ctx.ink, `dg-pp-k2${icon === "fold" ? " dg-pp-k3" : ""}${wide(c.value.text)}`, c.value.x, c.value.base, c.value.text, valueStyle, shown) +
    `${after}</g>`
  );
}

/** 計器の札。比べる式の後ろに結果の印を置く */
export function gauge(g: PipeGauge, ctx: Ctx, shown: Shown[], attrs: string): string {
  const size = P.card.icon / 2;
  const mark = okMark(g.ok, g.value.x + g.value.w + size, g.value.base - PIPE_TYPE.cardValue.size * 0.35, size, "dg-pp-okm");
  return card(g, g.ok ? "violet" : "rose", "gauge", ctx, shown, attrs, "dg-pp-card", PIPE_TYPE.cardValue, mark);
}

/** 確認の印 (名札の右上の角と、図の上の端の行)。`attrs` は部品の印 */
export function lamp(l: PipeLamp | PipeCheckMark, attrs: string): string {
  const r = l.w / 2;
  const cx = l.x + r;
  const cy = l.y + r;
  return `<g${attrs} style="${cs(l.ok ? "violet" : "rose")}"><circle class="dg-pp-lamp" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}"/>${okMark(l.ok, cx, cy, l.w * 0.5)}</g>`;
}
