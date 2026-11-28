/**
 * 量の目盛りの描き方 (#3880)。手順の図と列の図の描き方が、並べ方の置いた目盛り (`layout.gauges`) を描く時に呼ぶ。
 *
 * 目盛りは `data-gauge` を持つ組で、名前と棒の地と上限の点線は段を問わず出す。
 * 値ごとの組 (`data-gauge-value`) は値が変わった時刻から次に変わる時刻まで出し、その値を段の終わりに見せる段の番号を `data-steps` に持つ。
 * 組の中は上限までの棒と、上限を超えた分の赤い伸びと、「値 / 上限 単位」の字と、上限を超えた段の赤い札。棒は前の値の長さから伸びるか縮む。
 * 値が変わった段は、その段の間だけ棒の右に増えた量か減った量の札 (`data-gauge-delta`) を出す。
 * 予約した量を持つ段は、確定した量の濃い棒の下に、総量までの同じ色の淡い塗り (`dg-gh`) を敷き、棒の下の行に色の四角と「確定 40」「予約 30」の内訳 (`data-gauge-split`) を出す (#3895)。
 * 値ごとの組は、総量か予約した量のどちらかが変わった時刻で次の組へ移る。予約を持つ組は予約した量を `data-gauge-hold` に持つ。
 * 内訳の札を持つ目盛り (#3896) は、中身を押せる組 (`data-note`) で包み、名前のすぐ右に丸い i の印を描く。札は再生の部品の札の層が開く。
 * 見た目の規則は目盛りを持つ図の SVG にだけ書き、ほかの図の SVG を変えない。
 * この file は手順の図と列の図の後から読む塊だけが読み、最初に読む script に入れない。
 */
import { textWidth } from "../../layout/measure";
import { EASE, LOOK, MOTION, TYPE } from "../../look/values";
import { type Ctx, cssFont as font, esc, r1, sansOf, write } from "../../render/parts";
import type { DiagramModel } from "../../schema";
import type { Span } from "../../timeline";
import { cs } from "../color/draw";
import { noteMark } from "../pop/draw";
import type { Gauge } from "./block";
import { chipW, deltasOf, deltaText, gaugeHolds, gaugeParts, gaugeValues, markAt, overW, type SceneGauge, splitTexts, styleFor, valueText } from "./layout";

const G = LOOK.gauge;

/** 目盛りの見た目の規則。目盛りを持つ図の SVG にだけ書く */
const GAUGE_CSS = [
  `.dg-gn{${font(TYPE.gaugeName)};fill:var(--ink2)}`,
  `.dg-gk{fill:var(--sunk);stroke:var(--hair);stroke-width:1}`,
  ".dg-gf{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}",
  ".dg-go{fill:var(--c-rose);transform-box:fill-box;transform-origin:0 50%}",
  `.dg-gm{stroke:var(--ink2);stroke-width:${G.stroke};stroke-dasharray:2 2}`,
  `.dg-gv{${font(TYPE.gaugeValue)};fill:var(--ink)}`,
  `.dg-gvj{${font(sansOf(TYPE.gaugeValue))}}`,
  ".dg-gvr{fill:var(--t-rose)}",
  ".dg-gd rect{fill:color-mix(in srgb,var(--c) 16%,var(--surf));stroke:color-mix(in srgb,var(--c) 45%,transparent)}",
  `.dg-gdt{${font(TYPE.gaugeTag)};fill:var(--ct)}`,
  ".dg-gx rect{fill:color-mix(in srgb,var(--c-rose) 12%,var(--surf));stroke:var(--c-rose)}",
  `.dg-gxt{${font(TYPE.gaugeOver)};fill:var(--t-rose)}`,
].join("");

/** 予約した量の淡い塗り。目盛りの色を図の地の色と混ぜる (#3895) */
const HELD = `color-mix(in srgb,var(--c) ${G.heldMix}%,var(--surf))`;

/** 予約した量の見た目の規則。予約を持つ段が在る目盛りを置いた図の SVG にだけ書き、ほかの図の SVG を変えない (#3895) */
const HOLD_CSS = [
  `.dg-gh{fill:${HELD};transform-box:fill-box;transform-origin:0 50%}`,
  ".dg-gsc{fill:var(--c)}",
  `.dg-gsh{fill:${HELD}}`,
  `.dg-gst{${font(TYPE.gaugeSplit)};fill:var(--ct)}`,
  `.dg-gstj{${font(sansOf(TYPE.gaugeSplit))}}`,
].join("");

/** 値の続く間。`value` は総量、`hold` は予約した量、`steps` はその値を段の終わりに見せる段、`from` と `to` は出ている時刻 */
interface Run {
  value: number;
  hold: number;
  steps: number[];
  from: number;
  to: number;
}

/** 目盛り `gauge` の値の続く間。値を書く前は 0 の間で始め、総量か予約した量が変わる出来事の時刻で次の間へ移る */
function runsOf(gauge: Gauge, values: readonly number[], holds: readonly number[], diagram: DiagramModel, ctx: Ctx): Run[] {
  const runs: Run[] = [{ value: 0, hold: 0, steps: [], from: 0, to: ctx.m.last }];
  values.forEach((value, s) => {
    const current = runs[runs.length - 1] as Run;
    const hold = holds[s] ?? 0;
    if (value === current.value && hold === current.hold) {
      current.steps.push(s);
      return;
    }
    // 段の中で最後に値を書いた行の時刻に変える
    const events = diagram.steps[s]?.events ?? [];
    const last = events.reduce((at, e, k) => (e.type === "gauge" && e.gauge === gauge.id ? k : at), -1);
    const time = ctx.t.events.find((t) => t.step === s && t.event === last)?.at ?? (ctx.t.steps[s] as Span).start;
    current.to = time;
    runs.push({ value, hold, steps: [s], from: time, to: ctx.m.last });
  });
  return runs;
}

/** 前の長さ `before` から今の長さ `now` へ伸びるか縮む動き。長さが変わらない時と今の長さが 0 の時は動かさない */
function grow(ctx: Ctx, before: number, now: number, at: number): string {
  if (now <= 0 || Math.abs(before - now) < 0.01) return "";
  const from = `scaleX(${Math.round((before / now) * 1000) / 1000})`;
  return ctx.m.kf([
    [0, { transform: from }],
    [at, { transform: from }, EASE.inOut],
    [at + MOTION.chart.move, { transform: "scaleX(1)" }],
    [ctx.m.total, { transform: "scaleX(1)" }],
  ]);
}

/** 予約を持つ値の組の、棒の下の内訳の行。色の四角と「確定 40」「予約 30」の字を並べる (#3895) */
function splitRow(scene: SceneGauge, run: Run, y: number, ctx: Ctx): string {
  if (scene.split === undefined || run.hold <= 0) return "";
  const texts = splitTexts(scene.split, run.value, run.hold);
  const out: string[] = [];
  let x = scene.x;
  texts.forEach((text, k) => {
    out.push(`<rect class="${k === 0 ? "dg-gsc" : "dg-gsh"}" x="${r1(x)}" y="${r1(y + (G.splitH - G.swatch) / 2)}" width="${G.swatch}" height="${G.swatch}" rx="${G.swatchRadius}"/>`);
    const left = x + G.swatch + G.swatchGap;
    const style = styleFor(text, TYPE.gaugeSplit);
    const cls = `dg-gst${style === TYPE.gaugeSplit ? "" : " dg-gstj"}`;
    out.push(write(ctx.ink, cls, left, y + G.splitH / 2 + TYPE.gaugeSplit.size * 0.35, text, style, [[run.from, run.to]]));
    x = left + textWidth(text, style) + G.splitItemGap;
  });
  return `<g data-gauge-split="">${out.join("")}</g>`;
}

/** 目盛りを 1 つ描く。`holds` は段ごとの予約した量 */
function drawGauge(scene: SceneGauge, gauge: Gauge, values: readonly number[], holds: readonly number[], diagram: DiagramModel, ctx: Ctx): string {
  const parts = gaugeParts(scene, gauge, values, holds);
  const { track, limitX, span } = parts;
  const limit = gauge.limit;
  const out: string[] = [write(ctx.ink, "dg-gn", parts.nameX, parts.baseline, gauge.name, TYPE.gaugeName)];
  if (track) out.push(`<rect class="dg-gk" x="${r1(track.x)}" y="${r1(track.y)}" width="${r1(track.w)}" height="${r1(track.h)}" rx="${G.radius}"/>`);
  const runs = runsOf(gauge, values, holds, diagram, ctx);
  /** 総量 `v` のうち予約 `h` を持つ値の、上限までの確定の棒と、予約までの淡い塗りと、超えた分の伸びの長さ */
  const lengths = (v: number, h: number): { fill: number; held: number; over: number } =>
    limit === undefined || span === undefined
      ? { fill: 0, held: 0, over: 0 }
      : { fill: (Math.min(v - h, limit) / limit) * span, held: (Math.min(v, limit) / limit) * span, over: (Math.max(0, v - limit) / limit) * span };
  runs.forEach((run, k) => {
    const prev = k === 0 ? run : (runs[k - 1] as Run);
    const before = lengths(prev.value, prev.hold);
    const now = lengths(run.value, run.hold);
    const over = limit !== undefined && run.value > limit;
    const text = valueText(gauge, run.value);
    const style = styleFor(text, TYPE.gaugeValue);
    const cls = `dg-gv${style === TYPE.gaugeValue ? "" : " dg-gvj"}${over ? " dg-gvr" : ""}`;
    const inner: string[] = [];
    if (track && limitX !== undefined) {
      // 予約した量は、確定の濃い棒の下に総量まで淡い塗りを敷き、濃い棒の右に続けて見せる
      if (run.hold > 0) {
        const heldAnim = grow(ctx, before.held, now.held, run.from);
        inner.push(`<rect class="dg-gh${heldAnim ? " dg-a" : ""}" x="${r1(track.x)}" y="${r1(track.y)}" width="${r1(now.held)}" height="${r1(track.h)}" rx="${G.radius}"${heldAnim ? ` style="${heldAnim}"` : ""}/>`);
      }
      const fillAnim = grow(ctx, before.fill, now.fill, run.from);
      inner.push(`<rect class="dg-gf${fillAnim ? " dg-a" : ""}" x="${r1(track.x)}" y="${r1(track.y)}" width="${r1(now.fill)}" height="${r1(track.h)}" rx="${G.radius}"${fillAnim ? ` style="${fillAnim}"` : ""}/>`);
      if (over) {
        const overAnim = grow(ctx, before.over, now.over, run.from);
        inner.push(`<rect class="dg-go${overAnim ? " dg-a" : ""}" x="${r1(limitX)}" y="${r1(track.y)}" width="${r1(now.over)}" height="${r1(track.h)}" rx="${G.radius}"${overAnim ? ` style="${overAnim}"` : ""}/>`);
      }
    }
    // 上限を持つ目盛りの値の字は、右の端を棒の地の右の端に揃える
    const valueLeft = parts.valueAnchor === "end" ? parts.valueX - textWidth(text, style) : parts.valueX;
    inner.push(write(ctx.ink, cls, valueLeft, parts.baseline, text, style, [[run.from, run.to]]));
    if (parts.splitY !== undefined) inner.push(splitRow(scene, run, parts.splitY, ctx));
    if (over && parts.overY !== undefined) {
      const w = overW(scene.over);
      const y = parts.overY;
      ctx.ink.push({ text: scene.over, rect: { x: scene.x, y, w, h: G.overH }, shown: [[run.from, run.to]], boxed: true });
      inner.push(
        `<g class="dg-gx" data-gauge-over=""><rect x="${r1(scene.x)}" y="${r1(y)}" width="${r1(w)}" height="${G.overH}" rx="${G.radius}"/><text class="dg-gxt" x="${r1(scene.x + G.overPadX)}" y="${r1(y + G.overH / 2 + TYPE.gaugeOver.size * 0.35)}">${esc(scene.over)}</text></g>`,
      );
    }
    const held = run.hold > 0 ? ` data-gauge-hold="${run.hold}"` : "";
    out.push(`<g class="dg-a" data-gauge-value="${run.value}"${held} data-steps="${run.steps.join(" ")}" style="${ctx.m.vis(run.from, run.to)}">${inner.join("")}</g>`);
  });
  // 上限の点線は棒の上に引き、超えた段でも棒の中に上限の位置を残す
  if (track && limitX !== undefined)
    out.push(`<line class="dg-gm" x1="${r1(limitX)}" y1="${r1(track.y - G.limitOver)}" x2="${r1(limitX)}" y2="${r1(track.y + track.h + G.limitOver)}"/>`);
  // 値が変わった段は、その段の間だけ増えた量か減った量の札を出す
  deltasOf(values).forEach((delta, s) => {
    if (delta === 0) return;
    const run = runs.find((r) => r.steps[0] === s);
    const span = ctx.t.steps[s] as Span;
    const at = run?.from ?? span.start;
    const text = deltaText(delta);
    const w = chipW(text);
    ctx.ink.push({ text, rect: { x: parts.chipX, y: parts.chipY, w, h: G.chipH }, shown: [[at, span.end]], boxed: true });
    out.push(
      `<g class="dg-gd dg-popc dg-a" data-gauge-delta="" data-step="${s}" style="${ctx.m.pop(at, span.end)}"><rect x="${r1(parts.chipX)}" y="${r1(parts.chipY)}" width="${r1(w)}" height="${G.chipH}" rx="${G.chipH / 2}"/><text class="dg-gdt" x="${r1(parts.chipX + w / 2)}" y="${r1(parts.chipY + G.chipH / 2 + TYPE.gaugeTag.size * 0.35)}" text-anchor="middle">${esc(text)}</text></g>`,
    );
  });
  // 内訳の札を持つ目盛りは、目盛りの全体を押せる組で包み、名前のすぐ右に札の印を描く (#3896)。
  // 字と棒の間の隙間を押しても開くよう、目盛りの四角いっぱいに透明の面を敷く
  const hit = `<rect x="${r1(scene.x)}" y="${r1(scene.y)}" width="${r1(scene.w)}" height="${r1(scene.h)}" fill="transparent"/>`;
  const body = scene.card === undefined ? out.join("") : noteMark({ box: scene.card, name: gauge.name, text: "", ...markAt(scene, gauge) }, `${hit}${out.join("")}`);
  return `<g data-gauge="${esc(gauge.id)}" style="${cs(scene.color)}">${body}</g>`;
}

/** 置いた目盛りの見た目の規則。目盛りが無い図は空の字を返し、SVG を変えない。予約を持つ目盛りが在る図だけに予約の規則を足す */
export const gaugeCss = (gauges: readonly SceneGauge[] | undefined): string =>
  gauges && gauges.length > 0 ? `${GAUGE_CSS}${gauges.some((g) => g.split !== undefined) ? HOLD_CSS : ""}` : "";

/** 置いた目盛りを全て描く。目盛りが無い図は空の字を返す */
export function drawGauges(gauges: readonly SceneGauge[] | undefined, diagram: DiagramModel, ctx: Ctx): string {
  if (!gauges || gauges.length === 0) return "";
  const values = gaugeValues(diagram);
  const holds = gaugeHolds(diagram);
  const declared = new Map((diagram.gauge ?? []).map((g) => [g.id, g]));
  return gauges
    .map((scene) => {
      const gauge = declared.get(scene.id);
      return gauge ? drawGauge(scene, gauge, values.get(scene.id) ?? [], holds.get(scene.id) ?? [], diagram, ctx) : "";
    })
    .join("");
}
