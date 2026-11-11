/**
 * 集まりの円のブロックの描き方 (#3620)。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 円は初めて数を書いた段の始まりから現れて最後まで残り、円の外の名前と全体の数も同じ時に出す。全体の数は書き換えた段で入れ替える。
 * 重なりを書いた段の間だけ、その重なりの区画を集まりの円の切り抜き (`clipPath`) を重ねた形で光らせ、重なりの数の札と点線を出す。
 * 区画の中のそれぞれだけの数は、決まった段から出し、数が変わる段で入れ替える。
 * どれにも入らない数は、全ての部品を囲む枠と左下の札で、初めて書いた段から最後まで出す。
 * 字は描いた所と見えている間を字の記録 (`ink`) に残し、`dragon check --layout` と書き出しが字の重なりと枠からのはみ出しを数える。
 * 検査と読み上げの道具が引けるよう、円と字と区画は `data-venn-*` に集まりか区画の名札を持つ。
 * この file は集合の重なりの図を描く部品 (`render/venn.ts`) だけが読み、見本帳を開いた時に読む塊に入れない。
 */
import type { VennLit, VennPlan } from "../../kinds/venn/layout";
import { textBox } from "../../layout/measure";
import { MOTION, type TextStyle } from "../../look/values";
import { VENN_LOOK, VENN_TYPE } from "../../look/venn";
import { frameShape, partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, esc, r1 } from "../../render/parts";
import type { Span } from "../../timeline";
import { textRuns } from "../chart-set/draw";
import { cs } from "../color/draw";
import { vennNumber } from "./regions";

/** 段 `s` の数が出始める時刻 */
const showsAt = (ctx: Ctx, s: number): number => (ctx.t.steps[s] as Span).start + MOTION.edgeAt;

/** 段 `s` の終わり。最後の段は繰り返す前まで */
const endsAt = (ctx: Ctx, s: number): number => (s === ctx.t.steps.length - 1 ? ctx.m.last : (ctx.t.steps[s] as Span).end);

/** 字を 1 つ描き、字の四角と見えている間を字の記録に残す。`attrs` は字に足す属性 (`data-venn-*`) */
function vennText(ctx: Ctx, cls: string, x: number, y: number, text: string, style: TextStyle, attrs: string, span: [number, number], boxed = false): string {
  const [a, b] = span;
  const shown: Shown[] = [[a, b + MOTION.fade]];
  ctx.ink.push({ text, rect: textBox(text, x, y, style, "middle"), shown, ...(boxed ? { boxed } : {}) });
  return `<text class="${cls} dg-a" x="${r1(x)}" y="${r1(y)}" text-anchor="middle"${attrs} style="${ctx.m.vis(a, b)}">${esc(text)}</text>`;
}

/** 段ごとの字を、同じ字が続く段ごとに 1 つの字にして描く。字の無い段は出さない */
function textsByStep(ctx: Ctx, cls: string, x: number, y: number, texts: (string | undefined)[], style: TextStyle, attrs: string, boxed = false): string {
  return textRuns(texts)
    .map((run) => vennText(ctx, cls, x, y, run.text, style, attrs, [showsAt(ctx, run.from), endsAt(ctx, run.to)], boxed))
    .join("");
}

/** 集まりの円の切り抜き。光らせる区画は、区画の集まりの円の切り抜きを重ねて描く */
const clipId = (ctx: Ctx, i: number): string => `dg-vn-${ctx.id}-${i}`;

/** 集まりの円と、円の外の名前と全体の数 */
export function drawCircles(plan: VennPlan, ctx: Ctx): { defs: string; circles: string; labels: string } {
  const defs: string[] = [];
  const circles: string[] = [];
  const labels: string[] = [];
  plan.circles.forEach((c, i) => {
    defs.push(`<clipPath id="${clipId(ctx, i)}"><circle cx="${r1(c.cx)}" cy="${r1(c.cy)}" r="${r1(c.r)}"/></clipPath>`);
    if (c.appear < 0) return;
    const a = showsAt(ctx, c.appear);
    circles.push(`<circle class="dg-vn-c dg-a" data-venn-set="${esc(c.id)}" cx="${r1(c.cx)}" cy="${r1(c.cy)}" r="${r1(c.r)}" style="${cs(c.color)};${ctx.m.vis(a)}"/>`);
    const id = esc(c.id);
    labels.push(
      `<g style="${cs(c.color)}">` +
        vennText(ctx, "dg-vn-name", c.label.x, c.label.name, c.name, VENN_TYPE.name, ` data-venn-name="${id}"`, [a, ctx.m.last]) +
        textsByStep(ctx, "dg-vn-total", c.label.x, c.label.total, (plan.totals[i] ?? []).map((v) => (v === undefined ? undefined : vennNumber(v))), VENN_TYPE.total, ` data-venn-total="${id}"`) +
        "</g>",
    );
  });
  return { defs: `<defs>${defs.join("")}</defs>`, circles: circles.join(""), labels: labels.join("") };
}

/** 重なりを書いた段の間だけ光らせる区画。区画の集まりの円を、ほかの集まりの円の切り抜きで重ねて切る */
export function drawLits(plan: VennPlan, ctx: Ctx): string {
  const order = plan.circles.map((c) => c.id);
  return plan.lits
    .map((lit) => {
      const ids = lit.key.split("&").map((id) => order.indexOf(id));
      const last = plan.circles[ids[ids.length - 1] as number];
      if (!last) return "";
      let shape = `<circle class="dg-vn-lit" cx="${r1(last.cx)}" cy="${r1(last.cy)}" r="${r1(last.r)}"/>`;
      for (const i of ids.slice(0, -1)) shape = `<g clip-path="url(#${clipId(ctx, i)})">${shape}</g>`;
      return `<g class="dg-a" data-venn-lit="${esc(lit.key)}" style="${cs(lit.color)};${ctx.m.vis(showsAt(ctx, lit.step), endsAt(ctx, lit.step))}">${shape}</g>`;
    })
    .join("");
}

/** 重なりの数の札と、札と区画の数の所を結ぶ点線。重なりを書いた段の間だけ出す */
function chipOf(lit: VennLit, ctx: Ctx): string {
  const { chip } = lit;
  const span: [number, number] = [showsAt(ctx, lit.step), endsAt(ctx, lit.step)];
  const y = chip.y + chip.h / 2 + VENN_TYPE.chip.size * 0.35;
  const text = vennText(ctx, "dg-vn-ct", chip.x + chip.w / 2, y, lit.text, VENN_TYPE.chip, ` data-venn-chip="${esc(lit.key)}"`, span, true);
  return (
    `<g style="${cs(lit.color)}">` +
    `<path class="dg-vn-lead dg-a" d="M${r1(lit.from[0])} ${r1(lit.from[1])}L${r1(lit.to[0])} ${r1(lit.to[1])}" style="${ctx.m.vis(span[0], span[1])}"/>` +
    `<rect class="dg-vn-chip dg-a" x="${r1(chip.x)}" y="${r1(chip.y)}" width="${r1(chip.w)}" height="${r1(chip.h)}" rx="${partRadius(ctx.corner, VENN_LOOK.chip.radius)}" style="${ctx.m.vis(span[0], span[1])}"/>` +
    `${text}</g>`
  );
}

/** 重なりの数の札 */
export const drawChips = (plan: VennPlan, ctx: Ctx): string => plan.lits.map((lit) => chipOf(lit, ctx)).join("");

/** 区画の中のそれぞれだけの数。決まった段から出し、数が変わる段で入れ替える */
export function drawRegions(plan: VennPlan, ctx: Ctx): string {
  return plan.regions
    .map((region, i) =>
      textsByStep(ctx, "dg-vn-n", region.x, region.y, (plan.counts[i] ?? []).map((v) => (v === undefined ? undefined : vennNumber(v))), VENN_TYPE.region, ` data-venn-region="${esc(region.key)}"`),
    )
    .join("");
}

/**
 * どれにも入らない数の枠と札。初めて書いた段から最後まで出し、札の数は書き換えた段で入れ替える。
 * 枠は図の囲みなので、角を落とす色味では右上と左下を落とした形で描く
 */
export function drawNone(plan: VennPlan, ctx: Ctx): string {
  const none = plan.none;
  if (!none) return "";
  const { frame, chip } = none;
  const F = VENN_LOOK.frame;
  const y = chip.y + chip.h / 2 + VENN_TYPE.chip.size * 0.35;
  return (
    `<g class="dg-a" data-venn-none="" style="${cs("slate")};${ctx.m.vis(showsAt(ctx, none.first))}">` +
    frameShape(
      ctx.corner,
      ' class="dg-vn-frame" data-venn-frame=""',
      frame,
      `<rect class="dg-vn-frame" data-venn-frame="" x="${r1(frame.x)}" y="${r1(frame.y)}" width="${r1(frame.w)}" height="${r1(frame.h)}" rx="${F.radius}"/>`,
    ) +
    `<rect class="dg-vn-chip" x="${r1(chip.x)}" y="${r1(chip.y)}" width="${r1(chip.w)}" height="${r1(chip.h)}" rx="${partRadius(ctx.corner, VENN_LOOK.chip.radius)}"/>` +
    textsByStep(ctx, "dg-vn-ct", chip.x + chip.w / 2, y, none.texts, VENN_TYPE.chip, ' data-venn-none-count=""', true) +
    "</g>"
  );
}
