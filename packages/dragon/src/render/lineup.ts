/**
 * 列の図 (#3239) を描く部品。卓の形 (#3351) の見た目の元は `docs/design/lineup/auction.pen`。
 *
 * 図の題と段の題と文、役の札、箱の枠と名前と空の席、札の下の端の字、矢印、札の下の一言、「この先」の帯、凡例は下の層に、
 * チップと封と印と選んだ札の印は上の層に描く。チップが別の箱へ滑る時に、途中の箱の地の下へ隠れないため。
 * 置き場の枠は点線で、札の枠は実線で描く。色付きのチップは縁をその色で描いて光らせ、札の中の色の無いチップは薄く出す。
 * チップは席に居る間ごとに 1 つの部品で、座った時に滑り始める所から席へ滑るか、弾んで現れる。席を離れる時は、同じ段で別の席へ滑るなら滑り始める時に一瞬で替わり、
 * 別の席へ滑らないなら消えていく。
 * 封は斜線と錠と字で描き、箱の左から右へ伸び、覆い終えた時に箱のチップを隠す。開ける時はチップを出してから封を消す。札の下の端の字は封で隠さない。
 * 箱を選ぶと選んだ箱の縁に色が付いて頭に印が出て、ほかの札を薄くする。薄くした札は、後の段で並びを書き換えるか選ぶと濃く戻る。置き場は薄くしない。
 * 役の札は役が動く段にだけ光る。段の題と文、札の下の一言、「この先」の帯は、その段にだけ出る。
 */
import { hasWide, textWidth } from "../layout/measure";
import type { Rect } from "../layout/scene";
import {
  type LineupAt,
  type LineupLane,
  type LineupLayout,
  type LineupPick,
  type LineupSeal,
  type LineupSeat,
  splitNote,
} from "../kinds/lineup/layout";
import { EASE, LOOK, MOTION, TYPE } from "../look/values";
import { LINEUP_LOOK } from "../look/lineup";
import type { DiagramModel } from "../schema";
import type { Span, Timeline } from "../timeline";
import { partRadius } from "./corner";
import { ALWAYS, type Shown } from "./ink";
import type { Frame } from "./motion";
import { cs } from "../blocks/color/draw";
import type { SubChange } from "../blocks/box/draw";
import { arrowPath, chip as chipOf, lines, rect } from "../blocks/item/draw";
import { legend as legendOf } from "../blocks/legend/draw";
import { remark, slots as slotsOf } from "../blocks/line/draw";
import { laneFrame, poolArrow } from "../blocks/order/draw";
import { pickMark, pickRing } from "../blocks/pick/draw";
import { roleCard } from "../blocks/role/draw";
import { sealCover, sealPattern } from "../blocks/seal/draw";
import { stamp as stampOf } from "../blocks/stamp/draw";
import { type Ctx, cssFont as font, cssMix as mix, esc, r1, sansOf, write } from "./parts";

const S = LOOK.stroke;
const X = LOOK.mix;

/**
 * 列の図の部品の見た目 (#3239)。卓の形 (#3351) の箱と役の札と段の題と札の下の一言と「この先」の帯と凡例。封は箱の左端から右へ伸びる。
 * どの値も値の表から読む。列の図の SVG にだけ書き、ほかの図の SVG と頁が最初に読む script に入れない (#3351)
 */
const LINEUP_CSS = [
  `.dg-ln-card{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-pool{fill:color-mix(in srgb,var(--surf) ${X.poolFill}%,transparent);stroke:var(--mute);stroke-width:${S.hair}}`,
  `.dg-ln-slot{fill:none;stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-sep{stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-hint{${font(TYPE.laneHint)};fill:var(--mute)}`,
  `.dg-ln-ha{fill:none;stroke:var(--mute);stroke-width:${S.hair};stroke-linecap:round;stroke-linejoin:round}`,
  `.dg-ln-empty{${font(TYPE.laneEmpty)};fill:var(--mute)}`,
  `.dg-ln-note{${font(TYPE.laneNote)};fill:var(--ct)}`,
  `.dg-ln-unit{${font(TYPE.laneUnit)};fill:var(--ct)}`,
  `.dg-ln-cf{fill:var(--surf);stroke:var(--line);stroke-width:${S.hair}}`,
  `.dg-ln-cc{fill:${mix(X.chipTint)};stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-ln-cg{fill:none;stroke:var(--c);stroke-width:${LINEUP_LOOK.chip.glow};stroke-opacity:.18}`,
  `.dg-ln-t{${font(TYPE.chip)};fill:var(--ink)}`,
  ".dg-ln-tf{fill:var(--mute)}",
  `.dg-ln-tj{${font(sansOf(TYPE.chip))}}`,
  `.dg-ln-notej{${font(sansOf(TYPE.laneNote))}}`,
  `.dg-ln-unitj{${font(sansOf(TYPE.laneUnit))}}`,
  ".dg-ln-seal{transform-box:fill-box;transform-origin:0 50%}",
  `.dg-ln-sd{fill:color-mix(in srgb,var(--mute) ${X.sealDark}%,var(--surf))}`,
  `.dg-ln-sl{fill:color-mix(in srgb,var(--mute) ${X.sealLight}%,var(--surf))}`,
  `.dg-ln-sealbg{stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-lockbox{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-lock{fill:none;stroke:var(--mute);stroke-width:${S.slot};stroke-linecap:round}`,
  `.dg-ln-sw-t{${font(TYPE.sealWord)};fill:var(--mute)}`,
  `.dg-ln-stamp{fill:var(--surf);stroke:var(--c);stroke-width:${S.stamp}}`,
  `.dg-ln-st{${font(TYPE.stamp)};fill:var(--ct)}`,
  ".dg-ln-mark{fill:var(--c)}",
  `.dg-ln-mt{${font(TYPE.laneMark)};fill:var(--on-c)}`,
  `.dg-ln-role{fill:var(--surf);stroke:var(--hair);stroke-width:${S.hair}}`,
  `.dg-ln-lit{fill:${mix(X.chipTint)};stroke:var(--c);stroke-width:${S.on}}`,
  `.dg-ln-rn{${font(TYPE.roleName)};fill:var(--ink)}`,
  `.dg-ln-rt{${font(TYPE.roleNote)};fill:var(--mute)}`,
  `.dg-ln-ft{${font(TYPE.lineupTitle)};fill:var(--mute)}`,
  `.dg-ln-hd{${font(TYPE.lineupHead)};fill:var(--ink)}`,
  `.dg-ln-say{${font(TYPE.lineupSay)};fill:var(--mute)}`,
  `.dg-ln-arrow{fill:none;stroke:var(--c);stroke-width:${S.edge};stroke-linecap:round;stroke-linejoin:round}`,
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

export function drawLineup(
  layout: LineupLayout,
  diagram: DiagramModel,
  timeline: Timeline,
  ctx: Ctx,
  subs: Map<string, SubChange[]>,
): { heading: string; lanes: string; chips: string; css: string } {
  const { m } = ctx;
  const N = LINEUP_LOOK;
  const cut = MOTION.lineup.cut;
  const timeOf = (at: LineupAt): { start: number; drawn: number } =>
    timeline.edges.find((t) => t.step === at.step && t.event === at.event) ?? {
      start: 0,
      drawn: 0,
    };
  const spanOf = (s: number): Span => timeline.steps[s] as Span;
  const items = new Map((diagram.lineup?.items ?? []).map((item) => [item.id, item]));
  const pools = new Set(layout.lanes.filter((lane) => lane.pool).map((lane) => lane.id));

  // 札ごとの、薄くなるか濃く戻る時刻。箱を選ぶ時にほかの札を薄くし、並びを書き換えるか選ぶ時に濃く戻す
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
  /** 箱の濃さの動き。薄くならない箱は `undefined` */
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
  const faded = new Map(layout.lanes.map((lane) => [lane.id, fadeOf(lane.id)]));

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
    for (const s of steps) {
      const span = spanOf(s);
      const last = out.at(-1);
      if (last && steps.includes(s - 1)) last[1] = span.end;
      else out.push([span.start, span.end]);
    }
    return out;
  };

  /** 封が箱を隠す間。覆い終えてから開けるまで */
  const closedOf = (seal: LineupSeal): Shown => [
    timeOf(seal).drawn,
    seal.until ? timeOf(seal.until).start : Number.POSITIVE_INFINITY,
  ];

  /** 箱のチップを隠す動き。封の無い箱は `undefined` */
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
   * チップが席を離れる時刻と、別の席へ滑って離れるか。席を離れる段の中で、この席から滑り始めるチップが在れば、滑り始める時に一瞬で替わる。
   * 箱の並びを書き換える出来事と、別の箱へ滑る出来事の順は問わない。どちらが先でも、同じチップが 2 枚見える間と、1 枚も見えない間を作らない
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

  const chipKf = (c: LineupSeat): string => {
    const a = timeOf(c).start;
    const rest = place(0, 0);
    const frames: Frame[] = [];
    if (c.from) {
      const off = place(c.from[0] - c.x, c.from[1] - c.y);
      frames.push(
        [0, { opacity: 0, transform: off }],
        [a - cut, { opacity: 0, transform: off }],
        [a, { opacity: 1, transform: off }, EASE.inOut],
        [a + MOTION.lineup.slide, { transform: rest }],
      );
    } else {
      const off = place(0, 0, LOOK.popFrom);
      frames.push(
        [0, { opacity: 0, transform: off }],
        [a, { opacity: 0, transform: off }, EASE.pop],
        [a + MOTION.popFade, { opacity: 1, transform: rest }],
      );
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

  /** 席 `c` のチップ。字は封が箱を隠す間 `closed` を除いて書く。チップはチップのブロックが描く (#3348) */
  const chip = (c: LineupSeat, closed: Shown[]): string => {
    const color = items.get(c.id)?.color;
    const dim = !color && !pools.has(c.lane);
    const shown = without([timeOf(c).start + MOTION.lineup.slide, leaving(c)?.at ?? Number.POSITIVE_INFINITY], closed);
    return chipOf(c, color, dim, shown, () => chipKf(c), ctx);
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

  // 層の見た目 (#3625) は帯と印と札を別の部品で描く。見た目の規則も層の見た目の SVG にだけ書く
  if (layout.arrangement === "layers") return { heading: headingOf(), ...drawLayers(layout, diagram, timeline, { timeOf, chipKf, leaving, during }, ctx), css: `${LINEUP_CSS}${LAYERS_CSS}` };

  /** 選んだ箱の縁の色が見える間。次に別の箱を選ぶまで */
  const pickSpan = (pick: LineupPick): [number, number] => {
    const next = layout.picks[layout.picks.indexOf(pick) + 1];
    return [timeOf(pick).start, next ? timeOf(next).start : m.last];
  };

  /** 札の下の端の字。最初の字から、段の中の `note` で書き換わる。数と単位を別の大きさで描く */
  const noteOf = (lane: LineupLane): string => {
    if (lane.noteBaseline === undefined) return "";
    const y = lane.noteBaseline;
    const seq: SubChange[] = [[0, lane.sub ?? "", "dg-ss"], ...(subs.get(lane.id) ?? [])];
    const parts = seq.map(([t, text], k) => {
      if (text === "") return "";
      const next = seq[k + 1]?.[0];
      const anim =
        k === 0
          ? next === undefined
            ? ""
            : m.until(next - MOTION.untilFade)
          : next === undefined
            ? m.rise(t)
            : m.rise(t, next - MOTION.untilFade);
      const shown: Shown[] = [
        [k === 0 ? 0 : t, next === undefined ? Number.POSITIVE_INFINITY : next - MOTION.untilFade],
      ];
      const { number, unit } = splitNote(text);
      const numberStyle = hasWide(number)
        ? { ...TYPE.laneNote, family: "sans" as const }
        : TYPE.laneNote;
      const unitStyle =
        unit !== undefined && hasWide(unit)
          ? { ...TYPE.laneUnit, family: "sans" as const }
          : TYPE.laneUnit;
      const numberW = textWidth(number, numberStyle);
      const total =
        numberW + (unit === undefined ? 0 : N.card.unitGap + textWidth(unit, unitStyle));
      const left = lane.cx - total / 2;
      const drawn =
        write(
          ctx.ink,
          hasWide(number) ? "dg-ln-note dg-ln-notej" : "dg-ln-note",
          left,
          y,
          number,
          numberStyle,
          shown,
        ) +
        (unit === undefined
          ? ""
          : write(
              ctx.ink,
              hasWide(unit) ? "dg-ln-unit dg-ln-unitj" : "dg-ln-unit",
              left + numberW + N.card.unitGap,
              y,
              unit,
              unitStyle,
              shown,
            ));
      return `<g${anim ? ` class="dg-a" style="${anim}"` : ""}>${drawn}</g>`;
    });
    return `<g data-lineup-note="${esc(lane.id)}" style="${cs(N.noteColor)}">${parts.join("")}</g>`;
  };

  /** 札の名前の下の字の左の、下を向く矢印 */
  const hintArrow = (lane: LineupLane): string => {
    if (lane.arrowX === undefined) return "";
    const x = lane.arrowX + N.hintArrow / 2;
    const top = lane.hint.y;
    const bottom = lane.hint.y + lane.hint.h;
    return `<path class="dg-ln-ha" d="${arrowPath(
      [
        [x, top],
        [x, bottom],
      ],
      N.hintArrow / 2,
    )}"/>`;
  };

  const firstSeat = (id: string): number | undefined => {
    const times = layout.chips.filter((c) => c.lane === id).map((c) => timeOf(c).start);
    return times.length === 0 ? undefined : Math.min(...times);
  };

  const lanes = layout.lanes
    .map((lane) => {
      // 枠は置き場のブロックが、縁の光は選ぶブロックが、空の席は列の並びのブロックが描く (#3348)
      const frame = laneFrame(lane, ctx);
      const rings = layout.picks
        .filter((pick) => pick.lane === lane.id)
        .map((pick) => pickRing(lane, m.vis(...pickSpan(pick)), ctx))
        .join("");
      // 空の席の枠は封の下で透けないよう、封をしている間はチップと一緒に隠す
      const sealed = hideOf(layout.seals.filter((s) => s.lane === lane.id));
      const slots = slotsOf(lane, sealed, ctx);
      const sep =
        lane.foot === undefined
          ? ""
          : `<line class="dg-ln-sep" x1="${r1(lane.x)}" y1="${r1(lane.foot)}" x2="${r1(lane.x + lane.w)}" y2="${r1(lane.foot)}"/>`;
      const first = firstSeat(lane.id);
      const empty = lane.empty
        ? `<g${first === undefined ? "" : ` class="dg-a" style="${m.until(first)}"`}>${lines(ctx, "dg-ln-empty", lane.empty, TYPE.laneEmpty, first === undefined ? ALWAYS : [[0, first]])}</g>`
        : "";
      const fade = faded.get(lane.id);
      return (
        `<g${fade ? ' class="dg-a"' : ""} data-lineup-lane="${esc(lane.id)}"${lane.pool ? ' data-lineup-pool=""' : ""} style="${cs(lane.color)}${fade ? `;${fade}` : ""}">` +
        `${frame}${rings}${slots}${sep}${lines(ctx, "dg-sn", lane.title, TYPE.boxName)}${hintArrow(lane)}${lines(ctx, "dg-ln-hint", lane.hint, TYPE.laneHint)}${empty}${noteOf(lane)}</g>`
      );
    })
    .join("");

  // 役の札。役が動く段にだけ縁と地に色を付ける。札は役のブロックが描く (#3348)
  const roles = layout.roles.map((role) => roleCard(role, role.steps.length === 0 ? undefined : during(rangesOf(role.steps)), ctx)).join("");

  // 図の題と、段ごとの題と文。動きの表は書いた順に名前を振るので、今までどおりこの位置で描き、層の見た目を書かない図の SVG を変えない
  const headed = headingOf();

  // 置き場と札の間の矢印。置き場のブロックが描く (#3348)
  const arrows = layout.arrows.map(poolArrow).join("");

  // 札の下の一言。札と段ごとに 1 つの部品にまとめ、line を書いた段にだけ見せる
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

  const chips = layout.lanes
    .map((lane) => {
      const seals = layout.seals.filter((s) => s.lane === lane.id);
      const closed = seals.map(closedOf);
      const seats = layout.chips
        .filter((c) => c.lane === lane.id)
        .map((c) => chip(c, closed))
        .join("");
      const hide = hideOf(seals);
      const track = `<g${hide ? ' class="dg-a"' : ""} data-lineup-track="${esc(lane.id)}"${hide ? ` style="${hide}"` : ""}>${seats}</g>`;
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
      const fade = faded.get(lane.id);
      return `<g${fade ? ` class="dg-a" style="${fade}"` : ""}>${track}${covers}${stamps}</g>${marks}`;
    })
    .join("");

  return {
    heading: headed,
    lanes: `${roles}${arrows}${lanes}${remarks}${aheads}${legend}`,
    chips: `${pattern}${chips}`,
    css: LINEUP_CSS,
  };
}
