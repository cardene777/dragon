/**
 * イベントの描き方 (#3389)。
 *
 * 出したイベントは図の上の端のイベントの列に `<出した者の名前>.<イベントの名前>` の札で積み、出した段だけ引数を札の中に出す。
 * 暫定の札は点線の縁、確定した札は緑の縁、取り消した札は桃色の縁と消し線で描く。`emit` の段では、出した者の名札をイベントの色 (桃色) の輪で囲む。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeEventChip, PipePill } from "../../kinds/pipe/layout";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { STATE_COLOR } from "../hold/draw";
import { wide } from "../write/draw";

const P = PIPE_LOOK;

/** イベントの札。`attrs` は部品の印。引数の字は `data-pipe-args` を持つ */
export function eventChip(e: PipeEventChip, ctx: Ctx, shown: Shown[], attrs: string): string {
  const color = e.state === "none" ? "rose" : STATE_COLOR[e.state];
  const strike = e.state === "rolled" ? `<rect class="dg-pp-x" x="${r1(e.text.x)}" y="${r1(e.text.y + e.text.h * 0.55)}" width="${r1(e.text.w)}" height="1.25"/>` : "";
  let args = "";
  if (e.args) {
    ctx.ink.push({ text: e.args.text, rect: { x: e.args.x, y: e.args.y, w: e.args.w, h: e.args.h }, shown });
    args = `<text class="dg-pp-ca${wide(e.args.text)}" data-pipe-args="" x="${r1(e.args.x)}" y="${r1(e.args.base)}">${esc(e.args.text)}</text>`;
  }
  return (
    `<g${attrs} style="${cs(color)}">` +
    `<rect class="dg-pp-chip dg-pp-chip-${e.state}" x="${r1(e.x)}" y="${r1(e.y)}" width="${r1(e.w)}" height="${r1(e.h)}" rx="${partRadius(ctx.corner, 4)}"/>` +
    `${write(ctx.ink, `dg-pp-ct${wide(e.text.text)}`, e.text.x, e.text.base, e.text.text, PIPE_TYPE.chip, shown)}${args}${strike}</g>`
  );
}

/** イベントを出した者の名札を囲む輪。`radius` は名札の角 (丸の名札は渡さない) */
export function ring(pill: PipePill, attrs: string, ctx: Ctx, radius?: number): string {
  const pad = P.ring.width + 1;
  const h = pill.h + pad * 2;
  const rx = radius === undefined ? h / 2 : radius + pad;
  return `<rect${attrs} class="dg-pp-ring" style="${cs("rose")}" x="${r1(pill.x - pad)}" y="${r1(pill.y - pad)}" width="${r1(pill.w + pad * 2)}" height="${r1(h)}" rx="${partRadius(ctx.corner, rx)}"/>`;
}
