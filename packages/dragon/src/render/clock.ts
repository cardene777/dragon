/**
 * 回り続ける図の、時計の文字盤の見た目 (#3638) を描く部品。置き場所は並べ方 (`kinds/cycle/layout.ts` の `layoutClock`) が持つ。
 *
 * 手順の弧は灰の帯で描き、その回 (針が 12 時を越えるまで) に入った手順の弧を、手順の色で光らせる。弧の部品は手順ごとに `data-sector` を持つ。
 * 針は 1 本で、段の中の線ごとに前の向きから受ける手順の始まりまで回る。線の札は運ぶ物と同じ時刻と緩急で針の先を走るので、針と札は離れない。
 * 目盛りは帯の外に印と数字を描き、番号が弧に入らない手順は、弧から文字盤の外の番号へ線を引く。
 * 既定の幅では文字盤の外に手順の名前と長さを書き、携帯の幅では手順の番号を書いて、番号と名前と長さの一覧を文字盤の下に描く。
 * 文字盤の真ん中の字は輪の見た目と同じ処理 (`render/cycle.ts` の `centre`) で書く。
 * この file は回り続ける図の描く部品 (`kinds/cycle.ts`) が出し、見本帳を開いた時に読む塊に入れない
 */
import { cs } from "../blocks/color/draw";
import type { FieldChange } from "../blocks/strip/draw";
import type { ClockLabel, ClockLayout, ClockMove } from "../kinds/cycle/layout";
import { hasWide, textWidth } from "../layout/measure";
import type { Point } from "../layout/scene";
import { CLOCK_LOOK, CLOCK_TYPE } from "../look/cycle";
import { type ColorKey, LOOK } from "../look/values";
import type { Frame } from "./motion";
import { CENTRE_CSS, centre } from "./cycle";
import { type Ctx, cssFont as font, cssMix, easeInOut, r1, rangeKf, write } from "./parts";

const C = CLOCK_LOOK;
const S = C.stroke;
const RAD = Math.PI / 180;

/** 字の形ごとの class */
const CLASSES: Readonly<Record<keyof typeof CLOCK_TYPE, string>> = {
  name: "dg-ck-name",
  time: "dg-ck-time",
  sub: "dg-ck-sub",
  tick: "dg-ck-t",
  tickJa: "dg-ck-tj",
  key: "dg-ck-key",
  row: "dg-ck-key",
  rowName: "dg-ck-name",
  rowTime: "dg-ck-time",
};

/** 時計の文字盤の見た目の規則。弧の帯、光った弧、目盛り、針、引き出す線、文字盤の外の字と一覧の字と、文字盤の真ん中の題と値 */
export const CLOCK_CSS = [
  `.dg-ck-sec{fill:var(--sunk);stroke:var(--hair);stroke-width:${S.sector}}`,
  `.dg-ck-lit{fill:${cssMix(C.tint)};stroke:var(--c);stroke-width:${S.sector}}`,
  `.dg-ck-mark{fill:none;stroke:var(--ink2);stroke-width:${S.tick};stroke-linecap:round}`,
  `.dg-ck-hand{fill:none;stroke:var(--ink);stroke-width:${S.hand};stroke-linecap:round}`,
  ".dg-ck-dot{fill:var(--ink)}",
  `.dg-ck-lead{fill:none;stroke:var(--c);stroke-width:${S.lead};stroke-linecap:round}`,
  ".dg-ck-sw{fill:var(--c)}",
  `.dg-ck-name{${font(CLOCK_TYPE.name)};fill:var(--ink)}`,
  `.dg-ck-time{${font(CLOCK_TYPE.time)};fill:var(--mute)}`,
  `.dg-ck-sub{${font(CLOCK_TYPE.sub)};fill:var(--ink2)}`,
  `.dg-ck-t{${font(CLOCK_TYPE.tick)};fill:var(--ink2)}`,
  `.dg-ck-tj{${font(CLOCK_TYPE.tickJa)};fill:var(--ink2)}`,
  `.dg-ck-key{${font(CLOCK_TYPE.key)};fill:var(--ct)}`,
  CENTRE_CSS,
].join("");

/** 文字盤の真ん中 (`cx`、`cy`) から 12 時を 0 にして右回りに `a` 度、半径 `r` の点 */
const at = (cx: number, cy: number, r: number, a: number): Point => [
  cx + r * Math.sin(a * RAD),
  cy - r * Math.cos(a * RAD),
];

/** 帯の内の半径 `inner` から外の半径 `r` までの、角度 `a` から `b` までの弧。両端を弧どうしの間の半分だけ縮める */
function sectorPath(layout: ClockLayout, a: number, b: number): string {
  const { cx, cy, r, inner } = layout.ring;
  const g = Math.min(C.gap, Math.abs(b - a) * 0.2) * Math.sign(b - a);
  const [s, e] = [a + g, b - g];
  const large = Math.abs(e - s) > 180 ? 1 : 0;
  const sweep = e > s ? 1 : 0;
  const p = (rr: number, t: number): string => at(cx, cy, rr, t).map(r1).join(" ");
  return `M${p(r, s)}A${r1(r)} ${r1(r)} 0 ${large} ${sweep} ${p(r, e)}L${p(inner, e)}A${r1(inner)} ${r1(inner)} 0 ${large} ${1 - sweep} ${p(inner, s)}Z`;
}

/** 線ごとの、針が回り始める時刻と回り終える時刻。札を運ぶ線は運ぶ物の時刻、運ばない線は線を引く時刻にする */
function timesOf(move: ClockMove, ctx: Ctx): [number, number] {
  const carried = ctx.t.carriers.find((c) => c.step === move.step && c.event === move.event);
  if (carried) return [carried.depart, carried.arrive];
  const drawn = ctx.t.edges.find((e) => e.step === move.step && e.event === move.event);
  const span = ctx.t.steps[move.step];
  return drawn ? [drawn.start, drawn.drawn] : [span?.start ?? 0, span?.start ?? 0];
}

/** 回の番号。針の向きが 12 時を何回越えたか */
const roundOf = (angle: number): number => Math.floor(Math.abs(angle) / 360 + 1e-9);

/**
 * 手順ごとの、弧を光らせる時刻の範囲。最初の手順は初めから光り、手順は針が着いた時に光って、針が 12 時を越えて次の回に入る時に消える。
 * 次の回で同じ時に入り直す手順は、消さずに光ったまま続ける
 */
function litRanges(layout: ClockLayout, ctx: Ctx): Map<string, [number, number][]> {
  const out = new Map<string, [number, number][]>();
  const entered = new Map<string, number>([[layout.sectors[0]?.id ?? "", 0]]);
  const close = (until: number): void => {
    for (const [id, start] of entered) {
      const list = out.get(id) ?? [];
      const last = list[list.length - 1];
      if (last && Math.abs(last[1] - start) < 1e-9) last[1] = until;
      else list.push([start, until]);
      out.set(id, list);
    }
    entered.clear();
  };
  let round = 0;
  for (const move of layout.hand.moves) {
    const [, arrive] = timesOf(move, ctx);
    const edge = layout.edges.find((e) => e.step === move.step && e.event === move.event);
    if (roundOf(move.to) !== round) {
      close(arrive);
      round = roundOf(move.to);
    }
    if (edge && !entered.has(edge.to)) entered.set(edge.to, arrive);
  }
  close(ctx.m.last);
  return out;
}

/** 針。線ごとに、運ぶ物と同じ時刻の点で前の向きから次の向きまで回し、線の無い間は向きを保つ */
function hand(layout: ClockLayout, ctx: Ctx): string {
  const { cx, cy } = layout.ring;
  const { r, from, moves } = layout.hand;
  const n = LOOK.carrier.samples;
  const turn = (a: number): Frame[1] => ({ transform: `rotate(${r1(a)}deg)` });
  const frames: Frame[] = [[0, turn(0)]];
  for (const move of moves) {
    const [depart, arrive] = timesOf(move, ctx);
    frames.push([depart, turn(move.from)]);
    for (let k = 1; k <= n; k++)
      frames.push([
        depart + ((arrive - depart) * k) / n,
        turn(move.from + (move.to - move.from) * easeInOut(k / n)),
      ]);
  }
  frames.push([ctx.m.total, turn(moves[moves.length - 1]?.to ?? 0)]);
  return (
    `<g transform="translate(${r1(cx)} ${r1(cy)})"><g data-clock-hand="" class="dg-a" style="${ctx.m.kf(frames)}">` +
    `<path class="dg-ck-hand" d="M0 ${r1(-from)}V${r1(-r)}"/><circle class="dg-ck-dot" cy="${r1(-r)}" r="${C.dot}"/></g></g>`
  );
}

/**
 * 文字盤の外の字の固まり。字は描いた字の記録 (`ctx.ink`) に残し、崩れの確かめが重なりを数える。
 * 携帯の幅の手順の番号は手順の色 (`color`) の字で書き、下の一覧の色の印と結ぶ
 */
const label = (l: ClockLabel, color: ColorKey, ctx: Ctx): string =>
  `<g data-clock-label="${l.id}" style="${cs(color)}">${l.texts.map((t) => write(ctx.ink, CLASSES[t.style], t.x, t.y, t.text, CLOCK_TYPE[t.style])).join("")}</g>`;

/** 携帯の幅の一覧。行ごとに、手順の色の印と番号と名前を左に、長さを右の端に揃えて書く */
function list(layout: ClockLayout, ctx: Ctx): string {
  const l = layout.list;
  if (!l) return "";
  const rows = l.rows.map((row) => {
    const base = row.y + C.row / 2;
    const y = base + CLOCK_TYPE.rowName.size * 0.3;
    const number = l.x + C.swatch + 8;
    const name = number + textWidth("00", CLOCK_TYPE.row) + 8;
    const time = l.x + l.w - textWidth(row.time, CLOCK_TYPE.rowTime);
    return (
      `<g data-clock-row="${row.id}" style="${cs(row.color)}"><rect class="dg-ck-sw" x="${r1(l.x)}" y="${r1(base - C.swatch / 2)}" width="${C.swatch}" height="${C.swatch}" rx="2"/>` +
      write(ctx.ink, CLASSES.row, number, y, row.number, CLOCK_TYPE.row) +
      write(ctx.ink, CLASSES.rowName, name, y, row.name, CLOCK_TYPE.rowName) +
      write(ctx.ink, CLASSES.rowTime, time, y, row.time, CLOCK_TYPE.rowTime) +
      "</g>"
    );
  });
  return `<g data-clock-list="">${rows.join("")}</g>`;
}

/**
 * 時計の文字盤の見た目の弧と目盛りと針と、文字盤の外の字と一覧と、文字盤の真ん中の字。中身の帯の値の移り変わり (`changes`) は描く所が出して渡す。
 * 弧と目盛りは線の下に、針は札の下に描き、札は描く本体が針の先に描く
 */
export function drawClock(
  layout: ClockLayout,
  changes: ReadonlyMap<string, FieldChange[]>,
  ctx: Ctx,
): { base: string; node: string; on: Map<string, number[]>; css: string } {
  const { cx, cy, r } = layout.ring;
  const lit = litRanges(layout, ctx);
  const sectors = layout.sectors.map((s) => {
    const d = sectorPath(layout, s.from, s.to);
    return `<g data-sector="${s.id}" style="${cs(s.color)}"><path class="dg-ck-sec" d="${d}"/><path class="dg-ck-lit dg-a" style="${rangeKf(ctx.m, lit.get(s.id) ?? [])}" d="${d}"/></g>`;
  });
  const marks = layout.ticks.map((t) => {
    const [a, b] = [
      at(cx, cy, r + (C.mark[0] as number), t.angle),
      at(cx, cy, r + (C.mark[1] as number), t.angle),
    ];
    return `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`;
  });
  const ticks = layout.ticks.map((t) => {
    const style = hasWide(t.text) ? "tickJa" : "tick";
    return write(ctx.ink, CLASSES[style], t.x, t.y, t.text, CLOCK_TYPE[style], undefined, "middle");
  });
  const leads = layout.leads.map(
    (l) =>
      `<path class="dg-ck-lead" style="${cs(l.color)}" d="M${r1(l.from[0])} ${r1(l.from[1])}L${r1(l.to[0])} ${r1(l.to[1])}"/>`,
  );
  const base =
    `<g data-clock-dial="">${sectors.join("")}<path class="dg-ck-mark" d="${marks.join("")}"/>${ticks.join("")}${leads.join("")}</g>` +
    `${centre(layout, changes, ctx)}${[...layout.names, ...layout.keys].map((l) => label(l, layout.sectors.find((s) => s.id === l.id)?.color ?? "slate", ctx)).join("")}${list(layout, ctx)}`;
  return { base, node: hand(layout, ctx), on: new Map(), css: CLOCK_CSS };
}
