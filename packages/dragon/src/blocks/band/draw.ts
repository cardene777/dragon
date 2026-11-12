/**
 * 量の帯と量の棒の描き方 (#3626)。
 *
 * 帯は真ん中の曲線を帯の幅の太さで引き、その段で出どころの縁から行き先の縁へ伸ばす。伸びた段の間は濃く、後の段では薄くして残す。
 * 出どころの無い箱の棒と名前は初めから出し、行き先の棒は入る帯が伸び終えた時に帯の幅の分ずつ現れ、名前と量は最初の帯が着いた時に出る。
 * 帯の所と棒の所と字の所は並べ方 (`kinds/sankey/layout.ts`) が持つ。
 * この file は量の行き先の図の描く部品 (`kinds/sankey.ts`) が出し、見本帳を開いた時に読む塊に入れない
 */
import type { SankeyBand, SankeyLayout, SankeyNode } from "../../kinds/sankey/layout";
import { SANKEY_LOOK, SANKEY_TYPE } from "../../look/sankey";
import { EASE, MOTION } from "../../look/values";
import { partRadius } from "../../render/corner";
import { ALWAYS, type Shown } from "../../render/ink";
import { type Ctx, r1, write } from "../../render/parts";
import { cs } from "../color/draw";

const B = SANKEY_LOOK.band;

/** 帯の真ん中の曲線。両端で水平になる 3 次の曲線 */
function centre(band: SankeyBand): string {
  const ca = (band.a[0] + band.a[1]) / 2;
  const cb = (band.b[0] + band.b[1]) / 2;
  const m = (band.x1 + band.x2) / 2;
  return `M${r1(band.x1)} ${r1(ca)}C${r1(m)} ${r1(ca)} ${r1(m)} ${r1(cb)} ${r1(band.x2)} ${r1(cb)}`;
}

/** 帯の段の時刻。引き始め、伸び終わり、段の終わり */
function timesOf(band: Pick<SankeyBand, "step" | "event">, ctx: Ctx): { start: number; drawn: number; end: number } {
  const { t } = ctx;
  const time = t.edges.find((e) => e.step === band.step && e.event === band.event);
  const span = t.steps[band.step];
  const start = time?.start ?? span?.start ?? 0;
  const drawn = time?.drawn ?? start;
  return { start, drawn, end: span?.end ?? drawn };
}

/** 帯を全て描く。帯ごとに 1 つの部品 (`data-band="<出どころ>><行き先>"`) にまとめ、行き先の色で塗る */
export function drawBands(layout: SankeyLayout, ctx: Ctx): string {
  const { m } = ctx;
  return layout.bands
    .map((band) => {
      const { start, drawn, end } = timesOf(band, ctx);
      const style = m.kf([
        [0, { opacity: 0, "stroke-dashoffset": 1, "stroke-opacity": B.now }],
        [start, { opacity: 0, "stroke-dashoffset": 1 }, EASE.inOut],
        [start + 0.05, { opacity: 1 }],
        [drawn, { "stroke-dashoffset": 0 }],
        [end, { "stroke-opacity": B.now }, EASE.inOut],
        [end + MOTION.fade, { "stroke-opacity": B.lit }],
        [m.last, { opacity: 1, "stroke-dashoffset": 0, "stroke-opacity": B.lit }],
        [Math.min(m.last + MOTION.fade, m.total), { opacity: 0 }],
        [m.total, { opacity: 0, "stroke-dashoffset": 1 }],
      ]);
      const w = band.a[1] - band.a[0];
      return `<g data-band="${band.from}>${band.to}" style="${cs(band.color)}"><path class="dg-sk-band dg-a" pathLength="1" d="${centre(band)}" stroke-width="${r1(w)}" style="${style}"/></g>`;
    })
    .join("");
}

/** 箱の名前と量の字。`shown` の間だけ字の四角を記録する */
function labelOf(node: SankeyNode, ctx: Ctx, shown: Shown[]): string {
  const { name, amount, place } = node.label;
  const T = SANKEY_TYPE;
  const lead = place === "above";
  return (
    write(ctx.ink, "dg-sk-name", name.x, name.y, name.text, T.name, shown) +
    (amount ? write(ctx.ink, lead ? "dg-sk-lead" : "dg-sk-amt", amount.x, amount.y, amount.text, lead ? T.lead : T.amount, shown) : "")
  );
}

/**
 * 量の棒と名前と量を全て描く。箱ごとに 1 つの部品 (`data-node="<名札>"`) にまとめる。
 * 行き先の棒は入る帯ごとに帯の幅の分を、その帯が伸び終えた時に出す
 */
export function drawNodes(layout: SankeyLayout, ctx: Ctx): string {
  const { m } = ctx;
  const { radius } = SANKEY_LOOK.bar;
  return layout.nodes
    .map((node) => {
      // 角を落とす色味 (arcade) では棒の角を丸めない
      const bar = (y: number, h: number, rounded: boolean, style?: string): string => {
        const rx = rounded ? partRadius(ctx.corner, Math.min(radius, h / 2)) : 0;
        return `<rect class="dg-sk-bar${style ? " dg-a" : ""}" x="${r1(node.x)}" y="${r1(y)}" width="${r1(node.w)}" height="${r1(h)}"${rx > 0 ? ` rx="${r1(rx)}"` : ""}${style ? ` style="${style}"` : ""}/>`;
      };
      const head = `<g data-node="${node.id}" style="${cs(node.color)}">`;
      if (node.root) return `${head}${bar(node.y, node.h, true)}${labelOf(node, ctx, ALWAYS)}</g>`;
      const ins = layout.bands.filter((b) => b.to === node.id).sort((p, q) => p.b[0] - q.b[0]);
      const times = ins.map((band) => timesOf(band, ctx).drawn);
      const appear = Math.min(...times);
      const slices = ins.map((band, i) => bar(band.b[0], band.b[1] - band.b[0], ins.length === 1, m.vis(times[i] as number))).join("");
      return `${head}${slices}<g class="dg-a" style="${m.rise(appear)}">${labelOf(node, ctx, [[appear, Number.POSITIVE_INFINITY]])}</g></g>`;
    })
    .join("");
}
