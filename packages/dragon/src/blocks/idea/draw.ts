/**
 * 考えと、親から考えへの線の描き方 (#3619)。
 *
 * 考えと線は初めから薄く出しておき、書いた段で濃くする。親から子への線は、書いた段で親の側から子へ引いていく。
 * 親の縁から出る幹 (#3960) は、その側で最初に書いた子と一緒に親の色で引き、その子への曲線は幹を引き終えてから引く。後の段の子は幹の先から曲線だけを引く。
 * 考えの枠は考えの色の縁で描き、書いた段の間だけ太い縁を重ねる。題と枝の名前は太く、葉の名前は小さく書く。
 * 繰り返す前に、考えと線は初めの薄さへ戻る。
 * 考えの所と線の曲線は並べ方 (`kinds/mind/layout.ts`) が持つ。
 * この file は考えを広げる地図の描く部品 (`kinds/mind.ts`) が出し、見本帳を開いた時に読む塊に入れない
 */
import type { MindLayout, MindLink, MindPlaced, MindTrunk } from "../../kinds/mind/layout";
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

/** 書いた段の始まりで薄い線を消し、`from` から `to` までの時刻に親の側から伸ばす線の濃さと引き具合の点 */
function drawing(ctx: Ctx, span: Span, from: number, to: number): Frame[] {
  const { m } = ctx;
  const faint = MIND_LOOK.faint;
  const cut = Math.max(0, span.start - MIND_LOOK.cut);
  return [
    [0, { opacity: faint, "stroke-dashoffset": 0 }],
    ...(cut > 0 ? ([[cut, { opacity: faint, "stroke-dashoffset": 0 }]] as Frame[]) : []),
    [span.start, { opacity: 1, "stroke-dashoffset": 1 }],
    [from, { "stroke-dashoffset": 1 }, EASE.inOut],
    [to, { "stroke-dashoffset": 0 }],
    [m.last, { opacity: 1, "stroke-dashoffset": 0 }, EASE.inOut],
    [m.total, { opacity: faint, "stroke-dashoffset": 0 }],
  ];
}

/** 幹を引き終える時刻。最初の子への線を引く間のうち、`MIND_LOOK.fork` の割合を幹に使う */
function forkedAt(ctx: Ctx, trunk: MindTrunk): number {
  const { start, drawn } = timeOf(ctx, trunk.step, trunk.event);
  return start + (drawn - start) * MIND_LOOK.fork;
}

/** 親の縁から幹の先までの直線。最初の子を書いた段で、親の側から引く */
function trunkOf(trunk: MindTrunk, ctx: Ctx): string {
  const { start, span } = timeOf(ctx, trunk.step, trunk.event);
  const path = `M${r1(trunk.start[0])} ${r1(trunk.start[1])}L${r1(trunk.fork[0])} ${r1(trunk.fork[1])}`;
  return `<path class="dg-mind-ln dg-mind-l${trunk.level} dg-a" data-mind-trunk="${esc(trunk.from)}" pathLength="1" d="${path}" style="${cs(trunk.color)};${ctx.m.kf(drawing(ctx, span, start, forkedAt(ctx, trunk)))}"/>`;
}

/** 幹の先から子への曲線。幹と同じ段に書いた子は、幹を引き終えてから引く */
function linkOf(link: MindLink, trunk: MindTrunk | undefined, ctx: Ctx): string {
  const { start, drawn, span } = timeOf(ctx, link.step, link.event);
  // 崩れの確かめには、子から親へ集まる線として渡す。同じ幹を通る線は、階層図の枝と同じく同じ箱へ入る線として数えない (#3960)
  ctx.traces.push({ from: link.to, to: link.from, points: [...link.points].reverse(), shown: ALWAYS });
  const from = trunk && trunk.step === link.step ? Math.max(start, forkedAt(ctx, trunk)) : start;
  const [a, b, c, d] = link.curve;
  const path = `M${r1(a[0])} ${r1(a[1])}C${r1(b[0])} ${r1(b[1])} ${r1(c[0])} ${r1(c[1])} ${r1(d[0])} ${r1(d[1])}`;
  return `<path class="dg-mind-ln dg-mind-l${link.level} dg-a" data-mind-link="${esc(link.from)}>${esc(link.to)}" pathLength="1" d="${path}" style="${cs(link.color)};${ctx.m.kf(drawing(ctx, span, from, drawn))}"/>`;
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
  const trunkOfLink = (link: MindLink): MindTrunk | undefined =>
    layout.trunks.find((t) => t.from === link.from && t.side === Math.sign(link.curve[3][0] - link.curve[0][0]));
  return {
    base: [...layout.trunks.map((t) => trunkOf(t, ctx)), ...layout.links.map((link) => linkOf(link, trunkOfLink(link), ctx))].join(""),
    node: layout.ideas.map((p) => ideaOf(p, ctx)).join(""),
  };
}
