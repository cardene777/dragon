/**
 * 葉の描き方 (#3233、#3348)。
 *
 * 値を持つ葉の下に名札の札を置き、葉より前の最初の段から出しておく。葉が出た時に、葉と札を点線で結ぶ。
 * 札と点線を薄くする動きは、木の図を描く部品 (`render/tree.ts`) が箱ごとにまとめて掛ける。
 * この file は木の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { TreePlaced } from "../../kinds/tree/layout";
import type { Rect } from "../../layout/scene";
import { LOOK, TYPE } from "../../look/values";
import { partRadius } from "../../render/corner";
import { ALWAYS } from "../../render/ink";
import { type Ctx, r1, write } from "../../render/parts";
import { glyph } from "../icon/draw";

/** 葉 `n` と下の札 `card` を結ぶ点線。葉が現れる時刻 `at` から出す */
export function leafTie(n: TreePlaced, card: Rect, at: number, ctx: Ctx): string {
  const d = `M ${r1(n.cx)} ${r1(n.y + n.h + LOOK.edge.inset)} V ${r1(card.y - LOOK.edge.inset)}`;
  return `<path class="dg-tree-con dg-a" d="${d}" style="${ctx.m.vis(at)}"/>`;
}

/** 葉の下の名札の札。札の地と、書類の絵柄と、名札の字を左から並べる */
export function leafCard(c: Rect & { text: string }, ctx: Ctx): string {
  const T = LOOK.tree;
  const gx = c.x + T.card.padX + T.card.icon / 2;
  const cy = c.y + c.h / 2;
  const text = write(ctx.ink, "dg-tree-ct", c.x + T.card.padX + T.card.icon + T.card.gap, cy + LOOK.baseline.label, c.text, TYPE.treeCard, ALWAYS);
  return `<rect class="dg-tree-card" x="${r1(c.x)}" y="${r1(c.y)}" width="${r1(c.w)}" height="${c.h}" rx="${partRadius(ctx.corner, T.card.radius)}"/>${glyph("doc", gx, cy, T.card.glyph, "dg-tree-cg")}${text}`;
}
