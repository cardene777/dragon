/**
 * 配管の図を `layout` の行の形へ置き直す手順 (Tracelyth #165、#166、#168)。
 *
 * 今の並べ方 (`compose`) で作った部品を、トークンの箱を人の列の上か下に置く形 (`top`、`bottom`) か、
 * 槽をトークンごとの行に並べる3つの形 (`ledger`、`mesh`、`bus`) へ移す。`auto` は上と下の形と箱の並びを試し、線の交わりが最も少ない形を選ぶ。
 * 置き場所は `box` と `hold` の行だけで決まるので、呼ぶ人や引数を替えても箱と槽は動かない。呼び出しに関わらない人は薄く描く
 */
import { ETH } from "../blocks/definition-values";
import { textWidth } from "./measure";
import type { Point, Rect } from "./scene";
import { FLOW_MOVE, PIPE_LOOK, PIPE_TYPE } from "../look/pipe";
import type { DiagramModel } from "../schema";
import {
  type PipeBridge,
  type PipeBusLine,
  type PipeChip,
  type PipeFixed,
  type PipeFlow,
  type PipeLayout,
  type PipeLedger,
  type PipeParty,
  type PipePort,
  type PipeTank,
  type PipeValuePipe,
  partiesOf,
  simulate,
} from "../kinds/pipe/layout";

const P = PIPE_LOOK;
const T = PIPE_TYPE;

/** 置き直した図。置き直した形と点数を必ず持つ */
type Placed = PipeLayout & { fixed: PipeFixed };
/** 部品を2度動かさないための、動かした物の覚え */
type Seen = WeakSet<object> | Set<object>;
/** 縦と横の線分 */
type Seg = [Point, Point];
/** 箱の中の行を広げた幅に合わせて動かす部品の名前 */
const ROW_LEFT = ["badge", "badges", "keyArrow", "label"] as const;
const ROW_RIGHT = ["text", "was", "arrow", "strike", "pill"] as const;
/**
 * 上と下の形で、線をどこから上げるか。`up` は丸の上から真上へ、`right` と `left` は右か左の隣との間から、
 * `outer-left` と `outer-right` は列の外側から、`gap-right` と `gap-left` は槽のパイプが右か左の隣との間から、`row` は列の中どうしの呼び出し
 */
type Way = "up" | "right" | "left" | "outer-left" | "outer-right" | "gap-right" | "gap-left" | "row";
/** 槽からトークンの箱へ上げる値のパイプ */
interface ValueRun {
  holder: string;
  token: string;
  box: string;
  tank: PipeTank;
  way: Way;
}
/** どの人がどの箱を呼んでもよいよう先に取っておく呼び出しの道。`k` は箱の順 */
interface Reserved {
  from: string;
  to: string;
  k: number;
  way: Way;
}
/** 図に出てくる呼び出し。取っておいた道か、列の中どうしの呼び出し */
type Call = Reserved | { from: string; to: string; way: "row"; k?: undefined };
/** 隣との間を通る線。間の中で横に並べる順を決める */
type Item = ValueRun | Call;
/** 槽を行に並べる形の呼び出し。人 (`i` 番目) から箱 (`k` 番目) へ取っておいた道 (`box`) か、列の中どうしの呼び出し (`row`) */
type RowCall = { from: string; to: string; k: number; i: number; way: "box" } | { from: string; to: string; way: "row"; k?: undefined; i?: undefined };
/** 隣どうしの間ごとに通る線。左の人から右へ出る呼び出し、槽のパイプ、右の人から左へ出る呼び出し */
interface Gap {
  left: Reserved[];
  values: ValueRun[];
  right: Reserved[];
}

/** 折れ線の線分 */
const segsOf = (points: readonly Point[]): Seg[] => points.slice(1).map((q, i): Seg => [points[i] as Point, q]);

/**
 * 箱の下の口の横の位置。線の横の位置 `xs` (左から順) を `lo` から `hi` の間に寄せ、隣の口と `gap` 以上離す。
 * 右へ詰めて溢れた口は、右の端から左へ詰め直す
 */
function spreadPorts(xs: readonly number[], lo: number, hi: number, gap: number): number[] {
  const ps = xs.map((x) => Math.min(hi, Math.max(lo, x)));
  const at = (j: number): number => ps[j] as number;
  for (let j = 1; j < ps.length; j++) ps[j] = Math.max(at(j), at(j - 1) + gap);
  for (let j = ps.length - 2; j >= 0; j--) if (at(j + 1) > hi || at(j) > at(j + 1) - gap) ps[j] = Math.min(at(j), Math.min(at(j + 1), hi) - gap);
  if (ps.length > 0 && at(ps.length - 1) > hi) ps[ps.length - 1] = hi;
  return ps;
}

// パイプ図の箱を上に置く形 (Tracelyth #165) と、箱を人の列の下に集める形 (Tracelyth #166)。今の並べ方で作った部品を、
// トークンの箱を人の列の上か下に置く置き場所へ移す。下の形は上の形を上下に返した置き方で、人の丸と槽の並びは変えない。
// 人は `box` の行の順に左から1列に並べ、槽ごとにトークンの箱へパイプを引く。両端の人は列の外側から、間の人は右隣との間から上げる (下の形は下ろす)。
// 置き場所は `box` と `hold` の行だけで決まるので、呼ぶ人や引数を替えても箱と槽は動かない。呼び出しに関わらない人は薄く描く
// `cards` は箱の上に空けておく、札入れと呼び出しの札の高さ。ステップの中身で札の高さが変わっても箱を下げないよう、決まった高さで空ける。
// `boxW` と `boxH` はトークンの箱の最小の大きさ。呼び方で箱の中の値の札が出たり出なかったりしても、箱の大きさと下端を変えない
// `top` と `writes` は箱を下に集める形 (Tracelyth #166) だけが使う。`top` は人の列の上に空けておく、2人を結ぶ線と列の中どうしの呼び出しの高さ、
// `writes` は列と箱の間に空けておく、箱から人の下の札への書き換えの点線が横へ通る帯の高さ
// 箱の中の行を持つ箱か。行を持つ箱は中身に合わせた高さで描き、固定した形の最小の高さで下を空けない
const hasRows = (out: PipeLayout, id: string): boolean => (out.plates ?? []).some((p) => p.party === id && p.row && p.step === 0);
// 固定した形で広げて高くした箱に、関わる箱を囲む枠 (`pills`) と列 (`columns`) を合わせる (Tracelyth #173)。
// 合わせないと、枠が元の大きさのまま箱の上の部分だけを囲む
const fitFrames = (out: PipeLayout, p: PipeParty): void => {
  for (const x of [...out.pills, ...out.columns]) if (x.party === p.id) Object.assign(x, { x: p.x, y: p.y, w: p.w, h: p.h });
};
// 固定した形で広げた箱に、箱の中の行を合わせる (Tracelyth #175)。行の頭の印と名前は箱の左の辺へ、値と札は右の辺へ、広げた幅の半分ずつ寄せる。
// 合わせないと、行が元の幅のまま箱の真ん中に残り、値が箱の右の辺から離れる
const fitRows = (out: PipeLayout, id: string, extra: number): void => {
  if (Math.abs(extra) < 1e-3) return;
  const half = extra / 2;
  const shift = (part: unknown, dx: number): void => {
    if (part) moveParts(part, dx, 0, new Set());
  };
  for (const p of out.plates ?? []) {
    if (p.party !== id || !p.boxed) continue;
    for (const k of ROW_LEFT) shift(p[k], -half);
    for (const k of ROW_RIGHT) shift(p[k], half);
    if (p.divider) Object.assign(p.divider, { x1: round3(p.divider.x1 - half), x2: round3(p.divider.x2 + half) });
    p.x = round3(p.x - half);
    p.w = round3(p.w + extra);
  }
};
const TOP_LOOK = { gap: 132, slot: 36, outer: 36, lane: 24, port: 36, portPad: 28, turn: 34, band: 26, clear: 46, boxGap: 64, cards: 220, boxW: 200, boxH: 72, link: 34, linkTop: 44, under: 22, coin: 64, top: 124, writes: 44 } as const;
// 置き直した座標は小数3桁に丸める。元の座標の小数の誤差で、同じ置き場所が呼び方ごとにわずかにずれないように
const round3 = (v: number): number => Math.round(v * 1e3) / 1e3;
// `shape` は `top` か `bottom`。`order` はトークンの箱の並び。省くと `box` の行の順に並べる
function placeTop(composed: PipeLayout, diagram: DiagramModel, shape: "top" | "bottom" = "top", order?: readonly string[]): Placed {
  const out = structuredClone(composed) as Placed;
  const L = TOP_LOOK;
  const down = shape === "bottom";
  const parties = new Map(out.parties.map((p) => [p.id, p]));
  const party = (id: string): PipeParty => parties.get(id) as PipeParty;
  const declared = diagram.boxes.map((b) => b.id).filter((id) => parties.has(id));
  const people = declared.filter((id) => party(id).shape !== "token");
  const boxes = order ?? declared.filter((id) => party(id).shape === "token");
  const tokenBox = new Map<string, string>();
  for (const [owner, token] of simulate(diagram, new Set()).tokens) if (boxes.includes(owner)) tokenBox.set(token, owner);
  const moved = new WeakSet<object>();
  const move = (o: unknown, dx: number, dy: number, seen: Seen = moved): void => moveParts(o, dx, dy, seen);
  const OWNED = ["tanks", "glasses", "levels", "housings", "ties", "columns", "pills", "converters", "plates", "gauges", "events", "folds", "checks"] as const;
  const ownedBy = (id: string): { party?: string }[] => OWNED.flatMap((k) => (out[k] as readonly { party?: string }[]).filter((x) => x.party === id));
  const rectOf = (r: Rect): Rect => ({ x: r.x, y: r.y, w: r.w, h: r.h });
  const union = (rs: readonly Rect[]): Rect => {
    const x0 = Math.min(...rs.map((r) => r.x));
    const y0 = Math.min(...rs.map((r) => r.y));
    return { x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 };
  };
  const groupOf = (id: string): Rect => {
    const p = party(id);
    return union([rectOf(p), ...p.label ? [rectOf(p.label)] : [], ...(out.housings ?? []).filter((h) => h.party === id).map(rectOf), ...(out.tanks ?? []).filter((t) => t.party === id).map(rectOf)]);
  };
  const tanksOf = (id: string): PipeTank[] => (out.tanks ?? []).filter((t) => t.party === id).sort((a, b) => a.x - b.x);
  const n = people.length;
  const index = new Map(people.map((id, i) => [id, i]));
  const idx = (id: string): number => index.get(id) ?? 0;

  // 呼び出しは、呼ぶ人と呼ばれる物の組ごとに1本のパイプにする
  const pairs: { from: string; to: string }[] = [];
  for (const step of diagram.steps)
    for (const e of step.events) if (e.type === "call" && parties.has(e.from) && parties.has(e.to) && !pairs.some((q) => q.from === e.from && q.to === e.to)) pairs.push({ from: e.from, to: e.to });
  const middle = (n - 1) / 2;
  // 人から箱への呼び出しは、箱のある側の隣との間から上げる。列の真ん中の人は丸の上から真上へ上げる。
  // 下の形は丸の下に槽が在るので、真ん中の人も右隣との間から下ろし、1人だけの列は槽のパイプと反対の左の外側から下ろす
  const callWay = (id: string): Way => {
    if (down) return n <= 1 ? "outer-left" : idx(id) <= middle ? "right" : "left";
    return n <= 1 || idx(id) === middle ? "up" : idx(id) < middle ? "right" : "left";
  };
  // 真上へ上げる呼び出しが箱ごとに重ならないよう、箱の順に横へずらす
  const upOffset = (k: number): number => (k - (boxes.length - 1) / 2) * L.port;

  // 槽ごとのパイプの上げ方。両端の人は列の外側から、ほかの人は右隣との間 (右端の人は左隣との間) から上げる
  const values: ValueRun[] = [];
  for (const token of [...tokenBox.keys()]) {
    const box = tokenBox.get(token) as string;
    const holders = people.filter((id) => tanksOf(id).some((t) => t.token === token));
    const first = boxes.indexOf(box) === 0;
    const last = boxes.indexOf(box) === boxes.length - 1;
    holders.forEach((id, k) => {
      const i = idx(id);
      const tank = tanksOf(id).find((t) => t.token === token) as PipeTank;
      let way: Way;
      if (holders.length >= 2 && k === 0 && first) way = "outer-left";
      else if (holders.length >= 2 && k === holders.length - 1 && last) way = "outer-right";
      else if (n === 1) way = "outer-right";
      else way = i < n - 1 ? "gap-right" : "gap-left";
      values.push({ holder: id, token, box, tank, way });
    });
  }
  // 隣どうしの間ごとに通るパイプ。左の人から右へ出る呼び出し、槽のパイプ、右の人から左へ出る呼び出しの順に並べる
  const gaps = Array.from({ length: Math.max(0, n - 1) }, (): Gap => ({ left: [], values: [], right: [] }));
  for (const v of values) {
    const i = idx(v.holder);
    if (v.way === "gap-right") gaps[i]?.values.push(v);
    if (v.way === "gap-left") gaps[i - 1]?.values.push(v);
  }
  // 呼ぶ人を替えても置き場所を変えないよう、どの人がどの箱を呼んでもよい口と通り道を先に取っておく
  const reserved = people.flatMap((id) => boxes.map((b, k): Reserved => ({ from: id, to: b, k, way: callWay(id) })));
  for (const c of reserved) {
    const i = idx(c.from);
    if (c.way === "right") gaps[i]?.left.push(c);
    if (c.way === "left") gaps[i - 1]?.right.push(c);
  }
  const calls = pairs.map((q): Call => reserved.find((c) => c.from === q.from && c.to === q.to) ?? { ...q, way: "row" });
  // 下の形では、丸から出る呼び出しが槽から出るパイプより上で横へ出るので、隣との間の外寄りを呼び出しに、人寄りを槽のパイプに渡す。
  // 左の人の槽のパイプ、左の人の呼び出し、右の人の呼び出し、右の人の槽のパイプの順に並べると、横へ出る線と下りる線が交わらない
  const slotsOf = (g: Gap): Item[] => {
    if (!down) return [...g.left, ...g.values, ...g.right];
    const mine = g.values.filter((v) => v.way === "gap-right");
    return [...mine, ...g.left, ...g.right, ...g.values.filter((v) => v.way !== "gap-right")];
  };
  const gapW = gaps.map((g) => Math.max(L.gap, (slotsOf(g).length + 1) * L.slot));
  const outerLeft = values.filter((v) => v.way === "outer-left");
  const outerRight = values.filter((v) => v.way === "outer-right");
  const outerCalls = reserved.filter((c) => c.way === "outer-left");

  // 人を左から並べる (縦の位置は後で決める)
  const delta = new Map<string, [number, number]>();
  const shiftOf = (id: string): [number, number] => delta.get(id) ?? [0, 0];
  let cursor = P.margin + L.lane + (outerLeft.length + outerCalls.length) * L.outer + L.lane;
  const spans: { x: number; w: number }[] = [];
  people.forEach((id, i) => {
    const g = groupOf(id);
    delta.set(id, [cursor - g.x, 0]);
    spans.push({ x: cursor, w: g.w });
    cursor += g.w + (gapW[i] ?? 0);
  });
  const centerOf = (id: string): number => {
    const p = party(id);
    return p.x + shiftOf(id)[0] + p.w / 2;
  };
  const rowCenter = n === 0 ? P.margin + 200 : (centerOf(people[0] as string) + centerOf(people[n - 1] as string)) / 2;

  // 箱の幅は、下から入るパイプの口が並ぶだけ広げる
  const entering = (box: string): number => values.filter((v) => v.box === box && !v.way.startsWith("outer")).length + reserved.filter((c) => c.to === box).length;
  const widths = boxes.map((id) => Math.max(party(id).w, (entering(id) - 1) * L.port + L.portPad * 2, L.boxW));
  const heights = boxes.map((id) => (hasRows(out, id) ? party(id).h : Math.max(party(id).h, L.boxH)));
  const total = widths.reduce((s, w) => s + w, 0) + Math.max(0, boxes.length - 1) * L.boxGap;
  const boxX = new Map<string, number>();
  let bx = rowCenter - total / 2;
  boxes.forEach((id, k) => {
    boxX.set(id, bx);
    bx += (widths[k] ?? 0) + L.boxGap;
  });

  // 隣との間のパイプの横の位置
  const riserX = new Map<Item, number>();
  gaps.forEach((g, i) => {
    const span = spans[i] as { x: number; w: number };
    const x0 = span.x + span.w;
    slotsOf(g).forEach((item, j, all) => riserX.set(item, x0 + ((j + 1) * (gapW[i] ?? 0)) / (all.length + 1)));
  });
  const leftEdge = spans[0]?.x ?? P.margin;
  const lastSpan = spans[n - 1];
  const rightEdge = lastSpan ? lastSpan.x + lastSpan.w : P.margin;
  outerLeft.forEach((v, j) => riserX.set(v, leftEdge - L.lane - j * L.outer));
  outerRight.forEach((v, j) => riserX.set(v, rightEdge + L.lane + j * L.outer));
  // 外側から下ろす呼び出しは、槽のパイプより外を通す。丸から出る線が槽から出る線の上で横へ出るため
  outerCalls.forEach((c, j) => riserX.set(c, leftEdge - L.lane - (outerLeft.length + j) * L.outer));
  for (const c of reserved) if (c.way === "up") riserX.set(c, centerOf(c.from) + upOffset(c.k));

  // 箱の下の口。パイプを横の順に並べ、口どうしを離す
  const portX = new Map<Item, number>();
  const turnOf = new Map<Item, number>();
  let levels = 0;
  boxes.forEach((id, k) => {
    const lo = (boxX.get(id) ?? 0) + L.portPad;
    const hi = (boxX.get(id) ?? 0) + (widths[k] ?? 0) - L.portPad;
    const riser = (item: Item): number => riserX.get(item) ?? 0;
    const list: Item[] = [...values.filter((v) => v.box === id && !v.way.startsWith("outer")), ...reserved.filter((c) => c.to === id)].sort((a, b) => riser(a) - riser(b));
    const ps = spreadPorts(list.map(riser), lo, hi, L.port);
    list.forEach((item, j) => portX.set(item, ps[j] ?? lo));
    // 口へ横に寄るパイプは、口から遠いパイプほど箱の近くで曲げて、ほかのパイプを越えない
    const lefts = list.filter((item) => riser(item) < (portX.get(item) ?? 0) - 0.5);
    const rights = list.filter((item) => riser(item) > (portX.get(item) ?? 0) + 0.5).reverse();
    lefts.forEach((item, j) => turnOf.set(item, j));
    rights.forEach((item, j) => turnOf.set(item, j));
    levels = Math.max(levels, lefts.length, rights.length);
  });

  // 縦の位置。上の形は箱、曲げる帯、人の列の順に上から置き、箱は下端を揃え、値の札が多い箱は上へ伸ばす。
  // 下の形は人の列、書き換えの点線が横へ通る帯、曲げる帯、箱の順に上から置き、箱は上端を揃えて下へ伸ばす。
  // 下の形の2人を結ぶ線と列の中どうしの呼び出しは、上の形で箱の無い側を通すのに倣って列の上を通し、列の上に決まった高さ (`top`) を空ける。
  // 線の有る無しは呼び方で変わるので、線の分だけ箱や列を動かさない
  const rowCalls = calls.filter((c) => c.way === "row").length;
  const fromBox = calls.filter((c) => c.way === "row" && parties.get(c.from)?.shape === "token" && parties.get(c.to)?.shape !== "token");
  let boxTop: number;
  let boxBottom: number;
  let bandTop: number;
  let rowTop: number;
  let laneBelow = 0;
  if (!down) {
    boxTop = P.margin + L.cards;
    boxBottom = boxTop + L.boxH;
    bandTop = boxBottom + L.band;
    rowTop = bandTop + levels * L.turn + L.clear + rowCalls * L.under;
  } else {
    rowTop = P.margin + L.top;
    const reach = Math.max(0, ...people.map((id) => {
      const g = groupOf(id);
      return g.y + g.h - party(id).y;
    }));
    laneBelow = rowTop + reach + L.under;
    boxTop = laneBelow + L.writes + L.clear / 2 + levels * L.turn + L.band;
    boxBottom = boxTop + L.boxH;
    bandTop = boxTop - L.band;
  }
  for (const id of people) delta.set(id, [shiftOf(id)[0], rowTop - party(id).y]);
  boxes.forEach((id, k) => {
    const p = party(id);
    delta.set(id, [(boxX.get(id) ?? 0) - p.x + ((widths[k] ?? 0) - p.w) / 2, (down ? boxTop : boxBottom - (heights[k] ?? 0)) - p.y]);
  });

  // 人と箱と、それが持つ部品を動かす
  for (const id of [...people, ...boxes]) {
    const [dx, dy] = shiftOf(id);
    move(party(id), dx, dy);
    for (const part of ownedBy(id)) move(part, dx, dy);
  }
  boxes.forEach((id, k) => {
    const p = party(id);
    const extra = (widths[k] ?? p.w) - p.w;
    p.x -= extra / 2;
    p.w = widths[k] ?? p.w;
    p.h = heights[k] ?? p.h;
    if (p.label) p.label.x = p.x + p.w / 2 - p.label.w / 2;
    if (p.sub) p.sub.x = p.x + p.w / 2 - p.sub.w / 2;
    fitFrames(out, p);
    fitRows(out, id, extra);
  });
  // 確かめの計器は、確かめた箱の上の真ん中に載せ、軸を箱の上端へ下ろす。札入れと呼び出しの札は計器の左右に出す。
  // 下の形は、箱の下の真ん中に吊るし、軸を箱の下端から計器の上端へ下ろす
  for (const g of out.gauges ?? []) {
    const p = parties.get(g.party);
    if (!p || !boxes.includes(g.party)) continue;
    const cx = round3(p.x + p.w / 2 - (P.gauge.lampGap + P.gauge.lamp * 2) / 2);
    const cy = round3(down ? p.y + p.h + P.gauge.stemGap + g.r : p.y - P.gauge.stemGap - g.r);
    const stem = down ? { y1: round3(p.y + p.h), y2: round3(cy - g.r) } : { y1: cy + g.r, y2: p.y };
    Object.assign(g, { cx, cy, x: cx - g.r, y: cy - g.r, lamp: { ...g.lamp, x: cx + g.r + P.gauge.lampGap, y: cy - g.r + 4 }, stem });
  }
  const boxOfToken = (token: string): string | undefined => tokenBox.get(token);
  for (const c of out.chips ?? []) {
    if (c.kind === "return") continue;
    const owner = c.party !== undefined && delta.has(c.party) ? c.party : c.token !== undefined ? boxOfToken(c.token) : undefined;
    const [dx, dy] = owner ? shiftOf(owner) : shiftOf(boxes[0] ?? "");
    move(c, dx, dy);
  }
  // 自分の札への書き換えと、箱の中の札への書き換えは、札を持つ物と一緒に動かす。人の下の札への書き換えは、パイプを引き直した後に引く
  for (const w of out.writes ?? []) {
    if (w.from !== w.to && !boxes.includes(w.to)) continue;
    const [dx, dy] = shiftOf(w.to);
    move(w, dx, dy);
  }

  // パイプを引き直す
  const PORT_Y = P.tank.ports[0] as number;
  const box = (id: string): PipeParty => party(id);
  // 横から入るパイプの高さは、箱の最小の高さの真ん中に揃え、箱が上へ伸びても動かさない
  const mid = (): number => boxBottom - L.boxH / 2;
  // パイプが箱に入る口の高さ。上の形は箱の下端、下の形は箱の上端
  const bottom = (): number => down ? boxTop : boxBottom;
  const housingOf = (id: string) => (out.housings ?? []).find((h) => h.party === id);
    const turnY = (item: Item): number => bandTop + (down ? -1 : 1) * (turnOf.get(item) ?? 0) * L.turn;
  // 横の位置 x から箱の下の口まで上げる
  const rise = (item: Item, x: number): Point[] => {
    const px = portX.get(item);
    if (px === undefined || Math.abs(px - x) < 0.5) return [[px ?? x, bottom()]];
    return [[x, turnY(item)], [px, turnY(item)], [px, bottom()]];
  };
  // 槽の横の口。その側に槽か札が並ぶ時は、槽の下から出て入れ物の下を回る
  const exitOf = (v: ValueRun, side: "left" | "right"): Point[] => {
    const t = v.tank;
    const cx = (r: Rect): number => r.x + r.w / 2;
    const others: Rect[] = [...tanksOf(v.holder), ...(out.plates ?? []).filter((p) => p.party === v.holder)].filter((o) => o !== t);
    const outer = others.every((o) => side === "left" ? cx(o) > cx(t) : cx(o) < cx(t));
    if (outer) return [[side === "left" ? t.x : t.x + t.w, t.y + PORT_Y]];
    const h = housingOf(v.holder);
    const below = (h ? h.y + h.h : t.y + t.h) + L.under;
    return [[t.x + t.w / 2, t.y + t.h], [t.x + t.w / 2, below]];
  };
  const valueRoute = (v: ValueRun): Point[] => {
    const x = riserX.get(v) ?? 0;
    if (v.way === "outer-left") {
      const start = exitOf(v, "left");
      const y0 = (start[start.length - 1] as Point)[1];
      return simplifyPath([...start, [x, y0], [x, mid()], [box(v.box).x, mid()]]);
    }
    if (v.way === "outer-right") {
      const start = exitOf(v, "right");
      const y0 = (start[start.length - 1] as Point)[1];
      return simplifyPath([...start, [x, y0], [x, mid()], [box(v.box).x + box(v.box).w, mid()]]);
    }
    const start = exitOf(v, x > v.tank.x + v.tank.w / 2 ? "right" : "left");
    const y0 = (start[start.length - 1] as Point)[1];
    return simplifyPath([...start, [x, y0], ...rise(v, x)]);
  };
  const routeOf = new Map(values.map((v) => [v, valueRoute(v)]));
  const sideOf = (v: ValueRun, pt: Point): PipePort["side"] => Math.abs(pt[1] - bottom()) < 0.5 ? down ? "top" : "bottom" : pt[0] <= box(v.box).x + 0.5 ? "left" : "right";
  out.valuePipes = values.map((v, k): PipeValuePipe => {
    const pts = routeOf.get(v) as Point[];
    const a = pts[0] as Point;
    const b = pts[pts.length - 1] as Point;
    return {
      token: v.token,
      from: v.holder,
      to: v.box,
      holder: v.holder,
      points: pts,
      ports: [
        { party: v.holder, token: v.token, side: a[0] <= v.tank.x + 0.5 ? "left" : a[0] >= v.tank.x + v.tank.w - 0.5 ? "right" : "bottom", x: a[0], y: a[1] },
        { party: v.box, token: v.token, side: sideOf(v, b), x: b[0], y: b[1] }
      ],
      tone: v.tank.tone ?? 0,
      group: `v${k}`
    };
  });
  out.stubs = [];
  out.crossings = [];
  out.buses = [];
  out.pipes = [];

  // 移動は、送る人の槽からトークンの箱を通って受ける人の槽へ流す
  const routeFor = (holder: string, token: string): Point[] | undefined => {
    const v = values.find((x) => x.holder === holder && x.token === token);
    return v ? routeOf.get(v) : undefined;
  };
  for (const f of out.flows ?? []) {
    const a = routeFor(f.from, f.token);
    const b = routeFor(f.to, f.token);
    const id = boxOfToken(f.token);
    if (!a || !b || !id) continue;
    const pa = a[a.length - 1] as Point;
    const pb = b[b.length - 1] as Point;
    const m0 = mid();
    f.points = simplifyPath([...a, [pa[0], m0], [pb[0], m0], ...[...b].reverse()]);
    f.arrow = flowArrow(f.points);
  }
  // ETH は箱を持たないので、値が動いた2人の槽を、入れ物の下を通るパイプで結ぶ (Tracelyth #168)。2人を結ぶ線はそのパイプより下を通す
  const ethTank = (id: string): PipeTank | undefined => (out.tanks ?? []).find((t) => t.party === id && t.token === ETH);
  const eth = ethPairs(out.flows, index).filter((q) => ethTank(q.from) && ethTank(q.to));
  let ethLow = 0;
  const ethChips: PipeChip[] = [];
  if (eth.length > 0) {
    const floor = Math.max(...people.map((id) => {
      const h = housingOf(id);
      const g = groupOf(id);
      return h ? h.y + h.h : g.y + g.h;
    })) + L.under + ROW_LOOK.lane;
    const dim = fadedPeople(diagram, parties, people);
    for (const [q, pts] of underRoutes(eth.map((q) => ({ ...q, a: ethTank(q.l) as PipeTank, b: ethTank(q.r) as PipeTank })), floor)) {
      out.valuePipes.push(pairPipe(ETH, q.from, q.to, q.from === q.l ? pts : [...pts].reverse(), (id) => ethTank(id) as PipeTank, dim, out.valuePipes.length));
      ethLow = Math.max(ethLow, ...pts.map((p) => p[1]));
    }
    for (const f of out.flows ?? []) {
      const pp = out.valuePipes.find((v) => v.token === ETH && (v.from === f.from && v.to === f.to || v.from === f.to && v.to === f.from));
      if (f.token !== ETH || !pp) continue;
      f.points = (pp.from === f.from ? pp.points : [...pp.points].reverse()).map((p): Point => [p[0], p[1]]);
      f.arrow = flowArrow(f.points);
    }
    for (const c of out.chips ?? []) if (c.kind === "amount" && c.token === ETH) ethChips.push(...chipUnderFlow(c, out.flows ?? []));
  }

  // 呼び出しのパイプ
  const roundOf = (id: string): PipeParty | undefined => parties.get(id);
  const callRoute = (c: Call): Point[] | undefined => {
    const from = roundOf(c.from);
    const to = roundOf(c.to);
    if (!from || !to) return undefined;
    const cy = from.y + from.h / 2;
    if (c.way === "up") return simplifyPath([[riserX.get(c) ?? 0, from.y], ...rise(c, riserX.get(c) ?? 0)]);
    if (c.way === "right" || c.way === "left" || c.way === "outer-left") {
      const x = riserX.get(c) ?? 0;
      const start: Point = [c.way === "right" ? from.x + from.w : from.x, cy];
      return simplifyPath([start, [x, cy], ...rise(c, x)]);
    }
    // 列の中どうしの呼び出しは、列のすぐ上を通って上から入る。箱から列への呼び出しは、箱の下から下りる
    const k = calls.filter((x) => x.way === "row").indexOf(c);
    const laneY = rowTop - L.under * (k + 1);
    const fx = from.x + from.w / 2;
    const tx = to.x + to.w / 2;
    const fy = from.shape === "token" ? from.y + from.h : from.y;
    if (from.shape === "token" && to.shape === "token") {
      const right = tx > fx;
      return [[right ? from.x + from.w : from.x, from.y + from.h / 2], [right ? to.x : to.x + to.w, to.y + to.h / 2]];
    }
    // 下の形で箱から列の人を呼ぶ時は、箱の上から書き換えの帯の下を横へ通り、呼ばれる人の組の右の横を上がって丸の横から入る
    if (down && from.shape === "token") {
      const y = laneBelow + L.writes - 4 - (fromBox.indexOf(c) % 4) * 8;
      const g = groupOf(c.to);
      const gx = g.x + g.w + 10;
      const ty = to.y + to.h / 2;
      return simplifyPath([[fx, from.y], [fx, y], [gx, y], [gx, ty], [to.x + to.w, ty]]);
    }
    return simplifyPath([[fx, fy], [fx, laneY], [tx, laneY], [tx, to.shape === "token" ? to.y + to.h : to.y]]);
  };
  const callPts = new Map(calls.map((c) => [`${c.from}>${c.to}`, callRoute(c)]));
  for (const c of out.calls ?? []) {
    const pts = callPts.get(`${c.from}>${c.to}`);
    if (!pts) continue;
    c.points = pts.map((p): Point => [p[0], p[1]]);
    c.lit = pts.map((p): Point => [p[0], p[1]]);
    c.y = (pts[0] as Point)[1];
  }
  for (const l of out.lanes ?? []) {
    const pts = callPts.get(`${l.from}>${l.to}`);
    if (pts) l.points = pts.map((p): Point => [p[0], p[1]]);
  }
  for (const m of out.mains ?? []) {
    m.points = [];
    for (const b of m.branches ?? []) {
      const pts = callPts.get(`${m.from}>${b.to}`);
      if (!pts) continue;
      b.points = pts.map((p): Point => [p[0], p[1]]);
      const p0 = pts[0] as Point;
      const p1 = pts[1];
      const flat = p1 && Math.abs(p1[1] - p0[1]) < 0.5 && Math.abs(p1[0] - p0[0]) >= P.call.valveAt + P.valve.r * 2;
      const dir = p1 ? Math.sign((flat ? p1[0] - p0[0] : p1[1] - p0[1]) || -1) : -1;
      b.valve = flat ? { x: p0[0] + dir * P.call.valveAt, y: p0[1], vertical: false, under: false } : { x: p0[0], y: p0[1] + dir * P.call.valveAt, vertical: true, under: false };
    }
    m.y = m.branches?.[0]?.points?.[0]?.[1] ?? m.y;
  }
  for (const c of out.chips ?? []) {
    if (c.kind !== "return" || !c.path) continue;
    const call = (out.calls ?? []).find((x) => x.close?.step === c.step && x.close?.event === c.event) ?? (out.calls ?? []).find((x) => x.depth === 0);
    if (!call) continue;
    const back = [...call.points].reverse().map((p): Point => [p[0], p[1]]);
    const [ox, oy] = c.path[0] as Point;
    const head = back[0] as Point;
    c.path = back;
    move(c, head[0] - ox, head[1] - oy, new WeakSet<object>([c.path]));
  }

  // 書き換えの点線は、書いた物から人の下の札まで引く。列の上の空きを横へ通り、札を持つ人の丸と名前の横から札へ下りる。
  // 箱からは箱の下の、ほかのパイプから離れた所から下り、列の中のコントラクトからは丸の上の真ん中の横から上がる
  const verticals = [...out.valuePipes, ...(out.calls ?? [])].flatMap((l) =>
    segsOf(l.points ?? [])
      .filter(([p, q]) => Math.abs(p[0] - q[0]) < 0.5)
      .map(([p, q]) => ({ x: p[0], y1: Math.min(p[1], q[1]), y2: Math.max(p[1], q[1]) })),
  );
  const laneTop = rowTop - rowCalls * L.under - L.clear;
  const drawn: PipeLayout["writes"] = [];
  for (const w of out.writes ?? []) {
    if (w.from === w.to || boxes.includes(w.to)) continue;
    const plate = (out.plates ?? []).find((p) => p.party === w.to && p.name === w.name);
    const writer = parties.get(w.from);
    const holder = parties.get(w.to);
    if (!plate || !writer || !holder) {
      w.points = [];
      continue;
    }
    const same = drawn.filter((d) => d.step === w.step);
    const px = plate.x + plate.w / 2;
    // 下の形で箱から書き換える時は、箱の上から列の下の帯へ上がり、横へ通って札の下から入る
    if (down && writer.shape === "token") {
      const yb = laneBelow + 12 + (same.length % 4) * 8;
      const y1 = writer.y;
      const near = verticals.filter((v) => v.y2 > yb + 0.5 && v.y1 < y1 - 0.5);
      const room = (x: number): number => Math.min(Infinity, ...near.map((v) => Math.abs(v.x - x)));
      const spots: number[] = [];
      for (let x = writer.x + 14; x <= writer.x + writer.w - 14; x += 2) spots.push(round3(x));
      const free = spots.filter((x) => room(x) >= 14);
      const x0 = free.length > 0 ? free.reduce((a, b) => Math.abs(b - px) < Math.abs(a - px) ? b : a) : spots.reduce((a, b) => room(b) > room(a) ? b : a);
      w.points = simplifyPath([[x0, y1], [x0, yb], [px, yb], [px, plate.y + plate.h]]);
      verticals.push({ x: x0, y1: yb, y2: y1 }, { x: px, y1: plate.y + plate.h, y2: yb });
      drawn.push(w);
      continue;
    }
    const y = laneTop + 12 + (same.length % 4) * 8;
    const guard = union([rectOf(holder), ...holder.label ? [rectOf(holder.label)] : []]);
    const xd = px > guard.x - 6 && px < guard.x + guard.w + 6 ? px >= guard.x + guard.w / 2 ? guard.x + guard.w + 8 : guard.x - 8 : px;
    const h = housingOf(w.to);
    const shelf = h ? (h.y + plate.y) / 2 : plate.y - 10;
    const tail: Point[] = xd >= plate.x + 6 && xd <= plate.x + plate.w - 6 ? [[xd, plate.y]] : [[xd, shelf], [px, shelf], [px, plate.y]];
    let start: Point[];
    if (writer.shape === "token") {
      const y1 = writer.y + writer.h;
      const near = verticals.filter((v) => v.y2 > y1 + 0.5 && v.y1 < y - 0.5);
      const room = (x: number): number => Math.min(Infinity, ...near.map((v) => Math.abs(v.x - x)));
      const spots: number[] = [];
      for (let x = writer.x + 14; x <= writer.x + writer.w - 14; x += 2) spots.push(round3(x));
      const free = spots.filter((x) => room(x) >= 14);
      const x0 = free.length > 0 ? free.reduce((a, b) => Math.abs(b - xd) < Math.abs(a - xd) ? b : a) : spots.reduce((a, b) => room(b) > room(a) ? b : a);
      start = [[x0, y1], [x0, y]];
    } else {
      const side = xd >= writer.x + writer.w / 2 ? 1 : -1;
      const x0 = writer.x + writer.w / 2 + side * Math.min(16 + same.filter((d) => d.from === w.from).length * 8, writer.w / 2 - 4);
      start = [[x0, writer.y], [x0, y]];
    }
    w.points = simplifyPath([...start, [xd, y], ...tail]);
    const s0 = start[0] as Point;
    verticals.push({ x: s0[0], y1: Math.min(s0[1], y), y2: Math.max(s0[1], y) }, { x: xd, y1: y, y2: plate.y });
    drawn.push(w);
  }

  // 2人を結ぶ線は、槽の下を通す。同じ人の同じ側に着く線は、下を通る線ほど内側に端を置き、線どうしが交わらない
  const exitsBelow = (v: ValueRun): boolean => {
    const first = routeOf.get(v)?.[0];
    return first !== undefined && Math.abs(first[1] - (v.tank.y + v.tank.h)) < 0.5;
  };
  const lowest = Math.max(ethLow, ...people.map((id) => {
    const h = housingOf(id);
    const g = groupOf(id);
    return (h ? h.y + h.h : g.y + g.h) + (values.some((v) => v.holder === id && exitsBelow(v)) ? L.under : 0);
  }));
  const keyOf = (l: { owner: string; name: string }): string => `${l.owner}\0${l.name}`;
  const groups = [...new Set((out.links ?? []).map(keyOf))];
  // 下の形は、2人を結ぶ線を列の上の、列の中どうしの呼び出しより上に通す。丸の上から線を出す
  const linkY = (g: string): number => down ? rowTop - rowCalls * L.under - L.linkTop / 2 - (groups.length - 1 - groups.indexOf(g)) * L.link : lowest + L.linkTop + (groups.length - 1 - groups.indexOf(g)) * L.link;
  const farFromRow = (g: string): number => Math.abs(linkY(g) - rowTop);
  const firstOf = new Map<string, PipeLayout["links"][number]>();
  for (const l of out.links ?? []) if (!firstOf.has(keyOf(l)) && parties.has(l.from) && parties.has(l.to)) firstOf.set(keyOf(l), l);
  const middleOf = (id: string): number => party(id).x + party(id).w / 2;
  const endX = new Map<string, number>();
  for (const id of new Set([...firstOf.values()].flatMap((l) => [l.from, l.to]))) {
    for (const side of [-1, 1]) {
      const mine = [...firstOf.entries()].filter(([, l]) => (l.from === id || l.to === id) && Math.sign(middleOf(l.from === id ? l.to : l.from) - middleOf(id)) === side).map(([g]) => g).sort((a, b) => farFromRow(b) - farFromRow(a));
      mine.forEach((g, i) => endX.set(`${g}\0${id}`, middleOf(id) + side * (10 + i * 8)));
    }
  }
  for (const l of out.links ?? []) {
    const a = parties.get(l.from);
    const b = parties.get(l.to);
    if (!a || !b) continue;
    const y = linkY(keyOf(l));
    // 入れ物の無い人は、名前の下から線を出す。下の形は丸の上から出す
    const foot = (id: string): number => {
      const h = housingOf(id);
      const p = party(id);
      if (down) return p.y;
      return h ? h.y + h.h : Math.max(p.y + p.h, p.label ? p.label.y + p.label.h + 4 : 0);
    };
    const ax = endX.get(`${keyOf(l)}\0${l.from}`) ?? middleOf(l.from);
    const bx2 = endX.get(`${keyOf(l)}\0${l.to}`) ?? middleOf(l.to);
    l.points = [[ax, foot(l.from)], [ax, y], [bx2, y], [bx2, foot(l.to)]];
    const lw = l.label.w + (l.delta ? 6 + l.delta.w : 0);
    l.label.x = (ax + bx2) / 2 - lw / 2;
    l.label.y = y - l.label.h / 2;
    if (l.delta) {
      l.delta.x = l.label.x + l.label.w + 6;
      l.delta.y = l.label.y;
    }
  }

  const faded = fadedPeople(diagram, parties, people);

  // 形と箱の並びの点数 (Tracelyth #166)。値のパイプと、2人を結ぶ線と、どの人がどの箱を呼んでもよいように取っておいた呼び出しのパイプの
  // 交わりの数と長さの合計を数える。呼ぶ人と引数で点数が変わらないよう、実際の呼び出しではなく取っておいた全ての呼び出しを数える
  const seenLink = new Set<string>();
  const scored = [
    ...values.map((v) => ({ kind: "value" as const, from: v.holder, pts: routeOf.get(v) })),
    ...reserved.map((c) => ({ kind: "call" as const, from: c.from, pts: callRoute(c) })),
    ...(out.links ?? []).filter((l) => !seenLink.has(keyOf(l)) && seenLink.add(keyOf(l))).map((l) => ({ kind: "link" as const, from: keyOf(l), pts: l.points })),
  ].flatMap((l) => (l.pts !== undefined && l.pts.length > 1 ? [{ ...l, pts: l.pts }] : []));
  const score = fixedScore(scored);

  // 図の大きさを測り、左上の余白を揃える
  const rects = [
    ...out.parties.flatMap((p) => [rectOf(p), ...p.label ? [rectOf(p.label)] : []]),
    ...(out.housings ?? []).map(rectOf),
    ...(out.tanks ?? []).map(rectOf),
    ...(out.plates ?? []).map(rectOf),
    ...(out.gauges ?? []).map(rectOf),
    ...(out.links ?? []).flatMap((l) => [l.label, ...l.delta ? [l.delta] : []].map(rectOf)),
    ...[...(out.calls ?? []), ...(out.links ?? [])].flatMap((l) => (l.points ?? []).map((p) => ({ x: p[0] - 12, y: p[1] - 12, w: 24, h: 24 }))),
    // 移動の札は値のパイプの角を通るので、札の半分の幅を角の外に取る。移動の有る無しで余白を変えないよう、値のパイプの角には決まった幅を取り、
    // それより長い札の時だけ札の幅を取る
    ...out.valuePipes.flatMap((l) => (l.points ?? []).map((p) => ({ x: p[0] - L.coin, y: p[1] - 12, w: L.coin * 2, h: 24 }))),
    ...(out.flows ?? []).flatMap((f) => {
      const label = (out.chips ?? []).find((c) => c.step === f.step && c.kind === "amount" && c.token === f.token)?.text ?? `${f.amount} ${f.token}`;
      const half = (textWidth(label, T.chip) + FLOW_MOVE.coinPad * 2) * FLOW_MOVE.scale / 2;
      const tall = FLOW_MOVE.coinH * FLOW_MOVE.scale / 2;
      return (f.points ?? []).map((p) => ({ x: p[0] - half, y: p[1] - tall, w: half * 2, h: tall * 2 }));
    }),
    ...ethChips.map(rectOf)
  ];
  const all = union(rects);
  const dx0 = P.margin - all.x;
  // 札入れと呼び出しの札の高さを、上の形は箱の上に、下の形は箱の下に空けておく。上の形で値の札と残高の行が多い箱は上へ伸びるので、
  // 伸びた箱の上端から札の高さを空け、札の数で図の位置を変えない (Tracelyth #171)
  const highestBox = Math.min(boxTop, ...boxes.map((id) => party(id).y));
  const dy0 = P.margin - Math.min(all.y, down ? rowTop - L.top : highestBox - L.cards);
  const lowestBox = Math.max(-Infinity, ...boxes.map((id) => party(id).y + party(id).h));
  const fresh = new WeakSet<object>();
  for (const [k, v] of Object.entries(out)) if (k !== "width" && k !== "height" && typeof v === "object") move(v, dx0, dy0, fresh);
  out.width = round3(all.w + P.margin * 2);
  out.height = round3((down ? Math.max(all.y + all.h, lowestBox + L.cards) : all.y + all.h) + dy0 + P.margin);
  for (const f of out.focus ? [out.focus].flat() : []) Object.assign(f, { x: P.margin, y: P.margin, w: out.width - P.margin * 2, h: out.height - P.margin * 2 });
  // `order` は人と箱の行の並び。トークンの箱の行の場所に、選んだ箱の並びを入れる
  let t = 0;
  const written = declared.map((id) => (party(id).shape === "token" ? (boxes[t++] ?? id) : id));
  out.fixed = { shape, faded, score, order: written };
  return out;
}
// 線の交わりの数と長さの合計。線は縦と横の線分だけを持つ。同じ人から出る呼び出しは1本のパイプから枝分かれするので、互いに数えない
function fixedScore(lines2: readonly { kind: "value" | "call" | "link"; from: string; pts: readonly Point[] }[]): { crossings: number; length: number } {
  const E = 0.5;
  const lo = (a: number, b: number): number => Math.min(a, b);
  const hi = (a: number, b: number): number => Math.max(a, b);
  const within = (v: number, a: number, b: number): boolean => v >= lo(a, b) - E && v <= hi(a, b) + E;
  const inner = (v: number, a: number, b: number): boolean => v > lo(a, b) + E && v < hi(a, b) - E;
  const flat = ([p, q]: Seg): boolean => Math.abs(p[1] - q[1]) < E;
  const upright = ([p, q]: Seg): boolean => Math.abs(p[0] - q[0]) < E;
  const overlap = (a0: number, a1: number, b0: number, b1: number): boolean => hi(lo(a0, a1), lo(b0, b1)) < lo(hi(a0, a1), hi(b0, b1)) - E;
  const meet = (s: Seg, u: Seg): boolean => {
    const [p, q] = s;
    const [r, w] = u;
    if (flat(s) && upright(u)) return within(r[0], p[0], q[0]) && within(p[1], r[1], w[1]) && (inner(r[0], p[0], q[0]) || inner(p[1], r[1], w[1]));
    if (upright(s) && flat(u)) return meet(u, s);
    if (flat(s) && flat(u)) return Math.abs(p[1] - r[1]) < E && overlap(p[0], q[0], r[0], w[0]);
    if (upright(s) && upright(u)) return Math.abs(p[0] - r[0]) < E && overlap(p[1], q[1], r[1], w[1]);
    return false;
  };
  const segs = lines2.map((l) => segsOf(l.pts).filter(([p, q]) => Math.hypot(q[0] - p[0], q[1] - p[1]) > E));
  let crossings = 0;
  for (let i = 0; i < lines2.length; i++)
    for (let j = i + 1; j < lines2.length; j++) {
      const a = lines2[i];
      const b = lines2[j];
      if (a?.kind === "call" && b?.kind === "call" && a.from === b.from) continue;
      for (const s of segs[i] ?? []) for (const u of segs[j] ?? []) if (meet(s, u)) crossings++;
    }
  const length = segs.flat().reduce((sum, [p, q]) => sum + Math.hypot(q[0] - p[0], q[1] - p[1]), 0);
  return { crossings, length: round3(length) };
}
// 部品の座標を (dx, dy) だけ動かす。`seen` に入れた物は2度動かさない
function moveParts(o: unknown, dx: number, dy: number, seen: Seen): void {
  const walk = (v: unknown): void => {
    if (v === null || typeof v !== "object" || seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) {
      if (v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number") {
        v[0] = round3(v[0] + dx);
        v[1] = round3(v[1] + dy);
        return;
      }
      for (const x of v) walk(x);
      return;
    }
    const rec = v as Record<string, unknown>;
    for (const [k, x] of Object.entries(rec)) {
      if (typeof x === "number") {
        if (k === "x" || k === "cx" || k === "x1" || k === "x2") rec[k] = round3(x + dx);
        else if (k === "y" || k === "cy" || k === "y1" || k === "y2" || k === "base") rec[k] = round3(x + dy);
      } else walk(x);
    }
  };
  walk(o);
}
// 同じ点の続きと、真っすぐ並ぶ3点の真ん中を除く
export function simplifyPath(pts: readonly Point[]): Point[] {
  const a = pts.filter((p, i) => {
    const q = pts[i - 1];
    return q === undefined || Math.abs(p[0] - q[0]) > 0.01 || Math.abs(p[1] - q[1]) > 0.01;
  });
  return a.filter((p, i) => {
    const u = a[i - 1];
    const w = a[i + 1];
    if (u === undefined || w === undefined) return true;
    return !((Math.abs(u[0] - p[0]) < 0.01 && Math.abs(p[0] - w[0]) < 0.01) || (Math.abs(u[1] - p[1]) < 0.01 && Math.abs(p[1] - w[1]) < 0.01));
  });
}
// 呼び出しに関わらない人 (Tracelyth #165)。呼ぶ人、呼び出しの引数に出てくる人、移動とストレージの書き換えのキーに出てくる人を濃く描き、残りを薄く描く
function fadedPeople(diagram: DiagramModel, parties: ReadonlyMap<string, unknown>, people: readonly string[]): string[] {
  const lit = new Set<string>();
  const byName = new Map(diagram.boxes.map((b) => [b.name, b.id]));
  const holdsOf = diagram.pipe?.holds ?? [];
  for (const step of diagram.steps)
    for (const e of step.events) {
      if (e.type === "call") {
        lit.add(e.from).add(e.to);
        const inside = /\((.*)\)/su.exec(e.label ?? "")?.[1] ?? "";
        for (const word of inside.match(/[\p{L}\p{N}_.-]+/gu) ?? []) if (parties.has(word)) lit.add(word);
      }
      if (e.type === "move") lit.add(e.from).add(e.to);
      if (e.type === "write") {
        const hold = holdsOf.find((h) => "name" in h && h.box === e.box && h.name === e.name);
        const link = hold && "name" in hold ? hold.link : undefined;
        if (link) for (const id of [link.from, link.to, link.on]) if (id !== undefined) lit.add(id);
        for (const m of (e.name ?? "").matchAll(/\[([^\]]+)\]/gu)) {
          const key = m[1] ?? "";
          const id = byName.get(key) ?? (parties.has(key) ? key : undefined);
          if (id !== undefined) lit.add(id);
        }
      }
    }
  return people.filter((id) => !lit.has(id));
}
// 槽をトークンごとの行に並べる3つの形 (Tracelyth #168) の寸法。
// `gap` は人の列の入れ物どうしの間、`tie` は人の名前から最初の行の入れ物までの間、`rowGap` はトークンの行どうしの間、`lane` は横へ通るパイプどうしの間、
// `up` は同じ人から別の箱へ上げる呼び出しどうしの横の間、`linkOut` は丸の上から出す2人を結ぶ線の、丸の真ん中からの隔たり、`entry` は呼び出しの入口と縁の間。
// `drop` は帳簿型で人の名前から張り出しまでの間、`tabPad` は張り出しの左の縁と箱の間、`encPad` は囲みと入れ物の間、`gauge` は囲みの下に吊るす計器の高さ。
// `slotIn` と `slotOut` は槽の下から出るパイプの、槽の真ん中からの隔たりの幅 (槽の下の数字を避ける)。
// `busDrop` は母線型で入れ物の下の縁から母線までの間、`boxGap` は母線型の箱と最初の入れ物の間、`entryGap` は母線型の箱の横の縁に入る呼び出しどうしの縦の間
const ROW_LOOK = { gap: 96, tie: 30, rowGap: 56, lane: 24, up: 14, linkOut: 30, entry: 24, drop: 44, tabPad: 12, encPad: 24, gauge: 80, slotIn: 40, slotOut: 54, busDrop: 30, boxGap: 56, entryGap: 18 } as const;
// 槽の下を通って2つの槽を結ぶパイプの通り道 (Tracelyth #168)。`pairs` は列の番号 `i` < `j` を持つ組。
// 長さの短い組ほど上の通り道に置き、重ならない組は同じ通り道に入れる。内側の組は外側の組より上を通るので、交わるのは互いに食い込む組だけになる
function laneUp<Q extends { i: number; j: number }>(pairs: readonly Q[]): { sorted: Q[]; laneOf: Map<Q, number>; count: number } {
  const sorted = [...pairs].sort((p, q) => p.j - p.i - (q.j - q.i) || p.i - q.i);
  const laneOf = new Map<Q, number>();
  const lanes: Q[][] = [];
  for (const p of sorted) {
    const inner = sorted.filter((q) => q !== p && laneOf.has(q) && q.i >= p.i && q.j <= p.j);
    let k = Math.max(-1, ...inner.map((q) => laneOf.get(q) ?? -1)) + 1;
    while ((lanes[k] ?? []).some((q) => !(q.j <= p.i || p.j <= q.i))) k++;
    (lanes[k] ??= []).push(p);
    laneOf.set(p, k);
  }
  return { sorted, laneOf, count: lanes.length };
}
// 通り道に置いた組の道。左の槽 `a` の下の縁から下り、通り道を通って右の槽 `b` の下の縁へ上がる。`floor` は一番上の通り道の高さ。
// 同じ槽の同じ側から出る線は、遠い相手へ向かう線ほど槽の真ん中の近くから出すので、同じ槽から出る線どうしは交わらない
function underRoutes<Q extends { i: number; j: number; a: Rect; b: Rect }>(pairs: readonly Q[], floor: number): Map<Q, Point[]> {
  const R = ROW_LOOK;
  const { sorted, laneOf } = laneUp(pairs);
  const xs = new Map(sorted.map((p): [Q, { a?: number; b?: number }] => [p, {}]));
  const spread = (m: number, k: number): number => m === 1 ? (R.slotIn + R.slotOut) / 2 : R.slotOut - k * (R.slotOut - R.slotIn) / (m - 1);
  for (const side of ["a", "b"] as const) {
    const byTank = new Map<Rect, Q[]>();
    for (const p of sorted) byTank.set(p[side], [...byTank.get(p[side]) ?? [], p]);
    for (const [t, list] of byTank) list.forEach((p, k) => {
      (xs.get(p) as { a?: number; b?: number })[side] = round3(t.x + t.w / 2 + (side === "a" ? 1 : -1) * spread(list.length, k));
    });
  }
  return new Map(sorted.map((p): [Q, Point[]] => {
    const y = round3(floor + (laneOf.get(p) ?? 0) * R.lane);
    const { a: xa = 0, b: xb = 0 } = xs.get(p) ?? {};
    return [p, [[xa, round3(p.a.y + p.a.h)], [xa, y], [xb, y], [xb, round3(p.b.y + p.b.h)]]];
  }));
}
// ETH を送った人と受け取った人の組 (Tracelyth #168)。ETH はトークンの箱を持たないので、値が動いた組だけをパイプで結ぶ。`from` は最初に送った人
function ethPairs(flows: readonly PipeFlow[] | undefined, index: ReadonlyMap<string, number>): { from: string; to: string; i: number; j: number; l: string; r: string }[] {
  const seen = new Map<string, { from: string; to: string; i: number; j: number; l: string; r: string }>();
  const at = (id: string): number => index.get(id) ?? 0;
  for (const f of flows ?? []) {
    if (f.token !== ETH || !index.has(f.from) || !index.has(f.to) || f.from === f.to) continue;
    const [l, r] = at(f.from) < at(f.to) ? [f.from, f.to] : [f.to, f.from];
    if (!seen.has(`${l}>${r}`)) seen.set(`${l}>${r}`, { from: f.from, to: f.to, i: at(l), j: at(r), l, r });
  }
  return [...seen.values()];
}
// 2人の槽を結ぶ値のパイプの記録。`holder` は薄く描く人がいればその人にし、薄く描く人の部品と一緒に薄くする
function pairPipe(token: string, from: string, to: string, points: Point[], tank: (who: string) => PipeTank, faded: readonly string[], k: number): PipeValuePipe {
  const a = points[0] as Point;
  const b = points[points.length - 1] as Point;
  const holder = faded.includes(from) ? from : faded.includes(to) ? to : from;
  const side = (p: Point, t: Rect): PipePort["side"] => p[0] <= t.x + 0.5 ? "left" : p[0] >= t.x + t.w - 0.5 ? "right" : "bottom";
  return { token, from, to, holder, points, ports: [{ party: from, token, side: side(a, tank(from)), x: a[0], y: a[1] }, { party: to, token, side: side(b, tank(to)), x: b[0], y: b[1] }], tone: tank(from).tone ?? 0, group: `v${k}` };
}
// 箱を持たないトークンの額の札を、その段の流れの一番下の横の線の真ん中の下に置く (Tracelyth #168)。置いた時は、図の大きさに数えるよう札を返す
function chipUnderFlow(c: PipeChip, flows: readonly PipeFlow[]): PipeChip[] {
  const fl = flows.find((f) => f.step === c.step && f.token === c.token && f.points.length > 1);
  if (!fl) return [];
  const low = Math.max(...fl.points.map((p) => p[1]));
  const flat = segsOf(fl.points).filter(([p2, q2]) => Math.abs(p2[1] - low) < 0.5 && Math.abs(q2[1] - low) < 0.5);
  const [p, q] = flat[0] ?? [fl.points[0] as Point, fl.points[fl.points.length - 1] as Point];
  moveParts(c, round3((p[0] + q[0]) / 2 - c.w / 2) - c.x, round3(low + 14) - c.y, new WeakSet<object>());
  return [c];
}
// 流れの向きの印。流れの道の終わりに近い、長い線分の真ん中に置く
function flowArrow(pts: readonly Point[]): PipeFlow["arrow"] {
  const segs = segsOf(pts).filter(([p, q]) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 30);
  const [p, q] = segs[segs.length - 1] ?? [pts[0] as Point, pts[pts.length - 1] as Point];
  const vertical2 = Math.abs(q[0] - p[0]) < 0.5;
  return { x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, dir: (vertical2 ? q[1] - p[1] : q[0] - p[0]) >= 0 ? 1 : -1, vertical: vertical2 };
}
// 横の線分と縦の線分が、どちらの端でもない所で交わる所 (Tracelyth #168)。`over` は上を通る横の線のパイプ、`under` は切れる縦の線のパイプの番号
function bridgesOf(pipes: readonly PipeValuePipe[]): PipeBridge[] {
  const E = 0.5;
  const strictly = (v: number, a: number, b: number): boolean => v > Math.min(a, b) + E && v < Math.max(a, b) - E;
  const segs = pipes.map((p) => segsOf(p.points));
  const out: PipeBridge[] = [];
  segs.forEach((hs, over) => {
    for (const [a, b] of hs) {
      if (Math.abs(a[1] - b[1]) > E) continue;
      segs.forEach((vs, under) => {
        if (under === over) return;
        for (const [c, d] of vs) {
          if (Math.abs(c[0] - d[0]) > E) continue;
          if (strictly(c[0], a[0], b[0]) && strictly(a[1], c[1], d[1])) out.push({ x: round3(c[0]), y: round3(a[1]), over, under });
        }
      });
    }
  });
  return out;
}
// 槽をトークンごとの行に並べる3つの形 (Tracelyth #168)。人は `box` の行の順に左から1列に並べ、人の列の下に、トークンの行ごとに槽を並べる。
// 行は箱を持つトークンを `box` の行の順に上から、箱を持たないトークンをその後に、ETH を最後に置く。
// 帳簿型 (`ledger`) は箱を持つトークンの行を囲み、囲みの上の張り出しに箱と分配管を置いて、分配管から弁の付いた枝で各槽へつなぐ。呼び出しは張り出しの上の辺に入る。
// 網型 (`mesh`) はトークンの行ごとに全ての人の組をパイプで結ぶ。隣の組は槽の横どうしを横の線で、隣でない組は槽の下を通して結び、箱は人の列の上に置く。
// 母線型 (`bus`) は箱を持つトークンの行ごとに、入れ物の下に母線を引いて左の端に箱を置き、各槽から母線へ枝を下ろす。呼び出しは人の列の上を通って箱の左の縁に入る。
// ETH は箱を持たないので、網型は全ての組を、帳簿型と母線型は値が動いた組を、槽の下を通るパイプで結ぶ。
// 置き場所は `box` と `hold` の行だけで決まり (ETH のパイプは値が動いた組で決まる)、呼ぶ人や引数を替えても箱と槽は動かない
function placeRows(composed: PipeLayout, diagram: DiagramModel, shape: "ledger" | "mesh" | "bus"): Placed {
  const out = structuredClone(composed) as Placed;
  const L = TOP_LOOK;
  const R = ROW_LOOK;
  const ledger = shape === "ledger";
  const mesh = shape === "mesh";
  const bus = shape === "bus";
  const parties = new Map(out.parties.map((p) => [p.id, p]));
  const party = (id: string): PipeParty => parties.get(id) as PipeParty;
  const declared = diagram.boxes.map((b) => b.id).filter((id) => parties.has(id));
  const people = declared.filter((id) => party(id).shape !== "token");
  const boxes = declared.filter((id) => party(id).shape === "token");
  const tokenBox = new Map<string, string>();
  for (const [owner, token] of simulate(diagram, new Set()).tokens) if (boxes.includes(owner)) tokenBox.set(token, owner);
  const tokenOf = new Map([...tokenBox].map(([t, b]) => [b, t]));
  const n = people.length;
  const B = boxes.length;
  const index = new Map(people.map((id, i) => [id, i]));
  const idx = (id: string): number => index.get(id) ?? 0;
  const moved = new WeakSet<object>();
  const move = (o: unknown, dx: number, dy: number): void => moveParts(o, dx, dy, moved);
  const rectOf = (r: Rect): Rect => ({ x: r.x, y: r.y, w: r.w, h: r.h });
  const union = (rs: readonly Rect[]): Rect => {
    const x0 = Math.min(...rs.map((r) => r.x));
    const y0 = Math.min(...rs.map((r) => r.y));
    return { x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 };
  };
  const tanks = (out.tanks ?? []).filter((t) => index.has(t.party));
  const tankOf = (id: string, token: string): PipeTank | undefined => tanks.find((t) => t.party === id && t.token === token);
  const held = [...new Set(tanks.map((t) => t.token))];
  const rows = [...new Set([...boxes.map((b) => tokenOf.get(b)).filter((t): t is string => t !== undefined && (!mesh || held.includes(t))), ...held.filter((t) => !tokenBox.has(t) && t !== ETH), ...held.filter((t) => t === ETH)])];
  const rowOf = new Map(rows.map((t, r) => [t, r]));
  const holdersOf = (token: string): string[] => people.filter((id) => tankOf(id, token));
  // 帳簿型と母線型で、行を持つ箱。箱の番号 `k` は行の順
  const rowBoxes = mesh ? [] : rows.map((t) => tokenBox.get(t)).filter((b): b is string => b !== undefined);
  const PAD = P.housing.pad;
  const houseW = P.tank.w + PAD * 2;
  const houseH = P.housing.top + P.tank.h + P.housing.text;
  const PORT_Y = P.tank.ports[0] as number;
  const faded = fadedPeople(diagram, parties, people);
  // 札入れか呼び出しの札を出す箱と、計器を吊るす箱。どの段にも出てこない箱は札の高さを、確かめの無い箱は計器の高さを空けない
  const carded = (b: string): boolean => diagram.steps.some((s) => s.events.some((e) => partiesOf(e).includes(b)));
  const gauged = (b: string): boolean => (out.gauges ?? []).some((g) => g.party === b);

  // 人の列の横の真ん中。入れ物と丸と名前の広い方を列の幅にする
  const colX: number[] = [];
  let cursor = 0;
  for (const id of people) {
    const p = party(id);
    const w = Math.max(houseW, p.w, p.label?.w ?? 0);
    colX.push(cursor + w / 2);
    cursor += w + R.gap;
  }
  const houseX = (i: number): number => (colX[i] ?? 0) - houseW / 2;
  const col = (i: number): number => colX[i] ?? 0;
  // 帳簿型と母線型の枝は、入れ物の右の隣との間の真ん中を縦に通す
  const riserOf = (i: number): number => round3(houseX(i) + houseW + R.gap / 2);
  const reach = (id: string): number => {
    const p = party(id);
    return Math.max(p.h, p.label ? p.label.y + p.label.h - p.y : 0);
  };
  const rowTop = 0;
  const peopleBottom = rowTop + Math.max(0, ...people.map(reach));

  // 行ごとの、槽の下を通るパイプの組。網型は持つ人の全ての組、帳簿型と母線型は ETH の行の、値が動いた組
  const ethMoved = ethPairs(out.flows, index).filter((q) => tankOf(q.from, ETH) && tankOf(q.to, ETH));
  const pairsOf = (token: string): { from: string; to: string; i: number; j: number }[] => {
    if (mesh) {
      const ids = holdersOf(token);
      return ids.flatMap((a, x) => ids.slice(x + 1).map((b) => ({ from: a, to: b, i: idx(a), j: idx(b) })));
    }
    return token === ETH ? ethMoved.map((q) => ({ from: q.from, to: q.to, i: q.i, j: q.j })) : [];
  };
  const rowPairs = rows.map(pairsOf);
  const below = (q: { i: number; j: number }): boolean => !mesh || q.j - q.i > 1;
  const lanesBelow = rowPairs.map((list) => laneUp(list.filter(below)).count);

  // 箱の大きさ。網型は下から入る呼び出しの口が並ぶだけ広げ、母線型は左の縁から入る呼び出しが並ぶだけ高くする
  const widths = new Map(boxes.map((b) => [b, Math.max(party(b).w, L.boxW, mesh ? (n - 1) * L.port + L.portPad * 2 : 0)]));
  const heights = new Map(boxes.map((b) => [b, Math.max(hasRows(out, b) ? party(b).h : Math.max(party(b).h, L.boxH), bus ? R.entryGap * (n + 1) : 0)]));

  // 行の縦の位置。帳簿型の箱を持つ行は、張り出し、囲み、計器の高さを取り、2つ目からの張り出しの上には呼び出しが横へ通る道を空ける。
  // 2つ目からの行の箱が札入れか呼び出しの札を出す時は、道のさらに上に札の高さの帯を空け、札をその帯に出す (Tracelyth #171)。
  // 母線型の箱を持つ行は、入れ物の下に母線と箱を置き、箱の下に札入れと呼び出しの札の高さを空ける
  const rowY: number[] = [];
  const floorY: number[] = [];
  const tabY: number[] = [];
  const busY: number[] = [];
  const widthOf = (b: string): number => widths.get(b) ?? 0;
  const heightOf = (b: string): number => heights.get(b) ?? 0;
  let y = peopleBottom;
  rows.forEach((token, r) => {
    const box = tokenBox.get(token);
    if (ledger && box !== undefined) {
      const tab = y + (rowBoxes.indexOf(box) === 0 ? R.drop : (carded(box) ? L.cards : 0) + R.rowGap + n * R.lane);
      tabY[r] = tab;
      rowY[r] = tab + heightOf(box) + 46 + R.encPad;
      y = tab + heightOf(box) + 46 + R.encPad + houseH + R.encPad + (gauged(box) ? R.gauge : 0);
      return;
    }
    const top = y + (r === 0 ? R.tie : R.rowGap);
    rowY[r] = top;
    y = top + houseH;
    const floor = y + L.under;
    floorY[r] = floor;
    const lanes = lanesBelow[r] ?? 0;
    if (lanes > 0) y = floor + (lanes - 1) * R.lane;
    if (bus && box !== undefined) {
      const line = top + houseH + R.busDrop;
      busY[r] = line;
      y = line + heightOf(box) / 2 + (carded(box) ? L.cards - R.rowGap : 0);
    }
  });

  // 人と、人が持つ部品を置く
  const delta = new Map<string, [number, number]>();
  const PARTS = ["pills", "columns", "converters", "plates", "gauges", "events", "folds", "checks"] as const;
  const place = (id: string, dx: number, dy: number): void => {
    delta.set(id, [dx, dy]);
    move(party(id), dx, dy);
    for (const k of PARTS) for (const x of out[k] as readonly { party?: string }[]) if (x.party === id) move(x, dx, dy);
  };
  people.forEach((id, i) => {
    const p = party(id);
    place(id, col(i) - (p.x + p.w / 2), rowTop - p.y);
  });
  // 槽は人の列の下の、トークンの行に置く
  const tankDelta = new Map<string, [number, number]>();
  for (const t of tanks) {
    const r = rowOf.get(t.token);
    if (r === undefined) continue;
    tankDelta.set(`${t.party}\0${t.token}`, [round3(col(idx(t.party)) - t.w / 2) - t.x, round3((rowY[r] ?? 0) + P.housing.top) - t.y]);
  }
  for (const x of [...out.tanks, ...out.glasses, ...out.levels]) {
    const d = tankDelta.get(`${x.party}\0${x.token}`);
    if (d) move(x, d[0], d[1]);
  }
  // 入れ物は槽ごとに作り直す
  out.housings = tanks.filter((t) => rowOf.has(t.token)).map((t) => ({ party: t.party, token: t.token, row: 0, x: round3(t.x - PAD), y: round3(t.y - P.housing.top), w: houseW, h: houseH }));
  // 人の名前から一番上の入れ物へ下ろす線。帳簿型は張り出しが間に入るので引かない
  out.ties = ledger ? [] : people.flatMap((id) => {
    const p = party(id);
    const tops = out.housings.filter((h) => h.party === id).map((h) => h.y);
    return tops.length === 0 ? [] : [{ party: id, x: round3(p.x + p.w / 2), y1: round3(p.y + reach(id) + P.tie.gap), y2: Math.min(...tops) }];
  });

  // 呼び出しは、呼ぶ人と呼ばれる物の組ごとに1本のパイプにする。呼ぶ人を替えても置き場所を変えないよう、どの人がどの箱を呼んでもよい通り道を先に取っておく
  const pairs: { from: string; to: string }[] = [];
  for (const step of diagram.steps)
    for (const e of step.events) if (e.type === "call" && parties.has(e.from) && parties.has(e.to) && !pairs.some((q) => q.from === e.from && q.to === e.to)) pairs.push({ from: e.from, to: e.to });
  const reserved = people.flatMap((id) => boxes.map((b, k) => ({ from: id, to: b, k, i: idx(id), way: "box" as const })));
  const calls = pairs.map((q): RowCall => reserved.find((c) => c.from === q.from && c.to === q.to) ?? { ...q, way: "row" });
  const rowCalls = calls.filter((c) => c.way === "row");
  // 2人を結ぶ線は人の列の上を通す。列の中どうしの呼び出しは列のすぐ上を、2人を結ぶ線はその上を通る
  const keyOf = (l: { owner: string; name: string }): string => `${l.owner}\0${l.name}`;
  const groups = [...new Set((out.links ?? []).map(keyOf))];
  // 線の高さは、トークンの箱の2人をキーに持つ値の数だけ空ける。キーの2人が同じ人の値は線を描かないが、線を描く呼び方と列の高さを揃える (Tracelyth #175)
  const pairValues = new Set((out.plates ?? []).filter((p) => p.step === 0 && p.badges?.length === 2).map((p) => `${p.party}\0${p.name}`)).size;
  const lanes = Math.max(groups.length, pairValues);
  const top0 = rowTop - rowCalls.length * L.under - (lanes > 0 ? L.linkTop / 2 + (lanes - 1) * L.link + 16 : 0);
  // 人の丸の上から箱へ上げる呼び出しの横の位置。同じ人から別の箱へ上げる呼び出しは横へずらす
  const upX = (c: { i: number; k: number }): number => round3(col(c.i) + (c.k - (B - 1) / 2) * R.up);

  // 箱を置く
  const boxX = new Map<string, number>();
  const boxY = new Map<string, number>();
  const portX = new Map<RowCall, number>();
  const turnOf = new Map<RowCall, number>();
  let boxBottom = 0;
  const encX = n > 0 ? houseX(0) - R.encPad : 0;
  // 帳簿型の張り出しは、最初の入れ物の右の縁から囲みの右の縁までを上へ張り出す。最初の枝と全ての呼び出しの入口がこの幅に入り、左に段が付く
  const tabX = n > 0 ? houseX(0) + houseW : encX;
  if (mesh) {
    // 網型は人の列の上の真ん中に箱を並べ、箱の下の口へ呼び出しを上げる。口から遠いパイプほど箱の近くで曲げて、ほかのパイプを越えない
    const rowCenter = n === 0 ? 200 : (col(0) + col(n - 1)) / 2;
    const total = boxes.reduce((s, b) => s + widthOf(b), 0) + Math.max(0, B - 1) * L.boxGap;
    let bx = rowCenter - total / 2;
    for (const b of boxes) {
      boxX.set(b, bx);
      bx += widthOf(b) + L.boxGap;
    }
    let levels = 0;
    for (const id of boxes) {
      const lo = (boxX.get(id) ?? 0) + L.portPad;
      const hi = (boxX.get(id) ?? 0) + widthOf(id) - L.portPad;
      const list = reserved.filter((c) => c.to === id).sort((a, b) => upX(a) - upX(b));
      const ps = spreadPorts(list.map(upX), lo, hi, L.port);
      list.forEach((c, j) => portX.set(c, round3(ps[j] ?? lo)));
      const lefts = list.filter((c) => upX(c) < (portX.get(c) ?? 0) - 0.5);
      const rights = list.filter((c) => upX(c) > (portX.get(c) ?? 0) + 0.5).reverse();
      lefts.forEach((c, j) => turnOf.set(c, j));
      rights.forEach((c, j) => turnOf.set(c, j));
      levels = Math.max(levels, lefts.length, rights.length);
    }
    boxBottom = top0 - L.clear - levels * L.turn - L.band;
    for (const b of boxes) boxY.set(b, boxBottom - heightOf(b));
  } else {
    for (const b of rowBoxes) {
      const r = rowOf.get(tokenOf.get(b) ?? "") ?? 0;
      if (ledger) {
        boxX.set(b, tabX + R.tabPad);
        boxY.set(b, (tabY[r] ?? 0) + 10);
      } else {
        boxX.set(b, houseX(0) - R.boxGap - widthOf(b));
        boxY.set(b, (busY[r] ?? 0) - heightOf(b) / 2);
      }
    }
  }
  for (const b of boxes) {
    const bx0 = boxX.get(b);
    if (bx0 === undefined) continue;
    const p = party(b);
    const w = widthOf(b);
    place(b, bx0 - p.x + (w - p.w) / 2, (boxY.get(b) ?? 0) - p.y);
    const extra = w - p.w;
    p.x = round3(p.x - (w - p.w) / 2);
    p.w = w;
    p.h = heightOf(b);
    p.token = tokenOf.get(b);
    if (p.label) p.label.x = round3(p.x + p.w / 2 - p.label.w / 2);
    if (p.sub) p.sub.x = round3(p.x + p.w / 2 - p.sub.w / 2);
    fitFrames(out, p);
    fitRows(out, b, extra);
  }
  const box = (id: string): PipeParty => party(id);

  // 帳簿型の囲みと張り出しと分配管、母線型の母線、トークンの行ごとの値のパイプ
  const valuePipes: PipeValuePipe[] = [];
  const branchOf = new Map<string, Point[]>();
  const ledgers: PipeLedger[] = [];
  const busLines: PipeBusLine[] = [];
  out.ledgers = ledgers;
  out.busLines = busLines;
  rows.forEach((token, r) => {
    const id = tokenBox.get(token);
    const ids = holdersOf(token);
    if (!mesh && id !== undefined) {
      const b = box(id);
      const ends = ids.map((who) => ({ who, t: tankOf(who, token) as PipeTank, x: riserOf(idx(who)) }));
      const trunkY = ledger ? round3(b.y + b.h + 18) : (busY[r] ?? 0);
      for (const { who, t, x } of ends) {
        const pts: Point[] = [[round3(t.x + t.w), round3(t.y + PORT_Y)], [x, round3(t.y + PORT_Y)], [x, trunkY]];
        branchOf.set(`${who}\0${token}`, pts);
        const valve2 = ledger ? { x, y: round3((t.y + PORT_Y + (rowY[r] ?? 0) - R.encPad) / 2) } : undefined;
        const p0 = pts[0] as Point;
        valuePipes.push({
          token,
          from: who,
          to: id,
          holder: who,
          points: pts,
          ...(valve2 ? { valve: valve2 } : {}),
          ports: [
            { party: who, token, side: "right", x: p0[0], y: p0[1] },
            { party: id, token, side: "bottom", x, y: trunkY },
          ],
          tone: t.tone ?? 0,
          group: `v${valuePipes.length}`,
        });
      }
      const xs = ends.map((e) => e.x);
      if (ledger) {
        const right = round3(Math.max(n > 0 ? riserOf(n - 1) + R.encPad : 0, b.x + b.w + R.tabPad));
        const encY = (rowY[r] ?? 0) - R.encPad;
        const enclosure = { x: round3(encX), y: round3(encY), w: round3(right - round3(encX)), h: round3(houseH + R.encPad * 2) };
        const tab = { x: round3(tabX), y: round3(tabY[r] ?? 0), w: round3(right - round3(tabX)), h: round3(encY - (tabY[r] ?? 0)) };
        ledgers.push({ token, box: id, enclosure, tab, manifold: { x1: round3(Math.min(...xs, b.x + b.w / 2)), x2: round3(Math.max(...xs, b.x + b.w / 2)), y: trunkY } });
      } else {
        busLines.push({ token, box: id, x1: round3(b.x + b.w), x2: round3(Math.max(...xs, b.x + b.w + 40)), y: trunkY });
      }
      return;
    }
    // 槽の横どうしを結ぶ隣の組と、槽の下を通る組
    const list = rowPairs[r] ?? [];
    const tankAt = (i: number): PipeTank => tankOf(people[i] ?? "", token) as PipeTank;
    const unders = underRoutes(list.filter(below).map((q) => ({ ...q, a: tankAt(q.i), b: tankAt(q.j), q })), floorY[r] ?? 0);
    const routeOf = new Map<(typeof list)[number], Point[]>();
    for (const [p, pts] of unders) routeOf.set(p.q, pts);
    for (const q of list) {
      let pts = routeOf.get(q);
      if (!pts) {
        const a = tankAt(q.i);
        const c = tankAt(q.j);
        pts = [[round3(a.x + a.w), round3(a.y + PORT_Y)], [round3(c.x), round3(c.y + PORT_Y)]];
      }
      // 網型は左の人から、ETH のパイプは送った人から引く
      const left = people[q.i] ?? q.from;
      const from = mesh ? left : q.from;
      const to = mesh ? (people[q.j] ?? q.to) : q.to;
      valuePipes.push(pairPipe(token, from, to, from === left ? pts : [...pts].reverse(), (who) => tankOf(who, token) as PipeTank, faded, valuePipes.length));
    }
  });
  out.valuePipes = valuePipes;
  out.stubs = [];
  out.crossings = [];
  out.buses = [];
  out.pipes = [];
  out.bridges = mesh || ethMoved.length > 1 ? bridgesOf(valuePipes) : [];

  // 移動は、2人を結ぶパイプか、送る人の枝から分配管か母線を通って受ける人の枝へ流す
  const pipeBetween = (a: string, b: string, token: string): PipeValuePipe | undefined => valuePipes.find((v) => v.token === token && box(v.to)?.shape !== "token" && (v.from === a && v.to === b || v.from === b && v.to === a));
  for (const f of out.flows ?? []) {
    const pp = pipeBetween(f.from, f.to, f.token);
    let pts: Point[] | undefined;
    if (pp) pts = pp.from === f.from ? pp.points : [...pp.points].reverse();
    else {
      const a = branchOf.get(`${f.from}\0${f.token}`);
      const b = branchOf.get(`${f.to}\0${f.token}`);
      if (a && b) pts = simplifyPath([...a, ...[...b].reverse()]);
    }
    if (!pts) continue;
    f.points = pts.map((p): Point => [p[0], p[1]]);
    f.arrow = flowArrow(f.points);
  }

  // 呼び出しのパイプ。網型は丸の上から上げて箱の下の口に入る。母線型は丸の上から人の列の上の通り道へ上げ、箱の左を下りて箱の左の縁に入る。
  // 帳簿型は1つ目の張り出しへは丸の右の横から出て入れ物の右の隣との間を下り、2つ目からの張り出しへは丸の上から上げて囲みの右を下り、張り出しの上を横へ通って入る
  const laneTop = top0 - R.entry;
  const rankOf = (c: { k: number; i: number }): number => ledger ? (c.k - 1) * n + (n - 1 - c.i) : c.k * n + c.i;
  const rightmost = n > 0 ? Math.max(...ledgers.map((l) => l.enclosure.x + l.enclosure.w), riserOf(n - 1)) : 0;
  const boxLeft = Math.min(...rowBoxes.map((b) => box(b).x));
  const callRoute = (c: RowCall): Point[] | undefined => {
    const from = parties.get(c.from);
    const to = parties.get(c.to);
    if (!from || !to) return undefined;
    if (c.way !== "row") {
      const x = upX(c);
      if (mesh) {
        const px = portX.get(c) ?? x;
        const ty = round3(boxBottom + L.band + (turnOf.get(c) ?? 0) * L.turn);
        return simplifyPath(Math.abs(px - x) < 0.5 ? [[x, from.y], [x, boxBottom]] : [[x, from.y], [x, ty], [px, ty], [px, boxBottom]]);
      }
      const lane = round3(laneTop - rankOf(c) * R.lane);
      if (bus) {
        const dx = round3(boxLeft - R.entry - rankOf(c) * R.lane);
        const ey = round3(to.y + to.h * (c.i + 1) / (n + 1));
        return simplifyPath([[x, from.y], [x, lane], [dx, lane], [dx, ey], [to.x, ey]]);
      }
      const l = ledgers.find((x2) => x2.box === c.to);
      if (!l) return undefined;
      if (c.k === 0) {
        const cy = round3(from.y + from.h / 2);
        const ex = round3(houseX(c.i) + houseW + R.entry);
        return simplifyPath([[round3(from.x + from.w), cy], [ex, cy], [ex, l.tab.y]]);
      }
      const lx = round3(col(c.i) - (c.k - 1) * R.up);
      const dx = round3(rightmost + R.entry + rankOf(c) * R.lane);
      const gy = round3(l.tab.y - R.lane * (c.i + 1));
      const ex = round3(l.tab.x + l.tab.w - R.entry - c.i * R.lane);
      return simplifyPath([[lx, from.y], [lx, lane], [dx, lane], [dx, gy], [ex, gy], [ex, l.tab.y]]);
    }
    // 列の中どうしの呼び出しは、列のすぐ上を通って上から入る
    const k = rowCalls.indexOf(c);
    const laneY = rowTop - L.under * (k + 1);
    const fx = from.x + from.w / 2;
    const tx = to.x + to.w / 2;
    if (from.shape === "token" && to.shape === "token") {
      if (mesh) {
        const right = tx > fx;
        return [[right ? from.x + from.w : from.x, from.y + from.h / 2], [right ? to.x : to.x + to.w, to.y + to.h / 2]];
      }
      const down = to.y > from.y;
      if (bus) return [[fx, down ? from.y + from.h : from.y], [fx, down ? to.y : to.y + to.h]];
      const sx = round3(encX - R.entry);
      return simplifyPath([[from.x, from.y + from.h / 2], [sx, from.y + from.h / 2], [sx, to.y + to.h / 2], [to.x, to.y + to.h / 2]]);
    }
    const fy = from.shape === "token" ? mesh ? from.y + from.h : from.y : from.y;
    return simplifyPath([[fx, fy], [fx, laneY], [tx, laneY], [tx, to.shape === "token" ? mesh ? to.y + to.h : to.y : to.y]]);
  };
  const callPts = new Map(calls.map((c) => [`${c.from}>${c.to}`, callRoute(c)]));
  for (const c of out.calls ?? []) {
    const pts = callPts.get(`${c.from}>${c.to}`);
    if (!pts) continue;
    c.points = pts.map((p): Point => [p[0], p[1]]);
    c.lit = pts.map((p): Point => [p[0], p[1]]);
    c.y = (pts[0] as Point)[1];
  }
  for (const l of out.lanes ?? []) {
    const pts = callPts.get(`${l.from}>${l.to}`);
    if (pts) l.points = pts.map((p): Point => [p[0], p[1]]);
  }
  for (const m of out.mains ?? []) {
    m.points = [];
    for (const b of m.branches ?? []) {
      const pts = callPts.get(`${m.from}>${b.to}`);
      if (!pts) continue;
      b.points = pts.map((p): Point => [p[0], p[1]]);
      const p0 = pts[0] as Point;
      const p1 = pts[1];
      const flat = p1 && Math.abs(p1[1] - p0[1]) < 0.5 && Math.abs(p1[0] - p0[0]) >= P.call.valveAt + P.valve.r * 2;
      const dir = p1 ? Math.sign((flat ? p1[0] - p0[0] : p1[1] - p0[1]) || -1) : -1;
      b.valve = flat ? { x: p0[0] + dir * P.call.valveAt, y: p0[1], vertical: false, under: false } : { x: p0[0], y: p0[1] + dir * P.call.valveAt, vertical: true, under: false };
    }
    m.y = m.branches?.[0]?.points?.[0]?.[1] ?? m.y;
  }

  // 確かめの計器。網型は箱の上に載せ、帳簿型は囲みの下に、母線型は箱の下に吊るす
  for (const g of out.gauges ?? []) {
    const p = parties.get(g.party);
    if (!p || !boxes.includes(g.party)) continue;
    const l = ledgers.find((x) => x.box === g.party);
    const cx = round3(p.x + p.w / 2 - (P.gauge.lampGap + P.gauge.lamp * 2) / 2);
    const hang = l ? l.enclosure.y + l.enclosure.h : p.y + p.h;
    const cy = round3(mesh ? p.y - P.gauge.stemGap - g.r : hang + P.gauge.stemGap + g.r);
    const stem = mesh ? { y1: round3(cy + g.r), y2: p.y } : { y1: round3(hang), y2: round3(cy - g.r) };
    Object.assign(g, { cx, cy, x: cx - g.r, y: cy - g.r, lamp: { ...g.lamp, x: cx + g.r + P.gauge.lampGap, y: cy - g.r + 4 }, stem });
  }
  // 札。人の槽の札は槽と、人の札は人と、箱の札とトークンの額の札は箱と一緒に動かす。箱を持たないトークンの額の札は、その流れのパイプの下に置く
  const underChips: PipeChip[] = [];
  for (const c of out.chips ?? []) {
    if (c.kind === "return") continue;
    const tokenOwner = c.token !== undefined ? tokenBox.get(c.token) : undefined;
    const d =
      c.party !== undefined && c.token !== undefined && tankDelta.has(`${c.party}\0${c.token}`)
        ? tankDelta.get(`${c.party}\0${c.token}`)
        : c.party !== undefined && delta.has(c.party)
          ? delta.get(c.party)
          : tokenOwner !== undefined
            ? delta.get(tokenOwner)
            : undefined;
    if (d) move(c, d[0], d[1]);
    else underChips.push(...chipUnderFlow(c, out.flows ?? []));
  }
  // 自分の札への書き換えと、箱の中の札への書き換えは、札を持つ物と一緒に動かす。人の下の札への書き換えは、書いた物から札の上へ真っすぐ引く
  for (const w of out.writes ?? []) {
    if (w.from === w.to || boxes.includes(w.to)) {
      const d = delta.get(w.to);
      if (d) move(w, d[0], d[1]);
      continue;
    }
    const plate2 = (out.plates ?? []).find((p) => p.party === w.to && p.name === w.name);
    const writer = parties.get(w.from);
    w.points =
      plate2 && writer
        ? simplifyPath([
            [writer.x + writer.w / 2, writer.y + writer.h],
            [writer.x + writer.w / 2, plate2.y - 10],
            [plate2.x + plate2.w / 2, plate2.y - 10],
            [plate2.x + plate2.w / 2, plate2.y],
          ])
        : [];
  }
  for (const c of out.chips ?? []) {
    if (c.kind !== "return" || !c.path) continue;
    const call = (out.calls ?? []).find((x) => x.close?.step === c.step && x.close?.event === c.event) ?? (out.calls ?? []).find((x) => x.depth === 0);
    if (!call) continue;
    const back = [...call.points].reverse().map((p): Point => [p[0], p[1]]);
    const [ox, oy] = c.path[0] as Point;
    const head = back[0] as Point;
    c.path = back;
    moveParts(c, head[0] - ox, head[1] - oy, new WeakSet<object>([c.path]));
  }

  // 2人を結ぶ線は人の列の上を通す。丸の上から線を出し、同じ人の同じ側に着く線は、上を通る線ほど外側に端を置く
  const linkY = (g: string): number => rowTop - rowCalls.length * L.under - L.linkTop / 2 - (groups.length - 1 - groups.indexOf(g)) * L.link;
  const firstOf = new Map<string, PipeLayout["links"][number]>();
  for (const l of out.links ?? []) if (!firstOf.has(keyOf(l)) && parties.has(l.from) && parties.has(l.to)) firstOf.set(keyOf(l), l);
  const middleOf = (id: string): number => party(id).x + party(id).w / 2;
  const endX = new Map<string, number>();
  for (const id of new Set([...firstOf.values()].flatMap((l) => [l.from, l.to]))) {
    for (const side of [-1, 1]) {
      const mine = [...firstOf.entries()].filter(([, l]) => (l.from === id || l.to === id) && Math.sign(middleOf(l.from === id ? l.to : l.from) - middleOf(id)) === side).map(([g]) => g).sort((a, b) => linkY(b) - linkY(a));
      mine.forEach((g, i) => endX.set(`${g}\0${id}`, middleOf(id) + side * (R.linkOut + i * 8)));
    }
  }
  for (const l of out.links ?? []) {
    const a = parties.get(l.from);
    const b = parties.get(l.to);
    if (!a || !b) continue;
    const ly = linkY(keyOf(l));
    const ax = endX.get(`${keyOf(l)}\0${l.from}`) ?? middleOf(l.from);
    const bx2 = endX.get(`${keyOf(l)}\0${l.to}`) ?? middleOf(l.to);
    l.points = [[ax, a.y], [ax, ly], [bx2, ly], [bx2, b.y]];
    const lw = l.label.w + (l.delta ? 6 + l.delta.w : 0);
    l.label.x = (ax + bx2) / 2 - lw / 2;
    l.label.y = ly - l.label.h / 2;
    if (l.delta) {
      l.delta.x = l.label.x + l.label.w + 6;
      l.delta.y = l.label.y;
    }
  }

  // 置き場所の点数は上と下の形に揃えて数えるが、`auto` はこの形を選ばない
  const score = fixedScore([
    ...valuePipes.map((v) => ({ kind: "value" as const, from: v.from, pts: v.points })),
    ...reserved.flatMap((c) => {
      const pts = callRoute(c);
      return pts !== undefined && pts.length > 1 ? [{ kind: "call" as const, from: c.from, pts }] : [];
    }),
  ]);

  // 図の大きさを測り、左上の余白を揃える。札入れと呼び出しの札の高さを、網型は箱の上に、帳簿型は人の列と呼び出しの上に、母線型は箱の下に空けておく
  const callYs = reserved.flatMap((c) => (callRoute(c) ?? []).map((p) => p[1]));
  const ceiling = Math.min(top0, rowTop, ...callYs) - 12;
  const rects = [
    ...out.parties.flatMap((p) => [rectOf(p), ...p.label ? [rectOf(p.label)] : []]),
    ...out.housings.map(rectOf),
    ...tanks.map(rectOf),
    ...(out.plates ?? []).map(rectOf),
    ...(out.gauges ?? []).map(rectOf),
    ...(out.links ?? []).flatMap((l) => [l.label, ...l.delta ? [l.delta] : []].map(rectOf)),
    ...[...(out.calls ?? []), ...(out.links ?? [])].flatMap((l) => (l.points ?? []).map((p) => ({ x: p[0] - 12, y: p[1] - 12, w: 24, h: 24 }))),
    ...reserved.flatMap((c) => (callRoute(c) ?? []).map((p) => ({ x: p[0] - 12, y: p[1] - 12, w: 24, h: 24 }))),
    // 移す額の札は値のパイプの角を通るので、札の半分の幅を角の外に取る
    ...valuePipes.flatMap((l) => l.points.map((p) => ({ x: p[0] - L.coin, y: p[1] - 12, w: L.coin * 2, h: 24 }))),
    ...ledgers.flatMap((l) => [l.enclosure, l.tab, ...gauged(l.box) ? [{ x: l.enclosure.x, y: l.enclosure.y + l.enclosure.h, w: 1, h: R.gauge }] : []]),
    ...busLines.map((b) => ({ x: b.x1, y: b.y - 12, w: b.x2 - b.x1, h: 24 })),
    ...underChips.map(rectOf)
  ];
  const all = union(rects);
  const lowestBox = Math.max(-Infinity, ...rowBoxes.filter(carded).map((id) => box(id).y + box(id).h));
  const dx0 = P.margin - all.x;
  const dy0 = P.margin - Math.min(all.y, mesh ? Math.min(...boxes.map((b) => box(b).y)) - L.cards : ledger ? ceiling - L.cards : all.y);
  const fresh = new WeakSet<object>();
  // 帳簿型の2つ目からの行の箱の札は、その行の張り出しの上を横へ通る呼び出しの道より上に出す (Tracelyth #171)
  const ceilings = ledger
    ? Object.fromEntries(rowBoxes.slice(1).filter(carded).map((b) => [b, { y: round3((tabY[rowOf.get(tokenOf.get(b) ?? "") ?? 0] ?? 0) - n * R.lane - 12) }]))
    : {};
  const fixed: PipeFixed = { shape, faded, score, order: declared, cards: bus ? "below" : "above", ...(ledger ? { ceiling: { y: ceiling }, ceilings } : {}) };
  out.fixed = fixed;
  for (const [k, v] of Object.entries(out)) if (k !== "width" && k !== "height" && typeof v === "object") moveParts(v, dx0, dy0, fresh);
  out.width = round3(all.w + P.margin * 2);
  out.height = round3((bus ? Math.max(all.y + all.h, lowestBox + L.cards) : all.y + all.h) + dy0 + P.margin);
  for (const f of out.focus ? [out.focus].flat() : []) Object.assign(f, { x: P.margin, y: P.margin, w: out.width - P.margin * 2, h: out.height - P.margin * 2 });
  return out;
}
// `layout` の行の形で置く (Tracelyth #165、#166)。`auto` は上と下の2つの形と、トークンの箱が4つまでなら箱の全ての並びを試し、
// 交わりの数が最も少なく、次に長さの合計が最も短い組を選ぶ。同じ点数なら上の形を、さらに同じなら `box` の行の順を選ぶ。
// 箱が5つ以上の時は `box` の行の順のまま2つの形を比べる
const AUTO_MAX_BOXES = 4;
export function placeLayout(composed: PipeLayout, diagram: DiagramModel): PipeLayout {
  if (diagram.layout === "ledger" || diagram.layout === "mesh" || diagram.layout === "bus") return placeRows(composed, diagram, diagram.layout);
  if (diagram.layout !== "auto") return placeTop(composed, diagram, diagram.layout);
  const ids = new Set(composed.parties.filter((p) => p.shape === "token").map((p) => p.id));
  const tokens = diagram.boxes.map((b) => b.id).filter((id) => ids.has(id));
  const permute = (xs: readonly string[]): string[][] => xs.length <= 1 ? [[...xs]] : xs.flatMap((x, i) => permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest]));
  const orders = tokens.length <= AUTO_MAX_BOXES ? permute(tokens) : [tokens];
  let best: Placed | undefined;
  for (const shape of ["top", "bottom"] as const)
    for (const order of orders) {
      const placed = placeTop(composed, diagram, shape, order);
      const s = placed.fixed.score;
      if (!best || s.crossings < best.fixed.score.crossings || s.crossings === best.fixed.score.crossings && s.length < best.fixed.score.length) best = placed;
    }
  return best ?? composed;
}
