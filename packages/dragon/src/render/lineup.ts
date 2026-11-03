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
import { type LineupAt, type LineupLane, type LineupLayout, type LineupPick, type LineupSeal, type LineupSeat, type LineupText, splitNote } from "../layout/lineup";
import type { Point } from "../layout/scene";
import { EASE, LOOK, MOTION, type TextStyle, TYPE } from "../look/values";
import type { Diagram } from "../schema";
import type { Span, Timeline } from "../timeline";
import { ALWAYS, type Shown } from "./ink";
import type { Frame } from "./motion";
import { cs } from "../blocks/color/draw";
import type { SubChange } from "../blocks/box/draw";
import { type Ctx, esc, write } from "./parts";

const r1 = (v: number): number => Math.round(v * 100) / 100;

/** 席から `(dx, dy)` ずらして大きさを `scale` 倍にした時の `transform` */
const place = (dx: number, dy: number, scale = 1): string => `translate(${r1(dx)}px,${r1(dy)}px) scale(${scale})`;

/** `span` から `holes` の間を抜いた間 */
const without = (span: Shown, holes: Shown[]): Shown[] =>
  holes.reduce<Shown[]>((rest, [x, y]) => rest.flatMap(([a, b]): Shown[] => (y <= a || x >= b ? [[a, b]] : [...(a < x ? ([[a, x]] as Shown[]) : []), ...(y < b ? ([[y, b]] as Shown[]) : [])])), [span]);

const rect = (cls: string, r: { x: number; y: number; w: number; h: number }, rx: number, extra = ""): string =>
  `<rect class="${cls}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}" rx="${rx}"${extra}/>`;

const pathOf = (points: Point[]): string => points.map(([x, y], k) => `${k === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`).join("");

/** 矢じりの付いた線。終わりの点で、線の向きに `head` の長さの矢じりを付ける */
function arrowPath(points: Point[], head: number): string {
  const end = points.at(-1) as Point;
  const before = points.at(-2) as Point;
  const len = Math.hypot(end[0] - before[0], end[1] - before[1]) || 1;
  const ux = (end[0] - before[0]) / len;
  const uy = (end[1] - before[1]) / len;
  const wing = (side: number): Point => [end[0] - ux * head - uy * head * side, end[1] - uy * head + ux * head * side];
  return `${pathOf(points)}${pathOf([wing(1), end, wing(-1)])}`;
}

/** 折った字を 1 行ずつ描く。等幅の字で和文を含む行は、和文の字の class `wide` を足す */
function lines(ctx: Ctx, cls: string, t: LineupText, style: TextStyle, shown: Shown[] = ALWAYS, wide = ""): string {
  return t.lines.map((l) => write(ctx.ink, wide !== "" && style.family === "mono" && hasWide(l.text) ? `${cls} ${wide}` : cls, l.x, l.baseline, l.text, style, shown)).join("");
}

export function drawLineup(layout: LineupLayout, diagram: Diagram, timeline: Timeline, ctx: Ctx, subs: Map<string, SubChange[]>): { lanes: string; chips: string } {
  const { m } = ctx;
  const N = LOOK.lineup;
  const cut = MOTION.lineup.cut;
  const timeOf = (at: LineupAt): { start: number; drawn: number } => timeline.edges.find((t) => t.step === at.step && t.event === at.event) ?? { start: 0, drawn: 0 };
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
    if (e?.type === "line") turn(e.box, time.start, false);
    if (e?.type === "pick") for (const lane of layout.lanes) if (!lane.pool) turn(lane.id, time.start, lane.id !== e.box);
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
    for (const [a, b] of ranges) frames.push([a, { opacity: 0 }, EASE.out], [a + MOTION.fade, { opacity: 1 }], [b, { opacity: 1 }, EASE.inOut], [Math.min(b + MOTION.fade, m.total), { opacity: 0 }]);
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
  const closedOf = (seal: LineupSeal): Shown => [timeOf(seal).drawn, seal.until ? timeOf(seal.until).start : Number.POSITIVE_INFINITY];

  /** 箱のチップを隠す動き。封の無い箱は `undefined` */
  const hideOf = (seals: LineupSeal[]): string | undefined => {
    if (seals.length === 0) return undefined;
    const frames: Frame[] = [[0, { opacity: 1 }]];
    for (const seal of seals) {
      const [a, b] = closedOf(seal);
      frames.push([a, { opacity: 1 }], [a + cut, { opacity: 0 }]);
      if (seal.until) frames.push([b, { opacity: 0 }], [b + cut, { opacity: 1 }]);
    }
    frames.push([m.total - cut, { opacity: seals.at(-1)?.until ? 1 : 0 }], [m.total, { opacity: 1 }]);
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
    return m.kf([[0, none], [start - cut, none], [start, { opacity: 1, transform: "scaleX(0)" }, EASE.inOut], [drawn, { transform: "scaleX(1)" }], ...end]);
  };

  /**
   * チップが席を離れる時刻と、別の席へ滑って離れるか。席を離れる段の中で、この席から滑り始めるチップが在れば、滑り始める時に一瞬で替わる。
   * 箱の並びを書き換える出来事と、別の箱へ滑る出来事の順は問わない。どちらが先でも、同じチップが 2 枚見える間と、1 枚も見えない間を作らない
   */
  const leaving = (c: LineupSeat): { at: number; moved: boolean } | undefined => {
    if (!c.until) return undefined;
    const until = c.until;
    const next = layout.chips.find((n) => n !== c && n.id === c.id && n.step === until.step && n.from?.[0] === c.x && n.from?.[1] === c.y);
    return next ? { at: timeOf(next).start, moved: true } : { at: timeOf(until).start, moved: false };
  };

  const chipKf = (c: LineupSeat): string => {
    const a = timeOf(c).start;
    const rest = place(0, 0);
    const frames: Frame[] = [];
    if (c.from) {
      const off = place(c.from[0] - c.x, c.from[1] - c.y);
      frames.push([0, { opacity: 0, transform: off }], [a - cut, { opacity: 0, transform: off }], [a, { opacity: 1, transform: off }, EASE.inOut], [a + MOTION.lineup.slide, { transform: rest }]);
    } else {
      const off = place(0, 0, LOOK.popFrom);
      frames.push([0, { opacity: 0, transform: off }], [a, { opacity: 0, transform: off }, EASE.pop], [a + MOTION.popFade, { opacity: 1, transform: rest }]);
    }
    const leaves = leaving(c);
    if (leaves) {
      frames.push([leaves.at, { opacity: 1 }, EASE.inOut], [leaves.at + (leaves.moved ? cut : MOTION.fade), { opacity: 0 }], [m.total, { opacity: 0 }]);
    } else {
      frames.push([m.last, { opacity: 1 }, EASE.inOut], [m.total, { opacity: 0 }]);
    }
    return m.kf(frames);
  };

  const chip = (c: LineupSeat, closed: Shown[]): string => {
    const color = items.get(c.id)?.color;
    const dim = !color && !pools.has(c.lane);
    const frame = rect(color ? "dg-ln-cc" : "dg-ln-cf", c, N.chip.radius, " data-lineup-chip-frame=\"\"");
    const glow = color ? rect("dg-ln-cg", c, N.chip.radius) : "";
    const shown = without([timeOf(c).start + MOTION.lineup.slide, leaving(c)?.at ?? Number.POSITIVE_INFINITY], closed);
    const text = lines(ctx, dim ? "dg-ln-t dg-ln-tf" : "dg-ln-t", c.label, TYPE.chip, shown, "dg-ln-tj");
    const flags = `${color ? " data-lineup-glow=\"\"" : ""}${dim ? " data-lineup-faint=\"\"" : ""}`;
    return `<g class="dg-popc dg-a" data-lineup-chip="${esc(c.id)}" data-lineup-on="${esc(c.lane)}" data-lineup-seat="${c.index}"${flags} style="${color ? `${cs(color)};` : ""}${chipKf(c)}">${frame}${glow}${text}</g>`;
  };

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
      const anim = k === 0 ? (next === undefined ? "" : m.until(next - MOTION.untilFade)) : next === undefined ? m.rise(t) : m.rise(t, next - MOTION.untilFade);
      const shown: Shown[] = [[k === 0 ? 0 : t, next === undefined ? Number.POSITIVE_INFINITY : next - MOTION.untilFade]];
      const { number, unit } = splitNote(text);
      const numberStyle = hasWide(number) ? { ...TYPE.laneNote, family: "sans" as const } : TYPE.laneNote;
      const unitStyle = unit !== undefined && hasWide(unit) ? { ...TYPE.laneUnit, family: "sans" as const } : TYPE.laneUnit;
      const numberW = textWidth(number, numberStyle);
      const total = numberW + (unit === undefined ? 0 : N.card.unitGap + textWidth(unit, unitStyle));
      const left = lane.cx - total / 2;
      const drawn =
        write(ctx.ink, hasWide(number) ? "dg-ln-note dg-ln-notej" : "dg-ln-note", left, y, number, numberStyle, shown) +
        (unit === undefined ? "" : write(ctx.ink, hasWide(unit) ? "dg-ln-unit dg-ln-unitj" : "dg-ln-unit", left + numberW + N.card.unitGap, y, unit, unitStyle, shown));
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
      const dash = lane.pool ? ` stroke-dasharray="${N.dash.join(" ")}"` : "";
      const frame = rect(lane.pool ? "dg-ln-pool" : "dg-ln-card", lane, N.radius, ` data-lineup-frame=""${dash}${lane.pool ? "" : ` ${ctx.sh}`}`);
      const rings = layout.picks
        .filter((pick) => pick.lane === lane.id)
        .map((pick) => `<g class="dg-a" data-lineup-ring="${esc(lane.id)}" style="${m.vis(...pickSpan(pick))}">${rect("dg-halo", lane, N.radius)}${rect("dg-on", lane, N.radius)}</g>`)
        .join("");
      // 空の席の枠は封の下で透けないよう、封をしている間はチップと一緒に隠す
      const sealed = hideOf(layout.seals.filter((s) => s.lane === lane.id));
      const slotRects = lane.slots.map((s) => rect("dg-ln-slot", s, N.chip.radius)).join("");
      const slots = slotRects === "" ? "" : `<g${sealed ? ` class="dg-a" style="${sealed}"` : ""}>${slotRects}</g>`;
      const sep = lane.foot === undefined ? "" : `<line class="dg-ln-sep" x1="${r1(lane.x)}" y1="${r1(lane.foot)}" x2="${r1(lane.x + lane.w)}" y2="${r1(lane.foot)}"/>`;
      const first = firstSeat(lane.id);
      const empty = lane.empty ? `<g${first === undefined ? "" : ` class="dg-a" style="${m.until(first)}"`}>${lines(ctx, "dg-ln-empty", lane.empty, TYPE.laneEmpty, first === undefined ? ALWAYS : [[0, first]])}</g>` : "";
      const fade = faded.get(lane.id);
      return (
        `<g${fade ? ' class="dg-a"' : ""} data-lineup-lane="${esc(lane.id)}"${lane.pool ? " data-lineup-pool=\"\"" : ""} style="${cs(lane.color)}${fade ? `;${fade}` : ""}">` +
        `${frame}${rings}${slots}${sep}${lines(ctx, "dg-sn", lane.title, TYPE.boxName)}${hintArrow(lane)}${lines(ctx, "dg-ln-hint", lane.hint, TYPE.laneHint)}${empty}${noteOf(lane)}</g>`
      );
    })
    .join("");

  // 役の札。役が動く段にだけ縁と地に色を付ける
  const roles = layout.roles
    .map((role) => {
      const lit = role.steps.length === 0 ? "" : `<g class="dg-a" data-lineup-role-ring="${esc(role.id)}" style="${during(rangesOf(role.steps))}">${rect("dg-halo", role, N.radius)}${rect("dg-ln-lit", role, N.radius)}</g>`;
      return (
        `<g data-lineup-role="${esc(role.id)}" style="${cs(N.role.color)}">${rect("dg-ln-role", role, N.radius, ` ${ctx.sh}`)}${lit}` +
        `${lines(ctx, "dg-ln-rn", role.title, TYPE.roleName)}${role.note ? lines(ctx, "dg-ln-rt", role.note, TYPE.roleNote) : ""}</g>`
      );
    })
    .join("");

  // 図の題と、段ごとの題と文
  const heading = lines(ctx, "dg-ln-ft", layout.heading, TYPE.lineupTitle);
  const headlines = layout.headlines
    .map((h) => {
      const span = spanOf(h.step);
      const shown: Shown[] = [[span.start, span.end]];
      return `<g class="dg-a" data-lineup-headline="${h.step}" style="${m.vis(span.start, span.end)}">${lines(ctx, "dg-ln-hd", h.title, TYPE.lineupHead, shown)}${h.say ? lines(ctx, "dg-ln-say", h.say, TYPE.lineupSay, shown) : ""}</g>`;
    })
    .join("");

  // 置き場と札の間の矢印
  const arrows = layout.arrows.map((a) => `<path class="dg-ln-arrow" data-lineup-arrow="" d="${arrowPath(a.points, N.arrow.head)}" style="${cs(N.role.color)}"/>`).join("");

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
      const body = group.map((r) => `<g${r.color ? ` style="${cs(r.color)}"` : ""}>${rect(r.color ? "dg-ln-bar" : "dg-ln-bar0", r.bar, 0)}${lines(ctx, "dg-ln-rk", r.text, TYPE.remark, shown)}</g>`).join("");
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
            `<g data-lineup-ahead-tag="${tag.step}">${rect("dg-ln-tag", tag, N.chip.radius)}<g style="${cs(N.role.color)}">${rect("dg-ln-no", tag.no, N.chip.radius)}${lines(ctx, "dg-ln-nt", tag.number, TYPE.aheadNo, shown)}</g>` +
            `${lines(ctx, "dg-ln-at", tag.text, TYPE.aheadText, shown)}</g>`,
        )
        .join("");
      const links = a.arrows.map((points) => `<path class="dg-ln-aa" data-lineup-ahead-arrow="" d="${arrowPath(points, N.arrow.head)}"/>`).join("");
      return `<g class="dg-a" data-lineup-ahead="${a.step}" style="${m.vis(span.start, span.end)}"><g data-lineup-ahead-label="">${lines(ctx, "dg-ln-al", a.label, TYPE.aheadLabel, shown)}</g>${tags}${links}</g>`;
    })
    .join("");

  // 凡例。説明ごとに色の枠の見本を左に置く
  const legend =
    layout.legend.length === 0
      ? ""
      : `<g data-lineup-legend="">${layout.legend
          .map((row) => `<g data-lineup-legend-row=""${row.color ? ` style="${cs(row.color)}"` : ""}>${rect(row.color ? "dg-ln-sw" : "dg-ln-sw0", row.swatch, N.chip.radius / 2)}${lines(ctx, "dg-ln-lg", row.text, TYPE.legend)}</g>`)
          .join("")}</g>`;

  const stripes = N.seal.stripe;
  const pattern = `<defs><pattern id="dg-seal-${ctx.id}" patternUnits="userSpaceOnUse" width="${stripes * 2}" height="${stripes * 2}" patternTransform="rotate(45)"><rect class="dg-ln-sl" width="${stripes * 2}" height="${stripes * 2}"/><rect class="dg-ln-sd" width="${stripes}" height="${stripes * 2}"/></pattern></defs>`;

  /** 封の真ん中の錠の箱と錠と字 */
  const lockOf = (s: LineupSeal): string => {
    const size = Math.min(N.seal.lock, s.h - N.seal.over * 2, s.w - N.seal.over * 2);
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const { w, h, r, rise } = N.lock;
    const top = cy + N.seal.lockY - h / 2;
    const shackle = `M${r1(cx - r)} ${r1(top)}v${-rise}a${r} ${r} 0 0 1 ${r * 2} 0v${rise}`;
    const word = write(ctx.ink, "dg-ln-sw-t", cx, cy + N.seal.wordY, layout.sealWord, TYPE.sealWord, [closedOf(s)], "middle");
    return (
      `<g data-lineup-lock="">${rect("dg-ln-lockbox", { x: cx - size / 2, y: cy - size / 2, w: size, h: size }, N.chip.radius)}` +
      `<path class="dg-ln-lock" d="${shackle}"/>${rect("dg-ln-lock", { x: cx - w / 2, y: top, w, h }, N.chip.radius / 2)}</g>${word}`
    );
  };

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
      const covers = seals
        .map((s) => `<g class="dg-ln-seal dg-a" data-lineup-seal="${esc(lane.id)}" style="${sealKf(s)}">${rect("dg-ln-sealbg", s, N.seal.radius, ` fill="url(#dg-seal-${ctx.id})"`)}${lockOf(s)}</g>`)
        .join("");
      const stamps = layout.stamps
        .filter((s) => s.lane === lane.id)
        .map((s) => {
          const at = timeOf(s).start;
          const cx = s.x + s.w / 2;
          const cy = s.y + s.h / 2;
          const text = write(ctx.ink, "dg-ln-st", cx, cy + LOOK.baseline.tag, s.text, TYPE.stamp, [[at, Number.POSITIVE_INFINITY]], "middle");
          return `<g class="dg-popc dg-a" data-lineup-stamp="${esc(lane.id)}" style="${cs(N.stamp.color)};${m.pop(at)}"><g transform="rotate(${N.stamp.tilt} ${r1(cx)} ${r1(cy)})">${rect("dg-ln-stamp", s, N.stamp.radius)}${text}</g></g>`;
        })
        .join("");
      const marks = layout.marks
        .filter((mark) => mark.lane === lane.id)
        .map((mark) => {
          const pick = layout.picks.find((p) => p.step === mark.step && p.event === mark.event) as LineupPick;
          const [a, b] = pickSpan(pick);
          const text = write(ctx.ink, "dg-ln-mt", mark.x + mark.w / 2, mark.y + mark.h / 2 + LOOK.baseline.tag, mark.text, TYPE.laneMark, [[a, b]], "middle");
          return `<g class="dg-a" data-lineup-mark="${esc(lane.id)}" style="${cs(N.mark.color)};${m.vis(a, b)}">${rect("dg-ln-mark", mark, N.chip.radius)}${text}</g>`;
        })
        .join("");
      const fade = faded.get(lane.id);
      return `<g${fade ? ` class="dg-a" style="${fade}"` : ""}>${track}${covers}${stamps}</g>${marks}`;
    })
    .join("");

  return { lanes: `${heading}${headlines}${roles}${arrows}${lanes}${remarks}${aheads}${legend}`, chips: `${pattern}${chips}` };
}
