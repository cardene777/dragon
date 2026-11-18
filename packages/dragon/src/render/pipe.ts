/**
 * 配管の図 (#3389) を描く部品。見た目の元は Tracelyth の第6回の試作の「4 配管」(#3398) で、色と字は値の表から読む。
 *
 * 段ごとの絵 (`data-pipe-frame`) に、その段の部品を全て描き、段が替わる時に次の段の絵を重ねてから前の段の絵を消す。
 * 段ごとに変わらない部品 (地の点、槽の囲い、呼び出しの管の外の管、名札から槽へ下りる点線) は段の絵の下に 1 度だけ描く。
 * 段の中で変わる部品 (水位と数、値の札、イベントの札、流れた分、光る管と弁、計器、図の中の札) は、変えた出来事の時刻に替わる。
 * 前の段の値はその時刻まで同じ所に残し、部品の印 (`data-pipe-*`) は替わった後の部品だけが持つ。
 * その段で動かなかった槽と値の管と値の札と名札は薄く描き、計器と流れた分とイベントの札は薄くしない (#3418)。
 *
 * 呼び出しの管は値の管の下をくぐる (#3418)。全ての段の光る呼び出しの管を先に描き (`data-pipe-layer="calls"`)、くぐる所の印を重ね、
 * その後に段ごとの絵で値の管を描く。値の管の外の管がくぐる所の呼び出しの管を覆う。
 * 部品の形はブロックの描き方 (`blocks/<名前>/draw.ts`) が描き、この file は並べ方の置き場所と時刻を渡して組む。
 * 段ごとの絵は下から順に、値の管、流れた分、トークンの箱と弁、槽と水、変換器、値の札と書き込む管、呼び出しの管の弁、計器、名札と輪、
 * イベントの札、図の中の札 (流れた量、計器の式、入力と出力の印)、戻り値の札、畳んだ箱を重ねる。
 * 配管の図の見た目の規則は配管の図の SVG にだけ書き、ほかの図の SVG と頁が最初に読む script に入れない (列の図と同じ訳)。
 */
import { avatar, cabinet } from "../blocks/box/draw";
import { converter } from "../blocks/calc/draw";
import { gauge } from "../blocks/check/draw";
import { cs } from "../blocks/color/draw";
import { ring } from "../blocks/emit/draw";
import { foldBox } from "../blocks/fold/draw";
import { defId, flow, frame, grid, ledgerOutline, level, pipeDefs, sizedText, STATE_COLOR, tank, tokenBox, valuePipe, valve } from "../blocks/hold/draw";
import { callCase, FLOW_CSS, litPipe, STREAM } from "../blocks/return/draw";
import { linkLabel, linkLine, plate, wide, writePipe } from "../blocks/write/draw";
import {
  anchorLinks,
  callCardSize,
  chevronsOf,
  LOG_TYPE,
  logCardSize,
  type PipeArgRow,
  type PipeCallLane,
  type PipeChip,
  type PipeEventChip,
  type PipeFlow,
  type PipeGauge,
  type PipeGulp,
  type PipeLane,
  type PipeLayout,
  type PipeLevel,
  type PipeLogCard,
  type PipeParty,
  type PipePlate,
} from "../kinds/pipe/layout";
import { textWidth } from "../layout/measure";
import type { Point, Rect } from "../layout/scene";
import { FLOW_MOVE, PIPE_LOOK, PIPE_PAINT, PIPE_TYPE } from "../look/pipe";
import { type ColorKey, EASE, LOOK, MOTION } from "../look/values";
import { valveRects } from "../pipe-valve";
import type { Timeline } from "../timeline";
import { frameShape, partRadius } from "./corner";
import { ALWAYS, type Shown } from "./ink";
import type { Frame } from "./motion";
import { type Ctx, esc, cssFont as font, r1, write } from "./parts";
import { far, gapOf, gridOf, PathPoints, SpotGrid } from "./pipe-spot";

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
  `.dg-pp-pcase{fill:none;stroke:var(--line);stroke-width:14;stroke-linejoin:round}`,
  // 値の管の空洞。流れる値と流れた跡は空洞の太さで描く (Tracelyth #168)
  `.dg-pp-pbore{fill:none;stroke:${mix("var(--line)", 22, "var(--surf)")};stroke-width:8;stroke-linejoin:round}`,
  // 網型で横の管が縦の管の上を通る所。縦の管を背景の色で切ってから横の管を描き直す
  ".dg-pp-gap{fill:none;stroke:var(--bg);stroke-width:22}",
  // 帳簿型のトークンごとの囲みと張り出し
  `.dg-pp-ledger{fill:${mix("var(--surf)", 70, "transparent")};stroke:var(--line);stroke-width:${S.edgeOn + 0.5};stroke-linejoin:round}`,
  // くぐる所。呼び出しの管を値の管の縁で切る
  `.dg-pp-under{stroke:var(--bg);stroke-width:${S.edgeOn + 1.5}}`,
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
  `.dg-pp-tok{${font(T.tankTitle)};letter-spacing:${P.tank.titleTrack}em;fill:var(--mute)}`,
  `.dg-pp-num{${font(T.amount)};fill:var(--ink)}`,
  `.dg-pp-was{${font(T.sub)};fill:var(--mute)}`,
  `.dg-pp-dlt{${font(T.delta)};fill:var(--ct)}`,
  ".dg-pp-strike{fill:var(--mute)}",
  `.dg-pp-tagw{${font(T.tag)};fill:var(--t-slate)}`,
  ".dg-pp-lv-final .dg-pp-num,.dg-pp-lv-final .dg-pp-tagw,.dg-pp-lv-rolled .dg-pp-num,.dg-pp-lv-rolled .dg-pp-tagw{fill:var(--ct)}",
  ".dg-pp-lv-provisional .dg-pp-dlt{fill:var(--ink2)}",
  // 呼び出しの管と弁
  `.dg-pp-ccase{fill:none;stroke:var(--line);stroke-width:16;stroke-linejoin:round}`,
  ".dg-pp-core{fill:none;stroke:var(--bg);stroke-linecap:round;stroke-linejoin:round}",
  `.dg-pp-vbody{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn};stroke-linejoin:round}`,
  // 流れの先を道の頭から見せる切り抜きと、流れ終えた跡と、移す額の札 (Tracelyth #168)
  `.dg-pp-reveal{fill:none;stroke:${PIPE_PAINT.reveal};stroke-width:44;stroke-dasharray:1 1}`,
  `.dg-pp-cdone{fill:none;stroke:var(--c);stroke-width:12;opacity:.3;stroke-linejoin:round}`,
  `.dg-pp-tpast{fill:none;stroke:var(--pp-t);stroke-width:8;opacity:.32;stroke-linejoin:round}`,
  ".dg-pp-trace-rolled .dg-pp-tpast{stroke:var(--c-rose)}",
  `.dg-pp-coin rect{fill:var(--pp-t);stroke:var(--surf);stroke-width:2.5}`,
  `.dg-pp-coin text{${font(T.chip)};fill:var(--on-c)}`,
  ".dg-pp-vopen{fill:var(--c-blue);stroke:var(--c-blue)}",
  ".dg-pp-vval .dg-pp-vopen{fill:var(--c-amber);stroke:var(--c-amber)}",
  `.dg-pp-vstem{stroke:var(--line);stroke-width:${S.edgeOn + 1}}`,
  ".dg-pp-lever{fill:var(--mute)}",
  `.dg-pp-pivot{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn}}`,
  // トークンの箱と中の値
  `.dg-pp-act{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn}}`,
  `.dg-pp-tokbg{fill:var(--bg);stroke:none}`,
  `.dg-pp-tokv.dg-pp-on .dg-pp-act{stroke:var(--c-blue);stroke-width:${S.edgeOn + 1}}`,
  `.dg-pp-tstem{stroke:var(--line);stroke-width:${S.edgeOn + 2}}`,
  `.dg-pp-actn{${font(T.party)};fill:var(--ink)}`,
  // トークンの箱の見出しの下の字と残高の行 (Tracelyth #175)。行の頭の印は図の人の丸と同じ色、値が変わった行の札は状態の色を薄く塗る
  `.dg-pp-tsub,.dg-pp-tcap{${font(T.boxSub)};fill:var(--mute)}`,
  `.dg-pp-tname{${font(T.rowName)};fill:var(--ink2)}`,
  `.dg-pp-tbadge{fill:color-mix(in srgb,var(--c-blue) 13%,${PIPE_PAINT.badge});stroke:var(--c-blue);stroke-width:1.5}`,
  `.dg-pp-tini{${font(T.badge)};fill:var(--c-blue)}`,
  `.dg-pp-tpill{fill:${mix("var(--c)", 24, "var(--bg)")}}`,
  ".dg-pp-tsep{stroke:var(--line);stroke-width:1}",
  `.dg-pp-tvw,.dg-pp-tva{${font(T.rowWas)};fill:var(--mute)}`,
  `.dg-pp-tval{${font(T.rowValue)};fill:var(--ink)}`,
  `.dg-pp-tval-on{${font(T.rowNow)};fill:var(--ct)}`,
  // 値の札と書き込む管
  `.dg-pp-pbox{fill:var(--surf);stroke:var(--line);stroke-width:${S.edgeOn + 0.5}}`,
  ".dg-pp-plate-provisional .dg-pp-pbox{stroke:var(--c);stroke-dasharray:5 4}",
  ".dg-pp-plate-final .dg-pp-pbox,.dg-pp-plate-rolled .dg-pp-pbox{stroke:var(--c)}",
  `.dg-pp-pv{${font(T.plateValue)};fill:var(--ink)}`,
  ".dg-pp-plate-final .dg-pp-pv,.dg-pp-plate-rolled .dg-pp-pv,.dg-pp-plate-final .dg-pp-tagw,.dg-pp-plate-rolled .dg-pp-tagw{fill:var(--ct)}",
  `.dg-pp-wr{fill:none;stroke:var(--c);stroke-width:${S.on};stroke-dasharray:4 3}`,
  // 2人をキーに持つ値の点線の矢印と札 (#107)
  `.dg-pp-rell{fill:none;stroke:var(--c);stroke-width:${S.on};stroke-dasharray:6 5;stroke-linejoin:round;opacity:.55}`,
  ".dg-pp-relh{fill:var(--c);opacity:.55}",
  ".dg-pp-rel-on .dg-pp-rell,.dg-pp-rel-on .dg-pp-relh{opacity:1}",
  `.dg-pp-relb{fill:var(--surf);stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-pp-relt{${font(T.keyValue)};fill:var(--ct)}`,
  ".dg-pp-reld rect{fill:var(--c)}",
  `.dg-pp-reldt{${font(T.delta)};fill:var(--on-c)}`,
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
  `.dg-pp-cgl{fill:none;stroke:var(--ink2);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-cabn{${font(T.party)};fill:var(--ink)}`,
  `.dg-pp-ring{fill:none;stroke:var(--c);stroke-width:${P.ring.width}}`,
  // イベントの札
  `.dg-pp-chip{fill:var(--surf);stroke:var(--c);stroke-width:${S.on}}`,
  // 値の管の流れの上の向きの矢じり (#3721)。液の上に地の色で描く
  ".dg-pp-chev{fill:none;stroke:var(--surf);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}",
  // 札の帯の札から発した箱へ結ぶ点線 (#3721)
  `.dg-pp-tether{fill:none;stroke:var(--c);stroke-width:${S.on};stroke-dasharray:2 4;stroke-linecap:round;stroke-linejoin:round}`,
  ".dg-pp-chip-provisional{stroke-dasharray:3 2}",
  `.dg-pp-ct{${font(T.chip)};fill:var(--ct)}`,
  `.dg-pp-ca{${font(T.args)};fill:var(--mute)}`,
  ".dg-pp-x{fill:var(--mute)}",
  // 図の中の札。流れた量、計器の式、入力と出力の印、戻り値
  `.dg-pp-lab{fill:var(--surf);stroke:var(--c);stroke-width:${S.on}}`,
  ".dg-pp-lab-provisional .dg-pp-lab{stroke-dasharray:3 2}",
  `.dg-pp-labt{${font(T.chip)};fill:var(--ct)}`,
  `.dg-pp-io .dg-pp-labt{${font(T.io)}}`,
  ".dg-pp-io .dg-pp-lab{fill:var(--bg)}",
  // 畳んだ箱
  `.dg-pp-card{fill:var(--surf);stroke:var(--c);stroke-width:${S.arrow}}`,
  ".dg-pp-fold{stroke-dasharray:5 3;cursor:pointer}",
  `.dg-pp-ic{fill:none;stroke:var(--c);stroke-width:${S.glyph};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-pp-k1{${font(T.cardTitle)};fill:var(--mute)}`,
  `.dg-pp-k2{${font(T.cardValue)};fill:var(--ct)}`,
  `.dg-pp-k3{${font(T.fold)}}`,
  ".dg-pp-j{font-family:var(--sans)}",
].join("");

/** 図の中の札の色の役。流れた量は印の色、計器の式は確かめる色か落ちた色、入力と出力の印は暫定の印の色、戻り値は呼び出しの色 */
const chipColor = (c: PipeChip): ColorKey =>
  c.kind === "amount" ? STATE_COLOR[c.state ?? "none"] : c.kind === "formula" ? (c.ok === false ? "rose" : "violet") : c.kind === "io" ? "slate" : "blue";

/** 図の中の札。角の丸みは並べ方が決め (#3418)、字は並べ方が決めた大きさで書く */
function chipPart(c: PipeChip, ctx: Ctx, shown: Shown[], attrs: string): string {
  return (
    `<g${attrs} class="dg-pp-labg dg-pp-${c.kind}${c.state ? ` dg-pp-lab-${c.state}` : ""}" style="${cs(chipColor(c))}">` +
    `<rect class="dg-pp-lab" x="${r1(c.x)}" y="${r1(c.y)}" width="${r1(c.w)}" height="${r1(c.h)}" rx="${partRadius(ctx.corner, c.rx)}"/>` +
    `${sizedText(ctx, `dg-pp-labt${wide(c.text)}`, c.label, c.kind === "io" ? T.io : T.chip, shown)}</g>`
  );
}

/** 計器が描く形。針の盤と、通ったかの印と、値の管から上る軸 */
const gaugeRects = (g: PipeGauge) => [
  { x: g.x, y: g.y, w: g.w, h: g.h },
  { x: g.lamp.x - g.lamp.r, y: g.lamp.y - g.lamp.r, w: g.lamp.r * 2, h: g.lamp.r * 2 },
  ...(g.stem ? [{ x: g.cx - 2, y: Math.min(g.stem.y1, g.stem.y2), w: 4, h: Math.abs(g.stem.y2 - g.stem.y1) }] : []),
];

/**
 * 段ごとに変わらない部品 (名札、呼び出しの管、弁、槽、値の管) を、崩れの確かめのために `pieces` へ記録する (#3523、#3721)。
 * 呼び出しの管と弁の段は、その管が呼び出しを初めて運ぶ段にする
 */
function recordPieces(layout: PipeLayout, pieces: NonNullable<Ctx["pieces"]>): void {
  const names = new Map(layout.parties.map((p) => [p.id, p.name]));
  const nameOf = (id: string): string => names.get(id) ?? id;
  for (const p of layout.parties) {
    const corner = p.shape === "round" ? p.w / 2 : p.shape === "token" ? P.token.radius : P.cabinet.radius;
    pieces.push({ kind: "box", name: p.name, rect: { x: p.x, y: p.y, w: p.w, h: p.h }, corner, shown: ALWAYS });
  }
  for (const t of layout.tanks) pieces.push({ kind: "tank", name: `${nameOf(t.party)} ${t.token}`, rect: { x: t.x, y: t.y, w: t.w, h: t.h }, shown: ALWAYS });
  for (const v of layout.valuePipes)
    if (v.points.length > 1) pieces.push({ kind: "line", name: `${v.token} ${nameOf(v.from)} → ${nameOf(v.to)}`, points: v.points, half: P.bus.case / 2, shown: ALWAYS });
  for (const main of layout.mains)
    for (const br of main.branches) {
      const steps = layout.lanes.filter((x) => x.from === main.from && x.to === br.to).map((x) => x.step + 1);
      const step = steps.length > 0 ? Math.min(...steps) : 1;
      const from = nameOf(main.from);
      const to = nameOf(br.to);
      pieces.push({ kind: "pipe", from, to, step, points: br.points, half: P.call.case / 2, shown: ALWAYS });
      const [body, ...lever] = valveRects(br.valve.x, br.valve.y, br.valve.vertical, br.valve.under);
      if (body) pieces.push({ kind: "valve", from, to, step, body, lever, shown: ALWAYS });
    }
  for (const bus of layout.buses) {
    const v = bus.valve;
    if (!v) continue;
    const [body, ...lever] = valveRects(v.x, v.y, false, false);
    if (body) pieces.push({ kind: "valve", from: nameOf(v.party), body, lever, shown: ALWAYS });
  }
}

/** 札入れに入れる札の種類。上から式、額、記録の札の順に行を取る (Tracelyth #168) */
type CardKind = "formula" | "amount" | "event";
/** 記録の札と呼び出しの札の引数の 1 行 */
type ArgRow = PipeArgRow;
/** 札入れに入れる 1 枚の札。`t` はその段で札が出る時刻で、時刻を持たない札は `-1` */
interface CardItem extends Rect {
  key: PipeChip | PipeEventChip;
  kind: CardKind;
  party?: string;
  token?: string | undefined;
  t: number;
}
/** 箱ごとの札入れの大きさ。全ての段を通した種類ごとの最多の枚数と高さと、一番広い札の幅 */
interface CardPlan {
  count: Record<CardKind, number>;
  widest: number;
  h: number;
  hk: Record<CardKind, number>;
  seen: Map<string, number>;
}
/** 札入れの囲み。`t` の時刻に出て、`until` の時刻に次の大きさの囲みへ替わる */
interface Card extends Rect {
  t: number;
  until?: number | undefined;
}
/** 段ごとの札入れ。札ごとのずらす量と、札入れの囲み */
interface Stack {
  map: Map<object, { dx: number; dy: number }>;
  cards: Card[];
}
/** 呼び出しの札。関数名と引数の行を持ち、置いた所で描く */
interface CallTag {
  w: number;
  h: number;
  title: string;
  rows: ArgRow[];
  draw: (x: number, y: number) => string;
}
/** 置く呼び出しの札と、その札を出す時刻の窓 */
interface CallItem {
  c: PipeCallLane;
  lane: PipeLane;
  tag: CallTag;
  wins: [number, number][];
}

/** 槽の縁の色。確定した槽は確定の縁、取り消した槽は取り消しの縁 */
const edgeOf = (lv: PipeLevel | undefined): "final" | "rolled" | "" => (lv?.state === "final" ? "final" : lv?.state === "rolled" ? "rolled" : "");

export function drawPipe(layout: PipeLayout, timeline: Timeline, ctx: Ctx): { base: string; css: string } {
  const { m } = ctx;
  // 流れる帯の切り抜きの名札は、図ごとに 1 から数えて図の名前を付ける (#3720)
  STREAM.n = 0;
  STREAM.of = ctx.id;
  const f = MOTION.fade;
  const lastStep = timeline.steps.length - 1;
  const parties = new Map(layout.parties.map((p) => [p.id, p]));
  const pooled = new Set(layout.housings.map((h) => h.party));
  const look = { P, T };
  const timeOf = (s: number, event: number | undefined): number | undefined =>
    event === undefined ? undefined : timeline.events.find((t) => t.step === s && t.event === event)?.at;
  const deg = (v: number): string => `rotate(${r1(v)}deg)`;
  /** 段ごとの見える間 */
  const spanOf = (s: number): { a: number; b: number } => ({
    a: s === 0 ? 0 : (timeline.steps[s]?.start ?? 0),
    b: s === lastStep ? timeline.last : (timeline.steps[s]?.end ?? 0) + f,
  });
  const attrsOf = (s: number, attrs: Record<string, string | number>): string =>
    Object.entries({ ...attrs, step: s })
      .map(([k, v]) => ` data-pipe-${k}="${String(v).replace(/&/gu, "&amp;").replace(/"/gu, "&quot;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;")}"`)
      .join("");
  /** その段で動かなかった部品を薄く描く */
  const dimmed = (lit: boolean, markup: string): string => (lit ? markup : `<g opacity="${ctx.dark ? P.dimDark : P.dim}" style="filter:grayscale(1)">${markup}</g>`);
  /** 流れた分が通る値の管の番号 */
  const pipeOfFlow = (fl: { token: string; from: string; to: string }): number =>
    layout.valuePipes.findIndex((p) => p.token === fl.token && ((p.from === fl.from && p.to === fl.to) || (p.from === fl.to && p.to === fl.from)));
  const LF = LOG_TYPE;
  // 記録の札の見出しと状態の語は、組んだ図が描く言葉の語に呼ぶ側が渡した語を重ねて持つ (#3584、#3720)
  const LOG_STATE: Record<PipeEventChip["state"], string> = { ...layout.logWords.states, none: "" };
  const LOG_HEAD = layout.logWords.head;
  const logSize = (e: PipeEventChip): { w: number; h: number; rows: ArgRow[]; party: string } => logCardSize(layout, e);
  const logCard = (e: PipeEventChip, _shown: Shown[], attrs: string): string => {
    const { w, h, rows, party } = logSize(e);
    const x = e.x;
    const y = e.y;
    const color = e.state === "none" ? "rose" : STATE_COLOR[e.state];
    const tagW = textWidth(LOG_HEAD, LF.tag) + 14;
    const base = (yy: number, size: number): number => r1(yy + size * 0.36);
    return `<g${attrs} class="dg-pp-log dg-pp-log-${e.state}" style="${cs(color)}"><rect class="box" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${partRadius(ctx.corner, 10)}"/>` + `<rect class="tag" x="${r1(x + 10)}" y="${r1(y + 7)}" width="${r1(tagW)}" height="18" rx="${partRadius(ctx.corner, 9)}"/><text class="tagt" x="${r1(x + 10 + tagW / 2)}" y="${base(y + 16, 11)}" text-anchor="middle">${esc(LOG_HEAD)}</text>` + `<text x="${r1(x + 10 + tagW + 8)}" y="${base(y + 16, 13)}"><tspan class="k">${esc(party)}.</tspan><tspan class="f">${esc(e.name)}</tspan></text>` + `<text class="st" x="${r1(x + w - 12)}" y="${base(y + 16, 11)}" text-anchor="end">${esc(LOG_STATE[e.state] ?? "")}</text>` + (rows.length > 0 ? `<path class="hr" d="M ${r1(x + 1)} ${r1(y + 32)} H ${r1(x + w - 1)}"/>` : "") + rows.map((r, i) => {
      const yy = y + 32 + 4 + 21 * i + 10.5;
      return `<text x="${r1(x + 12)}" y="${base(yy, 12)}"><tspan class="n">${esc(r.name)}</tspan></text><text x="${r1(x + w - 12)}" y="${base(yy, 12)}" text-anchor="end"><tspan class="v">${esc(r.value)}</tspan></text>`;
    }).join("") + `</g>`;
  };
  const stacks = new Map<number, Stack>();
  // 札の置き場は図全体で決め、段が替わっても動かさない。種類ごとに行を持ち、その段に無い種類の行は空ける
  const boxes0 = layout.parties.filter((p) => p.shape === "token");
  const RANK: CardKind[] = ["formula", "amount", "event"];
  // トークンの箱。槽をトークンごとの行に並べる形 (Tracelyth #168) は箱にトークンを持たせ、ほかの形は箱へ入る値のパイプから引く
  const tokenHome = (token: string | undefined): PipeParty | undefined =>
    token === undefined ? undefined : boxes0.find((b) => b.token === token) ?? boxes0.find((b) => layout.valuePipes.some((v) => v.to === b.id && v.token === token));
  // 固定した形の図で箱を持たないトークン (ETH) の額の札は、札入れに入れず流れのパイプの下に置いたままにする
  const looseAmount = (c: PipeChip): boolean => layout.fixed !== undefined && c.kind === "amount" && tokenHome(c.token) === undefined;
  const itemsOf = (s: number): CardItem[] => [
    ...layout.chips.filter((c) => c.step === s && (c.kind === "formula" || c.kind === "amount") && !looseAmount(c)).map((c): CardItem => ({ key: c, kind: c.kind as CardKind, party: c.party, token: c.token, x: c.x, y: c.y, w: c.w, h: c.h, t: timeOf(s, c.event) ?? -1 })),
    // 札の帯を持つ形 (#3721) は、ログの札を札入れに入れず、置き直しが決めた札の帯の所に出す
    ...(layout.fixed?.band ? [] : layout.events.filter((e) => e.step === s).map((e): CardItem => ({ key: e, kind: "event", party: e.party, x: e.x, y: e.y, w: logSize(e).w, h: logSize(e).h, t: timeOf(s, e.event) ?? -1 })))
  ];
  const emitterOf = (it: CardItem): PipeParty | undefined => it.kind === "event" ? layout.parties.find((p) => p.id === it.party && p.shape !== "round" && p.shape !== "token") : undefined;
  // 札は、札を出した箱か、額のトークンの箱の札入れに入れる。どちらも無い札は横の位置が一番近い箱の札入れに入れる
  const boxOf = (it: CardItem): PipeParty =>
    emitterOf(it) ?? boxes0.find((b) => b.id === it.party) ?? tokenHome(it.token) ?? boxes0.reduce((best, bx) => Math.abs(bx.x + bx.w / 2 - (it.x + it.w / 2)) < Math.abs(best.x + best.w / 2 - (it.x + it.w / 2)) ? bx : best, boxes0[0] as PipeParty);
  const plan2 = new Map<PipeParty, CardPlan>();
  if (boxes0.length > 0) timeline.steps.forEach((_, s) => {
    for (const it of itemsOf(s)) {
      const box = boxOf(it);
      const p: CardPlan = plan2.get(box) ?? { count: { formula: 0, amount: 0, event: 0 }, widest: 0, h: 0, hk: { formula: 0, amount: 0, event: 0 }, seen: new Map() };
      const n = (p.seen.get(`${s}|${it.kind}`) ?? 0) + 1;
      p.seen.set(`${s}|${it.kind}`, n);
      p.count[it.kind] = Math.max(p.count[it.kind], n);
      p.widest = Math.max(p.widest, it.w);
      p.h = Math.max(p.h, it.h);
      p.hk[it.kind] = Math.max(p.hk[it.kind], it.h);
      plan2.set(box, p);
    }
  });
  // 固定した形の図で箱の上に計器が載る時に、札を計器の左右へ離す幅 (Tracelyth #165)
  // 槽をトークンごとの行に並べる形 (Tracelyth #168) は、札入れを箱の左の縁から出し、その右に呼び出しの札を出す。
  // 箱が図の左の端に寄っても札が図からはみ出さず、図の幅は札の分だけ右へ伸ばす。計器は札の外に吊るすので、札を計器の左右へ離さない
  const leftAligned = (): boolean => layout.fixed?.shape === "bus" || layout.fixed?.shape === "ledger" || layout.fixed?.shape === "mesh";
  const hasGauge = (box: PipeParty): boolean => (layout.gauges ?? []).some((g) => g.party === box.id);
  const gaugeRoom = (box: PipeParty): number => layout.fixed !== undefined && !leftAligned() && hasGauge(box) ? (P.gauge.r * 2 + P.gauge.lampGap + P.gauge.lamp * 2) / 2 : 0;
  // 網型は箱の上に、母線型は箱の下に計器を吊るすので、計器を吊るす箱の札は計器の外から出す
  const gaugeSpan = (box: PipeParty): number => leftAligned() && layout.fixed?.shape !== "ledger" && hasGauge(box) ? P.gauge.stemGap + P.gauge.r * 2 + 12 : 0;
  const belowBox = (box: PipeParty): number => box.y + box.h + 18 + gaugeSpan(box);
  // 帳簿型の札は、人の列と呼び出しより上 (`ceiling`) に出す。2つ目からの行の箱の札は、その行の張り出しの上の帯 (`ceilings`) に出す (Tracelyth #171)
  const ceilingOf = (box: PipeParty): number => layout.fixed?.ceilings?.[box.id]?.y ?? layout.fixed?.ceiling?.y ?? box.y - gaugeSpan(box);
  const stackOf = (s: number): Stack => {
    const known = stacks.get(s);
    if (known) return known;
    const map = new Map<object, { dx: number; dy: number }>();
    const cards: Card[] = [];
    const items = itemsOf(s);
    for (const [box, p] of plan2) {
      const mine = items.filter((it) => boxOf(it) === box).sort((u, v) => RANK.indexOf(u.kind) - RANK.indexOf(v.kind) || u.t - v.t);
      if (mine.length === 0) continue;
      const side = box.shape !== "token";
      const cx = box.x + box.w / 2;
      const gap = 8;
      const pad = 12;
      const tall = pad * 2 + RANK.reduce((sum, k) => sum + p.count[k] * (p.hk[k] + gap), 0) - gap;
      // 固定した形の図 (Tracelyth #165) は、札入れを箱の上の左半分に出す。右半分には呼び出しの札を出す。
      // 箱を下に集める形 (Tracelyth #166) は、札入れを箱の下の左半分に出す
      // 母線型 (Tracelyth #168) は、箱の下に左の縁から札入れを出し、その右に呼び出しの札を出す
      const fixedSide = layout.fixed !== undefined && !side;
      const above = fixedSide && layout.fixed?.shape !== "bottom" && layout.fixed?.cards !== "below";
      const top = above ? ceilingOf(box) - 18 - tall : side ? box.y : fixedSide ? belowBox(box) : box.y + box.h + 18;
      const left0 = fixedSide && leftAligned() ? box.x + pad : fixedSide ? cx - 8 - gaugeRoom(box) - p.widest - pad : side ? box.x + box.w + 18 + pad : cx - p.widest / 2;
      // 箱の下の札入れが、ほかの参加者と槽と入れ物に重なる時は、重ならない所まで横へずらす (Tracelyth #107)
      const holds2 = (o: Rect): boolean => o.x <= box.x && o.x + o.w >= box.x + box.w && o.y <= box.y && o.y + o.h >= box.y + box.h;
      const blockers: Rect[] = side ? [] : [...layout.housings ?? [], ...layout.tanks ?? [], ...layout.parties.filter((q) => q !== box)].filter((o) => !holds2(o));
      const clear = (l: number): boolean => blockers.every((o) => l - pad + p.widest + pad * 2 <= o.x || l - pad >= o.x + o.w || top + tall <= o.y || top >= o.y + o.h);
      let left = left0;
      for (let d = 0; d < 800 && !side; d += 6) {
        if (clear(left0 - d)) {
          left = left0 - d;
          break;
        }
        if (clear(left0 + d)) {
          left = left0 + d;
          break;
        }
      }
      const used: Record<CardKind, number> = { formula: 0, amount: 0, event: 0 };
      const rows: { bottom: number; t: number }[] = [];
      for (const it of mine) {
        const k0 = used[it.kind]++;
        const x = left;
        const y = top + pad + RANK.slice(0, RANK.indexOf(it.kind)).reduce((sum, k) => sum + p.count[k] * (p.hk[k] + gap), 0) + k0 * (p.hk[it.kind] + gap);
        map.set(it.key, { dx: x - it.x, dy: y - it.y });
        rows.push({ bottom: y + it.h, t: Math.max(spanOf(s).a, it.t) });
      }
      const times = [...new Set(rows.map((r) => r.t))].sort((u, v) => u - v);
      times.forEach((t, k) => {
        const bottom = Math.max(...rows.filter((r) => r.t <= t + 1e-6).map((r) => r.bottom));
        cards.push({ x: left - pad, y: top, w: p.widest + pad * 2, h: bottom + pad - top, t, until: times[k + 1] });
      });
    }
    const out: Stack = { map, cards };
    stacks.set(s, out);
    return out;
  };
  const TAGS: string[] = [];
  const GULPS: string[] = [];
  const LOGS = new Map<number, PipeLogCard>();
  const HANDED: PipeGulp[] = [];
  {
    const tsp = (cls: string, t: string): string => `<tspan class="${cls}">${esc(t)}</tspan>`;
    const runOf = (run: readonly (readonly [string, string])[]): string => run.map(([cls, t]) => tsp(cls, t)).join("");
    const BASE = 13 * 0.36;
    const build = (c: PipeCallLane): CallTag => {
      // 札の大きさは置き直し (`layout/pipe-place.ts`) が札の場所を空ける時と同じ物を使う (#3721)
      const { w, h, two, who, fn, rows: vals } = callCardSize(layout, c.label ?? "", c.to);
      const pad = 14;
      const headH = two ? 52 : 36;
      const rowH = 25;
      const head: [string, string][] = [["k", `${who}.`], ["f", fn]];
      return { w, h, title: `${who}.${fn}`, rows: vals, draw: (x: number, y: number) => `<g class="dg-pp-fn"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${partRadius(ctx.corner, 12)}"/>${two ? `<text x="${r1(x + pad)}" y="${r1(y + 17 + BASE)}">${tsp("k", who)}</text><text x="${r1(x + pad)}" y="${r1(y + 36 + 14 * 0.36)}">${tsp("f", fn)}</text>` : `<text x="${r1(x + pad)}" y="${r1(y + headH / 2 + 14 * 0.36)}">${runOf(head)}</text>`}` + (vals.length > 0 ? `<path class="hr" d="M ${r1(x + 1)} ${r1(y + headH)} H ${r1(x + w - 1)}"/>` : "") + vals.map((v, i) => {
        const yy = y + headH + 4 + rowH * i + rowH / 2 + BASE;
        return `<text x="${r1(x + pad)}" y="${r1(yy)}">${tsp("n", v.name)}</text><text x="${r1(x + w - pad)}" y="${r1(yy)}" text-anchor="end">${tsp("v", v.value)}</text>`;
      }).join("") + `</g>` };
    };
    // 札を置く時に避ける所
    const obst: Rect[] = [];
    const movedKeys = new Set<object>();
    const cardsAll: Card[] = [];
    const rebuild = (): void => {
    obst.length = 0;
    movedKeys.clear();
    cardsAll.length = 0;
    stacks.clear();
    const keep = (x: number, y: number, w: number, h: number): void => {
      if ([x, y, w, h].every((v) => Number.isFinite(v))) obst.push({ x, y, w, h });
    };
    const seg = (pts: readonly Point[], half: number): void =>
      pts.slice(1).forEach((q, i) => {
        const p = pts[i] as Point;
        keep(Math.min(p[0], q[0]) - half, Math.min(p[1], q[1]) - half, Math.abs(q[0] - p[0]) + half * 2, Math.abs(q[1] - p[1]) + half * 2);
      });
    for (const p of layout.parties) {
      keep(p.x, p.y, p.w, p.h);
      if (p.label) keep(p.label.x, p.label.y, p.label.w, p.label.h);
    }
    for (const r of [...layout.housings ?? [], ...layout.glasses ?? [], ...layout.plates ?? [], ...layout.gauges ?? [], ...layout.folds ?? []]) keep(r.x, r.y, r.w, r.h);
    timeline.steps.forEach((_, s) => {
      const st = stackOf(s);
      for (const k of st.map.keys()) movedKeys.add(k);
      for (const c of st.cards) {
        keep(c.x, c.y, c.w, c.h);
        cardsAll.push(c);
      }
    });
    for (const c of [...layout.chips, ...layout.events]) if (!movedKeys.has(c) && !("kind" in c && c.kind === "return")) keep(c.x, c.y, c.w, c.h);
    for (const l of layout.lanes) seg(l.points, 13);
    // 移す額の札が通る道も避ける
    for (const fl of layout.flows ?? []) seg(fl.points, 24);
    for (const l of layout.mains ?? []) seg(l.points, 13);
    for (const l of [...layout.valuePipes ?? [], ...layout.stubs ?? []]) seg(l.points, 15);
    for (const l of layout.writes ?? []) seg(l.points, 4);
    for (const t of layout.ties ?? []) keep(t.x - 4, Math.min(t.y1, t.y2), 8, Math.abs(t.y2 - t.y1));
    for (const bu of layout.buses ?? []) keep(Math.min(bu.x1, bu.x2), bu.y - 15, Math.abs(bu.x2 - bu.x1), 30);
    for (const tk of layout.tanks ?? []) keep(tk.x, tk.y, tk.w, tk.h);
    for (const l of layout.links ?? []) {
      seg(l.points, 3);
      for (const r of l.delta ? [l.label, l.delta] : [l.label]) keep(r.x, r.y, r.w, r.h);
    }
    };
    rebuild();
    const GAP = 8;
    // 呼び出しごとの時間。開いてから戻るまでのうち、子の呼び出しが開いていない間がその呼び出しの「今」
    const calls1 = [...layout.calls].filter((c) => c.label).sort((u, v) => u.index - v.index);
    const laneOf = (c: PipeCallLane): PipeLane | undefined => layout.lanes.find((x) => x.call === c.index && x.step === c.step) ?? layout.lanes.find((x) => x.call === c.index);
    const TIMES = new Map(calls1.map((c): [number, { open: number; close: number }] => {
      const lane = laneOf(c);
      const open = (lane ? timeOf(lane.step, lane.opened) : undefined) ?? spanOf(c.step).a;
      const close = c.close ? timeOf(c.close.step, c.close.event) ?? spanOf(c.close.step).b : timeline.last;
      return [c.index, { open, close }];
    }));
    const timesOf = (i: number): { open: number; close: number } => TIMES.get(i) ?? { open: 0, close: 0 };
    const kidsOf = (c: PipeCallLane): PipeCallLane[] => calls1.filter((k) => (k.depth ?? 0) === (c.depth ?? 0) + 1 && timesOf(k.index).open >= timesOf(c.index).open && timesOf(k.index).open < timesOf(c.index).close);
    const minus = (win: [number, number], holes: readonly [number, number][]): [number, number][] => holes.reduce((acc: [number, number][], [h0, h1]) => acc.flatMap(([u, v]) => h1 <= u || h0 >= v ? ([[u, v]] as [number, number][]) : [...(h0 > u ? [[u, h0] as [number, number]] : []), ...(h1 < v ? [[h1, v] as [number, number]] : [])]), [win]);
    const NOW = new Map(calls1.map((c): [number, [number, number][]] => {
      const { open, close } = timesOf(c.index);
      const holes = kidsOf(c).map((k): [number, number] => [timesOf(k.index).open, timesOf(k.index).close]);
      const all = minus([open, close], holes).filter(([u, v]) => v - u > 0.05);
      // 子の呼び出しの後に戻った時間が短い時は、親の札を出し直さない
      return [c.index, all.filter(([u, v], i) => i === 0 || v - u >= 1.2)];
    }));
    const meets = (w1: readonly [number, number][], w2: readonly [number, number][]): boolean => w1.some(([u1, v1]) => w2.some(([u2, v2]) => u1 < v2 && u2 < v1));
    const items: CallItem[] = [];
    for (const c of calls1) {
      const lane = laneOf(c);
      if (!lane || lane.points.length < 2) continue;
      const { open } = timesOf(c.index);
      const lead = (wins: readonly [number, number][]): [number, number][] => wins.map(([u, v]): [number, number] => [Math.abs(u - open) < 1e-6 ? u + MOTION.draw * 0.6 : u, v]);
      items.push({ c, lane, tag: build(c), wins: lead(NOW.get(c.index) ?? []) });
    }
    // 札を空いた所へ置く時に、札から線までの間を箱がふさいでいるかを見る
    const cross = ([x1, y1]: Point, [x2, y2]: Point, o: Rect): boolean => {
      let t0 = 0;
      let t1 = 1;
      const dx = x2 - x1;
      const dy = y2 - y1;
      for (const [p, q] of [[-dx, x1 - o.x], [dx, o.x + o.w - x1], [-dy, y1 - o.y], [dy, o.y + o.h - y1]] as [number, number][]) {
        if (p === 0) {
          if (q < 0) return false;
          continue;
        }
        const t = q / p;
        if (p < 0) t0 = Math.max(t0, t);
        else t1 = Math.min(t1, t);
        if (t0 > t1) return false;
      }
      return true;
    };
    const RESERVED = new Map<CallItem, Rect>();
    const fitHeight = (): void => {
      const low = Math.max(0, ...cardsAll.map((c) => c.y + c.h + P.margin));
      if (low > layout.height) layout.height = low;
    };
    fitHeight();
    {
      const unite = (p: PipeParty): Rect => {
        if (!p.label || ![p.label.x, p.label.y, p.label.w, p.label.h].every((v) => Number.isFinite(v))) return p;
        const x0 = Math.min(p.x, p.label.x);
        const y0 = Math.min(p.y, p.label.y);
        return { x: x0, y: y0, w: Math.max(p.x + p.w, p.label.x + p.label.w) - x0, h: Math.max(p.y + p.h, p.label.y + p.label.h) - y0 };
      };
      // 札入れは箱の位置から作り直すため、箱の手前と後ろを広げる切れ目を探す時は札入れを外す (cards を false にする)
      const rigid = (cards = true): Rect[] => [...layout.parties.map(unite), ...layout.housings ?? [], ...layout.tanks ?? [], ...layout.plates ?? [], ...layout.chips ?? [], ...layout.events ?? [], ...layout.folds ?? [], ...layout.gauges ?? [], ...(layout.links ?? []).flatMap((l) => l.delta ? [l.label, l.delta] : [l.label]), ...cards ? cardsAll : []].filter((r) => [r.x, r.y, r.w, r.h].every((v) => Number.isFinite(v)));
      const gapsOf = (axis: "x" | "y", cards = true): [number, number][] => {
        const ivs = rigid(cards).map((r): [number, number] => (axis === "y" ? [r.y, r.y + r.h] : [r.x, r.x + r.w])).sort((u, v) => u[0] - v[0]);
        const out2: [number, number][] = [];
        let end = 0;
        for (const [u, v] of ivs) {
          if (u > end + 2) out2.push([end, u]);
          end = Math.max(end, v);
        }
        out2.push([end, axis === "y" ? layout.height : layout.width]);
        return out2;
      };
      // cut より先 (下か右) の物を d だけずらし、cut をまたぐ物は伸ばす。元へ戻す関数を返す
      const shift = (axis: "x" | "y", cut: number | ((y: number) => number), d: number, extra: readonly object[]): (() => void) => {
        const log: [Record<string | number, unknown>, string | number, unknown][] = [];
        const put = (o: Record<string | number, unknown>, k: string | number, v: unknown): void => {
          log.push([o, k, o[k]]);
          o[k] = v;
        };
        const seen = new WeakSet<object>();
        const POS = axis === "y" ? ["y", "y1", "y2", "cy", "base"] : ["x", "x1", "x2", "cx"];
        const SIZE = axis === "y" ? "h" : "w";
        const cutOf = typeof cut === "function" ? cut : () => cut;
        const yOf = (o: Record<string, unknown>): number => typeof o.y === "number" ? o.y + (typeof o.h === "number" ? o.h / 2 : 0) : typeof o.y1 === "number" ? Math.min(o.y1, Number(o.y2)) : typeof o.cy === "number" ? o.cy : typeof o.base === "number" ? o.base : 0;
        const walk = (o: unknown): void => {
          if (o === null || typeof o !== "object" || seen.has(o)) return;
          seen.add(o);
          if (Array.isArray(o)) {
            if (o.length === 2 && typeof o[0] === "number" && typeof o[1] === "number") {
              const i = axis === "y" ? 1 : 0;
              if (o[i] > cutOf(o[1])) put(o as unknown as Record<number, unknown>, i, o[i] + d);
              return;
            }
            for (const v of o) walk(v);
            return;
          }
          const rec = o as Record<string, unknown>;
          const c0 = cutOf(yOf(rec));
          const lead = rec[axis];
          const size = rec[SIZE];
          const across = typeof lead === "number" && typeof size === "number" && lead < c0 && lead + size > c0;
          for (const [k, v] of Object.entries(rec)) {
            if (typeof v === "number") {
              if (POS.includes(k) && v > c0) put(rec, k, v + d);
              else if (k === SIZE && across) put(rec, k, v + d);
            } else walk(v);
          }
        };
        for (const [k, v] of Object.entries(layout)) if (k !== "width" && k !== "height") walk(v);
        for (const e of extra) walk(e);
        const side = axis === "y" ? "height" : "width";
        put(layout as unknown as Record<string, unknown>, side, layout[side] + d);
        return () => {
          for (let i = log.length - 1; i >= 0; i--) {
            const [o, k, v] = log[i] as [Record<string | number, unknown>, string | number, unknown];
            o[k] = v;
          }
        };
      };
      if (layout.fixed !== undefined) {
        // 固定した形の図 (Tracelyth #165) は、呼び出しの札を箱の上の右半分に出し、同じ時に出る札は上へ積む。
        // 札入れと札が図の上端からはみ出す時は、図の全体を下げてから置き直す
        const tokenBoxes = layout.parties.filter((p) => p.shape === "token");
        const touches = (a: Rect, b: Rect): boolean => a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP && a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP;
        // 箱を下に集める形 (Tracelyth #166) は、トークンの箱への呼び出しの札を箱の下の右半分に出し、同じ時に出る札は下へ積む。
        // 札入れと札が図の下端からはみ出す時は、図の高さを伸ばす
        // 母線型 (Tracelyth #168) は箱の下の札入れの右に、帳簿型は人の列と呼び出しより上に出す
        const under = layout.fixed.shape === "bottom" || layout.fixed.cards === "below";
        const placeAbove = (): { it: CallItem; r: Rect }[] => {
          const res: { it: CallItem; r: Rect }[] = [];
          for (const it of items) {
            // 札は呼ばれた物の上に出す。列の中のコントラクトへの呼び出しは、そのコントラクトの上に出す
            const anchor = layout.parties.find((p) => p.id === it.c.to) ?? tokenBoxes[0];
            if (!anchor) continue;
            const below = under && anchor.shape === "token";
            const alignedX = leftAligned() && anchor.shape === "token" ? anchor.x + (plan2.has(anchor) ? (plan2.get(anchor)?.widest ?? 0) + 24 + 16 : 0) : undefined;
            const r = { x: alignedX ?? anchor.x + anchor.w / 2 + 8 + gaugeRoom(anchor), y: below ? belowBox(anchor) : (anchor.shape === "token" ? ceilingOf(anchor) : anchor.y) - 18 - it.tag.h, w: it.tag.w, h: it.tag.h };
            for (let guard = 0; guard < 50; guard++) {
              const hit2 = res.find((o) => meets(o.it.wins, it.wins) && touches(o.r, r));
              if (!hit2) break;
              r.y = below ? hit2.r.y + hit2.r.h + GAP : hit2.r.y - GAP - r.h;
            }
            res.push({ it, r });
          }
          return res;
        };
        let above = placeAbove();
        const highest = Math.min(...above.map((x) => x.r.y), ...timeline.steps.flatMap((_, s) => stackOf(s).cards.map((c) => c.y)));
        // 札の帯を持つ形 (#3721) は、札入れと呼び出しの札を札の帯より下に置く。帯に届く時は、帯より下の物を下げる
        const band = layout.fixed.band;
        if (band && highest < band.bottom + GAP) {
          shift("y", band.bottom, band.bottom + GAP - highest, []);
          rebuild();
          above = placeAbove();
        } else if (highest < P.margin) {
          shift("y", -1e9, P.margin - highest, []);
          rebuild();
          above = placeAbove();
        }
        const lowest = Math.max(...above.map((x) => x.r.y + x.r.h), ...timeline.steps.flatMap((_, s) => stackOf(s).cards.map((c) => c.y + c.h)));
        if (lowest + P.margin > layout.height) layout.height = lowest + P.margin;
        for (const x of above) {
          RESERVED.set(x.it, x.r);
          if (x.r.x + x.r.w + P.margin > layout.width) layout.width = x.r.x + x.r.w + P.margin;
        }
        for (const c of timeline.steps.flatMap((_, s) => stackOf(s).cards)) if (c.x + c.w + P.margin > layout.width) layout.width = c.x + c.w + P.margin;
      }
      for (const fl of layout.fixed !== undefined ? [] : layout.flows ?? []) {
        const pts = fl.points;
        if (pts.length < 2) continue;
        const box = layout.parties.find((p) => p.shape === "token" && pts.slice(1).some((q, i) => {
          const p0 = pts[i] as Point;
          return Math.abs(q[1] - p0[1]) < 1 && q[1] > p.y && q[1] < p.y + p.h && Math.min(p0[0], q[0]) < p.x && Math.max(p0[0], q[0]) > p.x + p.w;
        }));
        if (!box) continue;
        const chip = layout.chips.find((c) => c.step === fl.step && c.kind === "amount" && c.token === fl.token);
        const label = chip?.text ?? `${fl.amount} ${fl.token}`;
        const need = (textWidth(label, T.chip) + FLOW_MOVE.coinPad * 2) * FLOW_MOVE.scale + 48;
        for (const side of ["left", "right"] as const) {
          const xs = pts.map((p) => p[0]);
          const lo = side === "left" ? Math.min(...xs) : box.x + box.w;
          const hi = side === "left" ? box.x : Math.max(...xs);
          if (hi - lo >= need) continue;
          const gap = gapsOf("x", false).find(([g0, g1]) => g1 > lo && g0 < hi);
          if (gap) {
            shift("x", (Math.max(gap[0], lo) + Math.min(gap[1], hi)) / 2, need - (hi - lo), []);
            rebuild();
            continue;
          }
          // 図の全体を通る縦の切れ目が無い時は、段の間の高さで切れ目を折り、上の段と下の段で別の位置を切る
          const segsAll = [...layout.lanes, ...layout.calls, ...layout.valuePipes ?? [], ...layout.flows ?? [], ...layout.writes ?? [], ...(layout.mains ?? []).flatMap((x) => x.branches ?? [])].flatMap((l) => (l.points ?? []).slice(1).map((q, i): [Point, Point] => [l.points[i] as Point, q]));
          const clearAt = (x: number, keep2: (r: Rect) => boolean): boolean => !rigid(false).some((r) => keep2(r) && r.x < x && r.x + r.w > x);
          for (const [y0, y1] of gapsOf("y", false)) {
            const jog = (y0 + y1) / 2;
            if (jog >= box.y) continue;
            const low = (r: Rect): boolean => r.y + r.h / 2 >= jog;
            let cl: number | undefined;
            for (let x = lo + 2; x < hi - 1 && cl === undefined; x += 2) if (clearAt(x, low)) cl = x;
            if (cl === undefined) continue;
            let ct: number | undefined;
            for (let dx = 0; dx < 400 && ct === undefined; dx += 2) for (const x of [cl + dx, cl - dx]) if (ct === undefined && clearAt(x, (r) => !low(r))) ct = x;
            if (ct === undefined) continue;
            const a = Math.min(cl, ct);
            const b = Math.max(cl, ct);
            const crossing = segsAll.some(([p, q]) => (p[1] - jog) * (q[1] - jog) < 0 && Math.max(p[0], q[0]) > a && Math.min(p[0], q[0]) < b) || (layout.ties ?? []).some((t) => (t.y1 - jog) * (t.y2 - jog) < 0 && t.x > a && t.x < b);
            if (crossing) continue;
            shift("x", (y) => y < jog ? ct : cl, need - (hi - lo), []);
            rebuild();
            break;
          }
        }
      }
      const NEAR = 56;
      const fits = (it: CallItem, more: readonly Rect[]): { r: Rect; score: number; above: boolean } | undefined => {
        const pts = it.lane.points;
        const entry = pts[pts.length - 1] as Point;
        const path = new PathPoints(pts);
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        // 札の置き場は格子の点ごとに選ぶので、選ぶ札を変えずに 1 点の手間を減らす (#3720、#3737)。
        // 道の区間の点は区間の外枠の中に在るので、どの区間の外枠からも NEAR より離れた札はどの点からも NEAR より離れる。端の丸めの差で選ぶ札が変わらないよう 1px 余して外す
        const reach = NEAR + 1;
        // 格子の候補の 9 割 5 分は物に重なるので、道までの隔たりより先に、列ごとに絞った物との重なりで外す
        const cols = gridOf(x0 - it.tag.w - 60, x1 + 60, 6);
        const rows = gridOf(y0 - it.tag.h - 60, y1 + 60, 6);
        const spots = new SpotGrid(cols, rows, it.tag.w, it.tag.h, [obst, more], GAP);
        // 横の区間 (呼び出しの管の札を上に置ける所) は札ごとに同じなので先に並べる
        const flats = pts.slice(1).flatMap((q, i): [Point, Point][] => {
          const p = pts[i] as Point;
          return Math.abs(q[1] - p[1]) >= 1 || Math.abs(q[0] - p[0]) < 1 ? [] : [[p, q]];
        });
        // 札が図の端から 8px の内に収まるかは、列と行で別に決まるので 1 度ずつ確かめる
        const { w, h } = it.tag;
        const colIn = cols.map((x) => !(x < 8 || x + w > layout.width - 8));
        const rowIn = rows.map((y) => !(y < 8 || y + h > layout.height - 8));
        let best: { r: Rect; score: number; above: boolean } | undefined;
        for (let i = 0; i < cols.length; i++) {
          if (!colIn[i]) continue;
          const x = cols[i] as number;
          const blocked = spots.blockedColumn(i);
          for (let j = 0; j < rows.length; j++) {
            // 選ぶ札は道に近く、どの物にも重ならない札。安い判定から先に当てる
            if (!rowIn[j] || blocked[j] === 1) continue;
            const r = { x, y: rows[j] as number, w, h };
            if (path.spans.every((b) => gapOf(r, b) > reach)) continue;
            const near3 = path.nearestWithin(r, reach);
            if (near3 > NEAR) continue;
            let above = false;
            let flatD = Infinity;
            for (const [p, q] of flats) {
              const d2 = far(r, [Math.max(Math.min(p[0], q[0]), Math.min(r.x + r.w / 2, Math.max(p[0], q[0]))), p[1]]);
              if (d2 < flatD) {
                flatD = d2;
                above = r.y + r.h <= p[1] + 1;
              }
            }
            above = above && flatD <= near3 + 1;
            const score = near3 + far(r, entry) * 0.25 + (above ? 80 : 0);
            if (!best || score < best.score) best = { r, score, above };
          }
        }
        return best;
      };
      const kept: { it: CallItem; r: Rect }[] = [];
      for (const it of layout.fixed !== undefined ? [] : items) {
        const moreOf = () => kept.filter((x) => meets(x.it.wins, it.wins)).map((x) => x.r);
        let got = fits(it, moreOf());
        if (!got || got.above) {
          const pts = it.lane.points;
          const tries: { axis: "x" | "y"; cut: number; d: number }[] = [];
          for (const axis of ["y", "x"] as const) {
            const k = axis === "y" ? 1 : 0;
            const size = axis === "y" ? it.tag.h : it.tag.w;
            const lo = Math.min(...pts.map((p) => p[k])) - size - 60;
            const hi = Math.max(...pts.map((p) => p[k])) + size + 60;
            for (const [g0, g1] of gapsOf(axis)) {
              if (g1 < lo || g0 > hi) continue;
              tries.push({ axis, cut: (g0 + g1) / 2, d: Math.max(16, size + GAP * 2 + 12 - (g1 - g0)) });
            }
          }
          const costOf = (g: { score: number; above: boolean }, d: number): number => d + g.score + (g.above ? 300 : 0);
          let pick: { t: { axis: "x" | "y"; cut: number; d: number }; cost: number } | undefined;
          for (const t of tries) {
            const undo = shift(t.axis, t.cut, t.d, kept.map((x) => x.r));
            rebuild();
            const g = fits(it, moreOf());
            if (g && (!pick || costOf(g, t.d) < pick.cost)) pick = { t, cost: costOf(g, t.d) };
            undo();
            rebuild();
          }
          if (pick && (!got || pick.cost < costOf(got, 0))) {
            shift(pick.t.axis, pick.t.cut, pick.t.d, kept.map((x) => x.r));
            rebuild();
            got = fits(it, moreOf());
          }
        }
        if (got) kept.push({ it, r: got.r });
      }
      for (const x of kept) RESERVED.set(x.it, x.r);
      fitHeight();
    }
    const placed: { it: CallItem; r: Rect }[] = [];
    for (const it of items) {
      const { tag, lane } = it;
      const pts = lane.points;
      const entry = pts[pts.length - 1] as Point;
      const kept = RESERVED.get(it);
      if (kept) {
        placed.push({ it, r: kept });
        continue;
      }
      const path = new PathPoints(pts);
      const more = placed.filter((x) => meets(x.it.wins, it.wins)).map((x) => x.r);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      // 物と重なる面積は列ごとに横で重なる物だけを足し、一番近い道の点は区間の外枠で外して探す (#3737)
      const cols = gridOf(Math.min(...xs) - tag.w - 240, Math.max(...xs) + 240, 8);
      const rows = gridOf(Math.min(...ys) - tag.h - 200, Math.max(...ys) + 200, 8);
      const spots = new SpotGrid(cols, rows, tag.w, tag.h, [obst, more], GAP);
      const colIn = cols.map((x) => !(x < 8 || x + tag.w > layout.width - 8));
      const rowIn = rows.map((y) => !(y < 8 || y + tag.h > layout.height - 8));
      let best: { r: Rect; score: number } | undefined;
      for (let i = 0; i < cols.length; i++) {
        if (!colIn[i]) continue;
        const x = cols[i] as number;
        for (let j = 0; j < rows.length; j++) {
          if (!rowIn[j]) continue;
          const r = { x, y: rows[j] as number, w: tag.w, h: tag.h };
          // 同じ隔たりの点は先の点を取る
          const { point: nearest, d: near3 } = path.nearest(r);
          const e0: Point = [Math.max(r.x, Math.min(nearest[0], r.x + r.w)), Math.max(r.y, Math.min(nearest[1], r.y + r.h))];
          const crosses = near3 > 28 && layout.parties.some((o) => cross(e0, nearest, { x: o.x + 2, y: o.y + 2, w: o.w - 4, h: o.h - 4 }));
          const score = spots.overlap(i, j) * 50 + near3 + far(r, entry) * 0.25 + (crosses ? 4e3 : 0);
          if (!best || score < best.score) best = { r, score };
        }
      }
      if (best) placed.push({ it, r: best.r });
    }
    for (const { it, r } of placed) {
      for (const [u, v] of it.wins) TAGS.push(`<g class="dg-a" style="${m.vis(u, v)}">${it.tag.draw(r.x, r.y)}</g>`);
    }
    layout.callCards = placed.map(({ it, r }) => ({ call: `${it.c.from}>${it.c.to}`, title: it.tag.title, rows: it.tag.rows, x: r.x, y: r.y, w: it.tag.w, h: it.tag.h, shown: it.wins }));
    layout.wallets = cardsAll.map(({ x, y, w, h }) => ({ x, y, w, h }));
    // 2人を結ぶ線は、札の置き場を空けるために箱を横へずらした後の箱の位置から引き直す。段の間で折ってずらすと線の端が別々に動くため (Tracelyth #107)。
    // 線の札は、置いた呼び出しの札と札入れにも重ねない (Tracelyth #111)
    // 固定した形の図 (Tracelyth #165) の線は、置き直した時に槽の下へ引いてある
    if (layout.fixed === undefined) anchorLinks(layout.links ?? [], (id) => parties.get(id), [...layout.callCards, ...layout.wallets], { x0: 0, x1: layout.width });
    // 札入れに入れた札は、線の傍でなく箱の下の札入れに描くと決めた札なので流れの名指しを持たない。崩れの確かめは線との離れを測らない
    for (const key of movedKeys) {
      const c = key as PipeChip;
      if (layout.chips.includes(c)) delete c.flow;
    }
  }
  if (ctx.pieces) recordPieces(layout, ctx.pieces);

  // 段ごとに変わらない部品
  const out: string[] = [
    `<defs>${pipeDefs(ctx, layout.tanks)}</defs>`,
    grid(ctx, layout.width, layout.height),
    // 帳簿型のトークンごとの囲みと張り出し (Tracelyth #168)
    ...(layout.ledgers ?? []).map((l) => `<path class="dg-pp-ledger" data-pipe-ledger="${esc(l.token)}" d="${ledgerOutline(l)}"/>`),
    ...layout.housings.map((h) => {
      const attrs = ` class="dg-pp-housing" data-pipe-housing="${h.party}"`;
      return frameShape(ctx.corner, attrs, h, `<rect${attrs} x="${r1(h.x)}" y="${r1(h.y)}" width="${r1(h.w)}" height="${r1(h.h)}" rx="${P.tank.radius + P.housing.pad / 2}"/>`);
    }),
    ...layout.mains.map(callCase),
    ...layout.ties.map((t) => `<path class="dg-pp-tie" d="M ${r1(t.x)} ${r1(t.y1)} V ${r1(t.y2)}"/>`),
  ];

  // 光る呼び出しの管。全ての段の分を値の管より先に描き、値の管の下をくぐらせる
  timeline.steps.forEach((_, s) => {
    const { a, b } = spanOf(s);
    const on = (attrs: Record<string, string | number>): string => attrsOf(s, attrs);
    const parts: string[] = [];
    for (const lane of layout.lanes.filter((x) => x.step === s)) {
      const opened = timeOf(s, lane.opened);
      const shut = timeOf(s, lane.shut);
      const shownAt = m.vis(opened ?? a, shut ?? b);
      const draw =
        opened === undefined
          ? ""
          : m.kf([
              [0, { "stroke-dashoffset": 1 }],
              [opened, { "stroke-dashoffset": 1 }, EASE.out],
              [opened + MOTION.draw, { "stroke-dashoffset": 0 }],
              [m.total, { "stroke-dashoffset": 0 }],
            ]);
      parts.push(litPipe(lane, on({ branch: `${lane.from}>${lane.to}`, call: lane.call, pipe: "open" }), shownAt, false, draw, { m, t0: opened ?? a, tEnd: shut ?? b, pre: opened === undefined }));
    }
    // 一番外の呼び出しが戻って全てが確定した段は、送り手から出る管を確定の色で光らせる
    for (const c of layout.calls.filter((x) => x.depth === 0 && x.close?.how === "return" && x.close.step === s)) {
      const t = timeOf(s, c.close?.event) ?? a;
      parts.push(litPipe({ kind: c.kind, width: c.width, points: c.lit }, on({ branch: `${c.from}>${c.to}`, call: c.index, pipe: "done" }), m.vis(t, b), true));
    }
    out.push(`<g class="dg-a" data-pipe-frame="${s}" data-pipe-layer="calls" style="${m.vis(a, b)}">${parts.join("")}</g>`);
  });
  // くぐる所。値の管の縁で呼び出しの管を切る
  const half = P.bus.case / 2 + 2;
  const cut = P.call.case / 2 + 2;
  for (const k of layout.crossings) {
    const d = k.vertical
      ? `M ${r1(k.x - cut)} ${r1(k.y - half)} H ${r1(k.x + cut)} M ${r1(k.x - cut)} ${r1(k.y + half)} H ${r1(k.x + cut)}`
      : `M ${r1(k.x - half)} ${r1(k.y - cut)} V ${r1(k.y + cut)} M ${r1(k.x + half)} ${r1(k.y - cut)} V ${r1(k.y + cut)}`;
    out.push(`<path class="dg-pp-under" data-pipe-crossing="${k.call}" data-pipe-token="${k.token}" data-pipe-under="${k.pipe}" d="${d}"/>`);
  }

  // 流れの向きの矢じりは、札入れと札を置いて道を伸ばし終えた道の上に置く (#3721)
  for (const fl of layout.flows) fl.chevrons = chevronsOf(fl.points);
  timeline.steps.forEach((span, s) => {
    const { a, b } = spanOf(s);
    const whole: Shown[] = [[a, b + f]];
    const since = (t: number | undefined): Shown[] => (t === undefined ? whole : [[t, b + f]]);
    const until = (t: number): Shown[] => [[a, t + f]];
    /** 時刻 `t` に出る部品。時刻を持たない部品は段の絵と一緒に出る */
    const appear = (t: number | undefined, markup: string): string => (t === undefined ? markup : `<g class="dg-a" style="${m.vis(t, b)}">${markup}</g>`);
    /** 段の始まりから時刻 `t` まで見える部品 */
    const vanish = (t: number, markup: string): string => `<g class="dg-a" style="${m.vis(a, t)}">${markup}</g>`;
    const on = (attrs: Record<string, string | number>): string => attrsOf(s, attrs);
    const pillOf = (party: string) => layout.pills.find((p) => p.step === s && p.party === party);
    const parts: string[] = [];
    const here = layout.flows.filter((x) => x.step === s);
    // 固定した形の図 (Tracelyth #165) は槽ごとにトークンの箱へパイプを引くので、送る人と受ける人の両方のパイプを濃くする
    // 2人の槽を結ぶパイプ (Tracelyth #168) は、その2人の間の流れで濃くする
    const usesPipe = (fl: PipeFlow, k: number): boolean => {
      const v = layout.valuePipes[k];
      if (layout.fixed === undefined || !v) return pipeOfFlow(fl) === k;
      if (parties.get(v.to)?.shape !== "token") return fl.token === v.token && ((fl.from === v.from && fl.to === v.to) || (fl.from === v.to && fl.to === v.from));
      return fl.token === v.token && (fl.from === v.holder || fl.to === v.holder);
    };
    const moved = (k: number): boolean => here.some((fl) => usesPipe(fl, k) && (fl.fresh || fl.event !== undefined));
    // 帳簿型の分配管と母線型の母線 (Tracelyth #168) は、枝より先に壁を、枝の後に空洞を描き、枝とのつなぎ目を開ける
    const trunks = [
      ...(layout.busLines ?? []).map((x) => ({ token: x.token, d: `M ${r1(x.x1)} ${r1(x.y)} H ${r1(x.x2)}`, len: x.x2 - x.x1 })),
      ...(layout.ledgers ?? []).map((l) => ({ token: l.token, d: `M ${r1(l.manifold.x1)} ${r1(l.manifold.y)} H ${r1(l.manifold.x2)}`, len: l.manifold.x2 - l.manifold.x1 })),
    ].filter((x) => x.len > 0.5);
    const trunkLit = (x: { token: string }): boolean => here.some((fl) => fl.token === x.token && (fl.fresh || fl.event !== undefined));

    // 値の管。その段で流れた管と、流れた分の印が替わった管だけを濃く描く
    for (const x of trunks) parts.push(dimmed(trunkLit(x), `<g data-pipe-trunk="${esc(x.token)}"><path class="dg-pp-pcase" d="${x.d}"/></g>`));
    layout.valuePipes.forEach((pipe, k) =>
      parts.push(dimmed(moved(k), valuePipe(pipe.points, on({ value: pipe.token, pipe: k, ...(pipe.holder !== undefined ? { holder: pipe.holder } : {}) })))),
    );
    for (const x of trunks) parts.push(dimmed(trunkLit(x), `<g data-pipe-trunk="${esc(x.token)}"><path class="dg-pp-pbore" d="${x.d}"/></g>`));
    for (const stub of layout.stubs) parts.push(dimmed(false, valuePipe(stub.points, on({ stub: stub.token }))));
    // 移す額の札がトークンの箱に入って出る図 (固定した形を持たない図) の、札を飲み込む箱
    const gulpOf = (path: readonly Point[]): PipeParty | undefined =>
      layout.fixed !== undefined
        ? undefined
        : layout.parties.find(
            (p) =>
              p.shape === "token" &&
              path.slice(1).some((q, i) => {
                const p0 = path[i] as Point;
                return Math.abs(q[1] - p0[1]) < 1 && q[1] > p.y && q[1] < p.y + p.h && Math.min(p0[0], q[0]) < p.x && Math.max(p0[0], q[0]) > p.x + p.w;
              }),
          );
    // 移す額の札と流れの先は、同じ時刻に同じ角を通る (Tracelyth #168)。道の頭から進んだ割合と時刻の組を返す
    const planOf = (fl: PipeFlow, t0: number): [number, number][] => {
      const t1 = Math.min(t0 + FLOW_MOVE.travel + FLOW_MOVE.pause, b - 0.1);
      const pts = fl.points;
      const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - (pts[i] as Point)[0], q[1] - (pts[i] as Point)[1]));
      const total = lens.reduce((sum, d) => sum + d, 0) || 1;
      let walked = 0;
      return [
        [t0, 0],
        ...lens.map((d): [number, number] => {
          walked += d;
          return [t0 + ((t1 - t0) * walked) / total, walked / total];
        }),
      ];
    };
    /**
     * 流れの道の上の向きの矢じり (#3721)。どこを切り取っても流れる向きが読める。
     * 1 本の流れの矢じりは 1 つの path の区切った道にまとめる。矢じりごとに要素を作ると、長い管を持つ図 (見本 `aggregator`) で要素が段ごとに数千増え、置く時の読み込みが遅くなる
     */
    const chevrons = (fl: PipeFlow): string => {
      const a = P.flow.chevron / 2;
      const d = (fl.chevrons ?? [])
        .map((c) => {
          const [bx, by] = [c.x - c.dx * a * 0.5, c.y - c.dy * a * 0.5];
          const [nx, ny] = [-c.dy * a, c.dx * a];
          return `M ${r1(bx + nx)} ${r1(by + ny)} L ${r1(c.x + c.dx * a * 0.5)} ${r1(c.y + c.dy * a * 0.5)} L ${r1(bx - nx)} ${r1(by - ny)}`;
        })
        .join(" ");
      return d === "" ? "" : `<path class="dg-pp-chev" d="${d}"/>`;
    };
    // 値の管を流れた分。この段で流れた分は、出来事の時刻に流れの先が管を進む
    for (const fl of here) {
      const attrs = on({ flow: `${fl.from}>${fl.to}`, token: fl.token, state: fl.state });
      const t = timeOf(s, fl.event);
      const prev = layout.flows.find((x) => x.step === s - 1 && x.id === fl.id);
      if (t !== undefined && prev) parts.push(vanish(t, flow(prev, ctx, "")));
      const plan = fl.fresh && t !== undefined && fl.points.length > 1 && !gulpOf(fl.points) ? planOf(fl, t) : undefined;
      parts.push(appear(t, flow(fl, ctx, attrs, fl.fresh ? t : undefined, plan) + chevrons(fl)));
    }
    // 網型の横の管が縦の管の上を通る所 (Tracelyth #168)。縦の管と、縦の管を流れる値を背景の色で切り、横の管を描き直す。
    // 横の管を値が流れる時は、流れの先が着いた時から描き直した所にも値を描く
    const BRIDGE = P.valve.r + 1;
    // 流れの道の頭から、横の線分の上の `x` の手前 `BRIDGE` の所までの割合。道がその横の線を通らない時は undefined
    const fracTo = (pts: readonly Point[], x: number, y0: number): number | undefined => {
      const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - (pts[i] as Point)[0], q[1] - (pts[i] as Point)[1]));
      const total = lens.reduce((sum, d) => sum + d, 0) || 1;
      let walked = 0;
      for (const [i, q] of pts.slice(1).entries()) {
        const p = pts[i] as Point;
        if (Math.abs(p[1] - y0) < 0.5 && Math.abs(q[1] - y0) < 0.5 && x > Math.min(p[0], q[0]) && x < Math.max(p[0], q[0])) return (walked + Math.max(0, Math.abs(x - p[0]) - BRIDGE)) / total;
        walked += lens[i] ?? 0;
      }
      return undefined;
    };
    // 道の頭から進んだ割合 `frac` に流れの先が着く時刻
    const timeAt = (plan: readonly [number, number][], frac: number): number => {
      const i = Math.max(0, plan.findIndex((_, j) => j === plan.length - 1 || (plan[j + 1] as [number, number])[1] >= frac));
      const [ta, fa] = plan[i] as [number, number];
      const [tb2, fb] = plan[Math.min(i + 1, plan.length - 1)] as [number, number];
      return fb > fa ? ta + ((tb2 - ta) * (frac - fa)) / (fb - fa) : ta;
    };
    for (const br of layout.bridges ?? []) {
      const over = layout.valuePipes[br.over];
      if (!over) continue;
      const d = `M ${r1(br.x - BRIDGE)} ${r1(br.y)} H ${r1(br.x + BRIDGE)}`;
      const liquid = here.flatMap((fl) => {
        const frac = fracTo(fl.points, br.x, br.y);
        if (frac === undefined) return [];
        const head = `<g class="dg-pp-trace dg-pp-trace-${fl.state}" style="--pp-t:var(--pp-tone${fl.tone});${cs(STATE_COLOR[fl.state])}">`;
        const t = timeOf(s, fl.event);
        if (!fl.fresh || t === undefined) return [`${head}<path class="dg-pp-tpast" d="${d}"/></g>`];
        return [appear(timeAt(planOf(fl, t), frac), `${head}<path class="dg-pp-mtrack" d="${d}"/></g>`)];
      });
      const holder: Record<string, string> = over.holder !== undefined ? { holder: over.holder } : {};
      parts.push(dimmed(moved(br.over), `<g${on({ ...holder, bridge: `${br.over}-${br.under}` })}><path class="dg-pp-gap" d="${d}"/><path class="dg-pp-pcase" d="${d}"/><path class="dg-pp-pbore" d="${d}"/>${liquid.join("")}</g>`));
    }
    // 帳簿型の枝の弁 (Tracelyth #168)。値がその枝を通る段は、流れが始まる時から弁を開いた色で描く。弁は移す額の札より前に描き、札を弁の上に通す
    for (const [k, v] of layout.valuePipes.entries()) {
      if (!v.valve) continue;
      const fl = here.find((x) => x.fresh && x.points.length > 1 && usesPipe(x, k));
      const t = fl ? timeOf(s, fl.event) ?? a : undefined;
      const holder = v.holder ?? "";
      // 帳簿型の枝は縦に走るので、弁は縦の管の弁で描く
      parts.push(dimmed(moved(k), `<g${on({ holder })}>${valve(v.valve.x, v.valve.y, true, on({ valve: holder }), t === undefined ? "" : m.vis(t, b))}</g>`));
    }
    // 移す額の札は、槽の下の差の文字と状態の文字に重ねない (Tracelyth #171)。札が文字の高さを通る間は札を消し、抜けてから出し直す。
    // 流れの先は消さないので、値がパイプを進むことは見えたままになる
    const COIN_CLEAR = 3;
    const COIN_STEP = 5e-3;
    const coinShown = (fl: PipeFlow, t0: number, t1: number, w: number, step: number): string => {
      const f = MOTION.fade;
      const tEnd = t1 + FLOW_MOVE.linger + f;
      const words2 = layout.levels.filter((l) => l.step === step).flatMap((l) => [l.delta, l.tag].filter((r) => r !== undefined));
      if (words2.length === 0) return m.vis(t0, t1 + FLOW_MOVE.linger);
      const pts = fl.points;
      const track: [number, Point][] = [[0, pts[0] as Point], ...planOf(fl, t0).map(([t], i): [number, Point] => [t, pts[i] as Point]), [m.total, pts[pts.length - 1] as Point]];
      const at = (t: number): Point => {
        const i = track.findIndex(([tb2]) => tb2 >= t);
        if (i <= 0) return (track[Math.max(0, i)] as [number, Point])[1];
        const [ta, pa] = track[i - 1] as [number, Point];
        const [tb2, pb] = track[i] as [number, Point];
        const k = tb2 > ta ? (t - ta) / (tb2 - ta) : 1;
        return [pa[0] + (pb[0] - pa[0]) * k, pa[1] + (pb[1] - pa[1]) * k];
      };
      const halfW = w * FLOW_MOVE.scale / 2 + COIN_CLEAR;
      const halfH = FLOW_MOVE.coinH * FLOW_MOVE.scale / 2 + COIN_CLEAR;
      const hits = (t: number): boolean => {
        const [cx, cy] = at(t);
        return words2.some((r) => cx + halfW > r.x && cx - halfW < r.x + r.w && cy + halfH > r.y && cy - halfH < r.y + r.h);
      };
      // 札が見えてよい間。文字に重なる間を抜き、短すぎて瞬くだけの間は捨てる
      const open2: [number, number][] = [];
      let from2: number | undefined;
      for (let t = t0; t <= tEnd + COIN_STEP / 2; t += COIN_STEP) {
        const tt = Math.min(t, tEnd);
        const clear = !hits(tt);
        if (clear && from2 === undefined) from2 = tt;
        if (!clear && from2 !== undefined) {
          open2.push([from2, tt - COIN_STEP]);
          from2 = undefined;
        }
      }
      if (from2 !== undefined) open2.push([from2, tEnd]);
      const spans = open2.filter(([x, y]) => y - x >= f);
      const only = spans.length === 1 ? spans[0] : undefined;
      if (only && only[0] === t0 && only[1] === tEnd) return m.vis(t0, t1 + FLOW_MOVE.linger);
      const points2: Frame[] = [
        [0, { opacity: 0 }],
        [m.total, { opacity: 0 }],
      ];
      for (const [x, y] of spans) {
        const mid = (x + y) / 2;
        points2.push([x, { opacity: 0 }], [Math.min(x + f, mid), { opacity: 1 }], [Math.max(y - f, mid), { opacity: 1 }], [y, { opacity: 0 }]);
      }
      return m.kf(points2);
    };
    for (const fl of here.filter((x) => x.fresh && x.points.length > 1)) {
      const t0 = timeOf(s, fl.event) ?? a;
      const t1 = Math.min(t0 + FLOW_MOVE.travel + FLOW_MOVE.pause, b - 0.1);
      const chip = layout.chips.find((c) => c.step === s && c.kind === "amount" && c.token === fl.token);
      const label = chip?.text ?? `${fl.amount} ${fl.token}`;
      const path2 = fl.points;
      const [sx, sy] = path2[0] as Point;
      // 札は流れの先と同じ時刻に角を通る (Tracelyth #168)
      const frames: Frame[] = [
        [0, { transform: "translate(0,0)" }],
        ...planOf(fl, t0).map(([t], i): Frame => [t, { transform: `translate(${r1((path2[i] as Point)[0] - sx)}px,${r1((path2[i] as Point)[1] - sy)}px)` }]),
      ];
      const [ex, ey] = path2[path2.length - 1] as Point;
      frames.push([m.total, { transform: `translate(${r1(ex - sx)}px,${r1(ey - sy)}px)` }]);
      const w = textWidth(label, T.chip) + FLOW_MOVE.coinPad * 2;
      const gulpBox = gulpOf(path2);
      let squeeze = "";
      if (gulpBox) {
        const dir = ex > sx ? 1 : -1;
        const half = w * FLOW_MOVE.scale / 2;
        const inX = dir > 0 ? gulpBox.x - half + 6 : gulpBox.x + gulpBox.w + half - 6;
        const outX = dir > 0 ? gulpBox.x + gulpBox.w + half - 6 : gulpBox.x - half + 6;
        const move = FLOW_MOVE.travel;
        const tIn = t0 + move / 2;
        const tOut = tIn + FLOW_MOVE.pause;
        const from0 = -dir * 12;
        const stop = ex - sx + dir * 14;
        frames.length = 0;
        frames.push([0, { transform: `translate(${r1(from0)}px,0)` }], [t0, { transform: `translate(${r1(from0)}px,0)` }, EASE.inOut], [tIn, { transform: `translate(${r1(inX - sx)}px,0)` }], [tOut, { transform: `translate(${r1(outX - sx)}px,0)` }, EASE.inOut], [Math.min(tOut + move / 2, m.total), { transform: `translate(${r1(stop)}px,${r1(ey - sy)}px)` }], [m.total, { transform: `translate(${r1(stop)}px,${r1(ey - sy)}px)` }]);
        const tEnd = Math.min(tOut + move / 2, m.total);
        squeeze = m.kf([[0, { transform: "scale(0.25)", opacity: 0 }], [t0, { transform: "scale(0.25)", opacity: 0 }], [t0 + 0.16, { transform: "scale(1)", opacity: 1 }], [tIn - 0.14, { transform: "scale(1)", opacity: 1 }], [tIn, { transform: "scale(0.25)", opacity: 0 }], [tOut, { transform: "scale(0.25)", opacity: 0 }], [tOut + 0.14, { transform: "scale(1)", opacity: 1 }], [tEnd - 0.16, { transform: "scale(1)", opacity: 1 }], [tEnd, { transform: "scale(0.25)", opacity: 0 }], [m.total, { transform: "scale(0.25)", opacity: 0 }]]);
        const ring = `<rect class="dg-pp-gulp" x="${r1(gulpBox.x - 8)}" y="${r1(gulpBox.y - 8)}" width="${r1(gulpBox.w + 16)}" height="${r1(gulpBox.h + 16)}" rx="${partRadius(ctx.corner, 16)}"/>`;
        HANDED.push({ step: s, token: fl.token, box: gulpBox.id, w: w * FLOW_MOVE.scale, from: [sx, sy], to: [ex, ey], hidden: [tIn, tOut] });
        GULPS.push(`<g class="dg-a" style="${m.kf([[0, { opacity: 0 }], [tIn - 0.1, { opacity: 0 }], [tIn + 0.05, { opacity: 1 }], [tOut, { opacity: 1 }], [tOut + 0.25, { opacity: 0 }], [m.total, { opacity: 0 }]])}">${ring}</g>`);
      }
      const h = FLOW_MOVE.coinH;
      const coin = `<g class="dg-pp-coin" style="--pp-t:var(--pp-tone${fl.tone})"><rect x="${r1(sx - w / 2)}" y="${r1(sy - h / 2)}" width="${r1(w)}" height="${h}" rx="${partRadius(ctx.corner, h / 2)}"/><text x="${r1(sx)}" y="${r1(sy + T.chip.size * 0.36)}" text-anchor="middle">${esc(label)}</text></g>`;
      const inner = `<g transform="translate(${r1(sx)} ${r1(sy)}) scale(${FLOW_MOVE.scale}) translate(${r1(-sx)} ${r1(-sy)})">${coin}</g>`;
      const shown3 = gulpBox ? m.vis(t0, t1 + FLOW_MOVE.linger) : coinShown(fl, t0, t1, w, s);
      (squeeze ? GULPS : parts).push(`<g class="dg-a" style="${shown3}"><g class="dg-a" style="${m.kf(frames)}">${squeeze ? `<g class="dg-a" style="transform-origin:${r1(sx)}px ${r1(sy)}px;${squeeze}">${inner}</g>` : inner}</g></g>`);
    }
    // トークンの箱。値の管の弁は描かない (Tracelyth #168)
    for (const p of layout.parties.filter((x) => x.shape === "token")) {
      const involved = pillOf(p.id)?.involved ?? false;
      // 帳簿型 (Tracelyth #168) の箱は囲みの張り出しが箱の形になるので、箱の枠を描かず名前だけを描く
      const bare = (layout.ledgers ?? []).some((l) => l.box === p.id);
      // 前の値と今の値を並べて見せる行を持つ段は、その段に呼ばれなくても箱を薄くしない (#3721)
      const changed = layout.plates.some((x) => x.party === p.id && x.step === s && x.boxed && x.was !== undefined);
      parts.push((bare ? "" : frame(ctx, "dg-pp-tokbg", p, P.token.radius)) + dimmed(involved || changed, tokenBox(p, involved, undefined, ctx, whole, on({ party: p.id, role: p.role }), bare)));
    }
    // 槽と水。水と数は、変わった出来事の時刻に段の始まりの値から今の値へ替わる
    for (const g of layout.glasses.filter((x) => x.step === s)) {
      const lv = layout.levels.find((l) => l.step === s && l.party === g.party && l.token === g.token);
      let inside = "";
      if (lv) {
        const attrs = on({ level: lv.party, token: lv.token, state: lv.state });
        // 流れが槽に着く時は、移す額の札が着いてから水位を替える (Tracelyth #168)
        const inbound = here.some((fl) => fl.fresh && fl.points.length > 1 && fl.to === g.party && fl.token === g.token && fl.event === lv.event);
        const at = timeOf(s, lv.event);
        const t = at === undefined ? undefined : Math.min(at + (inbound ? FLOW_MOVE.travel + FLOW_MOVE.pause - 0.05 : 0), b - 0.1);
        // 段 1 は前の段を持たないので、最初の持ち分の水位から替える (Tracelyth #131)
        const prev = s > 0 ? layout.levels.find((l) => l.step === s - 1 && l.party === g.party && l.token === g.token) : lv.before;
        inside =
          t === undefined || !prev
            ? level(lv, g, ctx, whole, attrs)
            : vanish(t, level(prev, g, ctx, until(t), "")) + appear(t, level(lv, g, ctx, since(t), attrs, lv.from ? t : undefined));
      }
      const lit = lv?.event !== undefined || layout.converters.some((c) => c.step === s && c.party === g.party && c.active);
      parts.push(dimmed(lit, tank(g, edgeOf(lv), inside, ctx, whole, on({ tank: g.party, token: g.token }))));
    }
    for (const c of layout.converters.filter((x) => x.step === s)) parts.push(dimmed(c.active, converter(c, on({ converter: c.party }))));
    // 値の札と書き込む管
    for (const w of layout.writes.filter((x) => x.step === s)) parts.push(appear(timeOf(s, w.event), writePipe(w, ctx, on({ write: w.to, name: w.name }))));
    // 2人をキーに持つ値の点線の矢印と札 (#107)
    for (const l of layout.links.filter((x) => x.step === s)) {
      const attrs = on({ link: `${l.from}>${l.to}`, name: l.name, state: l.state });
      // 値が変わった段は、差の札を持たない値 (真偽やアドレス) も線と札を濃く描く (Tracelyth #111)
      const t = l.changed ? timeOf(s, l.event) : undefined;
      const prev = s > 0 ? layout.links.find((x) => x.step === s - 1 && x.owner === l.owner && x.name === l.name) : undefined;
      const line = linkLine(l, l.changed);
      if (t === undefined || !prev) {
        parts.push(dimmed(l.changed, line + linkLabel(l, ctx, whole, attrs)));
        continue;
      }
      parts.push(line + vanish(t, linkLabel(prev, ctx, until(t), "")) + appear(t, linkLabel(l, ctx, since(t), attrs)));
    }
    /** 値の箱の下の前の値の行の頭の語 (`前`、#3721)。前の値と確定かの語と同じ行に、値の箱と同じ色で描く */
    const beforeOf = (p: PipePlate, shown: Shown[]): string =>
      p.before ? `<g style="${cs(STATE_COLOR[p.state])}">${write(ctx.ink, `dg-pp-tagw${wide(p.before.text)}`, p.before.x, p.before.base, p.before.text, T.tag, shown)}</g>` : "";
    for (const p of layout.plates.filter((x) => x.step === s)) {
      const attrs = on({ plate: p.party, name: p.name, state: p.state });
      const t = timeOf(s, p.event);
      const prev = s > 0 ? layout.plates.find((x) => x.step === s - 1 && x.party === p.party && x.name === p.name) : undefined;
      const lit = p.event !== undefined || p.boxed;
      if (t === undefined || !prev) {
        parts.push(dimmed(lit, plate(p, ctx, whole, attrs) + beforeOf(p, whole)));
        continue;
      }
      parts.push(dimmed(lit, vanish(t, plate(prev, ctx, until(t), "") + beforeOf(prev, until(t))) + appear(t, plate(p, ctx, since(t), attrs) + beforeOf(p, since(t)))));
    }
    // 計器。確かめた段は、確かめた時刻に針が振れて通ったかの印が付く。計器は薄くしない
    for (const g of layout.gauges.filter((x) => x.step === s)) {
      ctx.pieces?.push({ kind: "gauge", box: parties.get(g.party)?.name ?? g.party, rects: gaugeRects(g), shown: whole });
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
      const involved = pillOf(p.id)?.involved ?? false;
      const attrs = on({ party: p.id, role: p.role });
      parts.push(
        dimmed(
          involved,
          p.shape === "round"
            ? avatar(p, involved, ctx, whole, attrs, look, `url(#${defId(ctx, "av")})`)
            : cabinet(p, involved, pooled.has(p.id), ctx, whole, attrs, look),
        ),
      );
    }
    for (const r of layout.rings.filter((x) => x.step === s)) {
      const p = parties.get(r.party);
      const pill = pillOf(r.party);
      if (!p || !pill) continue;
      const radius = p.shape === "round" ? undefined : p.shape === "token" ? P.token.radius : P.cabinet.radius;
      const round = p.shape === "round" ? { ...pill, x: pill.x + pill.w / 2 - P.avatar.halo, y: pill.y + pill.h / 2 - P.avatar.halo, w: P.avatar.halo * 2, h: P.avatar.halo * 2 } : pill;
      parts.push(appear(timeOf(s, r.event), ring(round, on({ ring: r.party }), ctx, radius)));
    }
    // 札入れ (Tracelyth #168)。札入れへ動かした札は、段ごとに決めた札入れの中の所へずらして描く
    const offs = stackOf(s);
    const offPrev: Stack = s > 0 ? stackOf(s - 1) : { map: new Map(), cards: [] };
    const shifted = (o: { dx: number; dy: number } | undefined, markup: string): string => (o ? `<g transform="translate(${r1(o.dx)} ${r1(o.dy)})">${markup}</g>` : markup);
    for (const card of offs.cards) {
      const rect = `<rect class="dg-pp-lcard" x="${r1(card.x)}" y="${r1(card.y)}" width="${r1(card.w)}" height="${r1(card.h)}" rx="${partRadius(ctx.corner, 10)}"/>`;
      parts.push(card.until === undefined ? appear(card.t, rect) : vanish(card.until, appear(card.t, rect)));
    }
    // イベントの記録の札。札入れの中に、引数を 1 つずつの行に並べて出す (Tracelyth #107)
    for (const e of layout.events.filter((x) => x.step === s)) {
      const attrs = on({ event: `${e.party}.${e.name}`, state: e.state });
      const t = timeOf(s, e.event);
      const prev = layout.events.find((x) => x.step === s - 1 && x.id === e.id);
      if (t !== undefined && prev) parts.push(vanish(t, shifted(offPrev.map.get(prev), logCard(prev, until(t), ""))));
      if (e.tether && e.tether.length > 1) {
        const color = e.state === "none" ? "rose" : STATE_COLOR[e.state];
        parts.push(appear(t, `<path class="dg-pp-tether" style="${cs(color)}" data-pipe-tether="${e.id}" d="M ${e.tether.map((q) => `${r1(q[0])} ${r1(q[1])}`).join(" L ")}"/>`));
      }
      parts.push(appear(t, shifted(offs.map.get(e), logCard(e, since(t), attrs))));
      const o = offs.map.get(e);
      const size = logSize(e);
      const card = LOGS.get(e.id) ?? {
        party: e.party,
        title: `${size.party}.${e.name}`,
        states: [],
        rows: size.rows,
        x: e.x + (o?.dx ?? 0),
        y: e.y + (o?.dy ?? 0),
        w: size.w,
        h: size.h,
        step: s,
        ...(e.event !== undefined ? { event: e.event } : {}),
        ...(e.tether ? { tether: e.tether.map((q): Point => [q[0], q[1]]) } : {}),
      };
      const state = LOG_STATE[e.state];
      if (state && card.states[card.states.length - 1] !== state) card.states.push(state);
      LOGS.set(e.id, card);
    }
    // 図の中の札。流れた量と計器の式は変えた出来事の時刻に出す。済んだ段の流れた量は薄くする
    for (const c of layout.chips.filter((x) => x.step === s && x.kind !== "event" && x.kind !== "return")) {
      const t = timeOf(s, c.event);
      const o = offs.map.get(c);
      const drawnFrom = ctx.ink.length;
      parts.push(dimmed(c.kind !== "amount" || c.event !== undefined, appear(t, shifted(o, chipPart(c, ctx, since(t), on({ chip: c.kind, ...(c.token ? { token: c.token } : {}) }))))));
      // 札入れへ動かした札の字は、動かした先に描いた字として崩れの確かめに渡す (Tracelyth #168)
      if (o) for (const ink of ctx.ink.slice(drawnFrom)) ink.rect = { ...ink.rect, x: ink.rect.x + o.dx, y: ink.rect.y + o.dy };
    }
    // 戻り値の札。戻した時刻に呼ばれた側を出て、呼び出しの管を伝って呼んだ側へ戻る
    for (const c of layout.chips.filter((x) => x.step === s && x.kind === "return" && x.path && x.path.length > 1)) {
      const path = c.path as [number, number][];
      const t0 = timeOf(s, c.event) ?? a;
      const still = timeline.stills[s] ?? span.end;
      const t1 = Math.max(t0 + 0.2, Math.min(t0 + M.slug + M.level, still - 0.05));
      const [sx, sy] = path[0] as [number, number];
      const total = path.slice(1).reduce((sum, p, i) => sum + Math.abs(p[0] - (path[i] as [number, number])[0]) + Math.abs(p[1] - (path[i] as [number, number])[1]), 0) || 1;
      const frames: Frame[] = [
        [0, { transform: "translate(0,0)" }],
        [t0, { transform: "translate(0,0)" }],
      ];
      let walked = 0;
      path.slice(1).forEach((p, i) => {
        const q = path[i] as [number, number];
        walked += Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
        frames.push([t0 + ((t1 - t0) * walked) / total, { transform: `translate(${r1(p[0] - sx)}px,${r1(p[1] - sy)}px)` }]);
      });
      const [ex, ey] = path[path.length - 1] as [number, number];
      frames.push([m.total, { transform: `translate(${r1(ex - sx)}px,${r1(ey - sy)}px)` }]);
      // 札の字は止め絵で止まる所に記録する。描く所は動き出す所で、動きが止まる所まで運ぶ (#3523)
      const drawnFrom = ctx.ink.length;
      parts.push(
        `<g class="dg-a" style="${m.vis(t0, t1 + f)}"><g class="dg-a" data-pipe-return-chip="" data-pipe-step="${s}" data-pipe-x="${r1(sx)}" data-pipe-y="${r1(sy)}" style="${m.kf(frames)}">` +
          `${chipPart(c, ctx, [[t0, t1 + f]], "")}</g></g>`,
      );
      for (const ink of ctx.ink.slice(drawnFrom)) ink.rect = { ...ink.rect, x: ink.rect.x + ex - sx, y: ink.rect.y + ey - sy };
      // 描く方は t1+f まで濃く見せて t1+2f にかけて消すので、崩れの検査も t1+2f まで見えているとみなす (#3607)
      ctx.pieces?.push({ kind: "chip", text: c.text, rect: { x: c.x + ex - sx, y: c.y + ey - sy, w: c.w, h: c.h }, shown: [[t1, t1 + 2 * f]] });
    }
    // 畳んだ箱
    for (const fold of layout.folds.filter((x) => x.step === s)) parts.push(foldBox(fold, ctx, whole, ` data-pipe-step="${s}"`));
    out.push(`<g class="dg-a" data-pipe-frame="${s}" style="${m.vis(a, b)}">${parts.join("")}</g>`);
  });
  out.push(...GULPS);
  out.push(...TAGS);
  layout.logCards = [...LOGS.values()];
  layout.gulps = HANDED;
  const body = fadeParts(out.join(""), layout.fixed?.faded ?? []);
  return { base: `<g class="dg-pp">${body}</g>`, css: PIPE_CSS + FLOW_CSS.join("") + (layout.fixed !== undefined ? FADED_CSS : "") };
}

/** 固定した形の図で呼び出しに関わらない人の丸と槽とパイプを薄く描く (Tracelyth #165) */
const FADED_CSS = ".dg-pp-faded{opacity:.45;filter:grayscale(1)}";
const unescapeAttr = (v: string): string => v.replace(/&quot;/gu, '"').replace(/&lt;/gu, "<").replace(/&gt;/gu, ">").replace(/&amp;/gu, "&");
/** 薄く描く人 (`faded`) の部品の印 (`data-pipe-party`、`data-pipe-tank`、`data-pipe-holder`) を持つ組に、薄く描く印を足す */
function fadeParts(markup: string, faded: readonly string[]): string {
  if (faded.length === 0) return markup;
  const ids = new Set(faded);
  return markup.replace(/<g ([^>]*)>/gu, (tag, inner: string) => {
    const hit = /data-pipe-(?:party|tank|holder)="([^"]*)"/u.exec(inner);
    if (!hit || !ids.has(unescapeAttr(hit[1] ?? ""))) return tag;
    return /\bclass="/u.test(inner) ? tag.replace(/\bclass="/u, 'class="dg-pp-faded ') : `<g ${inner} class="dg-pp-faded">`;
  });
}
