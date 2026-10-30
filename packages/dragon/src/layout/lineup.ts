/**
 * 列の図の置き場所 (#3239)。見た目の元は step 2 で本人が選んだ見本の「列の図」。
 *
 * 箱 (`box`) が列になり、宣言した順に上から同じ幅で並ぶ。列の名前は列の左上に、箱の下の字 (`sub`) は列の右上に置く。
 * チップは列の左から等間隔の席に座り、図の幅は上限の枚数の列の幅で決まる。チップの数で図の幅を変えないのは、段によって図の大きさが変わらないため。
 * 字がチップの幅の下限を超える時は全てのチップを同じ幅に広げ、列の名前と右上の字が 1 列に収まらない時は全ての列を広げる。
 *
 * 段の中の `line` を書いた順に辿り、チップが席に居る間を 1 回ずつ `LineupSeat` にする。
 * 滑り始める所は、同じ列に居たチップならその席、ほかの列に居たチップなら段の始まりの居場所で、選んだ列に居ればその席、なければ最後に座った席。
 * どの列にも居なかったチップは滑り始める所を持たない。同じ席に残るチップは前の `LineupSeat` のまま続ける。
 * 元の列を書き換えない時は元の席のチップも残る。元の列を書き換えた時は、元の席の `until` に書き換えた出来事を書く。
 *
 * 原本の JSON が宣言していない列とチップを書く時は、その列とチップを除いて描く。同じ列に同じチップを書く時は最初の 1 枚だけを描く。
 * 開いている列への `open` と、封をした列への `seal` は描かない。
 *
 * 段の番号は、その段で最初に変わる列の左の縁に、チップの並びの高さで置く。列の変わらない段は帯の左上に置き、それも無ければ前の段の番号と入れ替える。
 */
import { type ColorKey, LOOK, TYPE } from "../look/values";
import type { Diagram } from "../schema";
import { LANE_MOST } from "../words";
import { textBox, textWidth } from "./measure";
import { boxColors, type Layout, layoutStrip, type Point, type Rect, replaceSameSpot, type SceneBadge, type SceneBox, stripNeed } from "./scene";

/** 列の中の字。`text` は描く字で、`y` から `h` は字の形の高さ */
export interface LaneText extends Rect {
  text: string;
  /** 基準線の高さ */
  baseline: number;
}

/** 列。`track` はチップを並べる所で、上限の枚数の席が入る */
export interface LineupLane extends SceneBox {
  title: LaneText;
  /** 右上の字の最初の字。書かない列は持たない */
  note?: LaneText;
  /** 右上の字の右端 */
  noteRight: number;
  track: Rect;
}

/** 段の出来事の場所 */
export interface LineupAt {
  step: number;
  event: number;
}

/** チップが列の席に居る間 1 回分。`from` は滑り始める左上で、弾んで現れるチップは持たない。`until` は席を離れる出来事 */
export interface LineupSeat extends Rect, LineupAt {
  id: string;
  lane: string;
  index: number;
  from?: Point;
  until?: LineupAt;
}

/** 封。`until` は開ける出来事 */
export interface LineupSeal extends Rect, LineupAt {
  lane: string;
  until?: LineupAt;
}

/** 札 */
export interface LineupStamp extends Rect, LineupAt {
  lane: string;
  text: string;
}

/** 列を選ぶ出来事。同じ列を続けて選んだ時は最初の 1 つだけを持つ */
export interface LineupPick extends LineupAt {
  lane: string;
}

export interface LineupLayout extends Layout {
  kind: "lineup";
  lanes: LineupLane[];
  chips: LineupSeat[];
  seals: LineupSeal[];
  stamps: LineupStamp[];
  picks: LineupPick[];
}

export const isLineupLayout = (layout: Layout): layout is LineupLayout => layout.kind === "lineup";

/** 列の右上に出る字と、その字の形。段の中の `note` は太い字で描く */
function notesOf(diagram: Diagram, id: string, sub: string | undefined): number[] {
  const written = diagram.steps.flatMap((step) => step.events.flatMap((e) => (e.type === "swap" && e.box === id ? [textWidth(e.text, TYPE.boxSubStrong)] : [])));
  return sub === undefined ? written : [textWidth(sub, TYPE.boxSub), ...written];
}

export function layoutLineup(diagram: Diagram): LineupLayout {
  const { margin, gap, lineup: N } = LOOK;
  const items = diagram.lineup?.items ?? [];
  const known = new Set(items.map((item) => item.id));
  const chipW = Math.max(N.chip.w, ...items.map((item) => (item.label === undefined ? 0 : textWidth(item.label, TYPE.chip) + N.chip.padX * 2)));
  const pitch = chipW + N.chip.gap;
  const trackW = pitch * LANE_MOST - N.chip.gap;
  const titled = diagram.boxes.map((b) => textWidth(b.name, TYPE.boxName) + N.textGap + Math.max(0, ...notesOf(diagram, b.id, b.sub)));
  const laneW = Math.max(trackW + N.padX * 2, ...titled.map((w) => w + N.padX * 2), stripNeed(diagram));

  const colors = boxColors(diagram);
  const lanes: LineupLane[] = diagram.boxes.map((b, i) => {
    const y = margin + i * (N.h + gap);
    const baseline = y + N.textY;
    const noteRight = margin + laneW - N.padX;
    return {
      id: b.id,
      name: b.name,
      ...(b.sub !== undefined ? { sub: b.sub } : {}),
      color: colors.get(b.id) ?? "slate",
      x: margin,
      y,
      w: laneW,
      h: N.h,
      cx: margin + laneW / 2,
      cy: y + N.h / 2,
      title: { ...textBox(b.name, margin + N.padX, baseline, TYPE.boxName), text: b.name, baseline },
      ...(b.sub !== undefined ? { note: { ...textBox(b.sub, noteRight - textWidth(b.sub, TYPE.boxSub), baseline, TYPE.boxSub), text: b.sub, baseline } } : {}),
      noteRight,
      track: { x: margin + N.padX, y: y + N.trackY, w: trackW, h: N.chip.h },
    };
  });
  const laneOf = new Map(lanes.map((lane) => [lane.id, lane]));

  const chips: LineupSeat[] = [];
  const seals: LineupSeal[] = [];
  const stamps: LineupStamp[] = [];
  const picks: LineupPick[] = [];
  const seated = new Map<string, LineupSeat[]>();
  const open = new Map<string, LineupSeal>();
  let picked: string | undefined;
  diagram.steps.forEach((step, s) => {
    // 同じ段の `line` どうしは、段の始まりの居場所から滑る
    const before = [...seated.values()].flat();
    step.events.forEach((e, k) => {
      if (e.type !== "line" && e.type !== "seal" && e.type !== "open" && e.type !== "pick" && e.type !== "stamp") return;
      const lane = laneOf.get(e.box);
      if (!lane) return;
      const at: LineupAt = { step: s, event: k };
      if (e.type === "seal" && !open.has(lane.id)) {
        const { over } = N.seal;
        const seal: LineupSeal = { ...at, lane: lane.id, x: lane.track.x - over, y: lane.track.y - over, w: lane.track.w + over * 2, h: lane.track.h + over * 2 };
        seals.push(seal);
        open.set(lane.id, seal);
      } else if (e.type === "open") {
        const seal = open.get(lane.id);
        if (seal) seal.until = at;
        open.delete(lane.id);
      } else if (e.type === "pick" && picked !== lane.id) {
        picks.push({ ...at, lane: lane.id });
        picked = lane.id;
      } else if (e.type === "stamp") {
        const w = textWidth(e.text, TYPE.stamp) + N.stamp.padX * 2;
        stamps.push({ ...at, lane: lane.id, text: e.text, x: lane.x + lane.w - N.padX - w, y: lane.track.y + (lane.track.h - N.stamp.h) / 2, w, h: N.stamp.h });
      } else if (e.type === "line") {
        const old = seated.get(lane.id) ?? [];
        const order = [...new Set(e.items)].filter((id) => known.has(id)).slice(0, LANE_MOST);
        const placed = order.map((id, index): LineupSeat => {
          const same = old.find((c) => c.id === id);
          if (same?.index === index) return same;
          const others = before.filter((c) => c.id === id);
          const source = same ?? others.find((c) => c.lane === picked) ?? others.at(-1);
          const seat: LineupSeat = { ...at, id, lane: lane.id, index, x: lane.track.x + pitch * index, y: lane.track.y, w: chipW, h: N.chip.h, ...(source ? { from: [source.x, source.y] as Point } : {}) };
          chips.push(seat);
          return seat;
        });
        for (const c of old) if (!placed.includes(c)) c.until = at;
        seated.set(lane.id, placed);
      }
    });
  });

  const layout: LineupLayout = {
    kind: "lineup",
    width: 0,
    height: 0,
    regions: [],
    boxes: lanes,
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    badges: [],
    paths: [],
    ends: [],
    lanes,
    chips,
    seals,
    stamps,
    picks,
  };
  const bottom = Math.max(...lanes.map((lane) => lane.y + lane.h), margin);
  const width = laneW + margin * 2;
  const strip = layoutStrip(diagram, margin, bottom + gap, width - margin * 2);
  layout.width = width;
  layout.height = (strip ? strip.y + strip.h : bottom) + margin;
  if (strip) layout.strip = strip;
  layout.badges = badgesOf(diagram, layout);
  return layout;
}

function badgesOf(diagram: Diagram, layout: LineupLayout): SceneBadge[] {
  const { inset } = LOOK.badge;
  const out: SceneBadge[] = [];
  const put = (step: number, x: number, y: number, color: ColorKey): void => {
    out.push({ step, x, y, color });
  };
  diagram.steps.forEach((step, s) => {
    const lane = step.events.flatMap((e) => ("box" in e ? [e.box] : [])).flatMap((id) => layout.lanes.filter((l) => l.id === id))[0];
    if (lane) {
      put(s, lane.x, lane.track.y + lane.track.h / 2, lane.color);
      return;
    }
    const before = out[out.length - 1];
    if (layout.strip && step.events.some((e) => e.type === "strip")) put(s, layout.strip.x + inset, layout.strip.y + inset, "slate");
    else if (before) out.push({ ...before, step: s });
    else put(s, LOOK.margin, LOOK.margin, layout.lanes[0]?.color ?? "slate");
  });
  return replaceSameSpot(out);
}
