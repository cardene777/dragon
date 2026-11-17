/**
 * 配管の図を `layout` の行の形へ置き直す手順 (Tracelyth #165、#166、#168)。
 *
 * 今の並べ方 (`compose`) で作った部品を、トークンの箱を人の列の上か下に置く形 (`top`、`bottom`) か、
 * 槽をトークンごとの行に並べる3つの形 (`ledger`、`mesh`、`bus`) へ移す。`auto` は上と下の形と箱の並びを試し、線の交わりが最も少ない形を選ぶ。
 * 置き場所は `box` と `hold` の行だけで決まるので、呼ぶ人や引数を替えても箱と槽は動かない。呼び出しに関わらない人は薄く描く
 */
import { ETH } from "../blocks/definition-values";
import type { Point, Rect } from "./scene";
import { PIPE_LOOK } from "../look/pipe";
import type { DiagramModel } from "../schema";
import {
  type PipeBridge,
  type PipeBusLine,
  type PipeChip,
  type PipeFixed,
  type PipeEventChip,
  type PipeFlow,
  type PipeHousing,
  type PipeLayout,
  type PipeLedger,
  type PipeParty,
  type PipePort,
  type PipeTank,
  type PipeValuePipe,
  callCardSize,
  logCardSize,
  partiesOf,
  returnRoute,
  simulate,
} from "../kinds/pipe/layout";
import { channelTracks } from "../pipe-route";
import { valveRects } from "../pipe-valve";

const P = PIPE_LOOK;

/** 置き直した図。置き直した形と点数を必ず持つ */
type Placed = PipeLayout & { fixed: PipeFixed };
/** 部品を2度動かさないための、動かした物の覚え */
type Seen = WeakSet<object> | Set<object>;
/** 縦と横の線分 */
type Seg = [Point, Point];
/** 箱の中の行を広げた幅に合わせて動かす部品の名前 */
const ROW_LEFT = ["badge", "badges", "keyArrow", "label"] as const;
const ROW_RIGHT = ["text", "was", "arrow", "strike", "pill"] as const;
/** 槽を行に並べる形の呼び出し。人 (`i` 番目) から箱 (`k` 番目) へ取っておいた道 (`box`) か、列の中どうしの呼び出し (`row`) */
type RowCall = { from: string; to: string; k: number; i: number; way: "box" } | { from: string; to: string; way: "row"; k?: undefined; i?: undefined };
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
/**
 * 上と下の形の通り道の寸法 (#3721)。
 * `pitch` は通り道の帯の段どうしの間、`riser` は隣との間を縦に通る線どうしの間、`gapPad` は縦に通る線と人の組の縁の間、
 * `gapMin` は線の通らない隣との間、`pad` は通り道の帯の段と帯の縁の間、`bPad` は名前の下の帯の段と名前の間、`port` は箱の口どうしの間、
 * `slot` は丸と箱の縁に着く線どうしの間、`tether` はログの札の点線の段どうしの間、`logGap` は札どうしの間、`rowGap` は札の帯の段どうしの間、
 * `card` は札の帯に必ず空ける高さ (引数が3つの札の高さ)。段の中身で札が無い図も、札がある図と同じ所に箱と槽を置く
 */
const CH = { pitch: 16, riser: 18, gapPad: 22, gapMin: 72, pad: 28, bPad: 24, port: 28, slot: 18, tether: 8, logGap: 16, rowGap: 14, card: 103, io: 20 } as const;

/** 槽か札へ下りる線。値のパイプ (`value`) か、1人をキーに持つ値の書き換えの点線 (`write`) */
interface Run {
  kind: "value" | "write";
  holder: string;
  token: string;
  /** 線のもう一方の端。トークンの箱か、書き換える値の持ち主 */
  box: string;
  target: Rect;
  name?: string;
  side: "left" | "right";
  drop: number;
}
/** 呼ぶ者ごとに1本の本管。`targets` は空けておく呼ばれる者、`drawn` は段に出る呼ばれる者 */
interface Caller {
  from: string;
  targets: string[];
  drawn: Set<string>;
}

// パイプ図の箱を上に置く形 (Tracelyth #165) と、箱を人の列の下に集める形 (Tracelyth #166)。
// 人は `box` の行の順に左から1列に並べ、名前の下の帯を通って槽の上の縁からパイプを入れる (#3721)。
// 線は通り道の帯ごとに、横に走る段を1本ずつ割り当て (`channelTracks`)、縦の線は隣との間に1本ずつ横の位置を割り当てるので、2本の線が同じ所を重なって走らない。
// 上の形は上から、札の帯、ログの点線の帯、札入れと呼び出しの札の高さ、トークンの箱、呼び出しと値のパイプの帯、人の列、名前の下の帯、槽の入れ物、2人を結ぶ線の帯の順に置く。
// 下の形は上から、札の帯、ログの点線の帯、列の中どうしの呼び出しと2人を結ぶ線の帯、人の列、名前の下の帯、槽の入れ物、値のパイプと呼び出しの帯、トークンの箱、札入れと呼び出しの札の高さの順に置く。
// 呼び出しの通り道は、`route` の行で渡した人からの呼び出しの組 (渡さない図は段に出る人からの呼び出しの組) と、コントラクトから全てのトークンの箱への組の分だけ空ける。
// 置き場所は `box` と `hold` と `route` の行だけで決まるので、段を替えても箱と槽は動かない。呼び出しに関わらない人は薄く描く
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
  const rectOf = (r: Rect): Rect => ({ x: r.x, y: r.y, w: r.w, h: r.h });
  const union = (rs: readonly Rect[]): Rect => {
    const x0 = Math.min(...rs.map((r) => r.x));
    const y0 = Math.min(...rs.map((r) => r.y));
    return { x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 };
  };
  const n = people.length;
  const m = boxes.length;
  const index = new Map(people.map((id, i) => [id, i]));
  const idx = (id: string): number => index.get(id) ?? 0;
  const isBox = (id: string): boolean => boxes.includes(id);
  const inRow = (id: string): boolean => index.has(id);
  const housingOf = (id: string): PipeHousing | undefined => (out.housings ?? []).find((h) => h.party === id);
  const tanksOf = (id: string): PipeTank[] => (out.tanks ?? []).filter((t) => t.party === id).sort((a, b) => a.x - b.x);
  const moved = new WeakSet<object>();
  const move = (o: unknown, dx: number, dy: number): void => moveParts(o, dx, dy, moved);

  // コントラクトの箱の高さを揃える。呼び出しに関わるかに依らず全て四角の箱で描く (`compose` が形を決める)
  const cabinets = people.filter((id) => party(id).shape === "cabinet");
  const cabH = Math.max(0, ...cabinets.map((id) => party(id).h));
  for (const id of cabinets) {
    party(id).h = cabH;
    fitFrames(out, party(id));
  }

  // 入れ物の中の槽を、トークンの箱の並びの順に並べ替える。`compose` は段の動きで並びを決めるので、段を減らすと槽が動く。
  // 変換器は隣り合う 2 つの槽を結ぶので、変換器を持つ入れ物は並びを変えない。
  // 段ごとの槽は槽の題の字を共に持つので、動かした物を 1 つの集まりで覚えて 1 度だけ動かす
  const reordered = new WeakSet<object>();
  for (const id of people) {
    if ((out.converters ?? []).some((c) => c.party === id)) continue;
    const list = tanksOf(id);
    const rank = (t: PipeTank): number => {
      const b = tokenBox.get(t.token);
      return b === undefined ? m : boxes.indexOf(b);
    };
    const want = [...list].sort((a, b) => rank(a) - rank(b) || a.x - b.x);
    if (want.every((t, i) => t === list[i])) continue;
    const gaps = list.slice(1).map((t, i) => t.x - ((list[i] as PipeTank).x + (list[i] as PipeTank).w));
    let x = (list[0] as PipeTank).x;
    const dxOf = new Map<string, number>();
    want.forEach((t, i) => {
      dxOf.set(t.token, x - t.x);
      x += t.w + (gaps[i] ?? 0);
    });
    for (const k of ["tanks", "glasses", "levels"] as const)
      for (const o of (out[k] ?? []) as { party: string; token: string }[]) if (o.party === id && dxOf.has(o.token)) moveParts(o, dxOf.get(o.token) ?? 0, 0, reordered);
  }

  // 人の列の部品を、名札の側 (丸と名前) と入れ物の側 (入れ物と、その中の槽と札と計器) に分ける。名前の下の帯を空けるため、2つを別々に動かす
  const inside = (r: Rect, h: Rect): boolean => r.x >= h.x - 1 && r.y >= h.y - 1 && r.x + r.w <= h.x + h.w + 1 && r.y + r.h <= h.y + h.h + 1;
  const ownedBy = <K extends keyof PipeLayout>(k: K, id: string): object[] => ((out[k] ?? []) as unknown as { party?: string }[]).filter((x) => x.party === id);
  const headParts = new Map<string, object[]>();
  const bodyParts = new Map<string, object[]>();
  for (const id of people) {
    const h = housingOf(id);
    const head: object[] = [party(id), ...ownedBy("columns", id), ...ownedBy("pills", id), ...ownedBy("folds", id)];
    const body: object[] = [...ownedBy("housings", id), ...ownedBy("tanks", id), ...ownedBy("glasses", id), ...ownedBy("levels", id), ...ownedBy("converters", id)];
    for (const k of ["plates", "gauges"] as const) for (const x of ownedBy(k, id) as Rect[]) (h && inside(x, h) ? body : head).push(x);
    for (const w of out.writes ?? []) if (w.from === id && w.to === id) body.push(w);
    headParts.set(id, head);
    bodyParts.set(id, body);
  }
  const headRect = (id: string): Rect => {
    const p = party(id);
    return union([rectOf(p), ...(p.label ? [rectOf(p.label)] : []), ...(p.sub ? [rectOf(p.sub)] : [])]);
  };
  const cols = people.map((id) => {
    const p = party(id);
    const head = headRect(id);
    const h = housingOf(id);
    const axis = p.x + p.w / 2;
    const all = h ? union([head, rectOf(h)]) : head;
    return { id, axis, left: axis - all.x, right: all.x + all.w - axis, headH: head.y + head.h - p.y };
  });

  // 槽と札へ下りる線。入れ物の左の半分の槽は左の隣との間から、右の半分は右の隣との間から下ろす。真ん中の槽はトークンの箱の側から下ろす
  const holdsOf = diagram.pipe?.holds ?? [];
  const runs: Run[] = [];
  for (const id of people) {
    const targets: Omit<Run, "side">[] = [];
    for (const t of tanksOf(id)) {
      const box = tokenBox.get(t.token);
      if (box !== undefined) targets.push({ kind: "value", holder: id, token: t.token, box, target: t, drop: t.x + t.w / 2 });
    }
    for (const pl of (out.plates ?? []).filter((x) => x.party === id && x.step === 0 && !x.boxed && !x.row)) {
      const owner = holdsOf.find((h) => "name" in h && h.name === pl.name && h.link?.on === id)?.box;
      if (owner !== undefined && owner !== id && parties.has(owner)) targets.push({ kind: "write", holder: id, token: "", box: owner, target: pl, name: pl.name, drop: pl.x + pl.w / 2 });
    }
    targets.sort((a, b) => a.drop - b.drop);
    const k = targets.length;
    targets.forEach((t, j) => {
      const toward = isBox(t.box) ? (boxes.indexOf(t.box) + 0.5) / Math.max(1, m) : (idx(t.box) + 0.5) / Math.max(1, n);
      const side = 2 * j + 1 < k ? "left" : 2 * j + 1 > k ? "right" : toward < (idx(id) + 0.5) / Math.max(1, n) ? "left" : "right";
      runs.push({ ...t, side });
    });
  }
  const sideRuns = (i: number, side: "left" | "right"): Run[] => (i < 0 || i >= n ? [] : runs.filter((r) => r.holder === people[i] && r.side === side).sort((a, b) => a.drop - b.drop));

  // 呼び出しの組。段に出る組と、置き方が通り道を空ける組 (#3721)
  const callPairs: [string, string][] = [];
  for (const step of diagram.steps)
    for (const e of step.events)
      if (e.type === "call" && parties.has(e.from) && parties.has(e.to) && e.from !== e.to && !callPairs.some(([f, t]) => f === e.from && t === e.to)) callPairs.push([e.from, e.to]);
  const person = (id: string): boolean => party(id).shape === "round";
  const routes: [string, string][] = diagram.routes
    ? diagram.routes.filter((r) => parties.has(r.from) && parties.has(r.to) && r.from !== r.to).map((r): [string, string] => [r.from, r.to])
    : callPairs.filter(([f]) => person(f));
  const callers = new Map<string, Caller>();
  const callerOf = (id: string): Caller => {
    const known = callers.get(id);
    if (known) return known;
    const c: Caller = { from: id, targets: [], drawn: new Set() };
    callers.set(id, c);
    return c;
  };
  const aim = (from: string, to: string): void => {
    const c = callerOf(from);
    if (!c.targets.includes(to)) c.targets.push(to);
  };
  for (const [f, t] of routes) aim(f, t);
  // コントラクトから箱への呼び出しは段で替わるので、全てのトークンの箱への通り道を空けておく
  for (const id of cabinets) for (const b of boxes) aim(id, b);
  for (const [f, t] of callPairs) {
    aim(f, t);
    callerOf(f).drawn.add(t);
  }
  const callerList = [...callers.values()].filter((c) => c.targets.length > 0);
  const boxTargets = (c: Caller): string[] => c.targets.filter(isBox);
  const rowTargets = (c: Caller): string[] => c.targets.filter((t) => inRow(t));

  // 下の形では、箱へ向かう呼び出しを丸の横から出し、隣との間を下ろす。箱の並びの重心の側へ出す
  const trunkSide = new Map<string, "left" | "right">();
  if (down)
    for (const c of callerList) {
      if (!inRow(c.from) || boxTargets(c).length === 0) continue;
      const toward = boxTargets(c).reduce((s, b) => s + (boxes.indexOf(b) + 0.5) / m, 0) / boxTargets(c).length;
      trunkSide.set(c.from, toward < (idx(c.from) + 0.5) / n ? "left" : "right");
    }

  // 隣との間ごとの縦の線。左の人の右から下ろす線、左の人の本管、右の人の本管、右の人の左から下ろす線の順に左から並べる。
  // 隣との間 g は人 g と人 g+1 の間で、-1 は列の左の外、n-1 は列の右の外
  type Slot = Run | { trunk: string };
  const slotsOf = (g: number): Slot[] => [
    ...sideRuns(g, "right"),
    ...(down && g >= 0 && trunkSide.get(people[g] ?? "") === "right" ? [{ trunk: people[g] as string }] : []),
    ...(down && g + 1 < n && trunkSide.get(people[g + 1] ?? "") === "left" ? [{ trunk: people[g + 1] as string }] : []),
    ...sideRuns(g + 1, "left"),
  ];
  const gapW = (g: number): number => {
    const k = slotsOf(g).length;
    const inner = g >= 0 && g < n - 1;
    return k === 0 ? (inner ? CH.gapMin : 0) : Math.max(inner ? CH.gapMin : 0, CH.gapPad * 2 + (k - 1) * CH.riser);
  };
  const axisOf = new Map<string, number>();
  const gapLeft = new Map<number, number>();
  let cursor = P.margin;
  gapLeft.set(-1, cursor);
  cursor += gapW(-1);
  cols.forEach((c, i) => {
    axisOf.set(c.id, cursor + c.left);
    cursor += c.left + c.right;
    gapLeft.set(i, cursor);
    cursor += gapW(i);
  });
  const rowRight = cursor;
  const riserX = new Map<Slot, number>();
  for (let g = -1; g < n; g++) slotsOf(g).forEach((s, j) => riserX.set(s, round3((gapLeft.get(g) ?? 0) + CH.gapPad + j * CH.riser)));
  const trunkX = (id: string): number | undefined => {
    for (const [s, x] of riserX) if ("trunk" in s && s.trunk === id) return x;
    return undefined;
  };
  const xNew = (id: string, x: number): number => x + (axisOf.get(id) ?? 0) - (cols[idx(id)]?.axis ?? 0);

  // 丸と箱の縁に着く線の口。上の形は丸の上の縁に、呼ぶ者の本管と呼ばれる口を並べ、真ん中を本管に使う。
  // 下の形は丸の上の縁に、列の中どうしの呼び出しと2人を結ぶ線の口を並べる
  const topSlots = new Map<string, Map<string, number>>();
  const slotOn = (id: string, key: string): number => topSlots.get(id)?.get(key) ?? (axisOf.get(id) ?? 0);
  const keyOfLink = (l: { owner: string; name: string }): string => `${l.owner}\u0000${l.name}`;
  const linkKeys = [...new Set((out.links ?? []).filter((l) => inRow(l.from) && inRow(l.to)).map(keyOfLink))];
  const firstLink = new Map<string, PipeLayout["links"][number]>();
  for (const l of out.links ?? []) if (!firstLink.has(keyOfLink(l)) && inRow(l.from) && inRow(l.to)) firstLink.set(keyOfLink(l), l);
  for (const id of people) {
    const own = callers.get(id);
    const mine = down ? (own && rowTargets(own).length > 0 ? ["exit"] : []) : own && (boxTargets(own).length > 0 || rowTargets(own).length > 0) ? ["exit"] : [];
    const arrivals = callerList.filter((c) => c.from !== id && rowTargets(c).includes(id)).map((c) => ({ key: `in:${c.from}`, at: isBox(c.from) ? n + boxes.indexOf(c.from) : idx(c.from) }));
    const links = down ? linkKeys.flatMap((g) => {
      const l = firstLink.get(g);
      if (!l || (l.from !== id && l.to !== id)) return [];
      const other = l.from === id ? l.to : l.from;
      return [{ key: `link:${g}`, at: idx(other) }];
    }) : [];
    const others = [...arrivals, ...links].sort((a, b) => a.at - b.at);
    const offsets: number[] = [];
    for (let k = 1; offsets.length < others.length + (mine.length > 0 ? 0 : 1); k++) offsets.push(-k * CH.slot, k * CH.slot);
    const free = (mine.length > 0 ? offsets : [0, ...offsets]).slice(0, others.length).sort((a, b) => a - b);
    const slots = new Map<string, number>();
    if (mine.length > 0) slots.set("exit", axisOf.get(id) ?? 0);
    others.forEach((o, k) => slots.set(o.key, round3((axisOf.get(id) ?? 0) + (free[k] ?? 0))));
    topSlots.set(id, slots);
  }

  // トークンの箱の大きさと横の位置。箱の口は箱へ入るパイプと呼び出しの数だけ並べ、箱は口の先の重心の上に寄せる
  // ログの札は段ごとに写しを持つので、札の番号で 1 つに数える
  const tetherNeed = new Map<string, number>();
  for (const id of new Set((out.events ?? []).filter((e) => isBox(e.party)).map((e) => e.id))) {
    const e = (out.events ?? []).find((x) => x.id === id) as PipeEventChip;
    tetherNeed.set(e.party, (tetherNeed.get(e.party) ?? 0) + 1);
  }
  type PortItem = Run | { call: string; to: string } | { exit: string } | { tether: string; k: number };
  const portItems = new Map<string, PortItem[]>(boxes.map((b) => [b, []]));
  for (const r of runs) if (isBox(r.box)) portItems.get(r.box)?.push(r);
  for (const c of callerList) {
    for (const b of boxTargets(c)) portItems.get(b)?.push({ call: c.from, to: b });
    if (isBox(c.from)) portItems.get(c.from)?.push({ exit: c.from });
  }
  // 下の形はログの点線が箱の上の縁 (口と同じ縁) に着くので、点線の口も空けておく。段で替わらないよう、箱ごとに少なくとも1つ空ける
  if (down) for (const b of boxes) for (let k = 0; k < Math.max(1, tetherNeed.get(b) ?? 0); k++) portItems.get(b)?.push({ tether: b, k });
  const otherEnd = (it: PortItem): number => {
    if ("kind" in it) return riserX.get(it) ?? 0;
    if ("call" in it) return inRow(it.call) ? (down ? (trunkX(it.call) ?? axisOf.get(it.call) ?? 0) : slotOn(it.call, "exit")) : 0;
    if ("exit" in it) return 0;
    return rowRight;
  };
  const heightOf = (id: string): number => (hasRows(out, id) ? party(id).h : Math.max(party(id).h, L.boxH));
  const boxH = Math.max(L.boxH, ...boxes.map(heightOf));
  const widths = boxes.map((b) => Math.max(party(b).w, ((portItems.get(b)?.length ?? 1) - 1) * CH.port + L.portPad * 2, L.boxW));
  const wanted = boxes.map((b, k) => {
    const ends = (portItems.get(b) ?? []).filter((it) => !("tether" in it) && !("exit" in it)).map(otherEnd);
    return ends.length > 0 ? ends.reduce((s, x) => s + x, 0) / ends.length : P.margin + ((k + 0.5) * (rowRight - P.margin)) / Math.max(1, m);
  });
  const boxX: number[] = [];
  boxes.forEach((_, k) => {
    const w = widths[k] ?? 0;
    const prev = k > 0 ? (boxX[k - 1] as number) + (widths[k - 1] ?? 0) + L.boxGap : Number.NEGATIVE_INFINITY;
    boxX.push(Math.max((wanted[k] ?? 0) - w / 2, prev));
  });
  const drift = boxes.length > 0 ? boxes.reduce((s, _, k) => s + ((boxX[k] as number) + (widths[k] ?? 0) / 2 - (wanted[k] ?? 0)), 0) / boxes.length : 0;
  const pull = Math.min(drift, (boxX[0] ?? P.margin) - P.margin);
  for (let k = 0; k < boxX.length; k++) boxX[k] = round3((boxX[k] as number) - Math.max(0, pull));

  // 箱の口。口の先の横の順に並べ、口どうしを離し、帯の反対の縁から入る線の横の位置を避ける
  const portX = new Map<PortItem, number>();
  const facing = (b: string): number[] => {
    const lo = boxX[boxes.indexOf(b)] ?? 0;
    const hi = lo + (widths[boxes.indexOf(b)] ?? 0);
    const xs: number[] = [];
    for (const [s, x] of riserX) if (!("trunk" in s) || down) xs.push(x);
    if (!down) for (const id of people) for (const x of topSlots.get(id)?.values() ?? []) xs.push(x);
    return xs.filter((x) => x > lo - CH.port && x < hi + CH.port);
  };
  boxes.forEach((b, k) => {
    const lo = (boxX[k] ?? 0) + L.portPad;
    const hi = (boxX[k] ?? 0) + (widths[k] ?? 0) - L.portPad;
    const list = [...(portItems.get(b) ?? [])].sort((u, v) => otherEnd(u) - otherEnd(v));
    const avoid = facing(b);
    const clear = (x: number): boolean => avoid.every((a) => Math.abs(a - x) >= CH.pitch + 4);
    const picked: number[] = [];
    for (let j = 0; j < list.length; j++) {
      const start = j === 0 ? lo : (picked[j - 1] as number) + CH.port;
      const room = hi - (list.length - 1 - j) * CH.port;
      let x = start;
      while (x <= room && !clear(x)) x += 2;
      picked.push(x <= room ? x : start);
    }
    const ok = picked.every((x) => x <= hi + 0.5);
    const xs = ok ? picked : spreadPorts(list.map(otherEnd), lo, hi, CH.port);
    list.forEach((it, j) => portX.set(it, round3(xs[j] ?? lo)));
  });
  const portOf = (b: string, pred: (it: PortItem) => boolean): number => {
    for (const [it, x] of portX) if (pred(it) && (portItems.get(b) ?? []).includes(it)) return x;
    return (boxX[boxes.indexOf(b)] ?? 0) + (widths[boxes.indexOf(b)] ?? 0) / 2;
  };
  const callPort = (from: string, b: string): number => portOf(b, (it) => "call" in it && it.call === from && it.to === b);

  // 箱と人の列の間の通り道 (上の形は箱の下、下の形は入れ物の下)。値のパイプと、箱へ向かう呼び出しの本管を1本ずつの段に置く
  interface Net {
    key: string;
    tops: number[];
    bottoms: number[];
    half: number;
  }
  const netA: Net[] = [];
  const netOf = new Map<string, Net>();
  const addNet = (list: Net[], net: Net): void => {
    list.push(net);
    netOf.set(net.key, net);
  };
  for (const r of runs) {
    const riser = riserX.get(r) ?? 0;
    if (!isBox(r.box)) continue;
    const port = portX.get(r) ?? 0;
    addNet(netA, { key: `run:${runs.indexOf(r)}`, tops: down ? [riser] : [port], bottoms: down ? [port] : [riser], half: r.kind === "value" ? 7 : 1 });
  }
  for (const c of callerList) {
    const ports = boxTargets(c).map((b) => callPort(c.from, b));
    if (isBox(c.from)) ports.push(portOf(c.from, (it) => "exit" in it && it.exit === c.from));
    if (down) {
      if (ports.length === 0) continue;
      const start = inRow(c.from) ? [trunkX(c.from) ?? axisOf.get(c.from) ?? 0] : [];
      addNet(netA, { key: `call:${c.from}`, tops: start, bottoms: ports, half: 8 });
    } else {
      const bottoms = [...(inRow(c.from) ? [slotOn(c.from, "exit")] : []), ...rowTargets(c).map((t) => slotOn(t, `in:${c.from}`))];
      addNet(netA, { key: `call:${c.from}`, tops: ports, bottoms, half: 8 });
    }
  }
  // 1人をキーに持つ値の書き換えは、値の持ち主から帯を通って札へ下ろす。持ち主が人の列にいる時は、持ち主の丸の上から出す
  // 下の形で持ち主が人の列にいる書き換えは、引く道を持たない (描かない)
  if (!down)
    for (const r of runs) {
      if (isBox(r.box)) continue;
      addNet(netA, { key: `run:${runs.indexOf(r)}`, tops: [], bottoms: [riserX.get(r) ?? 0, slotOn(r.box, "exit")], half: 1 });
    }
  const tracksA = channelTracks(netA);
  const trackOfA = new Map(netA.map((net, i) => [net.key, tracksA[i] ?? 0]));
  const countA = Math.max(0, ...tracksA.map((t) => t + 1));

  // 下の形の、列の上の通り道。列の中どうしの呼び出しと2人を結ぶ線を1本ずつの段に置く
  const netC: Net[] = [];
  if (down) {
    for (const c of callerList) {
      const targets = rowTargets(c);
      if (targets.length === 0 || !inRow(c.from)) continue;
      addNet(netC, { key: `row:${c.from}`, tops: [], bottoms: [slotOn(c.from, "exit"), ...targets.map((t) => slotOn(t, `in:${c.from}`))], half: 8 });
    }
    for (const g of linkKeys) {
      const l = firstLink.get(g);
      if (!l) continue;
      addNet(netC, { key: `link:${g}`, tops: [], bottoms: [slotOn(l.from, `link:${g}`), slotOn(l.to, `link:${g}`)], half: 1 });
    }
  }
  const tracksC = channelTracks(netC);
  const trackOfC = new Map(netC.map((net, i) => [net.key, tracksC[i] ?? 0]));
  const countC = Math.max(0, ...tracksC.map((t) => t + 1));

  // 名前の下の帯の段。入れ物の側ごとに、隣との間に近い槽ほど下の段を使う。ETH の槽どうしを結ぶパイプは、その上の段を通す
  const countB = Math.max(0, ...people.flatMap((_, i) => [sideRuns(i, "left").length, sideRuns(i, "right").length]));
  const trackOfB = new Map<Run, number>();
  for (let i = 0; i < n; i++) {
    const left = sideRuns(i, "left");
    left.forEach((r, j) => trackOfB.set(r, countB - 1 - j));
    const right = sideRuns(i, "right");
    right.forEach((r, j) => trackOfB.set(r, countB - right.length + j));
  }
  const ethTank = (id: string): PipeTank | undefined => (out.tanks ?? []).find((t) => t.party === id && t.token === ETH);
  const eth = ethPairs(out.flows, index).filter((q) => ethTank(q.from) && ethTank(q.to));
  const ethNets = eth.map((q) => ({ tops: [], bottoms: [xNew(q.l, (ethTank(q.l) as PipeTank).x + (ethTank(q.l) as PipeTank).w / 2), xNew(q.r, (ethTank(q.r) as PipeTank).x + (ethTank(q.r) as PipeTank).w / 2)], half: 7 }));
  const ethTracks = channelTracks(ethNets);
  const countEth = Math.max(0, ...ethTracks.map((t) => t + 1));

  // 2人を結ぶ線の帯 (上の形)。入れ物の下の縁から下ろし、1本ずつの段に置く
  const footX = new Map<string, number>();
  if (!down)
    for (const id of people) {
      const mine = linkKeys.flatMap((g) => {
        const l = firstLink.get(g);
        return l && (l.from === id || l.to === id) ? [{ g, other: l.from === id ? l.to : l.from }] : [];
      });
      for (const side of [-1, 1]) {
        const list = mine.filter((x) => Math.sign(idx(x.other) - idx(id)) === side).sort((a, b) => Math.abs(idx(b.other) - idx(id)) - Math.abs(idx(a.other) - idx(id)));
        list.forEach((x, k) => footX.set(`${x.g}\u0000${id}`, round3((axisOf.get(id) ?? 0) + side * (CH.slot + k * CH.slot))));
      }
    }
  const netL = linkKeys.flatMap((g) => {
    const l = firstLink.get(g);
    if (!l || down) return [];
    return [{ key: `link:${g}`, tops: [footX.get(`${g}\u0000${l.from}`) ?? 0, footX.get(`${g}\u0000${l.to}`) ?? 0], bottoms: [], half: 1 }];
  });
  const tracksL = channelTracks(netL);
  const trackOfL = new Map(netL.map((net, i) => [net.key, tracksL[i] ?? 0]));

  // 札の帯。発した順に左から並べ、図の幅に並びきらない時は2段にする
  const events = [...(out.events ?? [])].filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i).sort((a, b) => a.step - b.step || (a.event ?? 0) - (b.event ?? 0));
  const sizes = new Map(events.map((e) => [e.id, logCardSize(out, e)]));
  const cardsW = events.reduce((s, e) => s + (sizes.get(e.id)?.w ?? 0), 0) + Math.max(0, events.length - 1) * CH.logGap;
  const room = Math.max(rowRight, ...boxes.map((_, k) => (boxX[k] ?? 0) + (widths[k] ?? 0))) - P.margin;
  const rows = events.length > 1 && cardsW > room ? 2 : 1;
  const perRow = Math.ceil(events.length / rows);
  const rowH = (r: number): number => Math.max(0, ...events.slice(r * perRow, (r + 1) * perRow).map((e) => sizes.get(e.id)?.h ?? 0));
  const bandH = Math.max(CH.card, rows === 2 ? rowH(0) + CH.rowGap + rowH(1) : rowH(0));
  const tetherTracks = Math.max(1, m, events.length);
  const tetherH = tetherTracks * CH.tether + 16;

  // 縦の位置
  const maxHead = Math.max(0, ...cols.map((c) => c.headH));
  // 入力と出力の札の高さは、段で札の有る無しが替わっても箱と槽を動かさないよう、槽を持つ図には必ず空ける
  const hasIo = runs.length > 0;
  const bandTop = P.margin;
  const tetherTop = bandTop + bandH + 10;
  let boxTop: number;
  let rowTop: number;
  let cTop = 0;
  // 上の形で列の中のコントラクトへの呼び出しの札は、描く処理が呼ばれた箱の上 18px に出す。トークンの箱の列と人の列の間に札の高さを空ける
  const rowCards = down ? 0 : Math.max(0, ...(out.calls ?? []).filter((c) => inRow(c.to)).map((c) => callCardSize(out, c.label ?? "", c.to).h + 18 + 12));
  if (!down) {
    boxTop = tetherTop + tetherH + L.cards;
    rowTop = boxTop + boxH + Math.max(CH.pad * 2 + Math.max(0, countA - 1) * CH.pitch, rowCards);
  } else {
    cTop = tetherTop + tetherH;
    rowTop = cTop + (countC > 0 ? CH.pad * 2 + (countC - 1) * CH.pitch : CH.pad);
    boxTop = 0;
  }
  const bTop = rowTop + maxHead + 10;
  const ethTop = bTop + CH.bPad;
  const nestTop = ethTop + countEth * CH.pitch;
  const lowB = nestTop + Math.max(0, countB - 1) * CH.pitch;
  const housingTop = countB + countEth > 0 ? lowB + 7 + (hasIo ? 6 + CH.io + 4 : CH.bPad) : bTop + (hasIo ? CH.io + 10 : 4);
  const yB = (r: Run): number => nestTop + (trackOfB.get(r) ?? 0) * CH.pitch;

  // 人と箱と、それが持つ部品を動かす
  for (const c of cols) {
    const p = party(c.id);
    const dx = (axisOf.get(c.id) ?? 0) - c.axis;
    const dyHead = rowTop - p.y;
    for (const part of headParts.get(c.id) ?? []) move(part, dx, dyHead);
    const h = housingOf(c.id);
    const dyBody = h ? housingTop - h.y : dyHead;
    for (const part of bodyParts.get(c.id) ?? []) move(part, dx, dyBody);
  }
  const housingBottom = Math.max(rowTop + maxHead, ...people.map((id) => {
    const h = housingOf(id);
    return h ? h.y + h.h : rowTop + (cols[idx(id)]?.headH ?? 0);
  }));
  const aTop = down ? housingBottom : boxTop + boxH;
  if (down) boxTop = aTop + CH.pad * 2 + Math.max(0, countA - 1) * CH.pitch + tetherTracks * CH.tether + 8;
  const boxBottom = boxTop + boxH;
  const yA = (key: string): number => aTop + CH.pad + (trackOfA.get(key) ?? 0) * CH.pitch;
  const tetherA = (k: number): number => boxTop - 8 - (tetherTracks - 1 - k) * CH.tether;
  boxes.forEach((id, k) => {
    const p = party(id);
    const w = widths[k] ?? p.w;
    const dx = (boxX[k] ?? 0) + (w - p.w) / 2 - p.x;
    const dy = boxTop - p.y;
    move(p, dx, dy);
    for (const part of [...ownedBy("plates", id), ...ownedBy("pills", id), ...ownedBy("columns", id), ...ownedBy("gauges", id), ...ownedBy("tanks", id), ...ownedBy("levels", id)]) move(part, dx, dy);
    for (const wr of out.writes ?? []) if (wr.to === id) move(wr, dx, dy);
    const extra = w - p.w;
    p.x -= extra / 2;
    p.w = w;
    p.h = boxH;
    if (p.label) p.label.x = p.x + p.w / 2 - p.label.w / 2;
    if (p.sub) p.sub.x = p.x + p.w / 2 - p.sub.w / 2;
    fitFrames(out, p);
    fitRows(out, id, extra);
  });
  // 確かめの計器は、確かめた箱の上の真ん中に載せ、軸を箱の上端へ下ろす。下の形は、箱の下の真ん中に吊るす
  for (const g of out.gauges ?? []) {
    const p = parties.get(g.party);
    if (!p || !isBox(g.party)) continue;
    const cx = round3(p.x + p.w / 2 - (P.gauge.lampGap + P.gauge.lamp * 2) / 2);
    const cy = round3(down ? p.y + p.h + P.gauge.stemGap + g.r : p.y - P.gauge.stemGap - g.r);
    const stem = down ? { y1: round3(p.y + p.h), y2: round3(cy - g.r) } : { y1: cy + g.r, y2: p.y };
    Object.assign(g, { cx, cy, x: cx - g.r, y: cy - g.r, lamp: { ...g.lamp, x: cx + g.r + P.gauge.lampGap, y: cy - g.r + 4 }, stem });
  }
  // 名札から自分の入れ物へ下りる点線
  out.ties = (out.ties ?? []).flatMap((t) => {
    const h = housingOf(t.party);
    if (!h || !inRow(t.party)) return [];
    return [{ ...t, x: axisOf.get(t.party) ?? t.x, y1: rowTop + (cols[idx(t.party)]?.headH ?? 0) + 4, y2: housingTop }];
  });

  // 値のパイプ。槽の上の縁から上り、名前の下の帯を横へ通り、隣との間を通って、箱の口へ入る
  const runRoute = (r: Run): Point[] => {
    const t = r.target;
    const drop = round3(t.x + t.w / 2);
    const riser = riserX.get(r) ?? 0;
    const key = `run:${runs.indexOf(r)}`;
    if (!isBox(r.box)) {
      if (down) return [];
      const ex = slotOn(r.box, "exit");
      const from = party(r.box);
      return simplifyPath([[drop, t.y], [drop, yB(r)], [riser, yB(r)], [riser, yA(key)], [ex, yA(key)], [ex, down ? from.y + from.h : from.y]]);
    }
    const port = portX.get(r) ?? 0;
    return simplifyPath([[drop, t.y], [drop, yB(r)], [riser, yB(r)], [riser, yA(key)], [port, yA(key)], [port, down ? boxTop : boxBottom]]);
  };
  const valueRuns = runs.filter((r) => r.kind === "value");
  const routeOf = new Map(runs.map((r) => [r, runRoute(r)]));
  out.valuePipes = valueRuns.map((v, k): PipeValuePipe => {
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
        { party: v.holder, token: v.token, side: "top", x: a[0], y: a[1] },
        { party: v.box, token: v.token, side: down ? "top" : "bottom", x: b[0], y: b[1] },
      ],
      tone: (v.target as PipeTank).tone ?? 0,
      group: `v${k}`,
    };
  });
  out.stubs = [];
  out.crossings = [];
  out.buses = [];
  out.pipes = [];

  // 移動は、送る人の槽からトークンの箱を通って受ける人の槽へ流す
  const routeFor = (holder: string, token: string): Point[] | undefined => {
    const v = valueRuns.find((x) => x.holder === holder && x.token === token);
    return v ? routeOf.get(v) : undefined;
  };
  const mid = boxTop + boxH / 2;
  for (const f of out.flows ?? []) {
    const a = routeFor(f.from, f.token);
    const b = routeFor(f.to, f.token);
    if (!a || !b) continue;
    const pa = a[a.length - 1] as Point;
    const pb = b[b.length - 1] as Point;
    f.points = simplifyPath([...a, [pa[0], mid], [pb[0], mid], ...[...b].reverse()]);
    f.arrow = flowArrow(f.points);
  }
  // ETH は箱を持たないので、値が動いた2人の槽を、名前の下の帯の上の段を通るパイプで結ぶ
  const ethChips: PipeChip[] = [];
  if (eth.length > 0) {
    const dim = fadedPeople(diagram, parties, people);
    eth.forEach((q, k) => {
      const a = ethTank(q.l) as PipeTank;
      const b = ethTank(q.r) as PipeTank;
      const y = round3(ethTop + (ethTracks[k] ?? 0) * CH.pitch);
      const ax = round3(a.x + a.w / 2);
      const bx = round3(b.x + b.w / 2);
      const pts: Point[] = [[ax, a.y], [ax, y], [bx, y], [bx, b.y]];
      const pipe = pairPipe(ETH, q.from, q.to, q.from === q.l ? pts : [...pts].reverse(), (id) => ethTank(id) as PipeTank, dim, out.valuePipes.length);
      pipe.ports = [{ ...pipe.ports[0], side: "top" }, { ...pipe.ports[1], side: "top" }];
      out.valuePipes.push(pipe);
    });
    for (const f of out.flows ?? []) {
      const pp = out.valuePipes.find((v) => v.token === ETH && ((v.from === f.from && v.to === f.to) || (v.from === f.to && v.to === f.from)));
      if (f.token !== ETH || !pp) continue;
      f.points = (pp.from === f.from ? pp.points : [...pp.points].reverse()).map((p): Point => [p[0], p[1]]);
      f.arrow = flowArrow(f.points);
    }
    for (const c of out.chips ?? []) if (c.kind === "amount" && c.token === ETH) ethChips.push(...chipUnderFlow(c, out.flows ?? []));
  }

  // 呼び出しのパイプ。呼ぶ者ごとに1本の本管を帯の1つの段に通し、呼ばれる者の口へ分ける
  const callRoute = (from: string, to: string): Point[] | undefined => {
    const f = parties.get(from);
    const t = parties.get(to);
    if (!f || !t) return undefined;
    if (!down) {
      const y = yA(`call:${from}`);
      const start: Point = inRow(from) ? [slotOn(from, "exit"), f.y] : [portOf(from, (it) => "exit" in it && it.exit === from), f.y + f.h];
      const end: Point = isBox(to) ? [callPort(from, to), t.y + t.h] : [slotOn(to, `in:${from}`), t.y];
      return simplifyPath([start, [start[0], y], [end[0], y], end]);
    }
    if (inRow(from) && inRow(to)) {
      const y = cTop + CH.pad + (countC - 1 - (trackOfC.get(`row:${from}`) ?? 0)) * CH.pitch;
      const sx = slotOn(from, "exit");
      const ex = slotOn(to, `in:${from}`);
      return simplifyPath([[sx, f.y], [sx, y], [ex, y], [ex, t.y]]);
    }
    const y = yA(`call:${from}`);
    if (inRow(from)) {
      const side = trunkSide.get(from) ?? "right";
      const tx = trunkX(from) ?? (axisOf.get(from) ?? 0);
      const cy = f.y + f.h / 2;
      const end: Point = isBox(to) ? [callPort(from, to), t.y] : [axisOf.get(to) ?? 0, t.y + t.h];
      return simplifyPath([[side === "right" ? f.x + f.w : f.x, cy], [tx, cy], [tx, y], [end[0], y], end]);
    }
    const sx = portOf(from, (it) => "exit" in it && it.exit === from);
    const end: Point = isBox(to) ? [callPort(from, to), t.y] : [axisOf.get(to) ?? 0, t.y + t.h];
    return simplifyPath([[sx, f.y], [sx, y], [end[0], y], end]);
  };
  const callPts = new Map<string, Point[] | undefined>();
  for (const [f, t] of callPairs) callPts.set(`${f}>${t}`, callRoute(f, t));
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
  for (const mn of out.mains ?? []) {
    mn.points = [];
    for (const b of mn.branches ?? []) {
      const pts = callPts.get(`${mn.from}>${b.to}`);
      if (!pts) continue;
      b.points = pts.map((p): Point => [p[0], p[1]]);
      const p0 = pts[0] as Point;
      const p1 = pts[1];
      const flat = p1 && Math.abs(p1[1] - p0[1]) < 0.5 && Math.abs(p1[0] - p0[0]) >= P.call.valveAt + P.valve.r * 2;
      const dir = p1 ? Math.sign((flat ? p1[0] - p0[0] : p1[1] - p0[1]) || -1) : -1;
      b.valve = flat ? { x: p0[0] + dir * P.call.valveAt, y: p0[1], vertical: false, under: false } : { x: p0[0], y: p0[1] + dir * P.call.valveAt, vertical: true, under: false };
    }
    mn.y = mn.branches?.[0]?.points?.[0]?.[1] ?? mn.y;
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

  // 1人をキーに持つ値の書き換えの点線は、値の持ち主から札へ引いた道を通す
  for (const w of out.writes ?? []) {
    if (w.from === w.to || isBox(w.to)) continue;
    const r = runs.find((x) => x.kind === "write" && x.holder === w.to && x.name === w.name);
    w.points = r ? [...(routeOf.get(r) ?? [])].reverse() : [];
  }

  // 2人を結ぶ線。上の形は入れ物の下を、下の形は列の上を通す。札は、ほかの線の縦の線分が通らない所に置く
  const linkFloor = housingBottom + CH.pad;
  const linkY = (g: string): number => (down ? cTop + CH.pad + (countC - 1 - (trackOfC.get(`link:${g}`) ?? 0)) * CH.pitch : linkFloor + (trackOfL.get(`link:${g}`) ?? 0) * L.link);
  const verticals = (): { x: number; y1: number; y2: number }[] =>
    [...out.valuePipes, ...(out.calls ?? []), ...(out.links ?? [])].flatMap((l) =>
      segsOf(l.points ?? []).filter(([p, q]) => Math.abs(p[0] - q[0]) < 0.5).map(([p, q]) => ({ x: p[0], y1: Math.min(p[1], q[1]), y2: Math.max(p[1], q[1]) })),
    );
  for (const l of out.links ?? []) {
    const a = parties.get(l.from);
    const b = parties.get(l.to);
    if (!a || !b || !inRow(l.from) || !inRow(l.to)) continue;
    const g = keyOfLink(l);
    const y = linkY(g);
    const foot = (id: string): number => {
      if (down) return party(id).y;
      const h = housingOf(id);
      return h ? h.y + h.h : rowTop + (cols[idx(id)]?.headH ?? 0) + 4;
    };
    const ax = down ? slotOn(l.from, `link:${g}`) : (footX.get(`${g}\u0000${l.from}`) ?? axisOf.get(l.from) ?? 0);
    const bx2 = down ? slotOn(l.to, `link:${g}`) : (footX.get(`${g}\u0000${l.to}`) ?? axisOf.get(l.to) ?? 0);
    l.points = [[ax, foot(l.from)], [ax, y], [bx2, y], [bx2, foot(l.to)]];
  }
  const vs = verticals();
  for (const l of out.links ?? []) {
    if (l.points.length < 4) continue;
    const y = (l.points[1] as Point)[1];
    const x0 = Math.min((l.points[1] as Point)[0], (l.points[2] as Point)[0]);
    const x1 = Math.max((l.points[1] as Point)[0], (l.points[2] as Point)[0]);
    const lw = l.label.w + (l.delta ? 6 + l.delta.w : 0);
    const free = (x: number): boolean => vs.every((v) => v.y2 < y - l.label.h / 2 - 2 || v.y1 > y + l.label.h / 2 + 2 || v.x < x - 6 || v.x > x + lw + 6);
    let best = (x0 + x1) / 2 - lw / 2;
    for (let d = 0; d < x1 - x0; d += 4) {
      const c = (x0 + x1) / 2 - lw / 2;
      if (free(c - d)) {
        best = c - d;
        break;
      }
      if (free(c + d)) {
        best = c + d;
        break;
      }
    }
    l.label.x = round3(best);
    l.label.y = round3(y - l.label.h / 2);
    if (l.delta) {
      l.delta.x = l.label.x + l.label.w + 6;
      l.delta.y = l.label.y;
    }
  }

  // 入力と出力の札。始めた人の入れ物の上の縁の外に、パイプが下りる所を避けて置く
  const drops = (id: string): number[] => runs.filter((r) => r.holder === id).map((r) => round3(r.target.x + r.target.w / 2));
  const placedIo: Rect[] = [];
  for (const c of [...(out.chips ?? [])].filter((x) => x.kind === "io").sort((a, b) => a.step - b.step)) {
    const owner = c.party ?? "";
    const h = housingOf(owner);
    if (!h) continue;
    const y = round3(h.y - 3 - c.h);
    const tank = (out.tanks ?? []).find((t) => t.party === owner && t.token === c.token);
    const xs = drops(owner);
    const candidates = [
      ...(tank ? [tank.x + tank.w / 2 - 9 - c.w, tank.x + tank.w / 2 + 9] : []),
      ...xs.flatMap((x) => [x - 9 - c.w, x + 9]),
      h.x + 4,
      h.x + h.w - 4 - c.w,
    ];
    const fits = (x: number): boolean =>
      x >= h.x - 0.5 &&
      x + c.w <= h.x + h.w + 0.5 &&
      xs.every((d) => d < x - 8 || d > x + c.w + 8) &&
      placedIo.filter((r) => (r as Rect & { step?: number }).step === c.step).every((r) => r.x + r.w + 4 <= x || x + c.w + 4 <= r.x);
    const x = candidates.find(fits) ?? candidates[0] ?? h.x;
    moveParts(c, round3(x) - c.x, y - c.y, new WeakSet<object>());
    placedIo.push({ ...rectOf(c), step: c.step } as Rect);
  }

  // 札の帯とログの点線。札は発した順に左から並べ、2段の時は上の段の札の点線を下の段の札の間から下ろす。
  // 点線は札の下の縁から出て、点線の帯を横へ通り、上の形は箱の上の縁の真ん中 (札入れと呼び出しの札の間) に、下の形は列の右の外を下りて箱の上の縁に着く
  const colW = Array.from({ length: perRow }, (_, k) => Math.max(...[0, 1].slice(0, rows).map((r) => sizes.get(events[r * perRow + k]?.id ?? -1)?.w ?? 0)));
  const colX: number[] = [];
  let cx0 = P.margin;
  for (const w of colW) {
    colX.push(cx0);
    cx0 += w + CH.logGap;
  }
  const bandRight = cx0 - CH.logGap;
  const exits: { e: PipeEventChip; x: number; lead: Point[] }[] = [];
  events.forEach((e, i) => {
    const r = Math.floor(i / perRow);
    const k = i % perRow;
    const size = sizes.get(e.id) as { w: number; h: number };
    const x = colX[k] ?? P.margin;
    const y = bandTop + (r === 0 ? 0 : rowH(0) + CH.rowGap);
    for (const chip of (out.events ?? []).filter((c) => c.id === e.id)) moveParts(chip, round3(x) - chip.x, round3(y) - chip.y, new WeakSet<object>());
    const bottom = round3(y + size.h);
    if (rows === 2 && r === 0) {
      const side = round3(x + (colW[k] ?? size.w) + CH.logGap / 2);
      const ex = round3(x + size.w - 10);
      exits.push({ e, x: side, lead: [[ex, bottom], [ex, bottom + CH.rowGap / 2], [side, bottom + CH.rowGap / 2]] });
    } else {
      const ex = round3(x + size.w / 2);
      exits.push({ e, x: ex, lead: [[ex, bottom]] });
    }
  });
  const landing = new Map<string, number[]>();
  for (const b of boxes) {
    const p = party(b);
    const need = events.filter((e) => e.party === b).length;
    const xs = down
      ? [...portX.entries()].filter(([it]) => "tether" in it && it.tether === b).map(([, x]) => x)
      : Array.from({ length: need }, (_, k) => round3(p.x + p.w / 2 - ((out.gauges ?? []).some((g) => g.party === b) ? P.gauge.r + 8 : 0) + (k - (need - 1) / 2) * 3));
    landing.set(b, xs);
  }
  const used = new Map<string, number>();
  const tetherNets = exits.map(({ e, x }) => {
    const k = used.get(e.party) ?? 0;
    used.set(e.party, k + 1);
    const land = landing.get(e.party)?.[k] ?? (parties.get(e.party) ? party(e.party).x + party(e.party).w / 2 : x);
    return { tops: [x], bottoms: [down ? round3(Math.max(rowRight, ...boxes.map((_, j) => (boxX[j] ?? 0) + (widths[j] ?? 0))) + 24 + exits.length * CH.tether) : land], half: 1, land };
  });
  const tTracks = channelTracks(tetherNets, 2);
  const corridor0 = round3(Math.max(rowRight, ...boxes.map((_, j) => (boxX[j] ?? 0) + (widths[j] ?? 0)), bandRight) + 24);
  exits.forEach(({ e, x, lead }, i) => {
    const net = tetherNets[i] as { land: number };
    const emitter = parties.get(e.party);
    if (!emitter) return;
    const y = round3(tetherTop + 8 + (tTracks[i] ?? 0) * CH.tether);
    const tether: Point[] = down
      ? [...lead, [x, y], [corridor0 + i * CH.tether, y], [corridor0 + i * CH.tether, tetherA(i % tetherTracks)], [net.land, tetherA(i % tetherTracks)], [net.land, emitter.y]]
      : [...lead, [x, y], [net.land, y], [net.land, emitter.y]];
    const pts = simplifyPath(tether);
    for (const chip of (out.events ?? []).filter((c) => c.id === e.id)) (chip as PipeEventChip & { tether?: Point[] }).tether = pts;
  });

  const faded = fadedPeople(diagram, parties, people);

  // 形と箱の並びの点数 (Tracelyth #166)。値のパイプと、2人を結ぶ線と、空けておいた呼び出しの交わりの数と長さの合計を数える
  const seenLink = new Set<string>();
  const scored = [
    ...valueRuns.map((v) => ({ kind: "value" as const, from: v.holder, pts: routeOf.get(v) })),
    ...callerList.flatMap((c) => c.targets.map((t) => ({ kind: "call" as const, from: c.from, pts: callRoute(c.from, t) }))),
    ...(out.links ?? []).filter((l) => !seenLink.has(keyOfLink(l)) && seenLink.add(keyOfLink(l))).map((l) => ({ kind: "link" as const, from: keyOfLink(l), pts: l.points })),
  ].flatMap((l) => (l.pts !== undefined && l.pts.length > 1 ? [{ ...l, pts: l.pts }] : []));
  const score = fixedScore(scored);

  // 図の大きさ
  const rects = [
    ...out.parties.flatMap((p) => [rectOf(p), ...(p.label ? [rectOf(p.label)] : [])]),
    ...(out.housings ?? []).map(rectOf),
    ...(out.tanks ?? []).map(rectOf),
    ...(out.plates ?? []).map(rectOf),
    ...(out.gauges ?? []).map(rectOf),
    ...(out.events ?? []).map(rectOf),
    ...(out.links ?? []).flatMap((l) => [l.label, ...(l.delta ? [l.delta] : [])].map(rectOf)),
    ...[...(out.calls ?? []), ...(out.links ?? []), ...out.valuePipes].flatMap((l) => (l.points ?? []).map((p) => ({ x: p[0] - 12, y: p[1] - 12, w: 24, h: 24 }))),
    ...(out.events ?? []).flatMap((e) => ((e as PipeEventChip & { tether?: Point[] }).tether ?? []).map((p) => ({ x: p[0] - 4, y: p[1] - 4, w: 8, h: 8 }))),
    ...ethChips.map(rectOf),
  ];
  const all = union(rects);
  out.width = round3(Math.max(all.x + all.w, rowRight) + P.margin);
  out.height = round3(Math.max(all.y + all.h, down ? boxBottom + L.cards : 0) + P.margin);
  for (const f of out.focus ? [out.focus].flat() : []) Object.assign(f, { x: P.margin, y: P.margin, w: out.width - P.margin * 2, h: out.height - P.margin * 2 });
  let t = 0;
  const written = declared.map((id) => (party(id).shape === "token" ? (boxes[t++] ?? id) : id));
  out.fixed = { shape, faded, score, order: written, routes: routes.map((r): [string, string] => [r[0], r[1]]), band: { bottom: round3(tetherTop + tetherH) } };
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
      // 発行は受け手だけ、焼却は持ち主だけを持つ (#3722)
      if (e.type === "move") for (const id of [e.from, e.to]) if (id !== undefined) lit.add(id);
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
  const placed = pickPlace(composed, diagram);
  if (placed !== composed) settleReturns(placed);
  return placed;
}
function pickPlace(composed: PipeLayout, diagram: DiagramModel): PipeLayout {
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

/**
 * 置き直した図の戻り値の札を、今の並べ方と同じ探し方 (`returnRoute`) で止める (#3720)。
 * 置き直しは札の道筋を呼び出しの管の全長に引き直すので、止めないと札が呼んだ側の箱と、管の口の弁に載る。
 * 避けるのは人と箱とその名前の字、槽、箱の札入れ、弁、その段の計器と札
 */
function settleReturns(out: PipeLayout): void {
  const box = (r: Rect): Rect => ({ x: r.x, y: r.y, w: r.w, h: r.h });
  const V = P.valve;
  const fixed: Rect[] = [
    ...out.parties.flatMap((p) => [box(p), box(p.label)]),
    ...out.tanks.map(box),
    ...out.plates.map(box),
    ...out.mains.flatMap((m) => m.branches.flatMap((b) => valveRects(b.valve.x, b.valve.y, b.valve.vertical, b.valve.under))),
    ...out.buses.flatMap((b) => (b.valve ? valveRects(b.valve.x, b.valve.y, false, false) : [])),
    // 帳簿型の枝の弁は縦の管の上の胴だけを描く
    ...out.valuePipes.flatMap((v) => (v.valve ? [{ x: v.valve.x - V.half, y: v.valve.y - V.r, w: V.half * 2, h: V.r * 2 }] : [])),
  ];
  /** 折れ線の線分ごとの、太さ `half` の半分を足した四角 */
  const strokes = (points: readonly Point[], half: number): Rect[] =>
    points.slice(1).map((q, i) => {
      const a = points[i] as Point;
      return { x: Math.min(a[0], q[0]) - half, y: Math.min(a[1], q[1]) - half, w: Math.abs(q[0] - a[0]) + half * 2, h: Math.abs(q[1] - a[1]) + half * 2 };
    });
  /** 呼んだ側が `from` の呼び出しの管を除いた、段 `step` に描く線。太さは描く外の縁 (呼び出しの管は 16、値の管は 14) の半分 */
  const others = (from: string | undefined, step: number): Rect[] => [
    ...out.mains.filter((mn) => mn.from !== from).flatMap((mn) => mn.branches.flatMap((b) => strokes(b.points, 8))),
    ...out.valuePipes.flatMap((v) => strokes(v.points, 7)),
    ...out.links.filter((l) => l.step === step).flatMap((l) => strokes(l.points, 1)),
    ...out.writes.filter((w) => w.step === step && w.from !== w.to).flatMap((w) => strokes(w.points, 1)),
    ...out.events.flatMap((e) => strokes((e as { tether?: Point[] }).tether ?? [], 1)),
  ];
  /** 人か箱と、その名前の字を囲む四角 */
  const outline = (id: string | undefined): Rect | undefined => {
    const p = out.parties.find((x) => x.id === id);
    if (!p) return undefined;
    const x = Math.min(p.x, p.label.x);
    const y = Math.min(p.y, p.label.y);
    return { x, y, w: Math.max(p.x + p.w, p.label.x + p.label.w) - x, h: Math.max(p.y + p.h, p.label.y + p.label.h) - y };
  };
  for (const c of out.chips) {
    if (c.kind !== "return" || !c.path || c.path.length < 2) continue;
    const avoid = [
      ...fixed,
      ...out.gauges
        .filter((g) => g.step === c.step)
        .flatMap((g) => [box(g), { x: g.lamp.x - g.lamp.r, y: g.lamp.y - g.lamp.r, w: g.lamp.r * 2, h: g.lamp.r * 2 }, ...(g.stem ? [{ x: g.cx - 2, y: g.stem.y1, w: 4, h: g.stem.y2 - g.stem.y1 }] : [])]),
      ...out.chips.filter((x) => x.step === c.step && x.kind !== "return").map(box),
    ];
    const rectAt = ([x, y]: Point): Rect => ({ x: x - c.w / 2, y: y - c.h / 2, w: c.w, h: c.h });
    const textAt = ([x, y]: Point): Rect => ({ x: x - c.w / 2 + c.label.x - c.x, y: y - c.h / 2 + c.label.y - c.y, w: c.label.w, h: c.label.h });
    const from = out.calls.find((x) => x.index === c.call)?.from;
    const end = c.path[c.path.length - 1] as Point;
    const callee = out.parties.find((x) => x.id === c.party)?.label;
    // 戻り値の札は自分の呼び出しの管の上に止まるので、札の字をほかの線に掛けない (#3721)
    const { path } = returnRoute(c.path, rectAt, callee, () => outline(from) ?? rectAt(end), avoid, others(from, c.step), textAt);
    const [ox, oy] = c.path[0] as Point;
    const head = path[0] as Point;
    c.path = path;
    moveParts(c, head[0] - ox, head[1] - oy, new WeakSet<object>([c.path]));
  }
}
