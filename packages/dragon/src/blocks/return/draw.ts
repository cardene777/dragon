/**
 * 呼び出しの管の描き方 (#3389)。
 *
 * 呼び出しの管は呼んだ者の名札の上から出て、深さの段の高さを横に走り、呼ばれた者の名札の上に矢じりで入る。
 * 開いている間は呼び出しの色 (青) の実線で光り、開いた段では呼んだ者の側から引いていく。閉じた後は細い点線で残し、`revert` で閉じた管は桃色にする。
 * 管の上の字の札は、呼び出しの字と添えた ETH、戻る値を出す。同じ段の札は出来事の順に 1 つずつ出す。
 * 呼び出しの種類の見た目 (処理を借りる管の 2 本線、書き込めない管の細さ) は呼び出しの種類のブロックの描き方 (`call/draw.ts`) が持つ。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeLane, PipeTag } from "../../kinds/pipe/layout";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, pathOf, r1, write } from "../../render/parts";
import { kindCore } from "../call/draw";
import { cs } from "../color/draw";
import { shortened } from "../hold/draw";

const P = PIPE_LOOK;

/**
 * 開いている管。`draw` を渡すと、その時刻から引いていく (開いた段)。
 * 管の芯は `data-pipe-call` と `data-pipe-pipe` を持ち、太さを `stroke-width` に書く
 */
export function openLane(lane: PipeLane, ctx: Ctx, attrs: string, draw?: { kf: string; head: string }): string {
  const a = P.lane.arrow;
  const pts = shortened(lane.points, a);
  const d = pathOf(pts, ctx.corner);
  const [tx, ty] = lane.points[lane.points.length - 1] ?? [0, 0];
  const style = cs("blue");
  const drawn = draw ? ` class="dg-pp-lane dg-a" pathLength="1" stroke-dasharray="1 1" style="${style};${draw.kf}"` : ` class="dg-pp-lane" style="${style}"`;
  const head = `<path class="dg-pp-ah${draw ? " dg-a" : ""}"${draw ? ` style="${style};${draw.head}"` : ` style="${style}"`} d="M ${r1(tx - a * 0.8)} ${r1(ty - a)} L ${r1(tx)} ${r1(ty)} L ${r1(tx + a * 0.8)} ${r1(ty - a)} Z"/>`;
  return (
    `<path class="dg-pp-halo" style="${style}" d="${d}"/>` +
    `<path${attrs} data-pipe-pipe="open" stroke-width="${lane.width}"${drawn} d="${d}"/>` +
    kindCore(lane, d) +
    head
  );
}

/** 閉じた管。細い点線で残し、`revert` で閉じた管は桃色にする */
export function closedLane(lane: PipeLane, ctx: Ctx, attrs: string): string {
  return `<path${attrs} data-pipe-pipe="closed" class="dg-pp-shut" style="${cs(lane.how === "revert" ? "rose" : "blue")}" d="${pathOf(lane.points, ctx.corner)}"/>`;
}

/** 管の上の字の札。呼び出しの字は青、戻る値は灰の縁で描く */
export function laneTag(tag: PipeTag, ctx: Ctx, shown: Shown[], attrs: string): string {
  return (
    `<g${attrs} style="${cs(tag.kind === "call" ? "blue" : "slate")}">` +
    `<rect class="dg-pp-tag" x="${r1(tag.x)}" y="${r1(tag.y)}" width="${r1(tag.w)}" height="${r1(tag.h)}" rx="${partRadius(ctx.corner, 4)}"/>` +
    `${write(ctx.ink, "dg-pp-tt", tag.label.x, tag.label.base, tag.label.text, PIPE_TYPE.lane, shown)}</g>`
  );
}
