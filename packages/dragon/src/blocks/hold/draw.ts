/**
 * 槽の描き方 (#3389)。
 *
 * 残高は持ち主の列の下の槽で描き、水位は量に比例させる。上にトークンの名前と量を書き、変わった量の上には前の量を消し線で残す。
 * 暫定の槽は縁を点線にし、増えた分を斜線で、減った分を点線の枠で示す。確定した槽は緑の縁、取り消した槽は桃色の縁で描く。
 * 槽の下からトークンごとの管へ縦の管を下ろし、管の左の端にトークンの名前の札を置く。トークンの Contract の列には、名札から管の弁まで点線を引く。
 * `move` と `[value]` で流れた分は、送り手の槽から管を通って受け手の槽まで太い線で描き、暫定は斜線、確定は緑、取り消しは桃色の点線にする。
 * この file は配管の図を描く部品 (`render/pipe.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { PipeBusAt, PipeBusChip, PipeFlow, PipeGlass, PipeLevel, PipeState } from "../../kinds/pipe/layout";
import type { Point, Rect } from "../../layout/scene";
import { PIPE_LOOK, PIPE_TYPE } from "../../look/pipe";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, pathOf, r1, write } from "../../render/parts";
import { cs } from "../color/draw";

const P = PIPE_LOOK;

/** 印ごとの色の役。変わっていない物と暫定の物は水の色 */
export const STATE_COLOR = { none: "amber", provisional: "amber", final: "green", rolled: "rose" } as const satisfies Record<PipeState, string>;

/** 斜線の模様の名札。図ごとに分ける */
export const hatchId = (ctx: Ctx): string => `dg-ph-${ctx.id}`;

/** 斜線の模様。暫定の水と流れた分を塗る */
export function hatchPattern(ctx: Ctx): string {
  const s = P.flow.stripe;
  return `<pattern id="${hatchId(ctx)}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="dg-pp-h1" width="${s}" height="${s}"/><rect class="dg-pp-h2" width="${s / 2}" height="${s}"/></pattern>`;
}

/** 四角 */
const rect = (cls: string, r: Rect, radius: number, extra = ""): string =>
  `<rect class="${cls}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(Math.max(0, r.w))}" height="${r1(Math.max(0, r.h))}" rx="${radius}"${extra}/>`;

/** 槽のガラスと上の名前と、ガラスから管までの縦の管 */
export function glass(g: PipeGlass, ctx: Ctx, shown: Shown[]): string {
  return (
    `<line class="dg-pp-stubo" x1="${r1(g.stub.x)}" y1="${r1(g.stub.y1)}" x2="${r1(g.stub.x)}" y2="${r1(g.stub.y2)}"/>` +
    `<line class="dg-pp-stubi" x1="${r1(g.stub.x)}" y1="${r1(g.stub.y1)}" x2="${r1(g.stub.x)}" y2="${r1(g.stub.y2)}"/>` +
    rect("dg-pp-glass", g, partRadius(ctx.corner, P.radius)) +
    write(ctx.ink, "dg-pp-tk", g.title.x, g.title.base, g.title.text, PIPE_TYPE.tankTitle, shown)
  );
}

/** 水と量と前の量と、ガラスの上の端の印。`attrs` は部品の印 (段の始まりの写しは持たない) */
export function level(lv: PipeLevel, g: Rect, ctx: Ctx, shown: Shown[], attrs: string): string {
  const radius = partRadius(ctx.corner, P.radius);
  const inner = partRadius(ctx.corner, P.radius / 2);
  const parts = [`<rect class="dg-pp-gl-${lv.state}" x="${r1(g.x)}" y="${r1(g.y)}" width="${r1(g.w)}" height="${r1(g.h)}" rx="${radius}"/>`];
  if (lv.h > 0) parts.push(rect("dg-pp-liq", lv, inner));
  // 暫定の槽は増えた分を斜線で塗り、減った分を元の水位の点線の枠で示す。取り消した槽は取り消す前の水位を点線で示す
  if (lv.base && lv.state !== "final") {
    if (lv.state === "provisional" && lv.h > lv.base.h) parts.push(rect("dg-pp-rise", { ...lv, h: lv.h - lv.base.h }, inner, ` fill="url(#${hatchId(ctx)})"`));
    else if (lv.base.h > 0) parts.push(rect("dg-pp-old", lv.base, inner));
  }
  parts.push(write(ctx.ink, `dg-pp-amt dg-pp-amt-${lv.state}`, lv.text.x, lv.text.base, lv.text.text, PIPE_TYPE.amount, shown));
  if (lv.was) {
    parts.push(write(ctx.ink, "dg-pp-was", lv.was.x, lv.was.base, lv.was.text, PIPE_TYPE.was, shown));
    parts.push(rect("dg-pp-x", { x: lv.was.x - 1, y: lv.was.y + lv.was.h * 0.55, w: lv.was.w + 2, h: 1.25 }, 0));
  }
  if (lv.tag) {
    parts.push(rect("dg-pp-tagb", lv.tag.box, partRadius(ctx.corner, lv.tag.box.h / 2)));
    parts.push(write(ctx.ink, "dg-pp-tagt", lv.tag.x, lv.tag.base, lv.tag.text, PIPE_TYPE.tag, shown));
  }
  return `<g${attrs} style="${cs(STATE_COLOR[lv.state])}">${parts.join("")}</g>`;
}

/** トークンの管。中が空いた太い線で、トークンの Contract の弁と、弁から名札までの点線を持つ */
export function bus(b: PipeBusAt): string {
  const valve = b.valve
    ? `<line class="dg-pp-vline" x1="${r1(b.valve.x)}" y1="${r1(b.top ?? b.y)}" x2="${r1(b.valve.x)}" y2="${r1(b.y)}"/>` +
      `<path class="dg-pp-valve" d="${valvePath(b.valve.x, b.y, P.bus.valve)}"/>`
    : "";
  return (
    `<line class="dg-pp-buso" x1="${r1(b.x1)}" y1="${r1(b.y)}" x2="${r1(b.x2)}" y2="${r1(b.y)}"/>` +
    `<line class="dg-pp-busi" x1="${r1(b.x1)}" y1="${r1(b.y)}" x2="${r1(b.x2)}" y2="${r1(b.y)}"/>` +
    valve
  );
}

/** 弁の形 (2 つの三角を向かい合わせた形)。`(x, y)` が真ん中、`size` は一辺 */
export const valvePath = (x: number, y: number, size: number): string => {
  const h = size / 2;
  return `M ${r1(x - h)} ${r1(y - h)} L ${r1(x)} ${r1(y)} L ${r1(x - h)} ${r1(y + h)} Z M ${r1(x + h)} ${r1(y - h)} L ${r1(x)} ${r1(y)} L ${r1(x + h)} ${r1(y + h)} Z`;
};

/** 管の左の端のトークンの名前の札 */
export function busChip(c: PipeBusChip, ctx: Ctx, shown: Shown[]): string {
  return (
    `<g style="${cs("amber")}">${rect("dg-pp-bc", c, partRadius(ctx.corner, c.h / 2))}` +
    `<circle class="dg-pp-bd" cx="${r1(c.x + P.bus.chipPadX + P.bus.chip / 4)}" cy="${r1(c.y + c.h / 2)}" r="${P.bus.chip / 6}"/>` +
    `${write(ctx.ink, "dg-pp-bt", c.text.x, c.text.base, c.text.text, PIPE_TYPE.bus, shown)}</g>`
  );
}

/** 流れた分。`attrs` は部品の印 */
export function flow(f: PipeFlow, ctx: Ctx, attrs: string): string {
  const d = pathOf(f.points, ctx.corner);
  const a = P.flow.arrow;
  const { x, y, dir } = f.arrow;
  const head = `M ${r1(x - a * dir)} ${r1(y - a)} L ${r1(x)} ${r1(y)} L ${r1(x - a * dir)} ${r1(y + a)}`;
  const stroke = f.state === "provisional" ? ` stroke="url(#${hatchId(ctx)})"` : "";
  return `<g${attrs} style="${cs(STATE_COLOR[f.state])}"><path class="dg-pp-flow dg-pp-flow-${f.state}"${stroke} d="${d}"/><path class="dg-pp-fa" d="${head}"/></g>`;
}

/** 点の並びの最後を `cut` だけ手前で止める。矢じりの先と線の端を重ねないため */
export function shortened(points: Point[], cut: number): Point[] {
  const out = points.map((p): Point => [p[0], p[1]]);
  const last = out[out.length - 1] as Point;
  const before = out[out.length - 2] as Point;
  const len = Math.hypot(last[0] - before[0], last[1] - before[1]) || 1;
  out[out.length - 1] = [last[0] - ((last[0] - before[0]) / len) * cut, last[1] - ((last[1] - before[1]) / len) * cut];
  return out;
}
