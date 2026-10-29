/**
 * 置き場所を決めた結果 (場面) の形と、図の種類に依らず使う置き方。
 *
 * 座標は字が原寸の時の px で、左上を (0, 0) にする。線の名前は線の脇から箱を避けて置き、
 * 中身の帯は図の下に横いっぱいに置く。
 */
import type { Family } from "../look/fonts";
import { COLOR_ORDER, type ColorKey, LOOK, TYPE } from "../look/values";
import type { Carry, Diagram, DiagramEvent, LabelSide } from "../schema";
import { hasWide, textWidth } from "./measure";

export type Point = [number, number];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneBox extends Rect {
  id: string;
  name: string;
  sub?: string;
  icon?: string;
  color: ColorKey;
  cx: number;
  cy: number;
  /** 状態遷移図で、どの段も辿り着かない状態。点線の箱で脇道の囲みに描く */
  ghost?: boolean;
  /** 運ぶ物の置き場の枠 (#3176)。運ぶ物を出し入れする箱だけが持つ */
  slot?: Rect;
  /** 絵柄の真ん中の x。置き場を持つ箱は、絵柄を左へ寄せて右を置き場にする。無ければ箱の真ん中 */
  iconX?: number;
}

export interface SceneRegion extends Rect {
  id: string;
  /** 名前を折り返した行 */
  lines: string[];
  note?: string;
  icon?: string;
  color: ColorKey;
  /** 名前と印が占める所 */
  header: Rect;
}

/** 線。`step` と `event` は原本の `steps[step].events[event]` を指す。 */
export interface SceneEdge {
  step: number;
  event: number;
  from: string;
  to: string;
  points: Point[];
  color: ColorKey;
  carry: Carry;
  /** 着いた運ぶ物が留まる点。無ければ線の終わり */
  settle?: Point;
  /** 走り出す前に運ぶ物が待つ点 (#3176)。運ぶ物はここから線の始まりへ出て線を走る。無ければ線の始まり */
  wait?: Point;
}

export interface SceneLabel extends Rect {
  step: number;
  event: number;
  text: string;
  family: Family;
  color: ColorKey;
  /** 同じ線の同じ名前を次に置く段 (状態遷移図、#3184)。その段が始まると、薄く残した名前を消す */
  until?: number;
}

/** 状態遷移図の、最初の段より前に書いてどの段にも出ない線。点線で描き、運ぶ物を走らせない */
export interface ScenePath {
  from: string;
  to: string;
  points: Point[];
  label?: Rect & { text: string; family: Family };
}

/** 状態遷移図の始まりと終わりの印。`ghost` は脇道の中の終わりの印 */
export interface SceneEnd {
  kind: "start" | "finish";
  x: number;
  y: number;
  r: number;
  ghost: boolean;
  /** 印の右に添える字 */
  text: string;
  /** 終わりの印へ線を引く状態 */
  box?: string;
}

/** 状態遷移図の脇道の囲み。`title` と `notes` は囲みの左上に置く字 */
export interface SceneSide extends Rect {
  title: string;
  /** 囲みの名前の下に 1 行ずつ置く添え書き */
  notes: string[];
}

/** 時系列図の箱の中の処理。生存線の上に札で出す。 */
export interface SceneAction extends Rect {
  step: number;
  event: number;
  box: string;
  text: string;
  color: ColorKey;
}

export interface SceneBadge {
  step: number;
  x: number;
  y: number;
  color: ColorKey;
  /** 同じ所に次に番号を置く段 (#3184)。その段が始まると、この番号を消して数字を入れ替える。無ければ最後まで残る */
  until?: number;
}

export interface SceneLifeline {
  id: string;
  x: number;
  y1: number;
  y2: number;
}

export interface SceneField {
  name: string;
  x: number;
  y: number;
  w: number;
}

/** 状態遷移図の帯の最後の欄。段が辿り着く順に状態を点で並べ、着いた状態を塗る (#3171) */
export interface SceneTrail {
  title: string;
  states: { box: string; color: ColorKey }[];
  x: number;
  y: number;
  w: number;
}

export interface SceneStrip extends Rect {
  title: string;
  fields: SceneField[];
  trail?: SceneTrail;
}

export interface Layout {
  kind: Diagram["kind"];
  width: number;
  height: number;
  regions: SceneRegion[];
  boxes: SceneBox[];
  lifelines: SceneLifeline[];
  edges: SceneEdge[];
  labels: SceneLabel[];
  actions: SceneAction[];
  badges: SceneBadge[];
  strip?: SceneStrip;
  /** 状態遷移図の通らない道。他の図の種類では空 */
  paths: ScenePath[];
  /** 状態遷移図の始まりと終わりの印。他の図の種類では空 */
  ends: SceneEnd[];
  /** 状態遷移図の脇道の囲み。通らない状態が無ければ無い */
  side?: SceneSide;
}

export type EdgeEvent = Extract<DiagramEvent, { type: "edge" }>;

/** 段と線の位置を添えた線の並び。段の順、段の中は起きる順。 */
export function edgesOf(diagram: Diagram): { step: number; event: number; edge: EdgeEvent }[] {
  return diagram.steps.flatMap((step, s) =>
    step.events.flatMap((event, e) => (event.type === "edge" ? [{ step: s, event: e, edge: event }] : [])),
  );
}

/** 箱の色。書いていなければ区画の色、区画も無ければ並んだ順に分類の色を配る。 */
export function boxColors(diagram: Diagram): Map<string, ColorKey> {
  const regions = regionColors(diagram);
  const colors = new Map<string, ColorKey>();
  diagram.boxes.forEach((box, i) => {
    const fromRegion = box.region === undefined ? undefined : regions.get(box.region);
    colors.set(box.id, box.color ?? fromRegion ?? (COLOR_ORDER[i % COLOR_ORDER.length] as ColorKey));
  });
  return colors;
}

export function regionColors(diagram: Diagram): Map<string, ColorKey> {
  const colors = new Map<string, ColorKey>();
  (diagram.regions ?? []).forEach((region, i) => colors.set(region.id, region.color ?? (COLOR_ORDER[i % COLOR_ORDER.length] as ColorKey)));
  return colors;
}

/** 線の色。硬貨を運ぶ線は硬貨の色、それ以外は送る側の箱の色。 */
export const edgeColor = (edge: EdgeEvent, colors: Map<string, ColorKey>): ColorKey =>
  edge.carry.kind === "coin" ? "coin" : (colors.get(edge.from) ?? "slate");

/** 箱の幅。名前、下の小さな字、書き換わる字、中で出す処理のどれもが収まる幅。 */
export function boxWidth(diagram: Diagram, id: string, withActions: boolean): number {
  const box = diagram.boxes.find((b) => b.id === id);
  if (!box) return LOOK.box.minW;
  const lines = [textWidth(box.name, TYPE.boxName), textWidth(box.sub ?? "", TYPE.boxSub)];
  for (const step of diagram.steps) {
    for (const event of step.events) {
      if (event.type === "swap" && event.box === id) lines.push(textWidth(event.text, TYPE.boxSubStrong));
      if (withActions && event.type === "action" && event.box === id) lines.push(textWidth(event.label, TYPE.boxSubStrong));
    }
  }
  return Math.max(LOOK.box.minW, Math.max(...lines) + LOOK.box.padX * 2);
}

/** 運ぶ物の半分の幅と高さ */
export function carrierHalf(carry: Carry): Point {
  const C = LOOK.carrier;
  if (carry.kind === "tag") return [(textWidth(carry.text, hasWide(carry.text) ? TYPE.carrierJa : TYPE.carrier) + C.tagPadX * 2) / 2, C.tagH / 2];
  if (carry.kind === "coin") return [C.coinR, C.coinR];
  return [C.envW / 2, C.envH / 2];
}

/**
 * 置き場の中身の幅 (#3176)。主役の運ぶ物 (封筒と札) と硬貨は別々に動き、同じ箱に同時に留まることがあるので、
 * 両方が出入りする箱は主役を左、硬貨を右に並べる。それぞれの幅は、その箱を出入りする物の最も広い幅
 */
export interface SlotRoom {
  main: number;
  coin: number;
}

const roomWidth = (room: SlotRoom): number => room.main + room.coin + (room.main > 0 && room.coin > 0 ? LOOK.slot.spread : 0);

/** 運ぶ物を出し入れする箱ごとの置き場の中身の幅。何も運ばない線だけの箱は持たない */
export function slotRooms(diagram: Diagram): Map<string, SlotRoom> {
  const rooms = new Map<string, SlotRoom>();
  const ids = new Set(diagram.boxes.map((b) => b.id));
  for (const step of diagram.steps) {
    for (const event of step.events) {
      if (event.type !== "edge" || event.carry.kind === "none") continue;
      const who = event.carry.kind === "coin" ? "coin" : "main";
      const w = carrierHalf(event.carry)[0] * 2;
      for (const id of [event.from, event.to]) {
        if (!ids.has(id)) continue;
        const room = rooms.get(id) ?? { main: 0, coin: 0 };
        room[who] = Math.max(room[who], w);
        rooms.set(id, room);
      }
    }
  }
  return rooms;
}

/**
 * 置き場を持つ箱の幅。絵柄と枠を並べた幅の左に箱の余白を、右に `right` を空ける。
 * 状態遷移図は右上の済んだ印を避けるため `right` を広く取る。両脇を同じだけ広げないのは、図が広がって読める大きさで収まらなくなるため
 */
export function slotBoxWidth(room: SlotRoom | undefined, icon: boolean, right: number): number {
  if (!room) return 0;
  return (icon ? LOOK.box.icon + LOOK.slot.gap : 0) + roomWidth(room) + LOOK.slot.pad * 2 + LOOK.box.padX + right;
}

/**
 * 箱の絵柄の行に、絵柄と置き場の枠を並べる。絵柄を持たない箱は枠だけを置く。
 * 並びは真ん中に置き、右に `right` を空けられない時だけ、空けられる所まで左へ寄せる
 */
export function placeSlot(box: SceneBox, room: SlotRoom | undefined, right: number = LOOK.box.padX): void {
  if (!room) return;
  const B = LOOK.box;
  const S = LOOK.slot;
  const w = roomWidth(room) + S.pad * 2;
  const lead = box.icon ? B.icon + S.gap : 0;
  const left = Math.max(box.x + B.padX, Math.min(box.cx - (lead + w) / 2, box.x + box.w - right - (lead + w)));
  if (box.icon) box.iconX = left + B.icon / 2;
  box.slot = { x: left + lead, y: box.cy + B.iconY - S.h / 2, w, h: S.h };
}

/**
 * 箱を出入りする運ぶ物を、箱の置き場に座らせる。着いた物は着いた箱の置き場に留まり (`settle`)、
 * 走り出す前の物は出る箱の置き場で待つ (`wait`)。主役は枠の左の区画、硬貨は右の区画の真ん中に置く
 */
export function seatCarriers(edges: SceneEdge[], boxes: Map<string, SceneBox>, rooms: Map<string, SlotRoom>): void {
  const S = LOOK.slot;
  const seat = (id: string, carry: Carry): Point | undefined => {
    const box = boxes.get(id);
    const room = rooms.get(id);
    if (!box?.slot || !room) return undefined;
    const inner = box.slot.x + S.pad;
    const y = box.slot.y + box.slot.h / 2;
    if (room.main > 0 && room.coin > 0) return carry.kind === "coin" ? [inner + room.main + S.spread + room.coin / 2, y] : [inner + room.main / 2, y];
    return [box.slot.x + box.slot.w / 2, y];
  };
  for (const edge of edges) {
    if (edge.carry.kind === "none") continue;
    const settle = seat(edge.to, edge.carry);
    const wait = seat(edge.from, edge.carry);
    if (settle) edge.settle = settle;
    if (wait) edge.wait = wait;
  }
}

/** 2 つの四角の隙間。重なる時は負。縦か横のどちらかで離れていれば、その離れ方の大きい方。 */
export function gapBetween(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  return Math.max(dx, dy);
}

/**
 * 折れ線が四角の内側を通るか (#3175)。四角を縁から `inset` だけ内へ縮めて見る。負の `inset` は四角を広げる。
 * 区間ごとに、四角の左右と上下の境で区間を切り詰め (Liang-Barsky の切り取り)、残りが在れば通る
 */
export function crossesRect(points: Point[], rect: Rect, inset = 0): boolean {
  const x0 = rect.x + inset;
  const y0 = rect.y + inset;
  const x1 = rect.x + rect.w - inset;
  const y1 = rect.y + rect.h - inset;
  if (x1 <= x0 || y1 <= y0) return false;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const dx = bx - ax;
    const dy = by - ay;
    let lo = 0;
    let hi = 1;
    const cut = (p: number, q: number): boolean => {
      if (p === 0) return q > 0;
      const r = q / p;
      if (p < 0) lo = Math.max(lo, r);
      else hi = Math.min(hi, r);
      return lo < hi;
    };
    if (cut(-dx, ax - x0) && cut(dx, x1 - ax) && cut(-dy, ay - y0) && cut(dy, y1 - ay)) return true;
  }
  return false;
}

/** 折れ線のうち一番長い区間。 */
export function longest(points: Point[]): { a: Point; b: Point; vertical: boolean } {
  let best = { a: points[0] as Point, b: (points[1] ?? points[0]) as Point, length: -1 };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length > best.length) best = { a, b, length };
  }
  return { a: best.a, b: best.b, vertical: Math.abs(best.b[0] - best.a[0]) < Math.abs(best.b[1] - best.a[1]) };
}

/** 折れ線の長さと、始まりから `distance` 進んだ点。 */
export function along(points: Point[], distance: number): Point {
  let left = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= length && length > 0) return [a[0] + ((b[0] - a[0]) * left) / length, a[1] + ((b[1] - a[1]) * left) / length];
    left -= length;
  }
  return points[points.length - 1] as Point;
}

export function pathLength(points: Point[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return sum;
}

/**
 * 同じ箱へ戻る輪 (状態遷移図 #3163、構成図 #3186)。箱の下端の右から出て、下へ膨らむ弧を描いて左から箱へ戻る。
 * 運ぶ物が弧の上を走れるよう、点で区切る。大きさは状態遷移図の値 (`LOOK.state.loop`) を 2 つの図で分け合う
 */
export function loopUnder(box: { cx: number; y: number; h: number }): Point[] {
  const { w, h, samples } = LOOK.state.loop;
  const bottom = box.y + box.h;
  const p0: Point = [box.cx + w / 2, bottom];
  const c1: Point = [box.cx + (w * 3) / 4, bottom + (h * 4) / 3];
  const c2: Point = [box.cx - (w * 3) / 4, bottom + (h * 4) / 3];
  const p3: Point = [box.cx - w / 2, bottom + LOOK.edge.inset];
  return Array.from({ length: samples + 1 }, (_, k): Point => {
    const t = k / samples;
    const u = 1 - t;
    const at = (i: 0 | 1): number => u * u * u * p0[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * p3[i];
    return [at(0), at(1)];
  });
}

/** 輪の段の番号の点。弧に重ねず弧の右に置き、高さは弧の上端から深さの `LOOK.state.loop.badgeAt` の所 */
export function loopBadge(points: Point[]): Point {
  const right = Math.max(...points.map(([px]) => px));
  const top = (points[0] as Point)[1];
  const deep = Math.max(...points.map(([, py]) => py));
  return [right + LOOK.badge.r + LOOK.badge.inset, top + (deep - top) * LOOK.state.loop.badgeAt];
}

/** 輪の名前を探し始める札の左上。幅 `w` の札を輪の真下の真ん中に置く */
export function loopLabelBase(points: Point[], w: number): { x: number; y: number } {
  return { x: (points[0]?.[0] ?? 0) - LOOK.state.loop.w / 2 - w / 2, y: Math.max(...points.map(([, y]) => y)) + LOOK.label.soft };
}

/** 輪と、その下に置く名前の札が、箱の下に要る高さ (#3186) */
export const LOOP_ROOM = LOOK.state.loop.h + LOOK.label.soft * 2 + LOOK.label.h;

/**
 * 段の番号を置く点。線の始まりから少し進んだ所。`LOOK.badge.short` より短い線も始まりに置き、出る箱の縁から番号の半径と 1px だけ進める。
 * 中ほどに置くと、往復する 2 本の短い線で 2 つの番号が同じ高さに並んで重なるため (#3189)。
 * 先に置いた番号 (`taken`) に重なる時は、線に沿って進めて前の番号を避ける (#3175)。
 * 線の上で避けきれない時は線の脇へずらし、ずらす向きはほかの線 (`lines`) に乗らない側にする (#3189)
 */
export function badgeOnPath(points: Point[], taken: Point[] = [], lines: Point[][] = []): Point {
  const length = pathLength(points);
  const first = length < LOOK.badge.short ? Math.min(LOOK.badge.r + 1, length / 2) : LOOK.badge.along;
  const apart = LOOK.badge.r * 2 + LOOK.badge.inset;
  for (let d = first; d <= length; d += 1) {
    const p = along(points, d);
    if (taken.every(([x, y]) => Math.hypot(p[0] - x, p[1] - y) >= apart)) return p;
  }
  return besideLine(points, first, taken, lines) ?? along(points, first);
}

/**
 * 線の上で前の番号を避けきれない番号を、線の向きと直角に脇へずらした点 (#3189)。
 * 前の番号の四角にも、ほかの線にも掛からない所のうち、線に一番近い所。番号 1 つ分ずらしても無ければ返さない。
 * ほかの線は先に矢じりの幅だけ太らせて避け、それで空きが無い時だけ線そのものを避ける (矢じりに少し掛かっても、番号どうしを重ねるよりよい)
 */
function besideLine(points: Point[], at: number, taken: Point[], lines: Point[][]): Point | undefined {
  const length = pathLength(points);
  const [px, py] = along(points, at);
  const [ax, ay] = along(points, Math.max(0, at - 1));
  const [bx, by] = along(points, Math.min(length, at + 1));
  const n = Math.hypot(bx - ax, by - ay);
  if (n === 0) return undefined;
  const [nx, ny] = [-(by - ay) / n, (bx - ax) / n];
  const size = LOOK.badge.r * 2;
  for (const margin of [LOOK.edge.arrowHalf, 0]) {
    for (let s = 1; s <= size + LOOK.badge.inset; s++) {
      for (const sign of [1, -1]) {
        const c: Point = [px + nx * s * sign, py + ny * s * sign];
        const free = taken.every(([x, y]) => Math.max(Math.abs(c[0] - x), Math.abs(c[1] - y)) >= size + 1);
        if (free && lines.every((line) => !crossesRect(line, badgeRect(c), -margin))) return c;
      }
    }
  }
  return undefined;
}

/** 引いた線の形を表す鍵。同じ 2 つの箱を結んでも、時系列図の別の行のように形が違えば別の線 (#3184) */
export const lineKey = (edge: SceneEdge): string => edge.points.map(([x, y]) => `${Math.round(x * 10)},${Math.round(y * 10)}`).join(" ");

/**
 * 線を持つ段の番号の点 (#3175)。段の最初の線の上に `at` で置き、別の線の番号に重なる時は線に沿ってずらす。
 * 同じ線を前の段が通っていれば、前の段の番号と同じ所に置く。前の番号は後の段が始まると消え、数字が入れ替わる (#3184)。
 * 番号は線だけで決まるので、線の名前を置く前に求め、名前が同じ時刻に見える番号を避けられるようにする。
 * `at` には、形の違うほかの線 (段の前に点線で見えている線も含む) を渡し、脇へずらす番号がそれらに乗らないようにする (#3189)
 */
export function lineBadges(
  edges: SceneEdge[],
  steps: number,
  at: (edge: SceneEdge, taken: Point[], lines: Point[][]) => Point = (edge, taken, lines) => badgeOnPath(edge.points, taken, lines),
): Map<number, { point: Point; edge: SceneEdge }> {
  const out = new Map<number, { point: Point; edge: SceneEdge }>();
  const taken: Point[] = [];
  const placed = new Map<string, Point>();
  for (let s = 0; s < steps; s++) {
    const edge = edges.find((e) => e.step === s && e.points.length > 0);
    if (!edge) continue;
    const key = lineKey(edge);
    const before = placed.get(key);
    if (before) {
      out.set(s, { point: before, edge });
      continue;
    }
    const lines = edges.filter((e) => e.points.length > 1 && lineKey(e) !== key).map((e) => e.points);
    const point = at(edge, taken, lines);
    taken.push(point);
    placed.set(key, point);
    out.set(s, { point, edge });
  }
  return out;
}

/**
 * 同じ所に置いた段の番号を入れ替える (#3184)。後の段の番号が前の段の番号と同じ所に来る時、前の段の番号に `until` を付けて、
 * 後の段が始まると消す。同じ線を何度も通る段と、線の無い段が同じ箱か帯を続けて書き換える段がこれに当たる
 */
export function replaceSameSpot(badges: SceneBadge[]): SceneBadge[] {
  const same = (a: SceneBadge, b: SceneBadge): boolean => Math.hypot(a.x - b.x, a.y - b.y) <= 0.5;
  return badges.map((badge) => {
    const next = badges.filter((other) => other.step > badge.step && same(other, badge)).sort((a, b) => a.step - b.step)[0];
    return next ? { ...badge, until: next.step } : badge;
  });
}

/** 段の番号の丸を囲む四角。線の名前が避ける相手にする (#3175) */
export const badgeRect = ([x, y]: Point): Rect => ({ x: x - LOOK.badge.r, y: y - LOOK.badge.r, w: LOOK.badge.r * 2, h: LOOK.badge.r * 2 });

/** 状態遷移図の始まりと終わりの印の右に添える字の左端と基準線。描く部品と、線の名前が字を避ける所の両方が読む (#3175) */
export const markText = (e: SceneEnd): Point => [e.x + LOOK.state.text, e.y + LOOK.baseline.mark];

export interface LabelRequest {
  step: number;
  event: number;
  text: string;
  points: Point[];
  side?: LabelSide;
  color: ColorKey;
  /** 初めに試す札の左上。無ければ一番長い区間の真ん中から `side` の側へ離した所 (#3175) */
  base?: { x: number; y: number };
  /** 線に沿ってずらす長さの上限。無ければ上か下に置く札は札の幅、左か右に置く札は札の高さの 4 倍 (#3175) */
  slide?: number;
  /** 指示の側が埋まっている時、同じ離れで反対の側も探す (#3175) */
  flip?: boolean;
  /** 札を線の上か下に置く時の、線から札の真ん中までの離れ。無ければ `LOOK.label.offset` (#3177) */
  offset?: number;
}

export interface Obstacles {
  /** 10px 以上離す物 (箱) */
  hard: Rect[];
  /** 重ならなければよい物 (区画の名前、同じ段の線の名前) */
  soft: Rect[];
  /** 食い込まなければよい物 (同じ時刻に見えている段の番号の丸、#3175)。線のすぐ脇に置く名前を、線の上の丸のために遠ざけない */
  touch?: Rect[];
  /** 名前を横切らせない線 (#3175)。札を外して薄く残す名前は、地の色で線を隠せないため */
  lines?: Point[][];
}

export const labelStyle = (text: string) => (hasWide(text) ? TYPE.labelJa : TYPE.label);

const OPPOSITE: Record<LabelSide, LabelSide> = { above: "below", below: "above", left: "right", right: "left" };

/**
 * 線の名前を置く。線の一番長い区間の中ほどから、寄せの指示の側 (無ければ横の線は上、縦の線は右) へ
 * 離して置く。箱や区画の名前に掛かる時は、指示の側へさらに離し、線に沿ってもずらして空きを探す。
 * `flip` を立てると、同じ離れで反対の側も探す (#3175)。片側だけを遠くまで探すと、図の端の外へ出るため
 */
export function placeLabel(request: LabelRequest, obstacles: Obstacles): SceneLabel {
  const w = textWidth(request.text, labelStyle(request.text)) + LOOK.label.padX * 2;
  const h = LOOK.label.h;
  const segment = longest(request.points);
  const mx = (segment.a[0] + segment.b[0]) / 2;
  const my = (segment.a[1] + segment.b[1]) / 2;
  const preferred = request.side ?? (segment.vertical ? "right" : "above");
  const { side: sideGap } = LOOK.label;
  const offset = request.offset ?? LOOK.label.offset;
  const baseOf = (side: LabelSide): Rect =>
    side === "above"
      ? { x: mx - w / 2, y: my - offset - h / 2, w, h }
      : side === "below"
        ? { x: mx - w / 2, y: my + offset - h / 2, w, h }
        : side === "left"
          ? { x: mx - sideGap - w, y: my - h / 2, w, h }
          : { x: mx + sideGap, y: my - h / 2, w, h };
  const first: Rect = request.base ? { ...request.base, w, h } : baseOf(preferred);
  const sides = request.flip ? [preferred, OPPOSITE[preferred]] : [preferred];
  const clear = (rect: Rect): boolean =>
    obstacles.hard.every((box) => gapBetween(rect, box) >= LOOK.gap) &&
    obstacles.soft.every((other) => gapBetween(rect, other) >= LOOK.label.soft) &&
    (obstacles.touch ?? []).every((mark) => gapBetween(rect, mark) >= LOOK.label.touch) &&
    (obstacles.lines ?? []).every((line) => !crossesRect(line, rect, -LOOK.label.touch));
  const { search, searchMax } = LOOK.label;
  for (let d = 0; d <= searchMax; d += search) {
    for (const side of sides) {
      const base = side === preferred ? first : baseOf(side);
      // 離す向き (その側) と、ずらす向き (それに直交する向き)
      const away: Point = side === "above" ? [0, -1] : side === "below" ? [0, 1] : side === "left" ? [-1, 0] : [1, 0];
      const slideAxis: Point = [Math.abs(away[1]), Math.abs(away[0])];
      const slideMax = request.slide ?? (side === "above" || side === "below" ? w : h * 4);
      for (let s = 0; s <= slideMax; s += search) {
        for (const sign of s === 0 ? [1] : [1, -1]) {
          const rect = { x: base.x + away[0] * d + slideAxis[0] * s * sign, y: base.y + away[1] * d + slideAxis[1] * s * sign, w, h };
          if (clear(rect)) return { ...rect, step: request.step, event: request.event, text: request.text, family: labelStyle(request.text).family, color: request.color };
        }
      }
    }
  }
  return { ...first, step: request.step, event: request.event, text: request.text, family: labelStyle(request.text).family, color: request.color };
}

/** 中身の帯の欄の幅。欄の名前と、入る値と札を並べた最も長い形が収まる幅。 */
function fieldWidth(diagram: Diagram, name: string): number {
  let value = 0;
  let tag = 0;
  for (const step of diagram.steps) {
    for (const event of step.events) {
      if (event.type !== "strip" || event.field !== name) continue;
      if (event.value !== undefined) value = Math.max(value, textWidth(event.value, hasWide(event.value) ? TYPE.fieldValueJa : TYPE.fieldValue));
      if (event.tag !== undefined) tag = Math.max(tag, textWidth(event.tag, TYPE.tag) + LOOK.strip.tagPadX * 2);
    }
  }
  const both = value + (tag > 0 ? (value > 0 ? LOOK.strip.tagGap : 0) + tag : 0);
  return Math.max(textWidth(name, TYPE.fieldName), both);
}

/** 帯の最後に並べる通った状態の欄の名前と点。状態遷移図だけが渡す */
export type TrailSource = Pick<SceneTrail, "title" | "states">;

const trailWidth = (trail: TrailSource): number => Math.max(textWidth(trail.title, TYPE.fieldName), trail.states.length * LOOK.strip.trail.step);

/** 1 行に並べた時に帯が要る幅。 */
export function stripNeed(diagram: Diagram, trail?: TrailSource): number {
  if (!diagram.strip) return 0;
  const { titleX, fieldGap, pad } = LOOK.strip;
  const start = titleX + textWidth(diagram.strip.title, TYPE.stripTitle) + fieldGap;
  const widths = [...diagram.strip.fields.map((name) => fieldWidth(diagram, name)), ...(trail ? [trailWidth(trail)] : [])];
  return start + widths.reduce((sum, w) => sum + w + fieldGap, 0) - fieldGap + pad;
}

/** 中身の帯。欄は左から並べ、幅に収まらない欄は次の行へ送る。通った状態の欄を渡すと、最後の欄の後に同じ決まりで置く。 */
export function layoutStrip(diagram: Diagram, x: number, y: number, width: number, trail?: TrailSource): SceneStrip | undefined {
  if (!diagram.strip) return undefined;
  const { titleX, fieldGap, pad, line, h } = LOOK.strip;
  const start = titleX + textWidth(diagram.strip.title, TYPE.stripTitle) + fieldGap;
  const fields: SceneField[] = [];
  let cx = start;
  let row = 0;
  const place = (w: number): { x: number; y: number } => {
    if (cx > start && cx + w > width - pad) {
      cx = start;
      row++;
    }
    const at = { x: x + cx, y: y + row * line };
    cx += w + fieldGap;
    return at;
  };
  for (const name of diagram.strip.fields) {
    const w = fieldWidth(diagram, name);
    fields.push({ name, ...place(w), w });
  }
  const laidTrail = trail ? { ...trail, ...place(trailWidth(trail)), w: trailWidth(trail) } : undefined;
  return { x, y, w: width, h: h + row * line, title: diagram.strip.title, fields, ...(laidTrail ? { trail: laidTrail } : {}) };
}

/** 場面の全ての物を (dx, dy) だけ動かす。区画と帯は動かさず、横いっぱいの形を保つ。 */
export function shiftContent(layout: Layout, dx: number, dy: number): void {
  const move = (rect: Rect): void => {
    rect.x += dx;
    rect.y += dy;
  };
  for (const box of layout.boxes) {
    move(box);
    box.cx += dx;
    box.cy += dy;
    if (box.slot) move(box.slot);
    if (box.iconX !== undefined) box.iconX += dx;
  }
  for (const region of layout.regions) {
    region.y += dy;
    move(region.header);
  }
  for (const line of layout.lifelines) {
    line.x += dx;
    line.y1 += dy;
    line.y2 += dy;
  }
  for (const edge of layout.edges) {
    edge.points = edge.points.map(([px, py]) => [px + dx, py + dy]);
    if (edge.settle) edge.settle = [edge.settle[0] + dx, edge.settle[1] + dy];
    if (edge.wait) edge.wait = [edge.wait[0] + dx, edge.wait[1] + dy];
  }
  for (const label of layout.labels) move(label);
  for (const path of layout.paths) {
    path.points = path.points.map(([px, py]) => [px + dx, py + dy]);
    if (path.label) move(path.label);
  }
  for (const end of layout.ends) {
    end.x += dx;
    end.y += dy;
  }
  if (layout.side) move(layout.side);
  for (const action of layout.actions) move(action);
  for (const badge of layout.badges) {
    badge.x += dx;
    badge.y += dy;
  }
  if (layout.strip) {
    layout.strip.y += dy;
    for (const field of layout.strip.fields) {
      field.x += dx;
      field.y += dy;
    }
    if (layout.strip.trail) {
      layout.strip.trail.x += dx;
      layout.strip.trail.y += dy;
    }
  }
}

/** 線も処理も無い段の番号。書き換わる箱の左上か、中身の帯の左上か、最初の箱の左上。 */
export function cornerBadge(events: DiagramEvent[], step: number, layout: Layout): SceneBadge {
  const { inset } = LOOK.badge;
  for (const event of events) {
    const id = event.type === "swap" || event.type === "action" ? event.box : undefined;
    const box = layout.boxes.find((b) => b.id === id);
    if (box) return { step, x: box.x + inset, y: box.y + inset, color: box.color };
  }
  if (layout.strip && events.some((event) => event.type === "strip")) return { step, x: layout.strip.x + inset, y: layout.strip.y + inset, color: "slate" };
  const box = layout.boxes[0] as SceneBox;
  return { step, x: box.x + inset, y: box.y + inset, color: box.color };
}
