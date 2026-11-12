/**
 * 集合の重なりの図 (`venn`、#3620) の並べ方。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 円は同じ大きさで、2 つの集まりは左右に、3 つの集まりは左上と右上と下に、隣どうしの円の真ん中を半径の `apart` 倍離して置く。
 * 集まりの名前と全体の数は、円の並びの真ん中から見た円の向きの外に置く。2 つの集まりは左上と右上、3 つの集まりは左上と右上と右下。
 * 区画の数は、区画の中で円の縁から一番遠い点に置く。点は格子で探す。
 * 重なりの数の札は、重なりを書いた段の間だけ、並びの真ん中から重なりの向きの円の外に出し、区画の数の所と点線で結ぶ。3 つ全ての重なりの札は右に出す。
 * どれにも入らない数の札は、全ての部品を囲む枠の左下に置く。段の番号は、その段で現れた名前か札の外の側に置く。
 * 段ごとの数は、段の中の `count` が書いた数で、書かない段は前の段の数を保つ。それぞれだけの数は `blocks/circle/regions.ts` の決まりで出し、決まらない段は出さない。
 * 点で数える見た目 (`[shape: dots]`、#3635) は円を描かず、区画ごとに点の群れを置き、全体の箱から群れへ点を寄せる (`layoutVennDots`、共通の部品は `layout/dots.ts`)。
 * 見本帳を開いた時に読まない図の種類なので、後から読む塊に入れる
 */
import { exclusiveOf, provisionalOf, regionKey, regionsOf, vennNumber } from "../../blocks/circle/regions";
import { unitOf } from "../../dot-count";
import { above, arrangeDots, below, clusterSpots, type DotArea, type DotGroup, type DotPlan, type DotSize, type DotText, dotCounts, dotTextRect, NONE_KEY, widest } from "../../layout/dots";
import { textWidth } from "../../layout/measure";
import { besideSameSpot, type Layout, type Point, type Rect, type SceneBadge } from "../../layout/scene";
import { DOTS_LOOK, DOTS_TYPE } from "../../look/dots";
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
  /** 点で数える見た目 (#3635) の点と箱と字。この見た目の図は円と区画と札を持たない */
  dots?: DotPlan;
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

/** 集まりの色。`color` を書かない集まりは宣言した順に色の役を配る */
const colorsOf = (sets: readonly { color?: ColorKey }[]): ColorKey[] => sets.map((set, i) => set.color ?? (COLOR_ORDER[i % COLOR_ORDER.length] as ColorKey));

/** 集合の重なりの図を並べる。`lang` は札の頭に付ける字の言葉、`width` は点で数える見た目で箱を上に置くかを決める枠の幅 */
export function layoutVenn(diagram: DiagramModel, lang: NotationLang = DEFAULT_LANG, width?: number): VennLayout {
  if (diagram.venn?.shape === "dots") return layoutVennDots(diagram, lang, width);
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
  const colors = colorsOf(sets);
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

/** 段の番号を置かない場所の四角 */
const square = ([x, y]: Point, r: number): Rect => ({ x: x - r, y: y - r, w: r * 2, h: r * 2 });

/**
 * 点で数える見た目 (#3635)。区画ごとに点の群れを置き、群れの下に区画の件数を、集まりだけの区画の群れの外に集まりの名前と全体の件数を書く。
 * 群れは 3 行に並べる。1 行目は 1 つ目の集まりだけ、2 つの重なり、2 つ目の集まりだけの区画で、2 行目は 1 つ目と 3 つ目の重なり、3 つ全ての重なり、
 * 2 つ目と 3 つ目の重なりの区画、3 行目は 3 つ目の集まりだけの区画。2 つの集まりの図は 1 行目だけを持つ。
 * 区画の点の数は、今の段までに書いた数だけで出したそれぞれだけの数 (`provisionalOf`) を 1 点の件数で数えた数で、後の段で書く重なりは書いた段で点が寄る。
 * 区画の件数は重なりの区画と、集まりだけの数が集まりの全体の数と違う段に出す。1 つ目と 3 つ目の集まりの名前は群れの左上と下、2 つ目は右上に置き、段の番号を名前の外の側に置く
 */
function layoutVennDots(diagram: DiagramModel, lang: NotationLang, width: number | undefined): VennLayout {
  const sets = diagram.venn?.sets ?? [];
  const order = sets.map((set) => set.id);
  const colors = colorsOf(sets);
  const colorOf = new Map(order.map((id, i) => [id, colors[i] as ColorKey]));
  const regionSets = regionsOf(order);
  const keys = regionSets.map((members) => members.join("&"));
  const { values: written, none } = stepValues(diagram, order);
  const provisional = written.map((v) => provisionalOf(order, (key) => v.get(key)));
  const groups: DotGroup[] = regionSets.map((members, g) => ({ key: keys[g] as string, members, colors: members.map((id) => colorOf.get(id) as ColorKey) }));
  const hasNone = none.some((v) => v !== undefined);
  if (hasNone) groups.push({ key: NONE_KEY, members: [], colors: ["slate"] });
  const values = provisional.map((map, s) => [...keys.map((key) => map.get(key) ?? 0), ...(hasNone ? [none[s] ?? 0] : [])]);
  const unit = unitOf(
    values.map((row) => row.reduce((a, b) => a + b, 0)),
    diagram.venn?.unit,
  );
  const totals = order.map((id) => written.map((v) => v.get(id)));
  const firsts = totals.map((row) => row.findIndex((v) => v !== undefined));
  const regionTexts = regionSets.map((members, g) =>
    provisional.map((map, s) => {
      const value = map.get(keys[g] as string);
      if (value === undefined || Math.round(value / unit) === 0) return undefined;
      return members.length >= 2 || value !== totals[order.indexOf(members[0] as string)]?.[s] ? vennNumber(value) : undefined;
    }),
  );

  const area = (size: DotSize, caps: number[]): DotArea => {
    const C = DOTS_LOOK.cluster;
    const R = LOOK.badge.r;
    const blobs = caps.slice(0, keys.length).map((cap) => clusterSpots(cap, size));
    const has = (g: number): boolean => g >= 0 && (caps[g] ?? 0) > 0;
    const radius = (g: number): number => (has(g) ? (blobs[g]?.radius ?? 0) : 0);
    const textW = regionTexts.map((texts) => widest(texts, "region"));
    const textH = (g: number): number => (has(g) && (textW[g] ?? 0) > 0 ? C.textGap + DOTS_TYPE.region.size : 0);
    const half = (g: number): number => (has(g) ? Math.max(radius(g), (textW[g] ?? 0) / 2) : 0);
    // 区画の件数の字は、段ごとの群れの一番下の点のすぐ下に書く
    const counts = dotCounts(values, unit);
    const radiusAt = (g: number, s: number): number => clusterSpots(counts[s]?.[g] ?? 0, size).radius;
    const lowAt = (g: number, s: number): number => Math.max(0, ...clusterSpots(counts[s]?.[g] ?? 0, size).spots.map(([, y]) => y + size.r));
    const at = (...ids: string[]): number => keys.indexOf(order.filter((id) => ids.includes(id)).join("&"));
    const totalTexts = totals.map((row) => row.map((v) => (v === undefined ? undefined : vennNumber(v))));
    const labelW = sets.map((set, i) => Math.max(textWidth(set.name, DOTS_TYPE.name), widest(totalTexts[i] ?? [], "count")));
    const labelH = above("name") + DOTS_LOOK.rows.countRow + below("count");
    const [a, b, c] = [at(order[0] as string), at(order[1] as string), order[2] === undefined ? -1 : at(order[2])];
    const ab = at(order[0] as string, order[1] as string);
    const [ac, bc, abc] = order[2] === undefined ? [-1, -1, -1] : [at(order[0] as string, order[2]), at(order[1] as string, order[2]), at(...order)];
    const centre = new Map<number, Point>();
    // 1 行目。間は群れと区画の件数の字の広い方の半分どうしに群れの間を足し、2 つの名前も重ならないよう離す
    const gapOf = (g: number, h: number): number => half(g) + C.gap + half(h);
    const xA = 0;
    const xAB = has(ab) ? xA + gapOf(a, ab) : xA + half(a) + C.gap / 2;
    const xB = Math.max(has(ab) ? xAB + gapOf(ab, b) : xA + gapOf(a, b), xA + ((labelW[0] ?? 0) + (labelW[1] ?? 0)) / 2 + C.gap);
    const top0 = labelH + C.labelGap;
    const row0 = [a, ab, b].filter(has);
    const cy0 = top0 + Math.max(0, ...row0.map(radius));
    centre.set(a, [xA, cy0]).set(ab, [has(ab) ? xAB : (xA + xB) / 2, cy0]).set(b, [xB, cy0]);
    let bottom = cy0 + Math.max(0, ...row0.map((g) => radius(g) + textH(g)));
    const mid = has(ab) ? xAB : (xA + xB) / 2;
    if (c >= 0) {
      const row1 = [ac, abc, bc].filter(has);
      if (row1.length > 0) {
        const cy1 = bottom + C.gap + Math.max(...row1.map(radius));
        const inner = has(abc) ? half(abc) + C.gap : C.gap / 2;
        centre.set(abc, [mid, cy1]);
        centre.set(ac, [Math.min((xA + mid) / 2, mid - inner - half(ac)), cy1]);
        centre.set(bc, [Math.max((mid + xB) / 2, mid + inner + half(bc)), cy1]);
        bottom = cy1 + Math.max(...row1.map((g) => radius(g) + textH(g)));
      }
      const cy2 = bottom + C.gap + radius(c);
      centre.set(c, [mid, cy2]);
      bottom = cy2 + radius(c) + textH(c);
    }
    // 集まりの名前と全体の件数。1 つ目と 2 つ目は 1 行目の上、3 つ目は 3 つ目の集まりだけの群れの下に置く
    const labels = sets.map((_, i) => {
      const g = [a, b, c][i] as number;
      const [x] = centre.get(g) ?? [0, 0];
      const topY = i < 2 ? 0 : bottom + C.labelGap;
      return { x, nameY: topY + above("name"), countY: topY + above("name") + DOTS_LOOK.rows.countRow, w: labelW[i] ?? 0 };
    });
    if (c >= 0) bottom += C.labelGap + labelH;
    const regionY = (g: number, s: number): number => (centre.get(g)?.[1] ?? 0) + lowAt(g, s) + C.textGap + above("region");
    // 段の番号は、その段で初めて数を書いた集まりの名前の外の側に置く。集まりの名前の無い段は、初めて点を持った区画の件数の左に置く
    const badgeOf = (s: number): Point | undefined => {
      const i = firsts.indexOf(s);
      const label = labels[i];
      if (label) {
        const right = i === 1;
        const x = right ? label.x + label.w / 2 + DOTS_LOOK.badge.gap + R : label.x - label.w / 2 - DOTS_LOOK.badge.gap - R;
        return [x, label.nameY - DOTS_TYPE.name.size * 0.3];
      }
      const g = keys.findIndex((_, k) => has(k) && (counts[s]?.[k] ?? 0) > 0 && !counts.slice(0, s).some((row) => (row[k] ?? 0) > 0));
      const p = centre.get(g);
      if (g < 0 || !p) return undefined;
      const text = regionTexts[g]?.[s];
      if (text === undefined) return [p[0] - radiusAt(g, s) - DOTS_LOOK.badge.gap - R, p[1]];
      return [p[0] - textWidth(text, DOTS_TYPE.region) / 2 - DOTS_LOOK.badge.gap - R, regionY(g, s) - DOTS_TYPE.region.size * 0.3];
    };
    const badgeSpots = values.map((_, s) => badgeOf(s));
    const left = Math.min(...[...centre.entries()].filter(([g]) => has(g)).map(([g, [x]]) => x - half(g)), ...labels.map((l) => l.x - l.w / 2), ...badgeSpots.flatMap((p) => (p ? [p[0] - R] : [])));
    const right = Math.max(...[...centre.entries()].filter(([g]) => has(g)).map(([g, [x]]) => x + half(g)), ...labels.map((l) => l.x + l.w / 2), ...badgeSpots.flatMap((p) => (p ? [p[0] + R] : [])));
    const dx = -left;
    const texts: DotText[] = [];
    sets.forEach((set, i) => {
      const label = labels[i];
      if (!label) return;
      const from = firsts[i] ?? -1;
      texts.push({ role: "name", key: set.id, x: label.x + dx, y: label.nameY, anchor: "middle", texts: values.map((_, s) => (from >= 0 && s >= from ? set.name : undefined)), color: colors[i] });
      texts.push({ role: "count", key: set.id, x: label.x + dx, y: label.countY, anchor: "middle", texts: totalTexts[i] ?? [] });
    });
    keys.forEach((key, g) => {
      const p = centre.get(g);
      if (!has(g) || !p || (textW[g] ?? 0) === 0) return;
      texts.push({ role: "region", key, x: p[0] + dx, y: p[1] + radius(g) + C.textGap + above("region"), ys: values.map((_, s) => regionY(g, s)), anchor: "middle", texts: regionTexts[g] ?? [] });
    });
    const spot = (g: number, k: number): Point => {
      const [x, y] = centre.get(g) ?? [0, 0];
      const [ox, oy] = blobs[g]?.spots[k] ?? [0, 0];
      return [x + dx + ox, y + oy];
    };
    const blocked = [
      ...texts.flatMap((t) => {
        const text = t.texts.find((x) => x !== undefined);
        return text === undefined ? [] : [dotTextRect(t, text)];
      }),
      ...[...centre.entries()].filter(([g]) => has(g)).map(([g, [x, y]]) => square([x + dx, y], radius(g))),
    ];
    return { w: right - left, h: bottom, spot, texts, badges: badgeSpots.map((p) => (p ? ([p[0] + dx, p[1]] as Point) : undefined)), blocked };
  };
  const placed = arrangeDots({ groups, values, unit, ...(width === undefined ? {} : { width }), lang }, area);
  return {
    kind: "venn",
    width: placed.width,
    height: placed.height,
    regions: [],
    boxes: [],
    lifelines: [],
    edges: [],
    labels: [],
    actions: [],
    paths: [],
    ends: [],
    badges: besideSameSpot(placed.badges, () => false, () => true),
    venn: { circles: [], regions: [], totals, counts: [], lits: [], dots: placed.plan },
  };
}
