/**
 * 配管の図 (#3389) を描く部品。見た目の元は Tracelyth の第8回の試作 (`pipes2`) で、色と字は値の表から読む。
 *
 * 段ごとに図の全てを 1 枚の絵 (`data-pipe-frame`) に描き、段が替わる時に次の段の絵を重ねてから前の段の絵を消す。
 * 列を畳んだ図は段ごとに列の幅が替わるので、どの部品も段の絵の中で、その段の置き場所に描く。
 * 段の中で変わる部品 (水位、値の札、イベントの札、流れた分、管の開け閉め、計器と札と印) は、変えた出来事の時刻に替わる。
 * 前の段の値はその時刻まで同じ所に残し、印 (`data-pipe-*`) は替わった後の部品だけが持つ。
 *
 * 下から順に、管と弁、槽と水、流れた分、書き込む管と値の札、名札の下の札、呼び出しの管、名札と輪と確認の印、管の上の字の札、
 * 図の上の端の行 (確認の印と変更の札) とイベントの札を重ねる。
 * 配管の図の見た目の規則は配管の図の SVG にだけ書き、ほかの図の SVG と頁が最初に読む script に入れない (列の図と同じ訳)。
 */
import { glyph } from "../blocks/icon/draw";
import { lamp, gauge } from "../blocks/check/draw";
import { converter } from "../blocks/calc/draw";
import { cs } from "../blocks/color/draw";
import { eventChip, ring } from "../blocks/emit/draw";
import { foldBox } from "../blocks/fold/draw";
import { bus, busChip, flow, glass, hatchPattern, level, valvePath } from "../blocks/hold/draw";
import { closedLane, laneTag, openLane } from "../blocks/return/draw";
import { undo } from "../blocks/revert/draw";
import { ETH_COLOR } from "../blocks/value/draw";
import { plate, writePipe } from "../blocks/write/draw";
import type { PipeLayout, PipeParty, PipePill, PipeRole, PipeStatus } from "../kinds/pipe/layout";
import { PIPE_LOOK, PIPE_TYPE } from "../look/pipe";
import { type ColorKey, EASE, LOOK, MOTION } from "../look/values";
import type { Timeline } from "../timeline";
import { partRadius } from "./corner";
import { ALWAYS, type Shown } from "./ink";
import { type Ctx, cssFont as font, r1, write } from "./parts";

const P = PIPE_LOOK;
const T = PIPE_TYPE;
const S = LOOK.stroke;

/** 配管の図の部品の見た目。どの値も値の表から読む。配管の図の SVG にだけ書く */
const PIPE_CSS = [
  ".dg-pp-h1{fill:color-mix(in srgb,var(--c-amber) 72%,var(--surf))}",
  ".dg-pp-h2{fill:var(--surf)}",
  `.dg-pp-pill{fill:var(--surf);stroke:var(--hair);stroke-width:${S.on}}`,
  `.dg-pp-on{stroke:var(--c-blue);stroke-width:${S.edgeOn}}`,
  `.dg-pp-strip{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-pp-name{${font(T.party)};fill:var(--ink)}`,
  `.dg-pp-av{fill:color-mix(in srgb,var(--c) 18%,var(--surf));stroke:color-mix(in srgb,var(--c) 70%,transparent);stroke-width:${S.on}}`,
  `.dg-pp-ini{${font(T.initial)};fill:var(--ct)}`,
  `.dg-pp-gl{fill:none;stroke:var(--ct);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-vv{fill:var(--surf);stroke:var(--ink2);stroke-width:${S.arrow};stroke-linejoin:round}`,
  `.dg-pp-hd{${font(T.head)};fill:var(--mute)}`,
  `.dg-pp-stb{fill:var(--surf);stroke:var(--c);stroke-width:${S.arrow}}`,
  ".dg-pp-stb-pending{stroke-dasharray:4 3}",
  `.dg-pp-stt{${font(T.status)};fill:var(--ct)}`,
  `.dg-pp-sti{fill:none;stroke:var(--ct);stroke-width:${S.on};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-chip{fill:var(--surf);stroke:var(--c);stroke-width:${S.on}}`,
  ".dg-pp-chip-provisional{stroke-dasharray:3 2}",
  `.dg-pp-ct{${font(T.chip)};fill:var(--ct)}`,
  `.dg-pp-ca{${font(T.args)};fill:var(--mute)}`,
  ".dg-pp-lane{fill:none;stroke:var(--c);stroke-linecap:round;stroke-linejoin:round}",
  `.dg-pp-halo{fill:none;stroke:var(--c);stroke-opacity:.14;stroke-width:${P.lane.halo};stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-pp-core{fill:none;stroke:var(--surf);stroke-linecap:round;stroke-linejoin:round}",
  ".dg-pp-ah{fill:var(--c)}",
  `.dg-pp-shut{fill:none;stroke:var(--c);stroke-width:${S.arrow};stroke-dasharray:${P.lane.closed};stroke-linecap:round;opacity:.7}`,
  `.dg-pp-tag{fill:var(--surf);stroke:color-mix(in srgb,var(--c) 55%,transparent);stroke-width:${S.hair}}`,
  `.dg-pp-tt{${font(T.lane)};fill:var(--ct)}`,
  `.dg-pp-card{fill:var(--surf);stroke:var(--c);stroke-width:${S.arrow}}`,
  ".dg-pp-fold{stroke-dasharray:5 3;cursor:pointer}",
  `.dg-pp-ic{fill:none;stroke:var(--c);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-k1{${font(T.cardTitle)};fill:var(--mute)}`,
  `.dg-pp-k2{${font(T.cardValue)};fill:var(--ct)}`,
  `.dg-pp-k3{${font(T.fold)}}`,
  `.dg-pp-okm{fill:none;stroke:var(--c);stroke-width:${S.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-mk{fill:none;stroke:var(--on-c);stroke-width:${S.on};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-lamp{fill:var(--c);stroke:var(--surf);stroke-width:${S.arrow}}`,
  `.dg-pp-plate{fill:var(--surf);stroke:var(--hair);stroke-width:${S.on}}`,
  ".dg-pp-plate-provisional{stroke:var(--c);stroke-dasharray:4 3}",
  `.dg-pp-plate-final{stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-pp-plate-rolled{stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-pp-pn{${font(T.plateName)};fill:var(--mute)}`,
  `.dg-pp-pv{${font(T.plateValue)};fill:var(--ink)}`,
  ".dg-pp-pv-final{fill:var(--ct)}",
  ".dg-pp-pv-rolled{fill:var(--ct)}",
  `.dg-pp-was{${font(T.was)};fill:var(--mute)}`,
  ".dg-pp-x{fill:var(--mute)}",
  `.dg-pp-glass{fill:color-mix(in srgb,var(--surf) 70%,transparent);stroke:var(--line);stroke-width:${S.arrow}}`,
  ".dg-pp-gl-none{fill:none;stroke:none}",
  `.dg-pp-gl-provisional{fill:none;stroke:var(--c);stroke-width:${S.on};stroke-dasharray:4 3}`,
  `.dg-pp-gl-final{fill:none;stroke:var(--c);stroke-width:${S.glyph}}`,
  `.dg-pp-gl-rolled{fill:none;stroke:var(--c);stroke-width:${S.glyph}}`,
  ".dg-pp-liq{fill:color-mix(in srgb,var(--c-amber) 72%,var(--surf))}",
  ".dg-pp-rise{stroke:none}",
  `.dg-pp-old{fill:none;stroke:var(--c);stroke-width:${S.on};stroke-dasharray:3 2}`,
  `.dg-pp-tk{${font(T.tankTitle)};fill:var(--mute)}`,
  `.dg-pp-amt{${font(T.amount)};fill:var(--ink)}`,
  ".dg-pp-amt-final{fill:var(--ct)}",
  ".dg-pp-amt-rolled{fill:var(--ct)}",
  `.dg-pp-tagb{fill:var(--surf);stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-pp-tagt{${font(T.tag)};fill:var(--ct)}`,
  `.dg-pp-stubo{stroke:var(--line);stroke-width:${P.bus.width - 2}}`,
  `.dg-pp-stubi{stroke:var(--bg);stroke-width:${P.bus.core - 1}}`,
  `.dg-pp-buso{stroke:var(--line);stroke-width:${P.bus.width};stroke-linecap:round}`,
  `.dg-pp-busi{stroke:var(--bg);stroke-width:${P.bus.core};stroke-linecap:round}`,
  `.dg-pp-valve{fill:var(--surf);stroke:var(--ink2);stroke-width:${S.arrow};stroke-linejoin:round}`,
  `.dg-pp-vline{stroke:var(--mute);stroke-width:${S.hair};stroke-dasharray:1.5 3}`,
  `.dg-pp-bc{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  ".dg-pp-bd{fill:var(--c)}",
  `.dg-pp-bt{${font(T.bus)};fill:var(--ink2)}`,
  `.dg-pp-flow{fill:none;stroke-width:${P.flow.width};stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-pp-flow-none{stroke:var(--c)}",
  ".dg-pp-flow-final{stroke:var(--c)}",
  ".dg-pp-flow-rolled{stroke:var(--c);stroke-dasharray:3 3}",
  `.dg-pp-fa{fill:none;stroke:var(--ink);stroke-width:${S.on};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-wr{fill:none;stroke:var(--c);stroke-width:${S.on};stroke-dasharray:4 3}`,
  ".dg-pp-wh{fill:var(--c)}",
  `.dg-pp-ring{fill:none;stroke:var(--c);stroke-width:${P.ring.width}}`,
  ".dg-pp-pband{stroke:none}",
  ".dg-pp-j{font-family:var(--sans)}",
].join("");

/** 関係者の種類ごとの色の役 */
const ROLE_COLOR: Record<PipeRole, ColorKey> = { sender: "blue", contract: "violet", token: "amber", account: "slate" };

/** 段の始まりの部品を、段の置き場所へ横に `dx` ずらす。列を畳んだ図で、列の幅が段ごとに替わるため */
function shifted<V>(value: V, dx: number): V {
  if (dx === 0) return value;
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") return [value[0] + dx, value[1]] as V;
    return value.map((v: unknown) => shifted(v, dx)) as V;
  }
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "x" && typeof v === "number" ? v + dx : shifted(v, dx)])) as V;
}

/** 関係者の名札。種類の印 (送り手と口座は丸、Contract は角の丸い四角、トークンの Contract は弁、`icon` を書いた関係者はその形) と名前 */
function pill(p: PipePill, party: PipeParty, ctx: Ctx, shown: Shown[], attrs: string): string {
  const style = cs(ROLE_COLOR[party.role]);
  const cy = p.y + p.h / 2;
  const initial = [...party.name][0] ?? "";
  if (p.folded)
    return (
      `<g${attrs} style="${style}"><rect class="dg-pp-strip${p.active ? " dg-pp-on" : ""}" x="${r1(p.x)}" y="${r1(p.y)}" width="${r1(p.w)}" height="${r1(p.h)}" rx="${partRadius(ctx.corner, p.w / 2)}"/>` +
      `${write(ctx.ink, "dg-pp-ini", p.x + p.w / 2, cy + T.initial.size * 0.35, initial, T.initial, shown, "middle")}</g>`
    );
  const A = P.pill.avatar;
  const cx = p.x + P.pill.padX + A / 2;
  const mark = party.icon
    ? glyph(party.icon, cx, cy, LOOK.box.iconScale, "dg-pp-gl")
    : party.role === "token"
      ? `<path class="dg-pp-vv" d="${valvePath(cx, cy, A * 0.7)}"/>`
      : (party.role === "contract"
          ? `<rect class="dg-pp-av" x="${r1(cx - A / 2)}" y="${r1(cy - A / 2)}" width="${A}" height="${A}" rx="${partRadius(ctx.corner, A / 4)}"/>`
          : `<circle class="dg-pp-av" cx="${r1(cx)}" cy="${r1(cy)}" r="${A / 2}"/>`) +
        write(ctx.ink, "dg-pp-ini", cx, cy + T.initial.size * 0.35, initial, T.initial, shown, "middle");
  return (
    `<g${attrs} style="${style}"><rect class="dg-pp-pill${p.active ? " dg-pp-on" : ""}" x="${r1(p.x)}" y="${r1(p.y)}" width="${r1(p.w)}" height="${r1(p.h)}" rx="${partRadius(ctx.corner, p.h / 2)}" ${ctx.sh}/>` +
    `${mark}${write(ctx.ink, "dg-sn dg-pp-name", p.x + P.pill.padX + A + P.pill.gap, cy + T.party.size * 0.35, party.name, T.party, shown)}</g>`
  );
}

/** 右上の変更の札。暫定は点線の縁と斜線の丸、確定は緑のレ点、取り消しは桃色の × */
function statusChip(st: PipeStatus, ctx: Ctx, shown: Shown[], hatch: string): string {
  const color: ColorKey = st.kind === "pending" ? "amber" : st.kind === "final" ? "green" : "rose";
  const r = P.status.icon / 2;
  const cx = st.x + P.status.padX + r;
  const cy = st.y + st.h / 2;
  const icon =
    st.kind === "pending"
      ? `<circle class="dg-pp-sti" cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="url(#${hatch})"/>`
      : st.kind === "final"
        ? `<path class="dg-pp-sti" d="M ${r1(cx - r)} ${r1(cy)} L ${r1(cx - r / 3)} ${r1(cy + r * 0.66)} L ${r1(cx + r)} ${r1(cy - r * 0.66)}"/>`
        : `<path class="dg-pp-sti" d="M ${r1(cx - r * 0.8)} ${r1(cy - r * 0.8)} L ${r1(cx + r * 0.8)} ${r1(cy + r * 0.8)} M ${r1(cx + r * 0.8)} ${r1(cy - r * 0.8)} L ${r1(cx - r * 0.8)} ${r1(cy + r * 0.8)}"/>`;
  return (
    `<g data-pipe-status="${st.kind}" style="${cs(color)}"><rect class="dg-pp-stb dg-pp-stb-${st.kind}" x="${r1(st.x)}" y="${r1(st.y)}" width="${r1(st.w)}" height="${r1(st.h)}" rx="${partRadius(ctx.corner, st.h / 2)}"/>` +
    `${icon}${write(ctx.ink, "dg-pp-stt", st.text.x, st.text.base, st.text.text, T.status, shown)}</g>`
  );
}

export function drawPipe(layout: PipeLayout, timeline: Timeline, ctx: Ctx): { base: string; css: string } {
  const { m } = ctx;
  const f = MOTION.fade;
  const lastStep = timeline.steps.length - 1;
  const hatch = `dg-ph-${ctx.id}`;
  const parties = new Map(layout.parties.map((p) => [p.id, p]));
  const timeOf = (s: number, event: number | undefined): number | undefined =>
    event === undefined ? undefined : timeline.events.find((t) => t.step === s && t.event === event)?.at;
  const out: string[] = [`<defs>${hatchPattern(ctx)}</defs>`];

  // 段ごとに変わらない部品。管の左の端の名前の札と、図の上の端の行の字
  for (const chip of layout.busChips) out.push(`<g style="${cs(chip.token === "ETH" ? ETH_COLOR : "amber")}">${busChip(chip, ctx, ALWAYS)}</g>`);
  for (const head of [layout.heads.checks, layout.heads.events]) if (head) out.push(write(ctx.ink, "dg-pp-hd", head.x, head.base, head.text, T.head, ALWAYS));

  timeline.steps.forEach((span, s) => {
    const a = s === 0 ? 0 : span.start;
    const b = s === lastStep ? timeline.last : span.end + f;
    const whole: Shown[] = [[a, b + f]];
    const since = (t: number | undefined): Shown[] => (t === undefined ? whole : [[t, b + f]]);
    const until = (t: number): Shown[] => [[a, t + f]];
    /** 時刻 `t` に出る部品。時刻を持たない部品は段の絵と一緒に出る */
    const appear = (t: number | undefined, markup: string): string => (t === undefined ? markup : `<g class="dg-a" style="${m.vis(t, b)}">${markup}</g>`);
    /** 段の始まりから時刻 `t` まで見える部品 */
    const vanish = (t: number, markup: string): string => `<g class="dg-a" style="${m.vis(a, t)}">${markup}</g>`;
    const on = (attrs: Record<string, string | number>): string =>
      Object.entries({ ...attrs, step: s })
        .map(([k, v]) => ` data-pipe-${k}="${String(v).replace(/&/gu, "&amp;").replace(/"/gu, "&quot;").replace(/</gu, "&lt;")}"`)
        .join("");
    const folded = new Set(layout.pills.filter((p) => p.step === s && p.folded).map((p) => p.party));
    const glassOf = (step: number, party: string, token: string) => layout.glasses.find((g) => g.step === step && g.party === party && g.token === token);
    const parts: string[] = [];

    // 管と弁
    for (const b0 of layout.pipes.filter((x) => x.step === s)) parts.push(bus(b0));
    // 槽と水
    for (const g of layout.glasses.filter((x) => x.step === s && !folded.has(x.party))) {
      parts.push(glass(g, ctx, whole));
      const lv = layout.levels.find((l) => l.step === s && l.party === g.party && l.token === g.token);
      if (!lv) continue;
      const attrs = on({ level: lv.party, token: lv.token, state: lv.state });
      const t = timeOf(s, lv.event);
      const prev = s > 0 ? layout.levels.find((l) => l.step === s - 1 && l.party === g.party && l.token === g.token) : undefined;
      if (t === undefined || !prev) {
        parts.push(level(lv, g, ctx, whole, attrs));
        continue;
      }
      const dx = g.x - (glassOf(s - 1, g.party, g.token)?.x ?? g.x);
      parts.push(vanish(t, level(shifted(prev, dx), g, ctx, until(t), "")), appear(t, level(lv, g, ctx, since(t), attrs)));
    }
    // 流れた分
    for (const fl of layout.flows.filter((x) => x.step === s)) {
      const attrs = on({ flow: `${fl.from}>${fl.to}`, token: fl.token, state: fl.state });
      const t = timeOf(s, fl.event);
      const prev = layout.flows.find((x) => x.step === s - 1 && x.id === fl.id);
      if (t !== undefined && prev) parts.push(vanish(t, flow(prev, ctx, "")));
      parts.push(appear(t, flow(fl, ctx, attrs)));
    }
    // 書き込む管と値の札
    for (const w of layout.writes.filter((x) => x.step === s)) parts.push(appear(timeOf(s, w.event), writePipe(w, ctx, on({ write: w.to, name: w.name }))));
    for (const p of layout.plates.filter((x) => x.step === s && !folded.has(x.party))) {
      const attrs = on({ plate: p.party, name: p.name, state: p.state });
      const t = timeOf(s, p.event);
      const prev = s > 0 ? layout.plates.find((x) => x.step === s - 1 && x.party === p.party && x.name === p.name) : undefined;
      if (t === undefined || !prev) {
        parts.push(plate(p, ctx, whole, attrs));
        continue;
      }
      parts.push(vanish(t, plate(shifted(prev, p.x - prev.x), ctx, until(t), "")), appear(t, plate(p, ctx, since(t), attrs)));
    }
    // 名札の下の札
    for (const g of layout.gauges.filter((x) => x.step === s)) {
      const t = timeOf(s, g.event);
      parts.push(appear(t, gauge(g, ctx, since(t), on({ gauge: g.party, ok: String(g.ok) }))));
    }
    for (const c of layout.converters.filter((x) => x.step === s)) {
      const t = timeOf(s, c.event);
      parts.push(appear(t, converter(c, ctx, since(t), on({ converter: c.party }))));
    }
    for (const u of layout.undos.filter((x) => x.step === s)) {
      const t = timeOf(s, u.event);
      parts.push(appear(t, undo(u, ctx, since(t), on({ undo: u.party }))));
    }
    for (const fold of layout.folds.filter((x) => x.step === s)) parts.push(foldBox(fold, ctx, whole, ` data-pipe-step="${s}"`));
    // 呼び出しの管。閉じた管を下に、開いている管を上に
    const lanes = layout.lanes.filter((x) => x.step === s);
    for (const lane of lanes.filter((x) => x.state === "closed")) {
      const attrs = on({ call: lane.call });
      const t = timeOf(s, lane.shut);
      if (t === undefined) {
        parts.push(closedLane(lane, ctx, attrs));
        continue;
      }
      const opened = timeOf(s, lane.opened);
      parts.push(vanish(t, openLane({ ...lane, state: "open" }, ctx, attrs, opened === undefined ? undefined : drawIn(opened))), appear(t, closedLane(lane, ctx, attrs)));
    }
    for (const lane of lanes.filter((x) => x.state === "open")) {
      const t = timeOf(s, lane.opened);
      parts.push(t === undefined ? openLane(lane, ctx, on({ call: lane.call })) : appear(t, openLane(lane, ctx, on({ call: lane.call }), drawIn(t))));
    }
    // 名札と輪と確認の印
    for (const p of layout.pills.filter((x) => x.step === s)) {
      const party = parties.get(p.party);
      if (party) parts.push(pill(p, party, ctx, whole, on({ party: p.party, role: party.role })));
    }
    for (const r of layout.rings.filter((x) => x.step === s)) {
      const p = layout.pills.find((x) => x.step === s && x.party === r.party);
      if (p) parts.push(appear(timeOf(s, r.event), ring(p, on({ ring: r.party }), ctx)));
    }
    for (const l of layout.lamps.filter((x) => x.step === s && !folded.has(x.party))) parts.push(appear(l.fresh ? timeOf(s, l.event) : undefined, lamp(l, on({ lamp: l.party }))));
    // 管の上の字の札。同じ段の札は出来事の順に 1 つずつ出す
    const tags = layout.tags.filter((x) => x.step === s);
    tags.forEach((tag, k) => {
      const t = timeOf(s, tag.event) ?? a;
      const next = tags[k + 1];
      const end = next ? (timeOf(s, next.event) ?? b) : b;
      parts.push(`<g class="dg-a" style="${m.vis(t, end)}">${laneTag(tag, ctx, [[t, end + f]], on({ tag: tag.kind, call: tag.call }))}</g>`);
    });
    // 図の上の端の行とイベントの札
    for (const c of layout.checks.filter((x) => x.step === s)) parts.push(appear(c.fresh ? timeOf(s, c.event) : undefined, lamp(c, on({ check: c.ok ? "ok" : "fail" }))));
    const status = layout.statuses.find((x) => x.step === s);
    if (status) {
      const t = timeOf(s, status.event);
      const prev = layout.statuses.find((x) => x.step === s - 1);
      if (t !== undefined && prev) parts.push(vanish(t, statusChip(prev, ctx, until(t), hatch)));
      parts.push(appear(t, statusChip(status, ctx, since(t), hatch)));
    }
    for (const e of layout.events.filter((x) => x.step === s)) {
      const attrs = on({ event: `${e.party}.${e.name}`, state: e.state });
      const t = timeOf(s, e.event);
      const prev = layout.events.find((x) => x.step === s - 1 && x.id === e.id);
      if (t !== undefined && prev) parts.push(vanish(t, eventChip(prev, ctx, until(t), "")));
      parts.push(appear(t, eventChip(e, ctx, since(t), attrs)));
    }
    out.push(`<g class="dg-a" data-pipe-frame="${s}" style="${m.vis(a, b)}">${parts.join("")}</g>`);
  });
  return { base: out.join(""), css: PIPE_CSS };

  /** 開いた段の管を、呼んだ者の側から時刻 `t` に引いていく動き。矢じりは引き終えた時に出る */
  function drawIn(t: number): { kf: string; head: string } {
    const done = t + MOTION.draw;
    return {
      kf: m.kf([
        [0, { "stroke-dashoffset": 1 }],
        [t, { "stroke-dashoffset": 1 }, EASE.out],
        [done, { "stroke-dashoffset": 0 }],
        [m.total, { "stroke-dashoffset": 0 }],
      ]),
      head: m.vis(done, m.last),
    };
  }
}
