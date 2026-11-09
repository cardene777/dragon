/**
 * 量の図 (`chart`、#3560) を描く部品。
 *
 * ドーナツは輪の地と項目ごとの弧と輪の真ん中の段の名前と凡例を、横棒は段の名前と項目ごとの名前と棒の地と棒と端の値を描く。
 * 段の番号は描く所 (`render/draw.ts`) がほかの図の種類と同じく描く。
 * 弧と棒の動きと段ごとの字は、値のブロックの描き方 (`blocks/chart-set/draw.ts`) が段の時刻から組む。
 * 見た目の規則も量の図の SVG にだけ書き、ほかの図の SVG と最初に読む script に入れない。
 * 弧と棒と段ごとの字は、検査と読み上げの道具が引けるよう `data-chart-*` に項目の名札か段の名前を持つ。
 * この file は後から読む量の図の塊 (`kinds/chart.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { barName, chartText, itemAttr, legendRow } from "../blocks/chart-item/draw";
import { arcMotion, barMotion, runSpan, textRuns } from "../blocks/chart-set/draw";
import { barTrack, ringTrack } from "../blocks/chart-shape/draw";
import { cs } from "../blocks/color/draw";
import type { ChartLayout, ChartPlan } from "../kinds/chart/layout";
import { CHART_LOOK, CHART_TYPE } from "../look/chart";
import { MOTION } from "../look/values";
import type { DiagramModel } from "../schema";
import { partRadius } from "./corner";
import { type Ctx, cssFont as font, esc, r1 } from "./parts";

const CHART_CSS = [
  `.dg-ch-track{fill:none;stroke:var(--sunk);stroke-width:${CHART_LOOK.donut.width}}`,
  `.dg-ch-arc{fill:none;stroke:var(--c);stroke-width:${CHART_LOOK.donut.width}}`,
  ".dg-ch-sw{fill:var(--c)}",
  ".dg-ch-bt{fill:var(--sunk)}",
  ".dg-ch-bar{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}",
  `.dg-ch-t{${font(CHART_TYPE.title)};fill:var(--ink)}`,
  `.dg-ch-n{${font(CHART_TYPE.name)};fill:var(--ink)}`,
  `.dg-ch-s{${font(CHART_TYPE.share)};fill:var(--ink2)}`,
  `.dg-ch-v{${font(CHART_TYPE.value)};fill:var(--ink2)}`,
].join("");

/** 段ごとの段の名前。同じ名前が続く段は 1 つの字にまとめる */
function stepTitles(plan: ChartPlan, diagram: DiagramModel, ctx: Ctx): string {
  const { m } = ctx;
  return textRuns(diagram.steps.map((step) => step.title))
    .map((run) => {
      const [a, b] = runSpan(run, 0, ctx);
      const attr = ` data-chart-title="${esc(run.text)}"`;
      return chartText(ctx, "dg-ch-t", plan.title.x, plan.title.y, run.text, CHART_TYPE.title, attr, [[a, b + MOTION.fade]], plan.title.anchor, m.vis(a, b));
    })
    .join("");
}

/** ドーナツの輪と弧と凡例。凡例の割合は段ごとに、値を段の合計で割って整数に丸めた百分率 */
function donut(plan: ChartPlan, ctx: Ctx): string {
  const { ring, arcs, legend } = plan;
  if (!ring || !arcs || !legend) return "";
  const { m } = ctx;
  const out: string[] = [ringTrack(ring)];
  const rotate = `rotate(-90 ${r1(ring.cx)} ${r1(ring.cy)})`;
  plan.items.forEach((item, i) => {
    const motion = arcMotion(
      arcs.map((row) => row[i] ?? { start: 0, sweep: 0 }),
      ring.r,
      ctx,
    );
    out.push(`<circle class="dg-ch-arc dg-a" cx="${r1(ring.cx)}" cy="${r1(ring.cy)}" r="${r1(ring.r)}" transform="${rotate}"${itemAttr("arc", item.id)} style="${cs(item.color)};${motion}"/>`);
  });
  plan.items.forEach((item, i) => {
    const row = legend[i];
    if (!row) return;
    out.push(legendRow(row, item, ctx));
    const shares = plan.values.map((values) => {
      const total = values.reduce((a, b) => a + b, 0);
      return `${total > 0 ? Math.round(((values[i] ?? 0) / total) * 100) : 0}%`;
    });
    for (const run of textRuns(shares)) {
      const [a, b] = runSpan(run, MOTION.edgeAt, ctx);
      out.push(chartText(ctx, "dg-ch-s", row.share.x, row.share.y, run.text, CHART_TYPE.share, itemAttr("share", item.id), [[a, b + MOTION.fade]], undefined, m.vis(a, b)));
    }
  });
  return out.join("");
}

/** 横棒の名前と地と棒と端の値。値は棒が動き終えてから、棒の端の右に出す */
function bars(plan: ChartPlan, ctx: Ctx): string {
  const { bars: rows, lengths } = plan;
  if (!rows || !lengths) return "";
  const { m } = ctx;
  const B = CHART_LOOK.bar;
  const drop = CHART_TYPE.value.size * B.textDrop;
  const out: string[] = [];
  plan.items.forEach((item, i) => {
    const row = rows[i];
    if (!row) return;
    const { track } = row;
    out.push(barName(row, item, ctx), barTrack(row, ctx));
    const ratios = lengths.map((row) => (track.w > 0 ? (row[i] ?? 0) / track.w : 0));
    out.push(
      `<rect class="dg-ch-bar dg-a" x="${r1(track.x)}" y="${r1(track.y)}" width="${r1(track.w)}" height="${r1(track.h)}" rx="${partRadius(ctx.corner, B.radius)}"${itemAttr("bar", item.id)} style="${cs(item.color)};${barMotion(ratios, ctx)}"/>`,
    );
    // 値の無い段は値の字を出さない。同じ値が続く段は 1 つの字にまとめる
    const texts = plan.values.map((values) => ((values[i] ?? 0) > 0 ? String(values[i]) : undefined));
    for (const run of textRuns(texts)) {
      const [a, b] = runSpan(run, MOTION.edgeAt + MOTION.chart.move, ctx);
      const x = track.x + (lengths[run.from]?.[i] ?? 0) + B.valueGap;
      out.push(chartText(ctx, "dg-ch-v", x, track.y + track.h / 2 + drop, run.text, CHART_TYPE.value, itemAttr("value", item.id), [[a, b + MOTION.fade]], undefined, m.vis(a, b)));
    }
  });
  return out.join("");
}

/** 量の図を描く。段の番号の丸は描く所が描く */
export function drawChart(layout: ChartLayout, diagram: DiagramModel, ctx: Ctx): { base: string; css: string } {
  const plan = layout.chart;
  const body = plan.shape === "bar" ? bars(plan, ctx) : donut(plan, ctx);
  return { base: `<g class="dg-ch">${body}${stepTitles(plan, diagram, ctx)}</g>`, css: CHART_CSS };
}
