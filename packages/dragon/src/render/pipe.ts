/**
 * 配管の図 (#3389) を描く部品。見た目の元は Tracelyth の第6回の試作の「4 配管」(#3398) で、色と字は値の表から読む。
 *
 * 段ごとの絵 (`data-pipe-frame`) に、その段の部品を全て描き、段が替わる時に次の段の絵を重ねてから前の段の絵を消す。
 * 段ごとに変わらない部品 (地の点、槽の囲い、値の管と呼び出しの管の外の管、名札から槽へ下りる点線) は段の絵の下に 1 度だけ描く。
 * 段の中で変わる部品 (水位と数、値の札、イベントの札、流れた分、光る管と弁、計器、吹き出し) は、変えた出来事の時刻に替わる。
 * 前の段の値はその時刻まで同じ所に残し、部品の印 (`data-pipe-*`) は替わった後の部品だけが持つ。
 *
 * 部品の形はブロックの描き方 (`blocks/<名前>/draw.ts`) が描き、この file は並べ方の置き場所と時刻を渡して組む。
 * 下から順に、値の管を流れた分、トークンの箱と弁、槽と水、変換器、値の札と書き込む管、光る呼び出しの管と弁、計器、名札と輪、
 * イベントの札、畳んだ箱、吹き出しを重ねる。
 * 配管の図の見た目の規則は配管の図の SVG にだけ書き、ほかの図の SVG と頁が最初に読む script に入れない (列の図と同じ訳)。
 */
import { avatar, cabinet } from "../blocks/box/draw";
import { converter } from "../blocks/calc/draw";
import { gauge } from "../blocks/check/draw";
import { cs } from "../blocks/color/draw";
import { eventChip, ring } from "../blocks/emit/draw";
import { foldBox } from "../blocks/fold/draw";
import { defId, flow, grid, leverAngle, level, pipeDefs, tank, tokenBox, valuePipe, valve } from "../blocks/hold/draw";
import { callCase, litPipe } from "../blocks/return/draw";
import { plate, wide, writePipe } from "../blocks/write/draw";
import type { PipeCallout, PipeLayout, PipeLevel, PipeTone } from "../kinds/pipe/layout";
import { PIPE_LOOK, PIPE_TYPE } from "../look/pipe";
import { type ColorKey, EASE, LOOK, MOTION } from "../look/values";
import type { Timeline } from "../timeline";
import { frameShape } from "./corner";
import { ALWAYS, type Shown } from "./ink";
import type { Frame } from "./motion";
import { type Ctx, cssFont as font, r1, write } from "./parts";

const P = PIPE_LOOK;
const T = PIPE_TYPE;
const S = LOOK.stroke;
const M = MOTION.pipe;

/** 呼び出しの色、値の色、鉛筆の色 (暫定の印) を混ぜる式 */
const mix = (a: string, pct: number, b: string): string => `color-mix(in srgb,${a} ${pct}%,${b})`;

/**
 * 配管の図の部品の見た目。どの値も値の表から読む。配管の図の SVG にだけ書く。
 * 試作の色の役は、呼び出しを `--c-blue`、値を `--c-amber`、確かめるを `--c-violet`、確定を `--c-green`、取り消しを `--c-rose`、暫定の印を `--c-slate` に当てる
 */
const PIPE_CSS = [
  // 液の色。トークンごとに 3 つの色を順に使う
  `.dg-pp{--pp-tone0:var(--c-amber);--pp-tone1:${mix("var(--c-amber)", 48, "var(--ink2)")};--pp-tone2:${mix("var(--c-rose)", 70, "var(--c-amber)")}}`,
  `.dg-pp-gdot{fill:${mix("var(--line)", 60, "transparent")}}`,
  `.dg-pp-housing{fill:${mix("var(--surf)", 55, "transparent")};stroke:var(--line);stroke-width:${S.hair + 0.5};stroke-dasharray:6 6}`,
  // 値の管と流れた分
  `.dg-pp-pcase{fill:none;stroke:var(--line);stroke-width:${P.bus.case}}`,
  `.dg-pp-pcore{fill:none;stroke:var(--bg);stroke-width:${P.bus.core}}`,
  `.dg-pp-tline{fill:none;stroke:var(--pp-t);stroke-width:${P.flow.width};stroke-linecap:round;stroke-dasharray:${P.flow.dash}}`,
  `.dg-pp-chev{fill:none;stroke:var(--pp-t);stroke-width:${P.flow.width - 0.5};stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-pp-trace-final .dg-pp-tline{stroke-dasharray:none;opacity:.6}",
  ".dg-pp-trace-rolled .dg-pp-tline,.dg-pp-trace-rolled .dg-pp-chev{stroke:var(--c-rose)}",
  `.dg-pp-slug{fill:none;stroke-width:${P.bus.core - 4};stroke-dasharray:${P.flow.slug} ${1 + P.flow.slug}}`,
  // 斜線と液
  `.dg-pp-hb{fill:${mix("var(--pp-t)", 26, "transparent")}}`,
  `.dg-pp-hl{stroke:var(--pp-t);stroke-width:${P.flow.width}}`,
  ".dg-pp-d0{stop-color:var(--bg);stop-opacity:0}",
  ".dg-pp-d1{stop-color:var(--bg);stop-opacity:.38}",
  ".dg-pp-a0{stop-color:var(--c-amber)}",
  ".dg-pp-a1{stop-color:var(--c-blue)}",
  // 槽
  `.dg-pp-glass{fill:${mix("var(--surf)", 80, "transparent")};stroke:var(--line);stroke-width:${S.edgeOn + 0.5}}`,
  ".dg-pp-glass-on{stroke:var(--c)}",
  ".dg-pp-deep{pointer-events:none}",
  ".dg-pp-liq{fill:var(--pp-t)}",
  `.dg-pp-ghost{fill:none;stroke:var(--t-slate);stroke-width:${S.edgeOn};stroke-dasharray:5 5}`,
  `.dg-pp-mark{stroke:var(--t-slate);stroke-width:${S.edgeOn};stroke-dasharray:3 5}`,
  ".dg-pp-mark-rolled{stroke:var(--c-rose)}",
  `.dg-pp-shine{fill:${mix("var(--ink)", 9, "transparent")}}`,
  `.dg-pp-tick{stroke:${mix("var(--ink)", 22, "transparent")};stroke-width:${S.hair + 0.5}}`,
  `.dg-pp-tok{${font(T.tankTitle)};letter-spacing:.1em;fill:var(--mute)}`,
  `.dg-pp-num{${font(T.amount)};fill:var(--ink)}`,
  `.dg-pp-was{${font(T.sub)};fill:var(--mute)}`,
  ".dg-pp-strike{fill:var(--mute)}",
  `.dg-pp-tagw{${font(T.tag)};fill:var(--t-slate)}`,
  ".dg-pp-lv-final .dg-pp-num,.dg-pp-lv-final .dg-pp-tagw,.dg-pp-lv-rolled .dg-pp-num,.dg-pp-lv-rolled .dg-pp-tagw{fill:var(--ct)}",
  // 呼び出しの管と弁
  `.dg-pp-ccase{fill:none;stroke:var(--line);stroke-width:${P.call.case};stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-pp-cflow{fill:none;stroke:var(--c);stroke-linecap:round;stroke-linejoin:round}",
  ".dg-pp-core{fill:none;stroke:var(--bg);stroke-linecap:round;stroke-linejoin:round}",
  `.dg-pp-vbody{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn};stroke-linejoin:round}`,
  ".dg-pp-vopen{fill:var(--c-blue);stroke:var(--c-blue)}",
  ".dg-pp-vval .dg-pp-vopen{fill:var(--c-amber);stroke:var(--c-amber)}",
  `.dg-pp-vstem{stroke:var(--line);stroke-width:${S.edgeOn + 1}}`,
  ".dg-pp-lever{fill:var(--mute)}",
  `.dg-pp-pivot{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn}}`,
  // トークンの箱と中の値
  `.dg-pp-act{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn}}`,
  `.dg-pp-tokv.dg-pp-on .dg-pp-act{stroke:var(--c-blue);stroke-width:${S.edgeOn + 1}}`,
  `.dg-pp-tstem{stroke:var(--line);stroke-width:${S.edgeOn + 2}}`,
  `.dg-pp-actn{${font(T.party)};fill:var(--ink)}`,
  `.dg-pp-tkey{${font(T.key)};fill:var(--mute)}`,
  `.dg-pp-tvw,.dg-pp-tva{${font(T.keyValue)};fill:var(--mute)}`,
  `.dg-pp-tval{${font(T.keyValue)};fill:var(--ink)}`,
  ".dg-pp-tval-on{fill:var(--ct)}",
  // 値の札と書き込む管
  `.dg-pp-pbox{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn + 0.5}}`,
  ".dg-pp-plate-provisional .dg-pp-pbox{stroke:var(--c);stroke-dasharray:5 4}",
  ".dg-pp-plate-final .dg-pp-pbox,.dg-pp-plate-rolled .dg-pp-pbox{stroke:var(--c)}",
  `.dg-pp-pv{${font(T.plateValue)};fill:var(--ink)}`,
  ".dg-pp-plate-final .dg-pp-pv,.dg-pp-plate-rolled .dg-pp-pv,.dg-pp-plate-final .dg-pp-tagw,.dg-pp-plate-rolled .dg-pp-tagw{fill:var(--ct)}",
  `.dg-pp-wr{fill:none;stroke:var(--c);stroke-width:${S.on};stroke-dasharray:4 3}`,
  ".dg-pp-wh{fill:var(--c)}",
  // 計器
  `.dg-pp-face{fill:var(--surf);stroke:var(--c);stroke-width:${S.edgeOn + 0.5}}`,
  `.dg-pp-gfail .dg-pp-face{stroke-width:${S.edgeOn + 1.5}}`,
  `.dg-pp-gstem{stroke:var(--line);stroke-width:${S.edgeOn + 2}}`,
  `.dg-pp-zone{fill:none;stroke-width:${P.gauge.zone - 1};stroke-linecap:round}`,
  `.dg-pp-zbad{stroke:${mix("var(--c-rose)", 55, "transparent")}}`,
  `.dg-pp-zgood{stroke:${mix("var(--c-green)", 70, "transparent")}}`,
  ".dg-pp-needle,.dg-pp-hub{fill:var(--ink)}",
  ".dg-pp-lamp{fill:var(--c-green)}",
  ".dg-pp-gfail .dg-pp-lamp{fill:var(--c-rose)}",
  `.dg-pp-lampm{fill:none;stroke:var(--on-c);stroke-width:${S.edgeOn + 0.6};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-gread{${font(T.read)};fill:var(--ink2)}`,
  ".dg-pp-gfail .dg-pp-gread{fill:var(--c-rose)}",
  // 変換器
  `.dg-pp-cstub{fill:none;stroke:var(--line);stroke-width:${P.bus.stub}}`,
  `.dg-pp-cface{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn + 0.5}}`,
  `.dg-pp-cswirl{fill:none;stroke:var(--mute);stroke-width:${S.edgeOn + 1};stroke-linecap:round}`,
  ".dg-pp-ctip{fill:var(--mute)}",
  `.dg-pp-cur .dg-pp-cface{stroke:var(--c);stroke-width:${S.edgeOn + 1.5}}`,
  ".dg-pp-cur .dg-pp-cswirl{stroke:var(--c)}",
  ".dg-pp-cur .dg-pp-ctip{fill:var(--c)}",
  // 名札
  `.dg-pp-halo{fill:none;stroke:var(--c-blue);stroke-width:${S.edgeOn + 0.5};opacity:0}`,
  ".dg-pp-who.dg-pp-on .dg-pp-halo{opacity:.7}",
  `.dg-pp-glyph{${font(T.initial)};fill:var(--on-c)}`,
  `.dg-pp-pname{${font(T.party)};fill:var(--ink)}`,
  `.dg-pp-tie{fill:none;stroke:var(--line);stroke-width:${S.edgeOn};stroke-dasharray:2 6;stroke-linecap:round}`,
  `.dg-pp-cabr{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn + 0.5}}`,
  `.dg-pp-cab.dg-pp-pool .dg-pp-cabr{stroke:${mix("var(--c-amber)", 60, "var(--line)")}}`,
  `.dg-pp-cab.dg-pp-on .dg-pp-cabr{stroke:var(--c-blue);stroke-width:${S.edgeOn + 1.5}}`,
  `.dg-pp-cabg{${font(T.mark)};fill:var(--ink2)}`,
  `.dg-pp-cabg-s{${font(T.markSmall)}}`,
  `.dg-pp-cgl{fill:none;stroke:var(--ink2);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-cabn{${font(T.party)};fill:var(--ink)}`,
  `.dg-pp-ring{fill:none;stroke:var(--c);stroke-width:${P.ring.width}}`,
  // イベントの札と図の上の端の字
  `.dg-pp-hd{${font(T.head)};letter-spacing:.06em;fill:var(--mute)}`,
  `.dg-pp-chip{fill:var(--surf);stroke:var(--c);stroke-width:${S.on}}`,
  ".dg-pp-chip-provisional{stroke-dasharray:3 2}",
  `.dg-pp-ct{${font(T.chip)};fill:var(--ct)}`,
  `.dg-pp-ca{${font(T.args)};fill:var(--mute)}`,
  ".dg-pp-x{fill:var(--mute)}",
  // 畳んだ箱
  `.dg-pp-card{fill:var(--surf);stroke:var(--c);stroke-width:${S.arrow}}`,
  ".dg-pp-fold{stroke-dasharray:5 3;cursor:pointer}",
  `.dg-pp-ic{fill:none;stroke:var(--c);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-k1{${font(T.cardTitle)};fill:var(--mute)}`,
  `.dg-pp-k2{${font(T.cardValue)};fill:var(--ct)}`,
  `.dg-pp-k3{${font(T.fold)}}`,
  // 吹き出し
  `.dg-pp-cbr{fill:var(--surf);stroke:var(--c);stroke-width:${S.edgeOn}}`,
  `.dg-pp-cbk{${font(T.calloutTag)};letter-spacing:.06em;fill:var(--mute)}`,
  `.dg-pp-cbt{${font(T.callout)};fill:var(--ink)}`,
  `.dg-pp-cb-mono .dg-pp-cbt{${font(T.calloutMono)}}`,
  ".dg-pp-cb-good .dg-pp-cbt,.dg-pp-cb-bad .dg-pp-cbt{fill:var(--ct)}",
  ".dg-pp-j{font-family:var(--sans)}",
].join("");

/** 吹き出しの色の役 */
const TONE_COLOR: Record<PipeTone, ColorKey> = { call: "blue", check: "violet", value: "amber", good: "green", bad: "rose", event: "rose" };

/** 段ごとの吹き出し。上に小さな語、下に大きな字を書く */
function callout(c: PipeCallout, ctx: Ctx, shown: Shown[], attrs: string): string {
  return (
    `<g${attrs} class="dg-pp-cb dg-pp-cb-${c.tone}${c.mono ? " dg-pp-cb-mono" : ""}" style="${cs(TONE_COLOR[c.tone])}">` +
    frameShape(ctx.corner, ' class="dg-pp-cbr"', c, `<rect class="dg-pp-cbr" x="${r1(c.x)}" y="${r1(c.y)}" width="${r1(c.w)}" height="${r1(c.h)}" rx="${P.callout.radius}"/>`) +
    write(ctx.ink, `dg-pp-cbk${wide(c.tag.text)}`, c.tag.x, c.tag.base, c.tag.text, T.calloutTag, shown) +
    write(ctx.ink, `dg-pp-cbt${c.mono ? wide(c.text.text) : ""}`, c.text.x, c.text.base, c.text.text, c.mono ? T.calloutMono : T.callout, shown) +
    `</g>`
  );
}

/** 槽の縁の色。確定した槽は確定の縁、取り消した槽は取り消しの縁 */
const edgeOf = (lv: PipeLevel | undefined): "final" | "rolled" | "" => (lv?.state === "final" ? "final" : lv?.state === "rolled" ? "rolled" : "");

export function drawPipe(layout: PipeLayout, timeline: Timeline, ctx: Ctx): { base: string; css: string } {
  const { m } = ctx;
  const f = MOTION.fade;
  const lastStep = timeline.steps.length - 1;
  const parties = new Map(layout.parties.map((p) => [p.id, p]));
  const pooled = new Set(layout.housings.map((h) => h.party));
  const look = { P, T };
  const timeOf = (s: number, event: number | undefined): number | undefined =>
    event === undefined ? undefined : timeline.events.find((t) => t.step === s && t.event === event)?.at;
  /** 取っ手の向きの keyframes。`moves` は時刻と、その時刻に弁が開くか */
  const rotation = (start: number, moves: [number, number][], prop: (v: number) => string, length: number): string => {
    const frames: Frame[] = [[0, { transform: prop(start) }]];
    let now = start;
    for (const [t, to] of moves) {
      frames.push([t, { transform: prop(now) }, EASE.inOut], [t + length, { transform: prop(to) }]);
      now = to;
    }
    frames.push([m.total, { transform: prop(now) }]);
    return m.kf(frames);
  };
  const deg = (v: number): string => `rotate(${r1(v)}deg)`;

  // 段ごとに変わらない部品
  const out: string[] = [
    `<defs>${pipeDefs(ctx, layout.tanks)}</defs>`,
    grid(ctx, layout.width, layout.height),
    ...layout.housings.map((h) => {
      const attrs = ` class="dg-pp-housing" data-pipe-housing="${h.party}"`;
      return frameShape(ctx.corner, attrs, h, `<rect${attrs} x="${r1(h.x)}" y="${r1(h.y)}" width="${r1(h.w)}" height="${r1(h.h)}" rx="${P.tank.radius + P.tank.housing / 2}"/>`);
    }),
    ...layout.buses.map(valuePipe),
    ...layout.mains.map(callCase),
    ...layout.ties.map((t) => `<path class="dg-pp-tie" d="M ${r1(t.x)} ${r1(t.y1)} V ${r1(t.y2)}"/>`),
  ];
  if (layout.heads.events) out.push(write(ctx.ink, "dg-pp-hd", layout.heads.events.x, layout.heads.events.base, layout.heads.events.text, T.head, ALWAYS));

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
        .map(([k, v]) => ` data-pipe-${k}="${String(v).replace(/&/gu, "&amp;").replace(/"/gu, "&quot;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;")}"`)
        .join("");
    const pillOf = (party: string) => layout.pills.find((p) => p.step === s && p.party === party);
    const parts: string[] = [];

    // 値の管を流れた分。この段で流れた分は、出来事の時刻に斜線の液の塊が管を通り抜ける
    for (const fl of layout.flows.filter((x) => x.step === s)) {
      const attrs = on({ flow: `${fl.from}>${fl.to}`, token: fl.token, state: fl.state });
      const t = timeOf(s, fl.event);
      const prev = layout.flows.find((x) => x.step === s - 1 && x.id === fl.id);
      if (t !== undefined && prev) parts.push(vanish(t, flow(prev, ctx, "")));
      parts.push(appear(t, flow(fl, ctx, attrs, fl.fresh ? t : undefined)));
    }
    // トークンの箱と、値の管の弁。この段で値を移したトークンの弁は、移した時刻に開く
    for (const bus of layout.buses) {
      const v = bus.valve;
      if (!v) continue;
      const moved = layout.flows
        .filter((x) => x.step === s && x.fresh && x.token === bus.token && x.points.some((p) => p[0] >= bus.x1 - 1 && p[0] <= bus.x2 + 1))
        .map((x) => timeOf(s, x.event))
        .filter((t): t is number => t !== undefined)
        .sort((x, y) => x - y);
      const at = moved[0];
      const turn = at === undefined ? "" : rotation(leverAngle(false, false), [[at, leverAngle(false, true)]], deg, M.lever);
      const open = at === undefined ? "" : m.vis(at, b);
      parts.push(`<g class="dg-pp-vval">${valve(v.x, v.y, false, false, on({ lever: v.party }), ctx, turn, open)}</g>`);
    }
    for (const p of layout.parties.filter((x) => x.shape === "token")) {
      const v = layout.buses.find((x) => x.valve?.party === p.id)?.valve;
      parts.push(tokenBox(p, pillOf(p.id)?.involved ?? false, v ? [v.x, v.y] : undefined, ctx, whole, on({ party: p.id, role: p.role })));
    }
    // 槽と水。水と数は、変わった出来事の時刻に段の始まりの値から今の値へ替わる
    for (const g of layout.glasses.filter((x) => x.step === s)) {
      const lv = layout.levels.find((l) => l.step === s && l.party === g.party && l.token === g.token);
      let inside = "";
      if (lv) {
        const attrs = on({ level: lv.party, token: lv.token, state: lv.state });
        const t = timeOf(s, lv.event);
        const prev = s > 0 ? layout.levels.find((l) => l.step === s - 1 && l.party === g.party && l.token === g.token) : undefined;
        inside =
          t === undefined || !prev
            ? level(lv, g, ctx, whole, attrs)
            : vanish(t, level(prev, g, ctx, until(t), "")) + appear(t, level(lv, g, ctx, since(t), attrs, lv.from ? t : undefined));
      }
      parts.push(tank(g, edgeOf(lv), inside, ctx, whole, on({ tank: g.party, token: g.token })));
    }
    for (const c of layout.converters.filter((x) => x.step === s)) parts.push(converter(c, on({ converter: c.party })));
    // 値の札と書き込む管
    for (const w of layout.writes.filter((x) => x.step === s)) parts.push(appear(timeOf(s, w.event), writePipe(w, ctx, on({ write: w.to, name: w.name }))));
    for (const p of layout.plates.filter((x) => x.step === s)) {
      const attrs = on({ plate: p.party, name: p.name, state: p.state });
      const t = timeOf(s, p.event);
      const prev = s > 0 ? layout.plates.find((x) => x.step === s - 1 && x.party === p.party && x.name === p.name) : undefined;
      if (t === undefined || !prev) {
        parts.push(plate(p, ctx, whole, attrs));
        continue;
      }
      parts.push(vanish(t, plate(prev, ctx, until(t), "")), appear(t, plate(p, ctx, since(t), attrs)));
    }
    // 光る呼び出しの管。開いている間だけ呼び出しの色で光る
    for (const lane of layout.lanes.filter((x) => x.step === s)) {
      const opened = timeOf(s, lane.opened);
      const shut = timeOf(s, lane.shut);
      const shown = m.vis(opened ?? a, shut ?? b);
      const draw =
        opened === undefined
          ? ""
          : m.kf([
              [0, { "stroke-dashoffset": 1 }],
              [opened, { "stroke-dashoffset": 1 }, EASE.out],
              [opened + MOTION.draw, { "stroke-dashoffset": 0 }],
              [m.total, { "stroke-dashoffset": 0 }],
            ]);
      parts.push(litPipe(lane, on({ branch: `${lane.from}>${lane.to}`, call: lane.call, pipe: "open" }), shown, false, draw));
    }
    // 一番外の呼び出しが戻って全てが確定した段は、送り手から出る管を確定の色で光らせる
    for (const c of layout.calls.filter((x) => x.depth === 0 && x.close?.how === "return" && x.close.step === s)) {
      const t = timeOf(s, c.close?.event) ?? a;
      parts.push(litPipe({ kind: c.kind, width: c.width, points: c.lit }, on({ branch: `${c.from}>${c.to}`, call: c.index, pipe: "done" }), m.vis(t, b), true));
    }
    // 呼び出しの管の弁。呼び出しが開いた時刻に取っ手が倒れ、戻った時刻に立つ
    for (const main of layout.mains)
      for (const br of main.branches) {
        const here = layout.lanes.filter((x) => x.step === s && x.from === main.from && x.to === br.to);
        const start = here.some((x) => x.opened === undefined);
        const moves = here
          .flatMap((x): [number, boolean][] => [
            ...(timeOf(s, x.opened) === undefined ? [] : [[timeOf(s, x.opened) as number, true] as [number, boolean]]),
            ...(timeOf(s, x.shut) === undefined ? [] : [[timeOf(s, x.shut) as number, false] as [number, boolean]]),
          ])
          .sort((x, y) => x[0] - y[0]);
        const end = moves.length > 0 ? (moves[moves.length - 1] as [number, boolean])[1] : start;
        const vertical = br.valve.vertical;
        const turn =
          moves.length === 0
            ? ""
            : rotation(
                leverAngle(vertical, start),
                moves.map(([t, opened]): [number, number] => [t, leverAngle(vertical, opened)]),
                deg,
                M.lever,
              );
        let open = "";
        if (moves.length > 0) {
          const frames: Frame[] = [[0, { opacity: start ? 1 : 0 }]];
          let now = start;
          for (const [t, opened] of moves) {
            frames.push([t, { opacity: now ? 1 : 0 }], [t + f, { opacity: opened ? 1 : 0 }]);
            now = opened;
          }
          frames.push([m.total, { opacity: now ? 1 : 0 }]);
          open = m.kf(frames);
        }
        parts.push(valve(br.valve.x, br.valve.y, vertical, moves.length === 0 ? end : false, on({ lever: `${main.from}>${br.to}` }), ctx, turn, open));
      }
    // 計器。確かめた段は、確かめた時刻に針が振れて通ったかの印が付く
    for (const g of layout.gauges.filter((x) => x.step === s)) {
      const attrs = on({ gauge: g.party, ok: String(g.ok) });
      const t = g.fresh ? timeOf(s, g.event) : undefined;
      if (t === undefined) {
        parts.push(gauge(g, ctx, whole, attrs));
        continue;
      }
      const over = g.angle + (g.ok ? 22 : -26);
      const swing = m.kf([
        [0, { transform: deg(g.from) }],
        [t, { transform: deg(g.from) }, EASE.inOut],
        [t + M.needle * 0.5, { transform: deg(over) }, EASE.inOut],
        [t + M.needle, { transform: deg(g.angle) }],
        [m.total, { transform: deg(g.angle) }],
      ]);
      const lit = `transform-origin:${r1(g.lamp.x)}px ${r1(g.lamp.y)}px;${m.pop(t + M.lamp, b)}`;
      parts.push(gauge(g, ctx, whole, attrs, swing, lit));
    }
    // 名札と輪
    for (const p of layout.parties.filter((x) => x.shape !== "token")) {
      const pill = pillOf(p.id);
      const involved = pill?.involved ?? false;
      const attrs = on({ party: p.id, role: p.role });
      parts.push(
        p.shape === "round"
          ? avatar(p, involved, ctx, whole, attrs, look, `url(#${defId(ctx, "av")})`)
          : cabinet(p, involved, pooled.has(p.id), ctx, whole, attrs, look),
      );
    }
    for (const r of layout.rings.filter((x) => x.step === s)) {
      const p = parties.get(r.party);
      const pill = pillOf(r.party);
      if (!p || !pill) continue;
      const radius = p.shape === "round" ? undefined : p.shape === "token" ? P.token.radius : p.row === 0 ? P.cabinet.radius : P.cabinet.radiusSmall;
      const round = p.shape === "round" ? { ...pill, x: pill.x + pill.w / 2 - P.avatar.halo, y: pill.y + pill.h / 2 - P.avatar.halo, w: P.avatar.halo * 2, h: P.avatar.halo * 2 } : pill;
      parts.push(appear(timeOf(s, r.event), ring(round, on({ ring: r.party }), ctx, radius)));
    }
    // イベントの札
    for (const e of layout.events.filter((x) => x.step === s)) {
      const attrs = on({ event: `${e.party}.${e.name}`, state: e.state });
      const t = timeOf(s, e.event);
      const prev = layout.events.find((x) => x.step === s - 1 && x.id === e.id);
      if (t !== undefined && prev) parts.push(vanish(t, eventChip(prev, ctx, until(t), "")));
      parts.push(appear(t, eventChip(e, ctx, since(t), attrs)));
    }
    // 畳んだ箱と吹き出し
    for (const fold of layout.folds.filter((x) => x.step === s)) parts.push(foldBox(fold, ctx, whole, ` data-pipe-step="${s}"`));
    for (const c of layout.callouts.filter((x) => x.step === s)) {
      const t = timeOf(s, c.event) ?? a;
      const origin = `transform-origin:${r1(c.x + c.w / 2)}px ${r1(c.y + c.h / 2)}px`;
      parts.push(`<g class="dg-a" style="${origin};${m.pop(t, b)}">${callout(c, ctx, since(t), on({ callout: c.kind }))}</g>`);
    }
    out.push(`<g class="dg-a" data-pipe-frame="${s}" style="${m.vis(a, b)}">${parts.join("")}</g>`);
  });
  return { base: `<g class="dg-pp">${out.join("")}</g>`, css: PIPE_CSS };
}

