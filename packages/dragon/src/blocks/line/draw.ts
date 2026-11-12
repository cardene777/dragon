/**
 * 列の並びの描き方 (#3239、#3351、#3348、#3624)。
 *
 * `line` を書いた段にだけ、帯の下に色の縦棒と一言を出す。一言を出す時刻と隠す動きは、列の図を描く部品 (`render/lineup.ts`) が組んで渡す。
 * 札が前の帯へ戻る段 (差し戻し) は、戻りの線を角を丸めて引き、終わりに矢じりを置き、線の上に戻る向きの印と「差し戻し」の札を置く。
 * 狭い枠は札の代わりに戻る印の丸だけを置く。
 * この file は列の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupBack, LineupRemark } from "../../kinds/lineup/layout";
import { type TextStyle, TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, esc, r1 } from "../../render/parts";
import { cs } from "../color/draw";
import { backGlyph, bendPath, headPath, lines, rect } from "../item/draw";

/** 帯の下の一言 1 つ。色の縦棒と字で、字は `shown` の間だけ書く */
export function remark(r: LineupRemark, shown: Shown[], ctx: Ctx): string {
  return `<g${r.color ? ` style="${cs(r.color)}"` : ""}>${rect(r.color ? "dg-ln-bar" : "dg-ln-bar0", r.bar, 0)}${lines(ctx, "dg-ln-rk", r.text, TYPE.remark, shown)}</g>`;
}

/** 差し戻し `b` の戻りの線と札。`vis` は差し戻しの段に見せる動き、`shown` は字を見せる間 */
export function backLine(b: LineupBack, vis: string, shown: Shown[], style: TextStyle, ctx: Ctx): string {
  const B = LINEUP_LOOK.board;
  const R = B.return;
  const end = b.points.at(-1);
  const before = b.points.at(-2);
  const line = `<path class="dg-lb-back" d="${bendPath(b.points, R.bend)}"/>${end && before ? `<path class="dg-lb-back" d="${headPath(before, end, R.head, R.head * B.chevron.half / B.chevron.len)}"/>` : ""}`;
  const { label } = b;
  let tag: string;
  if (b.icon) {
    const r = label.w / 2;
    tag = `<circle class="dg-lb-tag" cx="${r1(label.x + r)}" cy="${r1(label.y + r)}" r="${r1(r)}"/>${backGlyph(label.x + r, label.y + r, B.label.glyph * (r / B.back.r))}`;
  } else {
    const glyphX = label.x + B.label.padX + B.label.glyph / 2;
    tag = `${rect("dg-lb-tag", label, partRadius(ctx.corner, label.h / 2))}${backGlyph(glyphX, label.y + label.h / 2, B.label.glyph)}${lines(ctx, "dg-lb-labelt", label.text, style, shown)}`;
  }
  return `<g class="dg-a" data-lineup-back="${esc(b.id)}" style="${cs(R.color)};${vis}">${line}<g data-lineup-back-label=""${b.icon ? ` aria-label="${esc(label.text.text)}"` : ""}>${tag}</g></g>`;
}
