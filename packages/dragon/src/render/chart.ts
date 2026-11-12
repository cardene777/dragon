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
import type { Rect } from "../layout/scene";
import { textWidth } from "../layout/measure";
import { CHART_LOOK, CHART_TYPE } from "../look/chart";
import { MOTION, type TextStyle } from "../look/values";
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

/**
 * 漏斗の見た目 (#3621) の見た目の規則。漏斗の見た目の SVG にだけ書き、ドーナツと横棒の SVG を今のまま保つ。
 * 去った分は薄い棒と点線の縁で、前の段から下ろす線は点線で描く。薄い棒は右端を軸に伸びる
 */
const FUNNEL_CSS = [
  `.dg-ch-fg{fill:var(--c-rose);fill-opacity:${CHART_LOOK.funnel.gapFill};transform-box:fill-box;transform-origin:100% 50%}`,
  `.dg-ch-fe{fill:none;stroke:var(--c-rose);stroke-opacity:${CHART_LOOK.funnel.gapEdge};stroke-width:${CHART_LOOK.funnel.edge};stroke-dasharray:${CHART_LOOK.funnel.dash} ${CHART_LOOK.funnel.dash}}`,
  `.dg-ch-fl{fill:none;stroke:var(--line);stroke-width:${CHART_LOOK.funnel.edge};stroke-dasharray:${CHART_LOOK.funnel.linkDash} ${CHART_LOOK.funnel.dash}}`,
  `.dg-ch-fk{stroke:var(--c-rose);stroke-opacity:${CHART_LOOK.funnel.tickOpacity};stroke-width:${CHART_LOOK.funnel.tick}}`,
  ".dg-ch-fb{fill:var(--c)}",
  `.dg-ch-fn{${font(CHART_TYPE.stage)};fill:var(--ink)}`,
  `.dg-ch-fc{${font(CHART_TYPE.count)};fill:var(--ink)}`,
  `.dg-ch-fr{${font(CHART_TYPE.share)};fill:var(--mute)}`,
  `.dg-ch-fx{${font(CHART_TYPE.left)};fill:var(--t-rose)}`,
  `.dg-ch-ft{${font(CHART_TYPE.count)};fill:var(--ct)}`,
].join("");

/**
 * 段ごとの段の名前。同じ名前が続く段は 1 つの字にまとめる。
 * ドーナツの名前は輪の真ん中に折り返さず描くので、輪の線の内側の縁の円を記録に残し、崩れの検査が収まるかを見る
 */
function stepTitles(plan: ChartPlan, diagram: DiagramModel, ctx: Ctx): string {
  const { m } = ctx;
  const { ring } = plan;
  const inside = ring ? { ring: { cx: ring.cx, cy: ring.cy, r: ring.r - ring.width / 2 } } : {};
  return textRuns(diagram.steps.map((step) => step.title))
    .map((run) => {
      const [a, b] = runSpan(run, 0, ctx);
      const attr = ` data-chart-title="${esc(run.text)}"`;
      return chartText(ctx, "dg-ch-t", plan.title.x, plan.title.y, run.text, CHART_TYPE.title, attr, { shown: [[a, b + MOTION.fade]], anchor: plan.title.anchor, motion: m.vis(a, b), ...inside });
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
      out.push(chartText(ctx, "dg-ch-s", row.share.x, row.share.y, run.text, CHART_TYPE.share, itemAttr("share", item.id), { shown: [[a, b + MOTION.fade]], motion: m.vis(a, b) }));
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
      out.push(chartText(ctx, "dg-ch-v", x, track.y + track.h / 2 + drop, run.text, CHART_TYPE.value, itemAttr("value", item.id), { shown: [[a, b + MOTION.fade]], motion: m.vis(a, b) }));
    }
  });
  return out.join("");
}

/** 段の `from` から `to` までの字が見えている間の、出る時刻と消える時刻。`appear` は段の始まりから出るまで */
const spanOf = (from: number, to: number, appear: number, ctx: Ctx): [number, number] => runSpan({ from, to, text: "" }, appear, ctx);

/** 段ごとの字 `texts` を、同じ字が続く段ごとに 1 つの字にして、棒が動き終えてから出す */
function stepTexts(texts: (string | undefined)[], at: (text: string) => { x: number; y: number }, cls: string, style: TextStyle, attr: string, ctx: Ctx): string[] {
  const settle = MOTION.edgeAt + MOTION.chart.move;
  return textRuns(texts).map((run) => {
    const [a, b] = runSpan(run, settle, ctx);
    const { x, y } = at(run.text);
    return chartText(ctx, cls, x, y, run.text, style, attr, { shown: [[a, b + MOTION.fade]], motion: ctx.m.vis(a, b) });
  });
}

/** 去った数の薄い棒と縁。薄い棒は前の段の棒の端から、その段の棒の端へ伸びる */
function gapRect(rect: Rect, a: number, b: number, attr: string, ctx: Ctx): string {
  const { m } = ctx;
  const F = CHART_LOOK.funnel;
  const at = `x="${r1(rect.x)}" y="${r1(rect.y)}" width="${r1(rect.w)}" height="${r1(rect.h)}" rx="${partRadius(ctx.corner, F.radius)}"`;
  const grow = m.vis(a, b, { f: MOTION.chart.move, on: { transform: "scaleX(1)" }, off: { transform: "scaleX(0)" } });
  return `<rect class="dg-ch-fg dg-a" ${at}${attr} style="${grow}"/><rect class="dg-ch-fe dg-a" ${at} style="${m.vis(a + MOTION.chart.move, b)}"/>`;
}

/**
 * 漏斗の見た目 (#3621)。段の行ごとに、値を書いた段から段の名前と左端を揃えた棒を出し、棒が動き終えてから段の数と前の段に対する割合を出す。
 * 前の段との差は、前の段の棒の端から下ろす点線と、前の段の棒の端からその段の棒の端へ伸びる薄い棒と去った数にする。
 * 最後の段は、最初の段のうち最後の段まで残った割合の行を出す。去った分の薄い棒に、間の段の棒の端の目盛りを引く
 */
function funnel(plan: ChartPlan, ctx: Ctx): string {
  const { funnel: f, lengths } = plan;
  if (!f || !lengths) return "";
  const { m, t } = ctx;
  const F = CHART_LOOK.funnel;
  const settle = MOTION.edgeAt + MOTION.chart.move;
  const out: string[] = [];
  const radius = partRadius(ctx.corner, F.radius);
  for (const gap of f.gaps) {
    const [a, b] = spanOf(gap.from, gap.to, MOTION.edgeAt, ctx);
    const [c, d] = spanOf(gap.from, gap.to, settle, ctx);
    const { link, label } = gap;
    out.push(`<path class="dg-ch-fl dg-a" d="M${r1(link.x)} ${r1(link.y1)}V${r1(link.y2)}" style="${m.vis(a, b)}"/>`, gapRect(gap.rect, a, b, itemAttr("gap", gap.item), ctx));
    out.push(chartText(ctx, "dg-ch-fx", label.x, label.y, gap.text, CHART_TYPE.left, itemAttr("left", gap.item), { shown: [[c, d + MOTION.fade]], anchor: label.anchor, motion: m.vis(c, d) }));
  }
  plan.items.forEach((item, i) => {
    const row = f.rows[i];
    if (!row || row.first < 0) return;
    const ratios = lengths.map((values) => (f.bar.w > 0 ? (values[i] ?? 0) / f.bar.w : 0));
    const [a] = spanOf(row.first, t.steps.length - 1, MOTION.edgeAt, ctx);
    out.push(
      `<rect class="dg-ch-bar dg-a" x="${r1(f.bar.x)}" y="${r1(row.y - F.h / 2)}" width="${r1(f.bar.w)}" height="${F.h}" rx="${radius}"${itemAttr("bar", item.id)} style="${cs(item.color)};${barMotion(ratios, ctx)}"/>`,
      chartText(ctx, "dg-ch-fn", row.name.x, row.name.y, item.name, CHART_TYPE.stage, itemAttr("name", item.id), { shown: [[a, m.last + MOTION.fade]], motion: m.vis(a) }),
      ...stepTexts(row.counts, () => row.count, "dg-ch-fc", CHART_TYPE.count, itemAttr("value", item.id), ctx),
      ...stepTexts(row.rates, (text) => ({ x: row.rateEnd - textWidth(text, CHART_TYPE.share), y: row.count.y }), "dg-ch-fr", CHART_TYPE.share, itemAttr("rate", item.id), ctx),
    );
  });
  const total = f.total;
  if (total) {
    const [a, b] = spanOf(total.step, total.step, settle, ctx);
    const shown = { shown: [[a, b + MOTION.fade]] as [number, number][], motion: m.vis(a, b) };
    const color = plan.items.find((item) => item.id === total.item)?.color ?? "green";
    const { bar } = total;
    out.push(
      `<g style="${cs(color)}">`,
      chartText(ctx, "dg-ch-fn", total.name.x, total.name.y, total.name.text, CHART_TYPE.stage, ' data-chart-total="name"', shown),
      chartText(ctx, "dg-ch-ft", total.rate.x, total.rate.y, total.rate.text, CHART_TYPE.count, ' data-chart-total="rate"', shown),
      `<rect class="dg-ch-fb dg-a" x="${r1(bar.x)}" y="${r1(bar.y)}" width="${r1(bar.w)}" height="${r1(bar.h)}" rx="${radius}" data-chart-total="bar" style="${m.vis(a, b)}"/>`,
      "</g>",
    );
    if (total.rest) out.push(gapRect(total.rest, a, b, ' data-chart-total="rest"', ctx));
    for (const x of total.ticks) out.push(`<path class="dg-ch-fk dg-a" d="M${r1(x)} ${r1(bar.y + F.tickInset)}V${r1(bar.y + bar.h - F.tickInset)}" data-chart-total="tick" style="${m.vis(a, b)}"/>`);
    if (total.left) out.push(chartText(ctx, "dg-ch-fx", total.left.x, total.left.y, total.left.text, CHART_TYPE.left, ' data-chart-total="left"', { ...shown, anchor: total.left.anchor }));
  }
  return out.join("");
}

/** 量の図を描く。段の番号の丸は描く所が描く。漏斗の見た目は段の名前を図に書かず、再生の部品の段の題が出す */
export function drawChart(layout: ChartLayout, diagram: DiagramModel, ctx: Ctx): { base: string; css: string } {
  const plan = layout.chart;
  const body = plan.shape === "funnel" ? funnel(plan, ctx) : plan.shape === "bar" ? bars(plan, ctx) : donut(plan, ctx);
  const titles = plan.shape === "funnel" ? "" : stepTitles(plan, diagram, ctx);
  return { base: `<g class="dg-ch">${body}${titles}</g>`, css: plan.shape === "funnel" ? CHART_CSS + FUNNEL_CSS : CHART_CSS };
}
