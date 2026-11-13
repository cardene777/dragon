/**
 * 回り続ける図の、輪を開いた帯の見た目 (#3639) を描く部品。置き場所は並べ方 (`kinds/cycle/layout.ts` の `layoutBand`) が持つ。
 *
 * 回の帯ごとに、山形を灰の地で描き、その回でその段の手順になった山形を手順の色で光らせて、光ったまま残す。山形の部品は `data-segment` と `data-round` を持つ。
 * まだ来ていない回の帯は、その回へ戻る矢印の札が着くまで薄く出す。帯の部品は `data-band-round` を持つ (量の行き先の図の帯の部品 `data-band` と分ける)。
 * 帯の頭に中身の帯の題と、その回に `set` で書いた欄の値を書き、値は次の値が来るまで出す。回が終わった帯の頭はその回の最後の値を出し続ける。
 * 全ての箱に長さを書いた図は、手順の境目に目盛りの印と数字を描く。戻る矢印は字を持たない線と矢じりで描き、札は描く本体が線の道に沿って走らせる。
 * 既定の幅では山形の下に手順の名前を書き、携帯の幅では山形の中に手順の番号を書いて、番号と名前と長さの一覧を帯の下に描く。
 * この file は回り続ける図の描く部品 (`kinds/cycle.ts`) が出し、見本帳を開いた時に読む塊に入れない
 */
import { cs } from "../blocks/color/draw";
import type { FieldChange } from "../blocks/strip/draw";
import {
  type BandLayout,
  type BandSegment,
  bandTickStyle,
  bandValueStyle,
} from "../kinds/cycle/layout";
import { hasWide, textBox, textWidth } from "../layout/measure";
import { BAND_LOOK, BAND_TYPE } from "../look/cycle";
import { MOTION } from "../look/values";
import type { Frame } from "./motion";
import { type Ctx, cssFont as font, cssMix, esc, r1, rangeKf, write } from "./parts";

const B = BAND_LOOK;
const S = B.stroke;

/** 輪を開いた帯の見た目の規則。山形、光った山形、目盛りの印、戻る矢印、行の頭の色の印と、字 */
export const BAND_CSS = [
  `.dg-bd-seg{fill:var(--sunk);stroke:var(--line);stroke-width:${S.segment};stroke-linejoin:round}`,
  `.dg-bd-lit{fill:${cssMix(B.tint)};stroke:var(--c);stroke-width:${S.segment};stroke-linejoin:round}`,
  `.dg-bd-mark{fill:none;stroke:var(--line);stroke-width:${S.tick};stroke-linecap:round}`,
  `.dg-bd-ret{fill:none;stroke:var(--line);stroke-width:${S.ret};stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-bd-arw{fill:var(--line)}",
  ".dg-bd-sw{fill:var(--c)}",
  `.dg-bd-name{${font(BAND_TYPE.name)};fill:var(--ink)}`,
  `.dg-bd-sub{${font(BAND_TYPE.sub)};fill:var(--mute)}`,
  `.dg-bd-tk{${font(BAND_TYPE.tick)};fill:var(--mute)}`,
  `.dg-bd-tkj{${font(BAND_TYPE.tickJa)};fill:var(--mute)}`,
  `.dg-bd-t{${font(BAND_TYPE.title)};fill:var(--mute)}`,
  `.dg-bd-v{${font(BAND_TYPE.lead)};fill:var(--ink)}`,
  `.dg-bd-vj{${font(BAND_TYPE.leadJa)};fill:var(--ink)}`,
  `.dg-bd-r{${font(BAND_TYPE.rest)};fill:var(--ink2)}`,
  `.dg-bd-key{${font(BAND_TYPE.key)};fill:var(--ct)}`,
  `.dg-bd-row{${font(BAND_TYPE.row)};fill:var(--ct)}`,
  `.dg-bd-rn{${font(BAND_TYPE.rowName)};fill:var(--ink)}`,
  `.dg-bd-rt{${font(BAND_TYPE.rowTime)};fill:var(--mute)}`,
].join("");

/** 山形の形。先は右へ尖り、帯の最初でない山形は左の縁に前の山形の先が入る切り込みを持つ */
function chevron(s: BandSegment): string {
  const x1 = s.x + s.w - B.point;
  const ym = s.y + s.h / 2;
  const notch = s.first ? "" : `L${r1(s.x + B.point)} ${r1(ym)}`;
  return `M${r1(s.x)} ${r1(s.y)}H${r1(x1)}L${r1(s.x + s.w)} ${r1(ym)}L${r1(x1)} ${r1(s.y + s.h)}H${r1(s.x)}${notch}Z`;
}

/** 線の札が着く時刻。札を運ぶ線は運ぶ物の着く時刻、運ばない線は線を引き終える時刻 */
function arriveOf(step: number, event: number, ctx: Ctx): number {
  const carried = ctx.t.carriers.find((c) => c.step === step && c.event === event);
  if (carried) return carried.arrive;
  const drawn = ctx.t.edges.find((e) => e.step === step && e.event === event);
  return drawn?.drawn ?? ctx.t.steps[step]?.start ?? 0;
}

/**
 * 段ごとの、その段の手順になった山形が光り始める時刻。段の線のうち最後に札が着いた線の着く時刻で、線の無い最初の段は初めから光る。
 * 鍵は `<名札>@<回>`
 */
function litFrom(layout: BandLayout, ctx: Ctx): Map<string, number> {
  const out = new Map<string, number>();
  layout.current.forEach((id, s) => {
    const key = `${id}@${String(layout.rounds[s] ?? 0)}`;
    if (out.has(key)) return;
    const last = layout.edges.filter((e) => e.step === s).at(-1);
    out.set(
      key,
      last ? arriveOf(last.step, last.event, ctx) : s === 0 ? 0 : (ctx.t.steps[s]?.start ?? 0),
    );
  });
  return out;
}

/** 回ごとの、帯が濃くなる時刻。最初の回は初めから濃く、次からの回はその回へ戻る札が着いた時 */
function enteredAt(layout: BandLayout, ctx: Ctx): number[] {
  const out = layout.bands.map(() => 0);
  const ids = layout.segments.filter((s) => s.round === 0).map((s) => s.id);
  let r = 0;
  for (const e of layout.edges)
    if (e.from === ids.at(-1) && e.to === ids[0]) {
      r += 1;
      out[r] = arriveOf(e.step, e.event, ctx);
    }
  return out;
}

/** 帯の頭の欄の値。回ごとに、その回の段で書いた値を次の値が来るまで出し、回の最初の段で書かない欄は前の回の値を引き継いで出す */
function heads(
  layout: BandLayout,
  changes: ReadonlyMap<string, FieldChange[]>,
  entered: number[],
  ctx: Ctx,
): Map<number, string> {
  const { m } = ctx;
  const out = new Map<number, string>();
  for (const head of layout.heads) {
    const parts: string[] = [
      write(ctx.ink, "dg-bd-t", head.title.x, head.base, head.title.text, BAND_TYPE.title),
    ];
    const steps = layout.rounds.flatMap((r, s) => (r === head.round ? [s] : []));
    const first = steps[0];
    for (const field of head.fields) {
      const all = (changes.get(field.field) ?? []).flatMap((change) => {
        const text = change.value ?? change.tag;
        return text === undefined ? [] : [{ ...change, text }];
      });
      const own = all.filter((c) => (layout.rounds[c.step] ?? 0) === head.round);
      const carried = first === undefined ? undefined : all.filter((c) => c.step < first).at(-1);
      const list =
        carried && own[0]?.step !== first
          ? [{ ...carried, at: entered[head.round] ?? 0, step: first as number }, ...own]
          : own;
      list.forEach((change, k) => {
        const next = list[k + 1]?.at;
        const until = next === undefined ? m.last : next - MOTION.untilFade;
        const style = bandValueStyle(change.text, field.lead);
        const cls = field.lead ? (hasWide(change.text) ? "dg-bd-vj" : "dg-bd-v") : "dg-bd-r";
        ctx.ink.push({
          text: change.text,
          rect: textBox(change.text, field.x, head.base, style),
          shown: [[change.at, next === undefined ? Number.POSITIVE_INFINITY : until]],
        });
        // 回の中で変わった値は、変わった段の間だけその段の手順の色で書き、段が終わると元の色へ戻す
        const base = field.lead ? "var(--ink)" : "var(--ink2)";
        const attrs =
          k === 0
            ? ` class="${cls}"`
            : ` class="${cls} dg-a" style="${cs(change.color)};${m.kf([
                [0, { fill: "var(--ct)" }],
                [Math.max(change.until - MOTION.untilFade, change.at), { fill: "var(--ct)" }],
                [change.until, { fill: base }],
                [m.total, { fill: base }],
              ])}"`;
        const text = `<text${attrs} x="${r1(field.x)}" y="${r1(head.base)}">${esc(change.text)}</text>`;
        parts.push(
          `<g data-field="${esc(field.field)}" class="dg-a" style="${m.rise(change.at, until)}">${text}</g>`,
        );
      });
    }
    out.set(head.round, `<g data-band-head="${String(head.round)}">${parts.join("")}</g>`);
  }
  return out;
}

/** 戻る矢印。字を持たない折れ線と、帯の左の端を指す矢じり */
function returns(layout: BandLayout): string {
  return layout.returns
    .map((ret) => {
      const d = ret.points.map((p, k) => `${k === 0 ? "M" : "L"}${r1(p[0])} ${r1(p[1])}`).join("");
      const [ex, ey] = ret.points[ret.points.length - 1] ?? [0, 0];
      const arrow = `M${r1(ex)} ${r1(ey)}L${r1(ex - B.head)} ${r1(ey - B.headHalf)}L${r1(ex - B.head)} ${r1(ey + B.headHalf)}Z`;
      return `<g data-band-return="${String(ret.round)}"><path class="dg-bd-ret" d="${d}"/><path class="dg-bd-arw" d="${arrow}"/></g>`;
    })
    .join("");
}

/** 携帯の幅の一覧。行ごとに、手順の色の印と番号と名前を左に、長さを右の端に揃えて書く */
function list(layout: BandLayout, ctx: Ctx): string {
  const l = layout.list;
  if (!l) return "";
  const rows = l.rows.map((row) => {
    const base = row.y + B.row / 2;
    const y = base + BAND_TYPE.rowName.size * 0.3;
    const number = l.x + B.swatch + 8;
    const name = number + textWidth("00", BAND_TYPE.row) + 8;
    const time = l.x + l.w - textWidth(row.time, BAND_TYPE.rowTime);
    return (
      `<g data-band-row="${row.id}" style="${cs(row.color)}"><rect class="dg-bd-sw" x="${r1(l.x)}" y="${r1(base - B.swatch / 2)}" width="${B.swatch}" height="${B.swatch}" rx="2"/>` +
      write(ctx.ink, "dg-bd-row", number, y, row.number, BAND_TYPE.row) +
      write(ctx.ink, "dg-bd-rn", name, y, row.name, BAND_TYPE.rowName) +
      (row.time === "" ? "" : write(ctx.ink, "dg-bd-rt", time, y, row.time, BAND_TYPE.rowTime)) +
      "</g>"
    );
  });
  return `<g data-band-list="">${rows.join("")}</g>`;
}

/**
 * 輪を開いた帯の見た目の帯と山形と目盛りと帯の頭と戻る矢印と、名前か一覧。中身の帯の値の移り変わり (`changes`) は描く所が出して渡す。
 * 札と段の番号は描く本体が描く
 */
export function drawBand(
  layout: BandLayout,
  changes: ReadonlyMap<string, FieldChange[]>,
  ctx: Ctx,
): { base: string; on: Map<string, number[]>; css: string } {
  const { m } = ctx;
  const lit = litFrom(layout, ctx);
  const entered = enteredAt(layout, ctx);
  const head = heads(layout, changes, entered, ctx);
  const bands = layout.bands.map((band) => {
    const r = band.round;
    const segments = layout.segments
      .filter((s) => s.round === r)
      .map((s, i) => {
        const d = chevron(s);
        const from = lit.get(`${s.id}@${String(r)}`);
        const key =
          layout.keyAt === undefined
            ? ""
            : write(
                ctx.ink,
                "dg-bd-key",
                s.x + s.w / 2,
                s.y + layout.keyAt,
                String(i + 1),
                BAND_TYPE.key,
                undefined,
                "middle",
              );
        return (
          `<g data-segment="${s.id}" data-round="${String(r)}" style="${cs(s.color)}"><path class="dg-bd-seg" d="${d}"/>` +
          `<path class="dg-bd-lit dg-a" style="${rangeKf(m, from === undefined ? [] : [[from, m.last]])}" d="${d}"/>${key}</g>`
        );
      });
    const ticks = layout.ticks.filter((t) => t.round === r);
    const marks = ticks.map((t) => `M${r1(t.x)} ${r1(t.mark[0])}V${r1(t.mark[1])}`).join("");
    const numbers = ticks.map((t) =>
      write(
        ctx.ink,
        hasWide(t.text) ? "dg-bd-tkj" : "dg-bd-tk",
        t.x,
        t.y,
        t.text,
        bandTickStyle(t.text),
        undefined,
        "middle",
      ),
    );
    const names = layout.names
      .filter((x) => x.round === r)
      .map(
        (x) =>
          `<g data-band-name="${x.id}">${x.texts.map((t) => write(ctx.ink, t.style === "name" ? "dg-bd-name" : "dg-bd-sub", t.x, t.y, t.text, BAND_TYPE[t.style], undefined, "middle")).join("")}</g>`,
      );
    // まだ来ていない回の帯は、その回へ戻る札が着くまで薄く出す
    const at = entered[r] ?? 0;
    const frames: Frame[] = [
      [0, { opacity: B.faint }],
      [at, { opacity: B.faint }],
      [at + MOTION.fade, { opacity: 1 }],
      [m.total, { opacity: 1 }],
    ];
    const faint = r === 0 ? "" : ` class="dg-a" style="${m.kf(frames)}"`;
    return (
      `<g data-band-round="${String(r)}"${faint}>${head.get(r) ?? ""}${marks === "" ? "" : `<path class="dg-bd-mark" d="${marks}"/>`}${numbers.join("")}` +
      `${segments.join("")}${names.join("")}</g>`
    );
  });
  return {
    base: `${bands.join("")}${returns(layout)}${list(layout, ctx)}`,
    on: new Map(),
    css: BAND_CSS,
  };
}
