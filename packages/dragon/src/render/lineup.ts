/**
 * 列の図 (#3239) を描く部品。既定の見た目はボード (#3624) で、選べる見た目に流れの線 (`[shape: stations]`、#3624) と層の見た目 (`[shape: layers]`、#3625) と階段の見た目 (`[shape: stairs]`、#3640) を持つ。
 * ボードと流れの線の見た目の元は #3624 の step 2 で本人が選んだ動く試作 (列を淡い色の縦の帯にする案と、駅をつなぐ流れの線の案)。
 *
 * 図の題と段の題と文、役の札、帯か駅と見出し (名前、札の数、上限の目盛り、順番なし、値の札)、帯の間の向きの印、受け口、帯の下の一言、「この先」の帯、凡例は下の層に、
 * 控えと跡、差し戻しの線、札と封と印と選んだ帯の印は上の層に描く。札が別の帯へ滑る時に、途中の帯の地の下へ隠れないため。
 * 札は席に居る間ごとに 1 つの部品で、座った時に滑り始める所から席へ滑るか、弾んで現れる。走る道を持つ札は道の折れ目を順に通る。
 * 席を離れる時は、同じ段で別の席へ滑るなら滑り始める時に一瞬で替わり、別の席へ滑らないなら消えていく。
 * 札の数と目盛りと値の札と受け口は段ごとに、差し戻しの線と跡と、帯を移った札の太い縁と印は、その段にだけ出る。
 * 封は斜線と錠と字で描き、帯の左から右へ伸び、覆い終えた時に帯の札を隠す。開ける時は札を出してから封を消す。値の札は封で隠さない。
 * 帯を選ぶと選んだ帯の縁に色が付いて頭に印が出て、ほかの順番のある帯を薄くする。薄くした帯は、後の段で並びを書き換えるか選ぶと濃く戻る。
 * 役の札は役が動く段にだけ光る。段の題と文、帯の下の一言、「この先」の帯は、その段にだけ出る。
 */
import { hasWide } from "../layout/measure";
import type { Point, Rect } from "../layout/scene";
import type { LineupAt, LineupLane, LineupLayout, LineupNeedle, LineupPick, LineupScale, LineupSeal, LineupSeat, LineupValue } from "../kinds/lineup/layout";
import { EASE, LOOK, MOTION, type TextStyle, TYPE } from "../look/values";
import { LINEUP_LOOK } from "../look/lineup";
import type { DiagramModel } from "../schema";
import type { Span, Timeline } from "../timeline";
import { partRadius } from "./corner";
import type { Shown } from "./ink";
import type { Frame } from "./motion";
import { cs } from "../blocks/color/draw";
import { arrowPath, boardCard, type CardType, ghostCard, headPath, lineupFrame, lines, rect, traceRow } from "../blocks/item/draw";
import { legend as legendOf } from "../blocks/legend/draw";
import { limitSlots, limitTicks } from "../blocks/limit/draw";
import { backLine, remark } from "../blocks/line/draw";
import { noOrderPill } from "../blocks/order/draw";
import { pickMark, pickRing } from "../blocks/pick/draw";
import { roleCard } from "../blocks/role/draw";
import { sealCover, sealPattern } from "../blocks/seal/draw";
import { stamp as stampOf } from "../blocks/stamp/draw";
import { type Ctx, cssFont as font, cssMix as mix, esc, r1, sansOf } from "./parts";

const S = LOOK.stroke;

/**
 * 列の図の部品の見た目 (#3239)。役の札と段の題と帯の下の一言と「この先」の帯と凡例と封と印。封は帯の左端から右へ伸びる。
 * どの値も値の表から読む。列の図の SVG にだけ書き、ほかの図の SVG と頁が最初に読む script に入れない (#3351)
 */
const LINEUP_CSS = [
  ".dg-ln-seal{transform-box:fill-box;transform-origin:0 50%}",
  `.dg-ln-sd{fill:color-mix(in srgb,var(--mute) ${LOOK.mix.sealDark}%,var(--surf))}`,
  `.dg-ln-sl{fill:color-mix(in srgb,var(--mute) ${LOOK.mix.sealLight}%,var(--surf))}`,
  `.dg-ln-sealbg{stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-lockbox{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-lock{fill:none;stroke:var(--mute);stroke-width:${S.slot};stroke-linecap:round}`,
  `.dg-ln-sw-t{${font(TYPE.sealWord)};fill:var(--mute)}`,
  `.dg-ln-stamp{fill:var(--surf);stroke:var(--c);stroke-width:${S.stamp}}`,
  `.dg-ln-st{${font(TYPE.stamp)};fill:var(--ct)}`,
  ".dg-ln-mark{fill:var(--c)}",
  `.dg-ln-mt{${font(TYPE.laneMark)};fill:var(--on-c)}`,
  `.dg-ln-role{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-lit{fill:${mix(LOOK.mix.chipTint)};stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-ln-rn{${font(TYPE.roleName)};fill:var(--ink)}`,
  `.dg-ln-rt{${font(TYPE.roleNote)};fill:var(--mute)}`,
  `.dg-ln-ft{${font(TYPE.lineupTitle)};fill:var(--mute)}`,
  `.dg-ln-hd{${font(TYPE.lineupHead)};fill:var(--ink)}`,
  `.dg-ln-say{${font(TYPE.lineupSay)};fill:var(--mute)}`,
  ".dg-ln-bar{fill:var(--c)}",
  ".dg-ln-bar0{fill:var(--mute)}",
  `.dg-ln-rk{${font(TYPE.remark)};fill:var(--ink)}`,
  `.dg-ln-al{${font(TYPE.aheadLabel)};fill:var(--mute)}`,
  `.dg-ln-tag{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-no{fill:none;stroke:var(--c);stroke-width:${S.hair}}`,
  `.dg-ln-nt{${font(TYPE.aheadNo)};fill:var(--ct)}`,
  `.dg-ln-at{${font(TYPE.aheadText)};fill:var(--ink)}`,
  `.dg-ln-aa{fill:none;stroke:var(--mute);stroke-width:${S.hair};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-ln-sw{fill:none;stroke:var(--c);stroke-width:${S.slot}}`,
  `.dg-ln-sw0{fill:none;stroke:var(--mute);stroke-width:${S.slot}}`,
  `.dg-ln-lg{${font(TYPE.legend)};fill:var(--mute)}`,
].join("");

/** ボードと流れの線の字の形 */
type BoardType = Record<keyof typeof LINEUP_LOOK.board.type, TextStyle>;

/**
 * ボードと流れの線 (#3624) の部品の見た目。帯の地と札が変わった段の縁、見出しの色の四角と名前、札の数と目盛りと順番なしと値の札、
 * 札と色の棒と番号と太い縁と印、控えの行、跡、差し戻しの線と札、帯の間の向きの印、流れの線と通った区間と駅と受け口。
 * 字の大きさは広い枠と狭い枠で違うので、並べ方の字の形 `T` から組む。どの値も値の表から読む
 */
function boardCss(T: BoardType): string {
  const B = LINEUP_LOOK.board;
  const ST = LINEUP_LOOK.stations;
  return [
    `.dg-lb-band{fill:color-mix(in srgb,var(--c) ${B.tint.base}%,var(--surf))}`,
    `.dg-lb-lit{fill:none;stroke:color-mix(in srgb,var(--c) ${B.tint.edge}%,transparent);stroke-width:${B.card.strong}}`,
    ".dg-lb-dot{fill:var(--c)}",
    `.dg-lb-name{${font(T.name)};fill:var(--ink)}`,
    `.dg-lb-count{fill:color-mix(in srgb,var(--c) ${B.count.tint}%,transparent)}`,
    `.dg-lb-ct{${font(T.count)};fill:var(--ct)}`,
    `.dg-lb-tick{fill:color-mix(in srgb,var(--c) ${B.tick.tint}%,transparent)}`,
    ".dg-lb-tickon{fill:var(--c)}",
    `.dg-lb-noorder{fill:none;stroke:var(--line);stroke-width:${S.hair}}`,
    `.dg-lb-not{${font(T.noOrder)};fill:var(--mute)}`,
    `.dg-lb-value{fill:var(--surf);stroke:var(--line);stroke-width:${S.hair}}`,
    `.dg-lb-valnew{stroke:var(--c);stroke-width:${B.value.edge}}`,
    `.dg-lb-vt{${font(T.value)};fill:var(--ink)}`,
    `.dg-lb-vtj{${font(sansOf(T.value))}}`,
    `.dg-lb-card{fill:var(--surf);stroke:var(--c);stroke-width:${B.card.edge}}`,
    `.dg-lb-faint{stroke-opacity:${B.card.faint}}`,
    `.dg-lb-strong{stroke-width:${B.card.strong}}`,
    `.dg-lb-fill{fill:color-mix(in srgb,var(--c) ${B.card.fill}%,transparent)}`,
    ".dg-lb-bar{fill:var(--c)}",
    `.dg-lb-t{${font(T.card)};fill:var(--ink)}`,
    `.dg-lb-num{${font(T.number)};fill:var(--mute)}`,
    ".dg-lb-numon{fill:var(--on-c)}",
    ".dg-lb-numbg{fill:var(--c)}",
    `.dg-lb-moved{fill:none;stroke:var(--c);stroke-width:${B.card.moved}}`,
    ".dg-lb-tag{fill:var(--c)}",
    `.dg-lb-tagt{${font(T.tag)};fill:var(--on-c)}`,
    `.dg-lb-glyph{fill:none;stroke:var(--on-c);stroke-width:${B.label.stroke};stroke-linecap:round;stroke-linejoin:round}`,
    `.dg-lb-labelt{${font(T.label)};fill:var(--on-c)}`,
    ".dg-lb-hit{fill:none}",
    `.dg-lb-trace{fill:none;stroke:var(--mute);stroke-width:${B.trace.stroke};stroke-linecap:round;stroke-linejoin:round}`,
    `.dg-lb-tracet{${font(T.trace)};fill:var(--mute)}`,
    `.dg-lb-ghost{fill:color-mix(in srgb,var(--c) ${B.ghost.fill}%,transparent);stroke:var(--c);stroke-width:${B.ghost.edge}}`,
    `.dg-lb-gt{${font({ ...T.card, weight: T.trace.weight })};fill:var(--mute)}`,
    `.dg-lb-back{fill:none;stroke:var(--c);stroke-width:${B.return.width};stroke-linecap:round;stroke-linejoin:round}`,
    `.dg-lb-chev{fill:none;stroke:var(--mute);stroke-width:${B.chevron.width};stroke-linecap:round;stroke-linejoin:round}`,
    ".dg-ls-line{fill:var(--line)}",
    `.dg-ls-run{fill:none;stroke:var(--c);stroke-width:${ST.run};stroke-linecap:round}`,
    `.dg-ls-stop{fill:var(--surf);stroke:var(--c);stroke-width:${ST.ring}}`,
    ".dg-ls-stopon{fill:var(--c)}",
    `.dg-ls-card{fill:var(--surf);stroke:var(--c);stroke-width:${ST.card.edge};stroke-opacity:${ST.card.faint}}`,
    `.dg-ls-card.dg-lb-strong{stroke-width:${ST.card.strong};stroke-opacity:1}`,
    `.dg-ls-fill{fill:color-mix(in srgb,var(--c) ${ST.card.fill}%,transparent)}`,
    `.dg-ls-fills{fill:color-mix(in srgb,var(--c) ${ST.card.strongFill}%,transparent)}`,
    `.dg-ls-slot{fill:color-mix(in srgb,var(--c) ${ST.slot.fill}%,transparent);stroke:var(--c);stroke-opacity:${ST.slot.opacity};stroke-width:${ST.slot.edge}}`,
  ].join("");
}

const Y = LINEUP_LOOK.layers;
const LT = Y.type;

/**
 * 層の見た目 (#3625) の部品の見た目。帯の地と縁、札が通った帯と札の居る帯の地、左の色の棒、層の名前と説明、層の番号の丸、帯の印、札。
 * どの値も値の表から読む。層の見た目の SVG にだけ書き、ほかの列の図の SVG に入れない
 */
const LAYERS_CSS = [
  `.dg-ly-band{fill:color-mix(in srgb,var(--c) ${Y.tint.base}%,transparent);stroke:color-mix(in srgb,var(--c) ${Y.tint.edge}%,transparent);stroke-width:${S.mark}}`,
  `.dg-ly-lit{fill:color-mix(in srgb,var(--c) ${Y.tint.lit - Y.tint.base}%,transparent)}`,
  `.dg-ly-now{fill:color-mix(in srgb,var(--c) ${Y.tint.now - Y.tint.lit}%,transparent);stroke:var(--c);stroke-width:${Y.nowEdge}}`,
  ".dg-ly-bar{fill:var(--c)}",
  `.dg-ly-name{${font(LT.name)};fill:var(--ink)}`,
  `.dg-ly-desc{${font(LT.desc)};fill:var(--mute)}`,
  `.dg-ly-no{fill:var(--surf);stroke:var(--c);stroke-width:${S.badgeRing}}`,
  `.dg-ly-non{fill:${mix(Y.tint.now)};stroke:var(--c);stroke-width:${Y.nowEdge}}`,
  `.dg-ly-nt{${font(LT.no)};fill:var(--ct)}`,
  `.dg-ly-stamp{fill:var(--surf);stroke:var(--c);stroke-width:${S.badgeRing}}`,
  `.dg-ly-st{${font(LT.stamp)};fill:var(--ct)}`,
  `.dg-ly-card{fill:var(--surf);stroke:var(--c);stroke-width:${Y.cardEdge}}`,
  `.dg-ly-cap{${font(LT.caption)};fill:var(--mute)}`,
  `.dg-ly-ct{${font(LT.card)};fill:var(--ink)}`,
  `.dg-ly-ctj{${font(sansOf(LT.card))}}`,
].join("");

/**
 * 帯の左の色の棒。帯の角の丸みの内側に収め、棒の右の端は丸みの弧と交わる所から始める。角を落とさない色味 (丸みが棒の幅以下) は四角で描く
 */
function barOf(bar: Rect, radius: number): string {
  if (radius <= bar.w) return rect("dg-ly-bar", bar, 0);
  const { x, y, w, h } = bar;
  const r = Math.min(radius, h / 2);
  const inset = r - Math.sqrt(r * r - (r - w) * (r - w));
  return `<path class="dg-ly-bar" d="M${r1(x + w)} ${r1(y + inset)}A${r1(r)} ${r1(r)} 0 0 0 ${r1(x)} ${r1(y + r)}L${r1(x)} ${r1(y + h - r)}A${r1(r)} ${r1(r)} 0 0 0 ${r1(x + w)} ${r1(y + h - inset)}Z"/>`;
}

/**
 * 層の見た目の帯と印と札 (#3625)。帯は札が初めて着いた時から地を濃くし、札が居る間は縁に色を付けて番号の丸を塗る。
 * 印は note を書いた段で、その層に札が着いてから現れ、同じ層の次の note まで残る。札は列の図のチップと同じ動きで、前の層の席から滑って下りる
 */
function drawLayers(
  layout: LineupLayout,
  diagram: DiagramModel,
  timeline: Timeline,
  parts: {
    timeOf: (at: LineupAt) => { start: number; drawn: number };
    chipKf: (c: LineupSeat) => string;
    leaving: (c: LineupSeat) => { at: number; moved: boolean } | undefined;
    during: (ranges: Shown[]) => string;
  },
  ctx: Ctx,
): { lanes: string; chips: string } {
  const { m } = ctx;
  const { timeOf, chipKf, leaving, during } = parts;
  const items = new Map((diagram.lineup?.items ?? []).map((item) => [item.id, item]));
  const arrived = (c: LineupSeat): number => timeOf(c).start + MOTION.lineup.slide;
  /** 札が層 `lane` の帯に居る間。滑り終えてから離れるまで */
  const staysOn = (lane: string): Shown[] => layout.chips.filter((c) => c.lane === lane).map((c) => [arrived(c), leaving(c)?.at ?? m.last]);
  /** 印が現れる時刻。note の時刻か、同じ段にその層へ札が着く時刻の遅い方 */
  const noteAt = (at: LineupAt & { lane: string }): number =>
    Math.max(
      timeline.events.find((t) => t.step === at.step && t.event === at.event)?.at ?? 0,
      ...layout.chips.filter((c) => c.lane === at.lane && c.step === at.step).map(arrived),
    );
  const bands = layout.lanes
    .map((lane) => {
      const band = (layout.bands ?? []).find((b) => b.lane === lane.id);
      if (!band) return "";
      const stays = staysOn(lane.id);
      const radius = partRadius(ctx.corner, Y.radius);
      const first = stays.length === 0 ? undefined : Math.min(...stays.map(([a]) => a));
      const lit = first === undefined ? "" : rect("dg-ly-lit dg-a", lane, radius, ` style="${during([[first, m.last]])}"`);
      const now = stays.length === 0 ? "" : rect("dg-ly-now dg-a", lane, radius, ` style="${during(stays)}"`);
      const bar = barOf(band.bar, radius);
      const { cx, cy, r } = band.no;
      const circle = (cls: string, extra = ""): string => `<circle class="${cls}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r}"${extra}/>`;
      const no = `${circle("dg-ly-no")}${stays.length === 0 ? "" : circle("dg-ly-non dg-a", ` style="${during(stays)}"`)}${lines(ctx, "dg-ly-nt", band.no.number, LT.no)}`;
      const texts = `${lines(ctx, "dg-ly-name", band.name, LT.name)}${band.desc ? lines(ctx, "dg-ly-desc", band.desc, LT.desc) : ""}`;
      return `<g data-lineup-layer="${esc(lane.id)}" style="${cs(lane.color)}">${rect("dg-ly-band", lane, radius)}${lit}${now}${bar}${texts}${no}</g>`;
    })
    .join("");
  const notes = (layout.bandNotes ?? [])
    .map((note) => {
      const lane = layout.lanes.find((l) => l.id === note.lane);
      const start = noteAt(note);
      const end = note.until ? noteAt({ ...note.until, lane: note.lane }) : undefined;
      const frames: Frame[] = [
        [0, { opacity: 0 }],
        [start, { opacity: 0 }, EASE.out],
        [start + MOTION.popFade, { opacity: 1 }],
        ...(end === undefined
          ? ([
              [m.last, { opacity: 1 }, EASE.inOut],
              [m.total, { opacity: 0 }],
            ] as Frame[])
          : ([
              [end, { opacity: 1 }],
              [end + MOTION.lineup.cut, { opacity: 0 }],
              [m.total, { opacity: 0 }],
            ] as Frame[])),
      ];
      const shown: Shown[] = [[start + MOTION.popFade, end ?? Number.POSITIVE_INFINITY]];
      const body = `${rect("dg-ly-stamp", note, partRadius(ctx.corner, Y.stamp / 2))}${lines(ctx, "dg-ly-st", note.text, LT.stamp, shown)}`;
      return `<g class="dg-a" data-lineup-band-note="${esc(note.lane)}" style="${cs(lane?.color ?? "slate")};${m.kf(frames)}">${body}</g>`;
    })
    .join("");
  const cards = layout.chips
    .map((c) => {
      const shown: Shown[] = [[arrived(c), leaving(c)?.at ?? Number.POSITIVE_INFINITY]];
      const frame = rect("dg-ly-card", c, partRadius(ctx.corner, Y.cardRadius));
      const caption = c.caption ? lines(ctx, "dg-ly-cap", c.caption, LT.caption, shown) : "";
      const text = lines(ctx, "dg-ly-ct", c.label, LT.card, shown, "dg-ly-ctj");
      return `<g class="dg-popc dg-a" data-lineup-card="${esc(c.id)}" data-lineup-on="${esc(c.lane)}" style="${cs(items.get(c.id)?.color ?? "slate")};${chipKf(c)}">${frame}${caption}${text}</g>`;
    })
    .join("");
  return { lanes: `${bands}${notes}`, chips: cards };
}

const SR = LINEUP_LOOK.stairs;

/**
 * 階段の見た目 (#3640) の経った時間の目盛りと針の見た目。目盛りの線と印と数字、針の三角、経った時間の札。どの値も値の表から読み、階段の見た目の SVG にだけ書く
 */
const STAIRS_CSS = [
  ".dg-sr-line{fill:var(--line)}",
  `.dg-sr-mark{fill:none;stroke:var(--line);stroke-width:${S.mark};stroke-linecap:round}`,
  `.dg-sr-tick{${font(SR.type.tick)};fill:var(--mute)}`,
  ".dg-sr-needle{fill:var(--ink)}",
  `.dg-sr-chip{fill:var(--surf);stroke:var(--ink);stroke-width:${S.badgeRing}}`,
  `.dg-sr-t{${font(SR.type.elapsed)};fill:var(--ink)}`,
].join("");

/**
 * 経った時間の目盛りと針と札 (#3640)。針は段ごとに、札が層へ下りるのと同じ時刻に前の所から次の所へ滑り、札を下ろさない段は留まる。
 * 経った時間の札は、針が着いてから次に針が動くまで見せる。同じ字と所が続く段は 1 枚の札にまとめる
 */
function drawStairs(
  scale: LineupScale,
  needles: LineupNeedle[],
  parts: { timeOf: (at: LineupAt) => { start: number; drawn: number }; during: (ranges: Shown[]) => string },
  ctx: Ctx,
): string {
  const { m } = ctx;
  const { timeOf, during } = parts;
  const ticks = scale.ticks
    .map(({ mark: [a, b], label }) => `<g data-stairs-tick="">${`<path class="dg-sr-mark" d="M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}"/>`}${lines(ctx, "dg-sr-tick", label, SR.type.tick)}</g>`)
    .join("");
  const axis = `<g data-stairs-scale="${scale.axis}">${rect("dg-sr-line", scale.line, 0)}${ticks}</g>`;
  // 針が着く時刻。札を下ろした出来事の時刻に滑り始め、札と同じ長さで着く。最初の段で札を下ろさない針は初めから在る
  const arriveAt = (n: LineupNeedle): number => (n.move ? timeOf(n.move).start + MOTION.lineup.slide : 0);
  const groups: { first: LineupNeedle; start: number }[] = [];
  for (const n of needles) {
    const last = groups.at(-1);
    if (last && last.first.text === n.text && Math.abs(last.first.at - n.at) < 0.01) continue;
    groups.push({ first: n, start: arriveAt(n) });
  }
  const first = groups[0]?.first;
  if (!first) return axis;
  const offset = (n: LineupNeedle): Frame[1] => {
    const d = n.at - first.at;
    return { transform: scale.axis === "vertical" ? `translateY(${r1(d)}px)` : `translateX(${r1(d)}px)` };
  };
  const frames: Frame[] = [[0, offset(first)]];
  groups.slice(1).forEach((g, k) => {
    const before = groups[k]?.first ?? first;
    frames.push([g.start - MOTION.lineup.slide, offset(before), EASE.inOut], [g.start, offset(g.first)]);
  });
  const end = groups.at(-1)?.first ?? first;
  frames.push([m.last, offset(end), EASE.inOut], [m.total, offset(first)]);
  const [tip, a, b] = first.tip;
  const needle = `<g data-stairs-needle="" class="dg-a" style="${m.kf(frames)}"><path class="dg-sr-needle" d="M${r1(tip[0])} ${r1(tip[1])}L${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}Z"/></g>`;
  const chips = groups
    .map((g, k) => {
      const until = groups[k + 1]?.start ?? m.last;
      const shown: Shown[] = [[g.start + MOTION.fade, until]];
      const body = `${rect("dg-sr-chip", g.first.chip, partRadius(ctx.corner, SR.chipRadius))}${lines(ctx, "dg-sr-t", g.first.label, SR.type.elapsed, shown)}`;
      return `<g class="dg-a" data-stairs-elapsed="${g.first.step}" style="${during([[g.start, until]])}">${body}</g>`;
    })
    .join("");
  return `${axis}${needle}${chips}`;
}

/** 席から `(dx, dy)` ずらして大きさを `scale` 倍にした時の `transform` */
const place = (dx: number, dy: number, scale = 1): string =>
  `translate(${r1(dx)}px,${r1(dy)}px) scale(${scale})`;

/** `span` から `holes` の間を抜いた間 */
const without = (span: Shown, holes: Shown[]): Shown[] =>
  holes.reduce<Shown[]>(
    (rest, [x, y]) =>
      rest.flatMap(([a, b]): Shown[] =>
        y <= a || x >= b
          ? [[a, b]]
          : [...(a < x ? ([[a, x]] as Shown[]) : []), ...(y < b ? ([[y, b]] as Shown[]) : [])],
      ),
    [span],
  );

/** 同じ見た目の段ごとの部品を 1 つにまとめる。`keyOf` が同じ部品は、その段の並びの間ずっと見せる */
function groupBySteps<T extends { step: number }>(list: T[], keyOf: (t: T) => string): { first: T; steps: number[] }[] {
  const groups = new Map<string, { first: T; steps: number[] }>();
  for (const item of list) {
    const key = keyOf(item);
    const group = groups.get(key) ?? { first: item, steps: [] };
    group.steps.push(item.step);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function drawLineup(
  layout: LineupLayout,
  diagram: DiagramModel,
  timeline: Timeline,
  ctx: Ctx,
): { heading: string; lanes: string; chips: string; css: string } {
  const { m } = ctx;
  const N = LINEUP_LOOK;
  const B = N.board;
  const ST = N.stations;
  const cut = MOTION.lineup.cut;
  const timeOf = (at: LineupAt): { start: number; drawn: number } =>
    timeline.edges.find((t) => t.step === at.step && t.event === at.event) ?? {
      start: 0,
      drawn: 0,
    };
  const spanOf = (s: number): Span => timeline.steps[s] as Span;
  const items = new Map((diagram.lineup?.items ?? []).map((item) => [item.id, item]));
  const pools = new Set(layout.lanes.filter((lane) => lane.pool).map((lane) => lane.id));

  // 帯ごとの、薄くなるか濃く戻る時刻。帯を選ぶ時にほかの帯を薄くし、並びを書き換えるか選ぶ時に濃く戻す
  const turns = new Map<string, [number, boolean][]>(layout.lanes.map((lane) => [lane.id, []]));
  const faint = new Set<string>();
  const turn = (id: string, at: number, to: boolean): void => {
    if (faint.has(id) === to) return;
    if (to) faint.add(id);
    else faint.delete(id);
    turns.get(id)?.push([at, to]);
  };
  for (const time of [...timeline.edges].sort((a, b) => a.start - b.start)) {
    const e = diagram.steps[time.step]?.events[time.event];
    if (e?.type === "line" && "box" in e) turn(e.box, time.start, false);
    if (e?.type === "pick")
      for (const lane of layout.lanes) if (!lane.pool) turn(lane.id, time.start, lane.id !== e.box);
  }
  /** 帯の濃さの動き。薄くならない帯は `undefined` */
  const fadeOf = (id: string): string | undefined => {
    const list = turns.get(id) ?? [];
    if (list.length === 0) return undefined;
    const frames: Frame[] = [[0, { opacity: 1 }]];
    let now: number = 1;
    for (const [t, to] of list) {
      const next = to ? N.faint : 1;
      frames.push([t, { opacity: now }, EASE.inOut], [t + MOTION.fade, { opacity: next }]);
      now = next;
    }
    frames.push([m.last, { opacity: now }, EASE.inOut], [m.total, { opacity: 1 }]);
    return m.kf(frames);
  };

  /** 時刻の範囲 `[[a, b], ...]` の間だけ見える動き */
  const during = (ranges: Shown[]): string => {
    const frames: Frame[] = [[0, { opacity: 0 }]];
    for (const [a, b] of ranges)
      frames.push(
        [a, { opacity: 0 }, EASE.out],
        [a + MOTION.fade, { opacity: 1 }],
        [b, { opacity: 1 }, EASE.inOut],
        [Math.min(b + MOTION.fade, m.total), { opacity: 0 }],
      );
    frames.push([m.total, { opacity: 0 }]);
    return m.kf(frames);
  };
  /** 段の並び `steps` を、続いた段は 1 つにまとめた時刻の範囲 */
  const rangesOf = (steps: number[]): Shown[] => {
    const out: Shown[] = [];
    for (const s of [...steps].sort((a, b) => a - b)) {
      const span = spanOf(s);
      const last = out.at(-1);
      if (last && steps.includes(s - 1)) last[1] = span.end;
      else out.push([span.start, span.end]);
    }
    return out;
  };

  /** 封が帯を隠す間。覆い終えてから開けるまで */
  const closedOf = (seal: LineupSeal): Shown => [
    timeOf(seal).drawn,
    seal.until ? timeOf(seal.until).start : Number.POSITIVE_INFINITY,
  ];

  /** 帯の札を隠す動き。封の無い帯は `undefined` */
  const hideOf = (seals: LineupSeal[]): string | undefined => {
    if (seals.length === 0) return undefined;
    const frames: Frame[] = [[0, { opacity: 1 }]];
    for (const seal of seals) {
      const [a, b] = closedOf(seal);
      frames.push([a, { opacity: 1 }], [a + cut, { opacity: 0 }]);
      if (seal.until) frames.push([b, { opacity: 0 }], [b + cut, { opacity: 1 }]);
    }
    frames.push(
      [m.total - cut, { opacity: seals.at(-1)?.until ? 1 : 0 }],
      [m.total, { opacity: 1 }],
    );
    return m.kf(frames);
  };

  const sealKf = (seal: LineupSeal): string => {
    const { start, drawn } = timeOf(seal);
    const none = { opacity: 0, transform: "scaleX(0)" };
    const end: Frame[] = seal.until
      ? [
          [timeOf(seal.until).start, { opacity: 1 }, EASE.inOut],
          [timeOf(seal.until).start + MOTION.fade, { opacity: 0 }],
          [m.total, { opacity: 0 }],
        ]
      : [
          [m.last, { opacity: 1 }, EASE.inOut],
          [m.total, { opacity: 0 }],
        ];
    return m.kf([
      [0, none],
      [start - cut, none],
      [start, { opacity: 1, transform: "scaleX(0)" }, EASE.inOut],
      [drawn, { transform: "scaleX(1)" }],
      ...end,
    ]);
  };

  /**
   * 札が席を離れる時刻と、別の席へ滑って離れるか。席を離れる段の中で、この席から滑り始める札が在れば、滑り始める時に一瞬で替わる。
   * 帯の並びを書き換える出来事と、別の帯へ滑る出来事の順は問わない。どちらが先でも、同じ札が 2 枚見える間と、1 枚も見えない間を作らない
   */
  const leaving = (c: LineupSeat): { at: number; moved: boolean } | undefined => {
    if (!c.until) return undefined;
    const until = c.until;
    const next = layout.chips.find(
      (n) =>
        n !== c &&
        n.id === c.id &&
        n.step === until.step &&
        n.from?.[0] === c.x &&
        n.from?.[1] === c.y,
    );
    return next
      ? { at: timeOf(next).start, moved: true }
      : { at: timeOf(until).start, moved: false };
  };

  /**
   * 札が席へ現れて離れる動き。滑り始める所を持つ札は滑り、走る道を持つ札は道の折れ目を順に通り、どちらも持たない札は弾んで現れる。
   * `pop` を倒すと弾まずに濃くなって現れる (控えの行)
   */
  const chipKf = (c: LineupSeat, pop = true): string => {
    const a = timeOf(c).start;
    const rest = place(0, 0);
    const frames: Frame[] = [];
    const path = c.path;
    if (path && path.length > 1) {
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      const offs = path.map(([x, y]) => place(x - cx, y - cy));
      const lens = path.slice(1).map((p, k) => Math.hypot(p[0] - (path[k] as Point)[0], p[1] - (path[k] as Point)[1]));
      const total = lens.reduce((sum, l) => sum + l, 0) || 1;
      frames.push([0, { opacity: 0, transform: offs[0] as string }], [a - cut, { opacity: 0, transform: offs[0] as string }], [a, { opacity: 1, transform: offs[0] as string }]);
      let run = 0;
      lens.forEach((l, k) => {
        run += l;
        frames.push([a + MOTION.lineup.slide * (run / total), { transform: offs[k + 1] as string }]);
      });
    } else if (c.from) {
      const off = place(c.from[0] - c.x, c.from[1] - c.y);
      frames.push(
        [0, { opacity: 0, transform: off }],
        [a - cut, { opacity: 0, transform: off }],
        [a, { opacity: 1, transform: off }, EASE.inOut],
        [a + MOTION.lineup.slide, { transform: rest }],
      );
    } else if (pop) {
      const off = place(0, 0, LOOK.popFrom);
      frames.push(
        [0, { opacity: 0, transform: off }],
        [a, { opacity: 0, transform: off }, EASE.pop],
        [a + MOTION.popFade, { opacity: 1, transform: rest }],
      );
    } else {
      frames.push([0, { opacity: 0 }], [a, { opacity: 0 }, EASE.out], [a + MOTION.fade, { opacity: 1 }]);
    }
    const leaves = leaving(c);
    if (leaves) {
      frames.push(
        [leaves.at, { opacity: 1 }, EASE.inOut],
        [leaves.at + (leaves.moved ? cut : MOTION.fade), { opacity: 0 }],
        [m.total, { opacity: 0 }],
      );
    } else {
      frames.push([m.last, { opacity: 1 }, EASE.inOut], [m.total, { opacity: 0 }]);
    }
    return m.kf(frames);
  };

  /** 図の題と、段ごとの題と文。段の題と文はその段にだけ出る */
  const headingOf = (): string => {
    const heading = lines(ctx, "dg-ln-ft", layout.heading, TYPE.lineupTitle);
    const headlines = layout.headlines
      .map((h) => {
        const span = spanOf(h.step);
        const shown: Shown[] = [[span.start, span.end]];
        return `<g class="dg-a" data-lineup-headline="${h.step}" style="${m.vis(span.start, span.end)}">${lines(ctx, "dg-ln-hd", h.title, TYPE.lineupHead, shown)}${h.say ? lines(ctx, "dg-ln-say", h.say, TYPE.lineupSay, shown) : ""}</g>`;
      })
      .join("");
    return `${heading}${headlines}`;
  };

  // 層の見た目 (#3625) と階段の見た目 (#3640) は帯と印と札を別の部品で描く。見た目の規則もその見た目の SVG にだけ書く
  if (layout.arrangement === "layers" || layout.arrangement === "stairs") {
    // 動きの名前は描いた順に付くので、題を帯より先に描く
    const heading = headingOf();
    const drawn = drawLayers(layout, diagram, timeline, { timeOf, chipKf, leaving, during }, ctx);
    const scale = layout.scale ? drawStairs(layout.scale, layout.needles ?? [], { timeOf, during }, ctx) : "";
    return { heading, lanes: `${drawn.lanes}${scale}`, chips: drawn.chips, css: `${LINEUP_CSS}${LAYERS_CSS}${layout.scale ? STAIRS_CSS : ""}` };
  }

  const stations = layout.shape === "stations";
  const narrow = layout.arrangement === "stack";
  const T: BoardType = narrow ? { ...B.type, ...B.narrowType } : B.type;
  const type: CardType = { card: T.card, number: T.number, tag: T.tag, trace: T.trace };
  const boardGeo = narrow ? B.narrow.card : B.card;
  const stationGeo = narrow ? ST.narrowCard : ST.card;
  const numX = stations ? stationGeo.numX : boardGeo.numX;
  const numR = stations ? stationGeo.numR : boardGeo.numR;
  const bar = stations ? undefined : { x: boardGeo.barX, y: boardGeo.barY, w: boardGeo.bar };
  const laneById = new Map(layout.lanes.map((lane) => [lane.id, lane]));
  const faded = new Map(layout.lanes.map((lane) => [lane.id, fadeOf(lane.id)]));

  /** 選んだ帯の縁の色が見える間。次に別の帯を選ぶまで */
  const pickSpan = (pick: LineupPick): [number, number] => {
    const next = layout.picks[layout.picks.indexOf(pick) + 1];
    return [timeOf(pick).start, next ? timeOf(next).start : m.last];
  };

  /** 帯の札が変わった段。札が着いた段か離れた段か、跡を置いた段で、段 1 は数えない */
  const changedSteps = (id: string): number[] =>
    [...new Set([...layout.chips.filter((c) => c.lane === id).flatMap((c) => [c.step, ...(c.until ? [c.until.step] : [])]), ...layout.ghosts.filter((g) => g.lane === id).map((g) => g.step)])].filter((s) => s > 0);

  /** 帯の札の数の札。同じ字の段は 1 つの部品にまとめる */
  const countsOf = (lane: LineupLane): string =>
    groupBySteps(
      layout.counts.filter((c) => c.lane === lane.id),
      (c) => `${c.text.text}|${c.x}`,
    )
      .map(({ first, steps }) => {
        const ranges = rangesOf(steps);
        return `<g class="dg-a" data-lineup-count="${esc(lane.id)}" style="${during(ranges)}">${rect("dg-lb-count", first, partRadius(ctx.corner, B.count.radius))}${lines(ctx, "dg-lb-ct", first.text, T.count, ranges)}</g>`;
      })
      .join("");
  /** 段 `s` の帯の札の数 */
  const countAt = (id: string, s: number): number => layout.counts.find((c) => c.lane === id && c.step === s)?.n ?? 0;
  const steps = diagram.steps.map((_, s) => s);
  /** 段の札の数が `test` に合う段だけ見える動き。どの段も合わなければ `undefined` */
  const whenCount = (id: string, test: (n: number) => boolean): string | undefined => {
    const on = steps.filter((s) => test(countAt(id, s)));
    return on.length === 0 ? undefined : during(rangesOf(on));
  };

  /** 帯の値の札。同じ値で、変わった段と残る段で 1 つずつにまとめ、まとめて `data-lineup-note` に入れる */
  const valuesOf = (lane: LineupLane): string => {
    const mine = layout.values.filter((v) => v.lane === lane.id);
    if (mine.length === 0) return "";
    const chips = groupBySteps(mine, (v: LineupValue) => `${v.text.text}|${v.changed}`)
      .map(({ first, steps: on }) => {
        const ranges = rangesOf(on);
        const wide = hasWide(first.text.text);
        const text = lines(ctx, wide ? "dg-lb-vt dg-lb-vtj" : "dg-lb-vt", first.text, wide ? sansOf(T.value) : T.value, ranges);
        return `<g class="dg-a" data-lineup-value="${esc(lane.id)}"${first.changed ? ' data-lineup-value-new=""' : ""} style="${during(ranges)}">${rect(first.changed ? "dg-lb-value dg-lb-valnew" : "dg-lb-value", first, partRadius(ctx.corner, B.value.radius))}${text}</g>`;
      })
      .join("");
    return `<g data-lineup-note="${esc(lane.id)}">${chips}</g>`;
  };

  /** 帯の名前と、その左の色の四角 */
  const nameOf = (lane: LineupLane): string => {
    const first = lane.title.lines[0];
    const mid = (first?.baseline ?? lane.title.y) - T.name.size * 0.35;
    const dot = stations ? "" : rect("dg-lb-dot", { x: lane.x + B.dotX, y: mid - B.dot / 2, w: B.dot, h: B.dot }, partRadius(ctx.corner, B.dotRadius));
    return `${dot}${lines(ctx, "dg-lb-name", lane.title, T.name)}`;
  };

  /** ボードの帯。地と札が変わった段の縁と、見出しと目盛りと順番なしと値の札 */
  const bandOf = (lane: LineupLane): string => {
    const radius = partRadius(ctx.corner, B.radius);
    const frame = lineupFrame(ctx.corner, "dg-lb-band", lane, radius, ' data-lineup-frame=""');
    const lit = changedSteps(lane.id);
    const edge = lit.length === 0 ? "" : lineupFrame(ctx.corner, "dg-a dg-lb-lit", lane, radius, ` style="${during(rangesOf(lit))}"`);
    // 縁の光は選ぶブロックが描く (#3348)
    const rings = layout.picks
      .filter((pick) => pick.lane === lane.id)
      .map((pick) => pickRing(lane, m.vis(...pickSpan(pick)), ctx))
      .join("");
    const ticks = limitTicks(lane, layout.ticks.filter((t) => t.lane === lane.id), (k) => whenCount(lane.id, (count) => count > k), ctx);
    const fade = faded.get(lane.id);
    return (
      `<g${fade ? ' class="dg-a"' : ""} data-lineup-lane="${esc(lane.id)}"${lane.pool ? ' data-lineup-pool=""' : ""} style="${cs(lane.color)}${fade ? `;${fade}` : ""}">` +
      `${frame}${edge}${rings}${nameOf(lane)}${countsOf(lane)}${ticks}${noOrderPill(lane, T.noOrder, ctx)}${valuesOf(lane)}</g>`
    );
  };

  /** 流れの線の駅。丸と、札が変わった段に塗る中と、名前と札の数と順番なしと値の札と受け口 */
  const stopOf = (lane: LineupLane): string => {
    const stop = layout.stations?.stops.find((s) => s.lane === lane.id);
    if (!stop) return "";
    const lit = changedSteps(lane.id);
    const circle = (cls: string, extra = ""): string => `<circle class="${cls}" cx="${r1(stop.cx)}" cy="${r1(stop.cy)}" r="${r1(stop.r)}"${extra}/>`;
    const station = `<g data-lineup-station="${esc(lane.id)}" style="${cs(lane.color)}">${circle("dg-ls-stop")}${lit.length === 0 ? "" : circle("dg-a dg-ls-stopon", ` style="${during(rangesOf(lit))}"`)}</g>`;
    const slots = limitSlots(lane, (k) => whenCount(lane.id, (count) => count <= k));
    return `<g data-lineup-lane="${esc(lane.id)}" style="${cs(lane.color)}">${slots}${station}${nameOf(lane)}${countsOf(lane)}${noOrderPill(lane, T.noOrder, ctx)}${valuesOf(lane)}</g>`;
  };

  /** 流れの線と、終わりで向きを示す三角を 1 つの面として塗る。線の色は半透明なので、線と三角を重ねると重なりが濃く出るため */
  const lineOf = (): string => {
    const line = layout.stations?.line;
    if (!line) return "";
    const hw = ST.line / 2;
    const half = ST.headHalf;
    let d: string;
    if (line.w >= line.h) {
      const y = line.y + hw;
      const tip = line.x + line.w;
      const base = tip - ST.head;
      d = `M${r1(line.x)} ${r1(y + hw)}A${r1(hw)} ${r1(hw)} 0 0 1 ${r1(line.x)} ${r1(y - hw)}H${r1(base)}V${r1(y - half)}L${r1(tip)} ${r1(y)}L${r1(base)} ${r1(y + half)}V${r1(y + hw)}Z`;
    } else {
      const x = line.x + hw;
      const tip = line.y + line.h;
      const base = tip - ST.head;
      d = `M${r1(x - hw)} ${r1(line.y + hw)}A${r1(hw)} ${r1(hw)} 0 0 1 ${r1(x + hw)} ${r1(line.y + hw)}V${r1(base)}H${r1(x + half)}L${r1(x)} ${r1(tip)}L${r1(x - half)} ${r1(base)}H${r1(x - hw)}Z`;
    }
    return `<path class="dg-ls-line" data-lineup-line="" d="${d}"/>`;
  };

  /** 流れの線の、段で札が後ろの駅へ移った区間。移った先の駅の色で、その段にだけ描く */
  const runsOf = (): string =>
    (layout.stations?.runs ?? [])
      .map((r) => {
        const [a, b] = r.points as [Point, Point];
        const to = laneById.get(r.to);
        return `<path class="dg-a dg-ls-run" data-lineup-run="" d="M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}" style="${cs(to?.color ?? "slate")};${during([[timeOf(r).start, spanOf(r.step).end]])}"/>`;
      })
      .join("");

  const lanes = stations ? `${lineOf()}${runsOf()}${layout.lanes.map(stopOf).join("")}` : layout.lanes.map(bandOf).join("");

  // 役の札。役が動く段にだけ縁と地に色を付ける。札は役のブロックが描く (#3348)
  const roles = layout.roles.map((role) => roleCard(role, role.steps.length === 0 ? undefined : during(rangesOf(role.steps)), ctx)).join("");

  // 図の題と、段ごとの題と文。動きの表は書いた順に名前を振るので、今までどおりこの位置で描き、層の見た目を書かない図の SVG を変えない
  const headed = headingOf();

  // ボードの帯の間の向きの印
  const arrows = layout.arrows.map((a) => `<path class="dg-lb-chev" data-lineup-arrow="" d="${headPath(a.points[0] as Point, a.points.at(-1) as Point, B.chevron.len, B.chevron.half)}"/>`).join("");

  // 帯の下の一言。帯と段ごとに 1 つの部品にまとめ、line を書いた段にだけ見せる
  const remarkGroups = new Map<string, typeof layout.remarks>();
  for (const r of layout.remarks) {
    const key = `${r.lane}|${r.step}`;
    remarkGroups.set(key, [...(remarkGroups.get(key) ?? []), r]);
  }
  const remarks = [...remarkGroups.values()]
    .map((group) => {
      const first = group[0] as (typeof layout.remarks)[number];
      const span = spanOf(first.step);
      const from = Math.max(...group.map((r) => timeOf(r).drawn));
      const shown: Shown[] = [[from, span.end]];
      const body = group.map((r) => remark(r, shown, ctx)).join("");
      return `<g class="dg-a" data-lineup-remark="${esc(first.lane)}" style="${m.vis(from, span.end)}">${body}</g>`;
    })
    .join("");

  // 「この先」の帯。後の段の題を番号の箱と枠で囲み、矢印で結ぶ
  const aheads = layout.aheads
    .map((a) => {
      const span = spanOf(a.step);
      const shown: Shown[] = [[span.start, span.end]];
      const tags = a.tags
        .map(
          (tag) =>
            `<g data-lineup-ahead-tag="${tag.step}">${rect("dg-ln-tag", tag, partRadius(ctx.corner, N.chip.radius))}<g style="${cs(N.role.color)}">${rect("dg-ln-no", tag.no, partRadius(ctx.corner, N.chip.radius))}${lines(ctx, "dg-ln-nt", tag.number, TYPE.aheadNo, shown)}</g>` +
            `${lines(ctx, "dg-ln-at", tag.text, TYPE.aheadText, shown)}</g>`,
        )
        .join("");
      const links = a.arrows
        .map(
          (points) =>
            `<path class="dg-ln-aa" data-lineup-ahead-arrow="" d="${arrowPath(points, N.arrow.head)}"/>`,
        )
        .join("");
      return `<g class="dg-a" data-lineup-ahead="${a.step}" style="${m.vis(span.start, span.end)}"><g data-lineup-ahead-label="">${lines(ctx, "dg-ln-al", a.label, TYPE.aheadLabel, shown)}</g>${tags}${links}</g>`;
    })
    .join("");

  // 凡例。説明ごとに色の枠の見本を左に置く。凡例のブロックが描く (#3348)
  const legend = legendOf(layout.legend, ctx);

  const pattern = sealPattern(ctx);

  /** 札 1 枚か控えの行 1 つ。字は封が帯を隠す間 `closed` を除いて書く */
  const cardOf = (c: LineupSeat, closed: Shown[]): string => {
    const start = timeOf(c).start;
    const shown = without([start + (c.trace ? MOTION.fade : MOTION.lineup.slide), leaving(c)?.at ?? Number.POSITIVE_INFINITY], closed);
    if (c.trace) return traceRow(c, shown, chipKf(c, false), type, ctx);
    const lane = laneById.get(c.lane);
    return boardCard(
      c,
      { color: items.get(c.id)?.color, laneColor: lane?.color ?? "slate", ordered: !pools.has(c.lane), stations, numX, numR, ...(bar ? { bar } : {}), shown, step: [start, spanOf(c.step).end], during, kf: chipKf(c), type },
      ctx,
    );
  };

  // 札の層。控えと跡を帯ごとに先に描き、差し戻しの線を重ね、札と封と印をその上に描く。戻る札が元の帯の跡の下を通らないため
  const wrap = (lane: LineupLane, body: string, hide: string | undefined, attr: string): string => {
    const fade = faded.get(lane.id);
    const inner = `<g${hide ? ' class="dg-a"' : ""} ${attr}="${esc(lane.id)}"${hide ? ` style="${hide}"` : ""}>${body}</g>`;
    return fade ? `<g class="dg-a" style="${fade}">${inner}` : `<g>${inner}`;
  };
  const under = layout.lanes
    .map((lane) => {
      const seals = layout.seals.filter((s) => s.lane === lane.id);
      const closed = seals.map(closedOf);
      const ghosts = layout.ghosts
        .filter((g) => g.lane === lane.id)
        .map((g) => {
          const a = timeOf(g).start;
          const b = spanOf(g.step).end;
          const color = items.get(g.id)?.color ?? (g.kind === "from" ? B.return.color : lane.color);
          return ghostCard(g, color, stations, [[a, b]], m.vis(a, b), type, ctx);
        })
        .join("");
      const traces = layout.chips
        .filter((c) => c.lane === lane.id && c.trace)
        .map((c) => cardOf(c, closed))
        .join("");
      return ghosts === "" && traces === "" ? "" : `${wrap(lane, `${ghosts}${traces}`, hideOf(seals), "data-lineup-under")}</g>`;
    })
    .join("");
  const backs = layout.backs
    .map((b) => {
      const a = timeOf(b).start;
      const end = spanOf(b.step).end;
      return backLine(b, m.vis(a, end), [[a, end]], T.label, ctx);
    })
    .join("");
  const chips = layout.lanes
    .map((lane) => {
      const seals = layout.seals.filter((s) => s.lane === lane.id);
      const closed = seals.map(closedOf);
      const seats = layout.chips
        .filter((c) => c.lane === lane.id && !c.trace)
        .map((c) => cardOf(c, closed))
        .join("");
      // 封は封のブロックが、札は札のブロックが、頭の印は選ぶブロックが描く (#3348)
      const covers = seals.map((s) => sealCover(s, lane.id, sealKf(s), layout.sealWord, closedOf(s), ctx)).join("");
      const stamps = layout.stamps
        .filter((s) => s.lane === lane.id)
        .map((s) => stampOf(s, lane.id, timeOf(s).start, ctx))
        .join("");
      const marks = layout.marks
        .filter((mark) => mark.lane === lane.id)
        .map((mark) => {
          const pick = layout.picks.find((p) => p.step === mark.step && p.event === mark.event) as LineupPick;
          const [a, b] = pickSpan(pick);
          return pickMark(mark, lane.id, a, b, ctx);
        })
        .join("");
      return `${wrap(lane, seats, hideOf(seals), "data-lineup-track")}${covers}${stamps}</g>${marks}`;
    })
    .join("");

  return {
    heading: headed,
    lanes: `${roles}${arrows}${lanes}${remarks}${aheads}${legend}`,
    chips: `${pattern}${under}${backs}${chips}`,
    css: `${LINEUP_CSS}${boardCss(T)}`,
  };
}
