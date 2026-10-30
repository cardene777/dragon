/**
 * 列の図 (#3239) を描く部品。見た目の元は step 2 で本人が選んだ見本の「列の図」。
 *
 * 列の地と字は下の層に、チップと封と札は上の層に描く。チップが別の列へ滑る時に、途中の列の地の下へ隠れないため。
 * チップは席に居る間ごとに 1 つの部品で、座った時に滑り始める所から席へ滑るか、弾んで現れる。席を離れる時は、同じ段で別の席へ滑るなら滑り始める時に一瞬で替わり、
 * 別の席へ滑らないなら消えていく。
 * 封は列の左から右へ伸び、覆い終えた時に列のチップを隠す。開ける時はチップを出してから封を消す。
 * 列を選ぶと選んだ列の縁に色が付き、ほかの列を薄くする。薄くした列は、後の段で並びを書き換えるか選ぶと濃く戻る。
 */
import type { LineupAt, LineupLayout, LineupPick, LineupSeal, LineupSeat } from "../layout/lineup";
import { EASE, LOOK, MOTION, TYPE } from "../look/values";
import type { Diagram } from "../schema";
import type { Timeline } from "../timeline";
import { ALWAYS, type Shown } from "./ink";
import type { Frame } from "./motion";
import { type Ctx, cs, esc, type SubChange, subLines, write } from "./parts";

const r1 = (v: number): number => Math.round(v * 100) / 100;

/** 席から `(dx, dy)` ずらして大きさを `scale` 倍にした時の `transform` */
const place = (dx: number, dy: number, scale = 1): string => `translate(${r1(dx)}px,${r1(dy)}px) scale(${scale})`;

/** `span` から `holes` の間を抜いた間 */
const without = (span: Shown, holes: Shown[]): Shown[] =>
  holes.reduce<Shown[]>((rest, [x, y]) => rest.flatMap(([a, b]): Shown[] => (y <= a || x >= b ? [[a, b]] : [...(a < x ? ([[a, x]] as Shown[]) : []), ...(y < b ? ([[y, b]] as Shown[]) : [])])), [span]);

export function drawLineup(layout: LineupLayout, diagram: Diagram, timeline: Timeline, ctx: Ctx, subs: Map<string, SubChange[]>): { lanes: string; chips: string } {
  const { m } = ctx;
  const N = LOOK.lineup;
  const cut = MOTION.lineup.cut;
  const timeOf = (at: LineupAt): { start: number; drawn: number } => timeline.edges.find((t) => t.step === at.step && t.event === at.event) ?? { start: 0, drawn: 0 };
  const items = new Map((diagram.lineup?.items ?? []).map((item) => [item.id, item]));

  // 列ごとの、薄くなるか濃く戻る時刻。列を選ぶ時に薄くし、並びを書き換えるか選ぶ時に濃く戻す
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
    if (e?.type === "pick") for (const lane of layout.lanes) turn(lane.id, time.start, lane.id !== e.box);
  }
  /** 列の濃さの動き。薄くならない列は `undefined` */
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

  /** 封が列を隠す間。覆い終えてから開けるまで */
  const closedOf = (seal: LineupSeal): Shown => [timeOf(seal).drawn, seal.until ? timeOf(seal.until).start : Number.POSITIVE_INFINITY];

  /** 列のチップを隠す動き。封の無い列は `undefined` */
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

  /** 席を離れた同じ出来事で、別の席へ滑るチップか */
  /**
   * チップが席を離れる時刻と、別の席へ滑って離れるか。席を離れる段の中で、この席から滑り始めるチップが在れば、滑り始める時に一瞬で替わる。
   * 列の並びを書き換える出来事と、別の列へ滑る出来事の順は問わない。どちらが先でも、同じチップが 2 枚見える間と、1 枚も見えない間を作らない
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
    const item = items.get(c.id);
    const color = item?.color;
    const rect = `<rect class="${color ? "dg-ln-chip" : "dg-ln-plain"}" x="${r1(c.x)}" y="${r1(c.y)}" width="${r1(c.w)}" height="${c.h}" rx="${N.chip.radius}"/>`;
    const shown = without([timeOf(c).start + MOTION.lineup.slide, leaving(c)?.at ?? Number.POSITIVE_INFINITY], closed);
    const text = item?.label === undefined ? "" : write(ctx.ink, color ? "dg-ln-t" : "dg-ln-tp", c.x + c.w / 2, c.y + c.h / 2 + LOOK.baseline.tag, item.label, TYPE.chip, shown, "middle");
    return `<g class="dg-popc dg-a" data-lineup-chip="${esc(c.id)}" data-lineup-on="${esc(c.lane)}" data-lineup-seat="${c.index}" style="${color ? `${cs(color)};` : ""}${chipKf(c)}">${rect}${text}</g>`;
  };

  /** 選んだ列の縁の色が見える間。次に別の列を選ぶまで */
  const ring = (pick: LineupPick, next: LineupPick | undefined, frame: string): string =>
    `<g class="dg-a" data-lineup-ring="${esc(pick.lane)}" style="${m.vis(timeOf(pick).start, next ? timeOf(next).start : m.last)}">${frame}</g>`;

  const faded = new Map(layout.lanes.map((lane) => [lane.id, fadeOf(lane.id)]));

  const lanes = layout.lanes
    .map((lane) => {
      const rect = (cls: string, extra = ""): string => `<rect class="${cls}" x="${r1(lane.x)}" y="${r1(lane.y)}" width="${r1(lane.w)}" height="${lane.h}" rx="${N.radius}"${extra}/>`;
      const rings = layout.picks.flatMap((pick, k) => (pick.lane === lane.id ? [ring(pick, layout.picks[k + 1], `${rect("dg-halo")}${rect("dg-on")}`)] : [])).join("");
      const notes = subLines(lane, m, subs.get(lane.id) ?? [], lane.title.baseline, ctx.ink, lane.noteRight);
      const fade = faded.get(lane.id);
      return (
        `<g${fade ? ' class="dg-a"' : ""} data-lineup-lane="${esc(lane.id)}" style="${cs(lane.color)}${fade ? `;${fade}` : ""}">` +
        `${rect("dg-st", ` ${ctx.sh}`)}${rings}${write(ctx.ink, "dg-sn", lane.title.x, lane.title.baseline, lane.name, TYPE.boxName, ALWAYS)}${notes}</g>`
      );
    })
    .join("");

  const stripes = N.seal.stripe;
  const pattern = `<defs><pattern id="dg-seal-${ctx.id}" patternUnits="userSpaceOnUse" width="${stripes * 2}" height="${stripes * 2}" patternTransform="rotate(45)"><rect class="dg-ln-sl" width="${stripes * 2}" height="${stripes * 2}"/><rect class="dg-ln-sd" width="${stripes}" height="${stripes * 2}"/></pattern></defs>`;

  const chips = layout.lanes
    .map((lane) => {
      const seals = layout.seals.filter((s) => s.lane === lane.id);
      const closed = seals.map(closedOf);
      const seats = layout.chips.filter((c) => c.lane === lane.id).map((c) => chip(c, closed)).join("");
      const hide = hideOf(seals);
      const track = `<g${hide ? ' class="dg-a"' : ""} data-lineup-track="${esc(lane.id)}"${hide ? ` style="${hide}"` : ""}>${seats}</g>`;
      const covers = seals
        .map((s) => `<rect class="dg-ln-seal dg-a" data-lineup-seal="${esc(lane.id)}" x="${r1(s.x)}" y="${r1(s.y)}" width="${r1(s.w)}" height="${r1(s.h)}" rx="${N.seal.radius}" fill="url(#dg-seal-${ctx.id})" style="${sealKf(s)}"/>`)
        .join("");
      const stamps = layout.stamps
        .filter((s) => s.lane === lane.id)
        .map((s) => {
          const at = timeOf(s).start;
          const cx = s.x + s.w / 2;
          const cy = s.y + s.h / 2;
          const text = write(ctx.ink, "dg-ln-st", cx, cy + LOOK.baseline.tag, s.text, TYPE.stamp, [[at, Number.POSITIVE_INFINITY]], "middle");
          return `<g class="dg-popc dg-a" data-lineup-stamp="${esc(lane.id)}" style="${cs(N.stamp.color)};${m.pop(at)}"><g transform="rotate(${N.stamp.tilt} ${r1(cx)} ${r1(cy)})"><rect class="dg-ln-stamp" x="${r1(s.x)}" y="${r1(s.y)}" width="${r1(s.w)}" height="${s.h}" rx="${N.stamp.radius}"/>${text}</g></g>`;
        })
        .join("");
      const fade = faded.get(lane.id);
      return `<g${fade ? ` class="dg-a" style="${fade}"` : ""}>${track}${covers}${stamps}</g>`;
    })
    .join("");

  return { lanes, chips: `${pattern}${chips}` };
}
