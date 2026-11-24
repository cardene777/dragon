/**
 * 持ち主ごとのカードの図 (`cards`、#3846) を描く部品。見た目の元は step 2 で本人が選んだ動く試作の案A (持ち主の縦の列を横に並べた板)。
 *
 * 列は淡い地の縦の帯で、上に名前と添え書きの見出しを持つ。カードの写しと、カードの無い列の点線の枠と、断られた札と、呼び出しの線と名前の札は、段ごとの組に描く。
 * 段ごとの組はその段の間だけ見え、`data-dg-only` に段の番号を持つ。再生の部品は止め絵の間、今の段のほかの組に `hidden` を付ける (`player.ts`)。
 * 合計の帯は列の下に置き、列ごとの合計を段ごとの組に描く。段で変わった合計は、変わる出来事の時刻までは前の量を出し、その後は新しい量と消し線を引いた前の量を出す。
 * カードの写しと断られた札は持ち主ごとのカードのブロックの描き方 (`blocks/card/draw.ts`) が描く。
 * 見た目の規則も持ち主ごとのカードの図の SVG にだけ書き、ほかの図の SVG と最初に読む script に入れない。
 * この file は後から読む持ち主ごとのカードの図の塊 (`kinds/cards.ts`) だけが読む
 */
import { type CardTimes, drawCard, drawRefusal, say } from "../blocks/card/draw";
import { cs } from "../blocks/color/draw";
import type { CardsColumn, CardsLayout, CardsTotal } from "../kinds/cards/layout";
import { textWidth } from "../layout/measure";
import { CARDS_LOOK, CARDS_TYPE } from "../look/cards";
import { type ColorKey, EASE, LOOK, MOTION } from "../look/values";
import { partRadius } from "./corner";
import { ALWAYS, type Shown } from "./ink";
import type { Frame } from "./motion";
import { arrowHead, type Ctx, cssFont as font, cssMix as mix, nodeAttr, pathOf, r1, sansOf } from "./parts";

const L = CARDS_LOOK;
const T = CARDS_TYPE;
const S = LOOK.stroke;

/** 字の形の真ん中から基準線までの下がりの、字の大きさに対する割合 */
const MIDDLE = 0.35;

/** 持ち主ごとのカードの図の見た目の規則 */
const CARDS_CSS = [
  "[data-dg-only][hidden]{display:none}",
  `.dg-cd-lane{fill:${mix(L.column.tint)}}`,
  `.dg-cd-head{fill:${mix(L.column.headTint)}}`,
  `.dg-cd-sep{stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-cd-name{${font(T.name)};fill:var(--ink)}`,
  `.dg-cd-sub{${font(T.sub)};fill:var(--mute)}`,
  `.dg-cd-card{fill:var(--surf);stroke:var(--line);stroke-width:${L.card.edge}}`,
  `.dg-cd-on{fill:none;stroke:var(--c);stroke-width:${L.card.strong}}`,
  `.dg-cd-cn{${font(T.card)};fill:var(--ink)}`,
  `.dg-cd-am{${font(T.amount)};fill:var(--ink2)}`,
  `.dg-cd-amj{${font(sansOf(T.amount))}}`,
  `.dg-cd-veil{fill:var(--bg);fill-opacity:${L.card.gone / 100}}`,
  `.dg-cd-strike{fill:none;stroke:var(--c);stroke-width:${L.card.strike};stroke-linecap:round;stroke-dasharray:1 1}`,
  ".dg-cd-tag{fill:var(--c)}",
  `.dg-cd-tagt{${font(T.tag)};fill:var(--on-c)}`,
  `.dg-cd-mark{fill:${mix(L.mark.tint)};stroke:${mix(L.mark.edge, "transparent")};stroke-width:${S.hair}}`,
  `.dg-cd-markt{${font(T.mark)};fill:var(--ct)}`,
  `.dg-cd-empty{fill:none;stroke:var(--line);stroke-width:${S.hair};stroke-dasharray:${L.empty.dash.join(" ")}}`,
  `.dg-cd-emptyt{${font(T.empty)};fill:var(--mute)}`,
  `.dg-cd-line{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-dasharray:1 1}`,
  `.dg-cd-dash{stroke-dasharray:${L.call.dash.join(" ")}}`,
  `.dg-cd-head-on{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-cd-call{fill:${mix(LOOK.mix.cap)};stroke:${mix(LOOK.mix.capEdge, "transparent")}}`,
  `.dg-cd-callt{${font(T.call)};fill:var(--ct)}`,
  `.dg-cd-ref{fill:${mix(L.refusal.tint)};stroke:var(--c);stroke-width:${L.card.strong}}`,
  `.dg-cd-x{fill:none;stroke:var(--c);stroke-width:${S.glyph};stroke-linecap:round}`,
  `.dg-cd-reft{${font(T.refused)};fill:var(--ct)}`,
  `.dg-cd-why{fill:var(--surf);stroke:${mix(LOOK.mix.capEdge, "transparent")};stroke-width:${S.hair}}`,
  `.dg-cd-whyt{${font(T.reason)};fill:var(--ct)}`,
  `.dg-cd-band{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-cd-cell{fill:${mix(L.total.tint, "transparent")}}`,
  `.dg-cd-tl{${font(T.totalLabel)};fill:var(--mute)}`,
  `.dg-cd-tv{${font(T.total)};fill:var(--ink)}`,
  `.dg-cd-tvj{${font(sansOf(T.total))}}`,
  ".dg-cd-new{fill:var(--ct)}",
  `.dg-cd-tw{${font(T.was)};fill:var(--mute)}`,
  `.dg-cd-tws{fill:none;stroke:var(--c);stroke-width:${L.total.strike}}`,
].join("");

/** 段 `s` の組が見えている間。最初の段は図の始まりから (最初の段の前の全体も最初の段の出来事より前の形で見せる)、最後の段は繰り返す前まで */
function windowOf(ctx: Ctx, s: number): Shown {
  const { steps } = ctx.t;
  const next = steps[s + 1];
  return [s === 0 ? 0 : (steps[s]?.start ?? 0), next ? next.start : ctx.m.last];
}

/** 段の組の動き。段の始まりに一瞬で替わり、最後の段は繰り返す前に消えていく */
function stepStyle(ctx: Ctx, s: number): string {
  const { m } = ctx;
  const [a, b] = windowOf(ctx, s);
  const cut = MOTION.lineup.cut;
  const frames: Frame[] = a <= 0 ? [[0, { opacity: 1 }]] : [[0, { opacity: 0 }], [a - cut, { opacity: 0 }], [a, { opacity: 1 }]];
  if (s === ctx.t.steps.length - 1) frames.push([b, { opacity: 1 }, EASE.inOut], [m.total, { opacity: 0 }]);
  else frames.push([b, { opacity: 1 }], [b + cut, { opacity: 0 }], [m.total, { opacity: 0 }]);
  return m.kf(frames);
}

/** 段 `s` の組。`data-dg-only` に段の番号を持つ */
const stepGroup = (ctx: Ctx, s: number, body: string): string => (body === "" ? "" : `<g data-dg-only="${s}" class="dg-a" style="${stepStyle(ctx, s)}">${body}</g>`);

/** 段 `s` の出来事 `event` が起きる時刻。時刻の表に無ければ段の始まり */
const eventAt = (ctx: Ctx, s: number, event: number | undefined): number =>
  (event === undefined ? undefined : ctx.t.events.find((e) => e.step === s && e.event === event)?.at) ?? ctx.t.steps[s]?.start ?? 0;

/** 列の地と見出し。見出しは上の角だけ丸めた形で、名前と添え書きを持つ */
function columnFrame(column: CardsColumn, ctx: Ctx): string {
  const { x, y, w, h, head } = column;
  const r = partRadius(ctx.corner, L.column.radius);
  const nameY = y + L.column.nameY;
  const name = say(ctx, "dg-cd-name", x + L.column.nameX, nameY, column.name, T.name, ALWAYS);
  const sub = column.sub === undefined ? "" : say(ctx, "dg-cd-sub", x + L.column.nameX + textWidth(column.name, T.name) + L.column.subGap, nameY, column.sub, T.sub, ALWAYS);
  const top = `M${r1(x)} ${r1(y + r)}a${r} ${r} 0 0 1 ${r} -${r}H${r1(x + w - r)}a${r} ${r} 0 0 1 ${r} ${r}V${r1(head.y + head.h)}H${r1(x)}Z`;
  return (
    `<rect class="dg-cd-lane" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}"/>` +
    `<g data-dragon="column-head"><path class="dg-cd-head" d="${top}"/>${name}${sub}</g>` +
    `<path class="dg-cd-sep" d="M${r1(x)} ${r1(head.y + head.h)}H${r1(x + w)}"/>`
  );
}

/** 段で呼び出しを受けた写しの、線を引き始める時刻と線の色。鍵は `<段>/<列>/<カード>` */
function callTargets(layout: CardsLayout, ctx: Ctx): Map<string, { start: number; color: ColorKey }> {
  const out = new Map<string, { start: number; color: ColorKey }>();
  for (const e of layout.edges) {
    const time = ctx.t.edges.find((t) => t.step === e.step && t.event === e.event);
    const seat = layout.cards.find((c) => c.step === e.step && c.column === e.from && c.id === e.to) ?? layout.cards.find((c) => c.step === e.step && c.id === e.to);
    if (time && seat) out.set(`${e.step}/${seat.column}/${seat.id}`, { start: time.start, color: e.color });
  }
  return out;
}

/**
 * 段 `s` に列 `column` から出る呼び出しの線と名前の札。線は引き始める時刻から伸び、着いた時に矢じりを出す。
 * 断られた呼び出し (線の色が rose) は点線で描いて引き始める時刻に出し、見出しの下の間の線の上に × の印を重ねる
 */
function calls(layout: CardsLayout, column: string, s: number, ctx: Ctx, window: Shown): string {
  const { m } = ctx;
  return layout.edges
    .filter((e) => e.step === s && e.from === column)
    .map((e) => {
      const time = ctx.t.edges.find((t) => t.step === e.step && t.event === e.event);
      if (!time) return "";
      ctx.traces.push({ from: e.from, to: e.to, points: e.points, shown: [[time.start, window[1]]] });
      const refused = e.color === "rose";
      const line = refused
        ? m.vis(time.start, m.last)
        : m.kf([
            [0, { "stroke-dashoffset": 1 }],
            [time.start, { "stroke-dashoffset": 1 }, EASE.inOut],
            [time.drawn, { "stroke-dashoffset": 0 }],
            [m.total, { "stroke-dashoffset": 0 }],
          ]);
      const head = m.kf([
        [0, { opacity: 0 }],
        [time.drawn - 0.05, { opacity: 0 }],
        [time.drawn, { opacity: 1 }],
        [m.total, { opacity: 1 }],
      ]);
      const tag = layout.calls.find((c) => c.step === e.step && c.event === e.event);
      const shown: Shown[] = [[time.start + MOTION.labelDelay, window[1]]];
      const label = tag
        ? `<g class="dg-a" style="${cs(tag.color)};${m.rise(time.start + MOTION.labelDelay)}"><rect class="dg-cd-call" x="${r1(tag.x)}" y="${r1(tag.y)}" width="${r1(tag.w)}" height="${tag.h}" rx="${partRadius(ctx.corner, L.call.radius)}"/>${say(ctx, "dg-cd-callt", tag.x + tag.w / 2, tag.y + tag.h / 2 + T.call.size * MIDDLE, tag.text, T.call, shown, "middle")}</g>`
        : "";
      const [x0 = 0, y0 = 0] = e.points[0] ?? [];
      const c = L.call.cross;
      const cy = y0 + L.call.room / 2;
      const cross = refused ? `<path class="dg-cd-x dg-a" d="M${r1(x0 - c)} ${r1(cy - c)}L${r1(x0 + c)} ${r1(cy + c)}M${r1(x0 + c)} ${r1(cy - c)}L${r1(x0 - c)} ${r1(cy + c)}" style="${m.vis(time.drawn, m.last)}"/>` : "";
      const path = refused
        ? `<path class="dg-cd-line dg-cd-dash dg-a" d="${pathOf(e.points, ctx.corner)}" style="${line}"/>`
        : `<path class="dg-cd-line dg-a" pathLength="1" d="${pathOf(e.points, ctx.corner)}" style="${line}"/>`;
      return `<g style="${cs(e.color)}">${path}<path class="dg-cd-head-on dg-a" d="${arrowHead(e.points)}" style="${head}"/>${cross}</g>${label}`;
    })
    .join("");
}

/** 合計の行を右に寄せて描く。`was` を持つ行は今の量の左に前の量を消し線で添える。`fresh` は変わった行の今の量を光った色で書く */
function totalRows(total: CardsTotal, ctx: Ctx, shown: Shown[], after: boolean): string {
  const right = total.x + total.w - L.total.padX;
  return total.rows
    .map((row, i) => {
      const y = total.y + L.total.padY + i * L.total.row + L.total.row / 2 + T.total.size * MIDDLE;
      if (!after) return say(ctx, "dg-cd-tv", right, y, row.was ?? row.now, T.total, shown, "end");
      const now = say(ctx, row.was === undefined ? "dg-cd-tv" : "dg-cd-tv dg-cd-new", right, y, row.now, T.total, shown, "end");
      if (row.was === undefined) return now;
      const end = right - textWidth(row.now, T.total) - L.total.gap;
      const w = textWidth(row.was, T.was);
      const mid = y - T.was.size * MIDDLE;
      return `${now}${say(ctx, "dg-cd-tw", end, y, row.was, T.was, shown, "end")}<path class="dg-cd-tws" style="${cs("rose")}" d="M${r1(end - w - 2)} ${r1(mid)}H${r1(end + 2)}"/>`;
    })
    .join("");
}

/**
 * 合計の帯。列ごとの「合計」の字は帯に 1 度だけ置き、量は段ごとの組に描く。
 * 段で変わった合計の量は、変わる出来事の時刻までは前の量を、その後は新しい量と前の量を出す。合計の印 (`data-dragon="total"`) は変わった後の量に付ける
 */
function totalsBand(layout: CardsLayout, ctx: Ctx): string {
  const { band } = layout;
  if (!band) return "";
  const { m } = ctx;
  const labels = layout.columns.map((column, i) => {
    const sep = i === 0 ? "" : `<path class="dg-cd-sep" d="M${r1(column.x - L.column.gap / 2)} ${r1(band.y + L.total.padY)}V${r1(band.y + band.h - L.total.padY)}"/>`;
    return `${sep}${say(ctx, "dg-cd-tl", column.x + L.total.padX, band.y + L.total.padY + L.total.row / 2 + T.totalLabel.size * MIDDLE, layout.words.total, T.totalLabel, ALWAYS)}`;
  });
  const steps = ctx.t.steps.map((_, s) => {
    const window = windowOf(ctx, s);
    const change = changeAt(layout, ctx, s);
    return stepGroup(
      ctx,
      s,
      layout.totals
        .filter((total) => total.step === s)
        .map((total) => {
          const at = total.changed ? (change ?? window[0]) : window[0];
          const cell = total.changed
            ? `<rect class="dg-cd-cell dg-a" style="${cs("green")};${m.vis(at, m.last)}" x="${r1(total.x + LOOK.gap / 2)}" y="${r1(total.y + LOOK.gap / 2)}" width="${r1(total.w - LOOK.gap)}" height="${r1(total.h - LOOK.gap)}" rx="${partRadius(ctx.corner, L.total.radius - LOOK.gap / 2)}"/>`
            : "";
          const before = total.changed && at > window[0] ? `<g class="dg-a" style="${m.kf([[0, { opacity: 1 }], [at, { opacity: 1 }], [at + MOTION.untilFade, { opacity: 0 }], [m.total, { opacity: 0 }]])}">${totalRows(total, ctx, [[window[0], at]], false)}</g>` : "";
          const shown: Shown[] = [[at, window[1]]];
          const after = total.changed && at > window[0] ? ` class="dg-a" style="${cs("green")};${m.vis(at, m.last)}"` : total.changed ? ` style="${cs("green")}"` : "";
          return `${cell}${before}<g data-dragon="total"${nodeAttr(total.column)}${after}>${totalRows(total, ctx, total.changed ? shown : [window], true)}</g>`;
        })
        .join(""),
    );
  });
  return `<rect class="dg-cd-band" x="${r1(band.x)}" y="${r1(band.y)}" width="${r1(band.w)}" height="${r1(band.h)}" rx="${partRadius(ctx.corner, L.total.radius)}" ${ctx.sh}/>${labels.join("")}${steps.join("")}`;
}

/** 段 `s` に合計を変える最初の出来事 (カードを作る、動かす、消す) の時刻。無ければ `undefined` */
function changeAt(layout: CardsLayout, ctx: Ctx, s: number): number | undefined {
  const events = layout.cards.filter((seat) => seat.step === s && seat.event !== undefined).map((seat) => eventAt(ctx, s, seat.event));
  return events.length === 0 ? undefined : Math.min(...events);
}

/** 持ち主ごとのカードの図。列ごとに列の地と見出しと段ごとの組を 1 つの組 (`data-dragon="column"`) に入れ、列の下に合計の帯を置く */
export function drawCards(layout: CardsLayout, ctx: Ctx): { base: string; css: string; attrs: string } {
  const targets = callTargets(layout, ctx);
  const stepCount = ctx.t.steps.length;
  const columns = layout.columns.map((column) => {
    const steps: string[] = [];
    for (let s = 0; s < stepCount; s++) {
      const window = windowOf(ctx, s);
      const empty = layout.empties
        .filter((e) => e.step === s && e.column === column.id)
        .map(
          (e) =>
            `<rect class="dg-cd-empty" x="${r1(e.x)}" y="${r1(e.y)}" width="${r1(e.w)}" height="${r1(e.h)}" rx="${partRadius(ctx.corner, L.card.radius)}"/>${say(ctx, "dg-cd-emptyt", e.x + e.w / 2, e.y + e.h / 2 + T.empty.size * MIDDLE, layout.words.empty, T.empty, [window], "middle")}`,
        )
        .join("");
      const cards = layout.cards
        .filter((seat) => seat.step === s && seat.column === column.id)
        .map((seat) => {
          const call = targets.get(`${s}/${seat.column}/${seat.id}`);
          const times: CardTimes = { window, ...(seat.event !== undefined ? { at: eventAt(ctx, s, seat.event) } : {}), ...(call ? { call } : {}) };
          return drawCard(seat, layout.words, ctx, times);
        })
        .join("");
      const refusals = layout.refusals
        .filter((r) => r.step === s && r.column === column.id)
        .map((r) => drawRefusal(r, layout.words, ctx, eventAt(ctx, s, r.event), window))
        .join("");
      steps.push(stepGroup(ctx, s, `${empty}${cards}${refusals}${calls(layout, column.id, s, ctx, window)}`));
    }
    return `<g data-dragon="column"${nodeAttr(column.id)} style="${cs("slate")}">${columnFrame(column, ctx)}${steps.join("")}</g>`;
  });
  return { base: `<g class="dg-cd">${columns.join("")}${totalsBand(layout, ctx)}</g>`, css: CARDS_CSS, attrs: ` data-diagram="cards"` };
}
