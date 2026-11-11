/**
 * 考えと、親から考えへの線の描き方 (#3619)。
 *
 * 考えと線は初めから薄く出しておき、書いた段で濃くする。親から子への線は、書いた段で親の側から子へ引いていく。
 * 考えの枠は考えの色の縁で描き、書いた段の間だけ太い縁を重ねる。題と枝の名前は太く、葉の名前は小さく書く。
 * 繰り返す前に、考えと線は初めの薄さへ戻る。
 * 考えの所と線の曲線は並べ方 (`kinds/mind/layout.ts`) が持つ。
 * この file は考えを広げる地図の描く部品 (`kinds/mind.ts`) が出し、見本帳を開いた時に読む塊に入れない
 */
import type { MindLayout, MindLink, MindPlaced } from "../../kinds/mind/layout";
import { textBox } from "../../layout/measure";
import { MIND_LOOK, MIND_TYPE } from "../../look/mind";
import { EASE, MOTION } from "../../look/values";
import { partRadius } from "../../render/corner";
import { ALWAYS } from "../../render/ink";
import type { Frame } from "../../render/motion";
import { type Ctx, esc, r1, write } from "../../render/parts";
import type { Span } from "../../timeline";
import { cs } from "../color/draw";

const TYPES = [MIND_TYPE.centre, MIND_TYPE.branch, MIND_TYPE.leaf] as const;

/** 考え (`step` 段の `event` 番目の出来事) を引き始める時刻と引き終える時刻と、その段 */
function timeOf(ctx: Ctx, step: number, event: number): { start: number; drawn: number; span: Span } {
  const span = ctx.t.steps[step] as Span;
  const time = ctx.t.edges.find((e) => e.step === step && e.event === event);
  return { start: time?.start ?? span.start, drawn: time?.drawn ?? span.start + MOTION.draw, span };
}

/** 書いた段より前は薄く、`start` から濃くなり、繰り返す前に薄さへ戻る濃さの点 */
function brighten(ctx: Ctx, start: number): Frame[] {
  const { m } = ctx;
  const faint = MIND_LOOK.faint;
  return [
    [0, { opacity: faint }],
    [start, { opacity: faint }, EASE.out],
    [start + MOTION.fade, { opacity: 1 }],
    [m.last, { opacity: 1 }, EASE.inOut],
    [m.total, { opacity: faint }],
  ];
}

/** 親から子への線。書いた段の始まりで薄い線を消し、引き始める時刻から引き終える時刻まで親の側から伸ばす */
function linkOf(link: MindLink, ctx: Ctx): string {
  const { m } = ctx;
  const { start, drawn, span } = timeOf(ctx, link.step, link.event);
  ctx.traces.push({ from: link.from, to: link.to, points: link.points, shown: ALWAYS });
  const faint = MIND_LOOK.faint;
  const cut = Math.max(0, span.start - MIND_LOOK.cut);
  const frames: Frame[] = [
    [0, { opacity: faint, "stroke-dashoffset": 0 }],
    ...(cut > 0 ? ([[cut, { opacity: faint, "stroke-dashoffset": 0 }]] as Frame[]) : []),
    [span.start, { opacity: 1, "stroke-dashoffset": 1 }],
    [start, { "stroke-dashoffset": 1 }, EASE.inOut],
    [drawn, { "stroke-dashoffset": 0 }],
    [m.last, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut],
    [m.total, { opacity: faint, "stroke-dashoffset": 0 }],
  ];
  const [a, b, c, d] = link.curve;
  const path = `M${r1(a[0])} ${r1(a[1])}C${r1(b[0])} ${r1(b[1])} ${r1(c[0])} ${r1(c[1])} ${r1(d[0])} ${r1(d[1])}`;
  return `<path class="dg-mind-ln dg-mind-l${link.level} dg-a" data-mind-link="${esc(link.from)}>${esc(link.to)}" pathLength="1" d="${path}" style="${cs(link.color)};${m.kf(frames)}"/>`;
}

/** 考えの枠と名前。地と縁と、書いた段の間だけ重ねる太い縁と、名前の字 */
function ideaOf(p: MindPlaced, ctx: Ctx): string {
  const { m } = ctx;
  const { start, span } = timeOf(ctx, p.step, p.event);
  const style = TYPES[p.level];
  const rx = partRadius(ctx.corner, p.h / 2);
  const rect = `x="${r1(p.x)}" y="${r1(p.y)}" width="${r1(p.w)}" height="${p.h}" rx="${r1(rx)}"`;
  const y = p.cy + style.size * MIND_LOOK.baseline;
  ctx.ink.push({ text: p.name, rect: textBox(p.name, p.cx, y, style, "middle"), shown: ALWAYS, frame: { name: p.name, rect: { x: p.x, y: p.y, w: p.w, h: p.h } } });
  const name = write(undefined, `dg-mind-t${p.level}`, p.cx, y, p.name, style, ALWAYS, "middle");
  const now = `<rect class="dg-mind-now dg-a" ${rect} style="${m.vis(start, span.end, { within: true })}"/>`;
  return (
    `<g class="dg-a" data-mind-idea="${esc(p.id)}" style="${cs(p.color)};${m.kf(brighten(ctx, start))}">` +
    `<rect class="dg-mind-card" ${rect} ${ctx.sh}/><rect class="dg-mind-ol${p.level === 2 ? " dg-mind-o2" : ""}" ${rect}/>${now}${name}</g>`
  );
}

/** 考えを広げる地図の線と考え。線 (`base`) は考え (`node`) の下に描く */
export function drawIdeas(layout: MindLayout, ctx: Ctx): { base: string; node: string } {
  return {
    base: layout.links.map((link) => linkOf(link, ctx)).join(""),
    node: layout.ideas.map((p) => ideaOf(p, ctx)).join(""),
  };
}
