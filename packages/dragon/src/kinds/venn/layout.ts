/**
 * 集合の重なりの図 (`venn`、#3620) の並べ方。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 円は同じ大きさで、2 つの集まりは左右に、3 つの集まりは左上と右上と下に、隣どうしの円の真ん中を半径の `apart` 倍離して置く。
 * 集まりの名前と全体の数は、円の並びの真ん中から見た円の向きの外に置く。2 つの集まりは左上と右上、3 つの集まりは左上と右上と右下。
 * 区画の数は、区画の中で円の縁から一番遠い点に置く。点は格子で探す。
 * 重なりの数の札は、重なりを書いた段の間だけ、並びの真ん中から重なりの向きの円の外に出し、区画の数の所と点線で結ぶ。3 つ全ての重なりの札は右に出す。
 * どれにも入らない数の札は、全ての部品を囲む枠の左下に置く。段の番号は、その段で現れた名前か札の外の側に置く。
 * 段ごとの数は、段の中の `count` が書いた数で、書かない段は前の段の数を保つ。それぞれだけの数は `blocks/circle/regions.ts` の決まりで出し、決まらない段は出さない。
 * 見本帳を開いた時に読まない図の種類なので、後から読む塊に入れる
 */
import { exclusiveOf, regionKey, regionsOf, vennNumber } from "../../blocks/circle/regions";
import { textWidth } from "../../layout/measure";
import { besideSameSpot, type Layout, type Point, type Rect, type SceneBadge } from "../../layout/scene";
import { COLOR_ORDER, type ColorKey, LOOK } from "../../look/values";
import { VENN_LOOK, VENN_TYPE } from "../../look/venn";
import type { DiagramModel } from "../../schema";
import { DEFAULT_LANG, type NotationLang } from "../../words";

/** 札の頭に付ける字。2 つの集まりの重なり、3 つ全ての重なり、どれにも入らない数 */
const CHIP_WORDS: Record<NotationLang, { both: string; all: string; none: string }> = {
  ja: { both: "両方", all: "3つ全て", none: "どれにも入らない" },
  en: { both: "Both", all: "All three", none: "In none" },
};

/** 並べた集まりの円。`appear` は初めて数を書いた段で、書かない集まりは -1 */
export interface VennCircle {
  id: string;
  name: string;
  color: ColorKey;
  cx: number;
  cy: number;
  r: number;
  appear: number;
  /** 円の外の名前と数。`x` は字の真ん中、`name` と `total` は 2 つの字の基準線、`rect` は 2 つの字を囲む四角 */
  label: { x: number; name: number; total: number; rect: Rect };
}

/** 区画。`key` は宣言した順の名札を `&` で繋いだ名札、`x` と `y` は数の字の真ん中と基準線 */
export interface VennRegion {
  key: string;
  members: string[];
  x: number;
  y: number;
  /** 数の字を置く点 (区画の中で円の縁から一番遠い点) */
  spot: Point;
}

/** 重なりを書いた段の、光らせる区画と数の札。`from` と `to` は札と区画の数の所を結ぶ点線の両端 */
export interface VennLit {
  step: number;
  key: string;
  value: number;
  color: ColorKey;
  text: string;
  chip: Rect;
  from: Point;
  to: Point;
}

/** どれにも入らない数。`frame` は全ての部品を囲む枠、`chip` は数の札、`texts` は段ごとの札の字 (まだ書かない段は `undefined`) */
export interface VennNonePlan {
  first: number;
  frame: Rect;
  chip: Rect;
  texts: (string | undefined)[];
}

export interface VennPlan {
  circles: VennCircle[];
  regions: VennRegion[];
  /** 集まりごと段ごとの全体の数。まだ書かない段は `undefined` */
  totals: (number | undefined)[][];
  /** 区画ごと段ごとのそれぞれだけの数。まだ決まらない段は `undefined` */
  counts: (number | undefined)[][];
  lits: VennLit[];
  none?: VennNonePlan;
}

export interface VennLayout extends Layout {
  kind: "venn";
  venn: VennPlan;
}

const unit = ([x, y]: Point): Point => {
  const n = Math.hypot(x, y);
  return n === 0 ? [0, -1] : [x / n, y / n];
};

/** 点 `from` から向き `u` に進み、どの円の外にも出た所までの長さ */
function exitOf(circles: readonly { cx: number; cy: number; r: number }[], from: Point, u: Point): number {
  let t = 0;
  const inside = (d: number): boolean => circles.some((c) => Math.hypot(from[0] + u[0] * d - c.cx, from[1] + u[1] * d - c.cy) < c.r);
  while (inside(t)) t += 1;
  return t;
}

/**
 * 点 `p` の外に置く `w` と `h` の四角。向き `u` の縦横の成分が小さい軸は `p` に真ん中を揃え、大きい軸は `p` から向きの側へ寄せる。
 * どの角も `p` から見て向きの側に在るので、`p` が円の外なら四角も円の外に出る
 */
function placeOut(p: Point, u: Point, w: number, h: number): Rect {
  const along = (v: number, size: number): number => (Math.abs(v) < 0.3 ? -size / 2 : v < 0 ? -size : 0);
  return { x: p[0] + along(u[0], w), y: p[1] + along(u[1], h), w, h };
}

/** 区画ごとに、区画の中で円の縁から一番遠い点。格子の点を区画に分け、区画ごとに縁から一番遠い点を選ぶ */
function spotsOf(circles: readonly VennCircle[], order: readonly string[]): Map<string, Point> {
  const step = VENN_LOOK.place.grid;
  const left = Math.min(...circles.map((c) => c.cx - c.r));
  const right = Math.max(...circles.map((c) => c.cx + c.r));
  const top = Math.min(...circles.map((c) => c.cy - c.r));
  const bottom = Math.max(...circles.map((c) => c.cy + c.r));
  const best = new Map<string, { p: Point; clear: number }>();
  for (let y = top; y <= bottom; y += step) {
    for (let x = left; x <= right; x += step) {
      const ds = circles.map((c) => c.r - Math.hypot(x - c.cx, y - c.cy));
      const members = circles.filter((_, i) => (ds[i] as number) > 0).map((c) => c.id);
      if (members.length === 0) continue;
      const key = regionKey(order, members);
      const clear = Math.min(...ds.map(Math.abs));
      const had = best.get(key);
      if (!had || clear > had.clear) best.set(key, { p: [x, y], clear });
    }
  }
  return new Map([...best].map(([key, { p }]) => [key, p]));
}

/** 四角どうしを囲む四角 */
function unionOf(rects: readonly Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
}

const grow = (r: Rect, by: number): Rect => ({ x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 });
const shift = (r: Rect, dx: number, dy: number): Rect => ({ ...r, x: r.x + dx, y: r.y + dy });

/** 札の大きさ。字の幅に左右の余白を足す */
const chipSize = (texts: readonly string[]): { w: number; h: number } => ({
  w: Math.max(...texts.map((t) => textWidth(t, VENN_TYPE.chip))) + VENN_LOOK.chip.padX * 2,
  h: VENN_LOOK.chip.h,
});

/** 段ごとの数。`count` と `none` を書かない段は前の段の数を保つ */
function stepValues(diagram: DiagramModel, order: readonly string[]): { values: Map<string, number>[]; none: (number | undefined)[]; written: Set<string> } {
  const now = new Map<string, number>();
  const written = new Set<string>();
  let none: number | undefined;
  const values: Map<string, number>[] = [];
  const nones: (number | undefined)[] = [];
  for (const step of diagram.steps) {
    for (const event of step.events) {
      if (event.type === "count") {
        const key = regionKey(order, event.sets);
        now.set(key, event.value);
        written.add(key);
      }
      if (event.type === "none") none = event.value;
    }
    values.push(new Map(now));
    nones.push(none);
  }
  return { values, none: nones, written };
}

/** 集合の重なりの図を並べる。`lang` は札の頭に付ける字の言葉 */
export function layoutVenn(diagram: DiagramModel, lang: NotationLang = DEFAULT_LANG): VennLayout {
  const words = CHIP_WORDS[lang];
  const sets = diagram.venn?.sets ?? [];
  const order = sets.map((set) => set.id);
  const C = VENN_LOOK.circle;
  const d = C.r * C.apart;
  const three = sets.length >= 3;
  // 円の真ん中。2 つは左右に、3 つは左上と右上と下に置き、後で枠の左上へずらす
  const centres: Point[] = three
    ? [
        [-d / 2, 0],
        [d / 2, 0],
        [0, (d * Math.sqrt(3)) / 2],
      ]
    : [
        [-d / 2, 0],
        [d / 2, 0],
      ];
  const g: Point = [centres.reduce((a, c) => a + c[0], 0) / centres.length, centres.reduce((a, c) => a + c[1], 0) / centres.length];
  // 名前と数を置く向き。2 つは左上と右上、3 つは左上と右上と右下
  const labelDirs: Point[] = three
    ? [unit([-0.866, -0.5]), unit([0.866, -0.5]), unit([0.5, 0.866])]
    : [unit([-0.5, -0.866]), unit([0.5, -0.866])];
  const { values, none, written } = stepValues(diagram, order);
  const used = new Set(sets.flatMap((set) => (set.color ? [set.color] : [])));
  const colors: ColorKey[] = sets.map((set, i) => set.color ?? (COLOR_ORDER[i % COLOR_ORDER.length] as ColorKey));
  for (const c of colors) used.add(c);
  /** 3 つ全ての重なりの色。集まりが使っていない最初の色の役 */
  const allColor = (COLOR_ORDER.find((c) => !used.has(c)) ?? "slate") as ColorKey;

  const totals = order.map((id) => values.map((v) => v.get(id)));
  const bare = sets.map((set, i) => {
    const [cx, cy] = centres[i] as Point;
    return { id: set.id, name: set.name, color: colors[i] as ColorKey, cx, cy, r: C.r };
  });
  const circles: VennCircle[] = bare.map((c, i) => {
    const u = labelDirs[i] as Point;
    const out = exitOf(bare, [c.cx, c.cy], u) + VENN_LOOK.label.gap;
    const p: Point = [c.cx + u[0] * out, c.cy + u[1] * out];
    const T = VENN_TYPE;
    const shownTotals = (totals[i] ?? []).flatMap((v) => (v === undefined ? [] : [vennNumber(v)]));
    const w = Math.max(textWidth(c.name, T.name), ...shownTotals.map((t) => textWidth(t, T.total)));
    const h = T.name.size * 0.8 + VENN_LOOK.label.row + T.total.size * 0.2;
    const rect = placeOut(p, u, w, h);
    const name = rect.y + T.name.size * 0.8;
    return { ...c, appear: (totals[i] ?? []).findIndex((v) => v !== undefined), label: { x: rect.x + w / 2, name, total: name + VENN_LOOK.label.row, rect } };
  });

  const spots = spotsOf(circles, order);
  const regionSets = regionsOf(order);
  const regions: VennRegion[] = regionSets.map((members) => {
    const key = members.join("&");
    const spot = spots.get(key) ?? g;
    return { key, members, x: spot[0], y: spot[1] + VENN_TYPE.region.size * 0.3, spot };
  });
  const counts = regionSets.map((members) => values.map((v) => exclusiveOf(order, members, (key) => v.get(key), (key) => written.has(key))));

  // 重なりの数の札。重なりを書いた段ごとに 1 つ出し、同じ段で同じ重なりを 2 度書いた時は後の数を出す
  const lits: VennLit[] = [];
  diagram.steps.forEach((step, s) => {
    for (const event of step.events) {
      if (event.type !== "count" || event.sets.length < 2) continue;
      const key = regionKey(order, event.sets);
      const members = key.split("&");
      const text = `${members.length >= 3 ? words.all : words.both} ${vennNumber(event.value)}`;
      const ids = members.map((id) => order.indexOf(id));
      const mid: Point = [ids.reduce((a, i) => a + (centres[i]?.[0] ?? 0), 0) / ids.length, ids.reduce((a, i) => a + (centres[i]?.[1] ?? 0), 0) / ids.length];
      const u = members.length >= 3 ? ([1, 0] as Point) : unit([mid[0] - g[0], mid[1] - g[1]]);
      const out = exitOf(circles, g, u) + VENN_LOOK.chip.gap;
      const { w, h } = chipSize([text]);
      const chip = placeOut([g[0] + u[0] * out, g[1] + u[1] * out], u, w, h);
      const spot = regions.find((r) => r.key === key)?.spot ?? g;
      // 点線は札の縁の、区画の数の所に近い点から、区画の数の字の外まで引く
      const to: Point = [Math.min(Math.max(spot[0], chip.x), chip.x + w), Math.min(Math.max(spot[1], chip.y), chip.y + h)];
      const dir = unit([to[0] - spot[0], to[1] - spot[1]]);
      const textW = Math.max(0, ...(counts[regionSets.findIndex((m) => m.join("&") === key)] ?? []).flatMap((v) => (v === undefined ? [] : [textWidth(vennNumber(v), VENN_TYPE.region)])));
      const half = Math.min(Math.abs(dir[0]) > 1e-6 ? (textW / 2 + 4) / Math.abs(dir[0]) : Number.POSITIVE_INFINITY, Math.abs(dir[1]) > 1e-6 ? (VENN_TYPE.region.size / 2 + 4) / Math.abs(dir[1]) : Number.POSITIVE_INFINITY);
      const from: Point = [spot[0] + dir[0] * half, spot[1] + dir[1] * half];
      const color = members.length >= 3 ? allColor : (colors[Math.max(...ids)] as ColorKey);
      const same = lits.findIndex((l) => l.step === s && l.key === key);
      const lit = { step: s, key, value: event.value, color, text, chip, from, to };
      if (same >= 0) lits[same] = lit;
      else lits.push(lit);
    }
  });

  // 段の番号。円が現れた段は名前の、図の真ん中から遠い側に置く。重なりだけを書いた段は、最後に光らせた区画の数の下に置く。
  // 重なりの数の札はその段の間だけ出るので、札の隣に置くと後の段で番号だけが残る。何も現れない段は前の段の番号の隣に置く
  const R = LOOK.badge.r;
  const besideOf = (rect: Rect, y: number, color: ColorKey): Omit<SceneBadge, "step"> => {
    const left = rect.x + rect.w / 2 < g[0];
    return { x: left ? rect.x - VENN_LOOK.badge.gap - R : rect.x + rect.w + VENN_LOOK.badge.gap + R, y, color };
  };
  const nameMid = (c: VennCircle): number => c.label.name - VENN_TYPE.name.size * 0.3;
  const spotsByStep: (Omit<SceneBadge, "step"> | undefined)[] = diagram.steps.map((_, s) => {
    const circle = circles.find((c) => c.appear === s);
    if (circle) return besideOf(circle.label.rect, nameMid(circle), circle.color);
    const lit = lits.filter((l) => l.step === s).at(-1);
    const spot = lit && regions.find((r) => r.key === lit.key)?.spot;
    if (lit && spot) return { x: spot[0], y: spot[1] + VENN_TYPE.region.size * 0.3 + VENN_LOOK.badge.gap + R, color: lit.color };
    return undefined;
  });

  const content = unionOf([
    ...circles.map((c) => ({ x: c.cx - c.r, y: c.cy - c.r, w: c.r * 2, h: c.r * 2 })),
    ...circles.map((c) => c.label.rect),
    ...lits.map((l) => l.chip),
    ...spotsByStep.flatMap((b) => (b ? [{ x: b.x - R, y: b.y - R, w: R * 2, h: R * 2 }] : [])),
  ]);
  // どれにも入らない数の札は、ほかの部品の下の左端に置き、段の番号を札の左に置く
  const noneFirst = none.findIndex((v) => v !== undefined);
  let nonePlan: VennNonePlan | undefined;
  let frame = grow(content, VENN_LOOK.frame.pad);
  if (noneFirst >= 0) {
    const texts = none.map((v) => (v === undefined ? undefined : `${words.none} ${vennNumber(v)}`));
    const { w, h } = chipSize(texts.flatMap((t) => (t === undefined ? [] : [t])));
    const chip = { x: content.x + R * 2 + VENN_LOOK.badge.gap, y: content.y + content.h + VENN_LOOK.chip.gap, w, h };
    frame = grow(unionOf([content, chip]), VENN_LOOK.frame.pad);
    nonePlan = { first: noneFirst, frame, chip, texts };
    diagram.steps.forEach((step, s) => {
      if (spotsByStep[s] === undefined && step.events.some((e) => e.type === "none")) spotsByStep[s] = { x: content.x + R, y: chip.y + h / 2, color: "slate" };
    });
  }
  // 何も現れない段の番号は、前の段の番号と同じ所に置き、besideSameSpot が隣へずらす
  let before: Omit<SceneBadge, "step"> | undefined = spotsByStep.find((b) => b !== undefined);
  const raw: SceneBadge[] = spotsByStep.map((b, step) => {
    const spot = b ?? before ?? { x: frame.x + R, y: frame.y + R, color: "slate" as ColorKey };
    before = spot;
    return { step, ...spot };
  });

  // 枠の左上を余白の所へずらす
  const P = VENN_LOOK.pad;
  const dx = P - frame.x;
  const dy = P - frame.y;
  const mv = ([x, y]: Point): Point => [x + dx, y + dy];
  const texts = [...circles.map((c) => c.label.rect), ...lits.map((l) => l.chip)].map((r) => shift(r, dx, dy));
  const blocked = ([x, y]: Point): boolean => texts.some((r) => x > r.x - R && x < r.x + r.w + R && y > r.y - R && y < r.y + r.h + R);
  const badges = besideSameSpot(
    raw.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy })),
    blocked,
  );
  const plan: VennPlan = {
    circles: circles.map((c) => ({
      ...c,
      cx: c.cx + dx,
      cy: c.cy + dy,
      label: { x: c.label.x + dx, name: c.label.name + dy, total: c.label.total + dy, rect: shift(c.label.rect, dx, dy) },
    })),
    regions: regions.map((r) => ({ ...r, x: r.x + dx, y: r.y + dy, spot: mv(r.spot) })),
    totals,
    counts,
    lits: lits.map((l) => ({ ...l, chip: shift(l.chip, dx, dy), from: mv(l.from), to: mv(l.to) })),
    ...(nonePlan ? { none: { ...nonePlan, frame: shift(nonePlan.frame, dx, dy), chip: shift(nonePlan.chip, dx, dy) } } : {}),
  };
  return {
    kind: "venn",
    width: frame.w + P * 2,
    height: frame.h + P * 2,
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    paths: [],
    ends: [],
    badges,
    venn: plan,
  };
}
