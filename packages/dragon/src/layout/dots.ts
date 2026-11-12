/**
 * 点で数える見た目 (`[shape: dots]`、#3635) の並べ方の共通の部品。量の図 (`kinds/chart/layout.ts`) と集合の重なりの図 (`kinds/venn/layout.ts`) が使う。
 *
 * 点は群れ (量の図の項目、集合の重なりの図の区画、どれにも入らない数の `none`) ごとに、段ごとの件数を 1 点の件数で数えた数だけ置く。
 * どの点も 1 つずつ見分け、段を送るたびに次の決まりで行き先を決める (`assignDots`)。
 *
 * 1. 件数が減った群れは、後から入った点から手放す
 * 2. 件数が増えた群れは、同じ段で手放された点のうち、入る集まりを 1 つでも共にする群れの点を先に取る (集合の重なりの図で、重なりへ寄る点)
 * 3. 足りない分は、その段で初めて点を持つ群れなら全体の箱の点を取り、2 度目からは新しい点が弾んで現れる
 * 4. 誰も取らなかった手放された点は、その場で薄くなって消える
 *
 * 全体の箱の点は初めから箱の中の席に置き、群れに取られた段で箱から群れへ寄る。`none` の点は箱の席に残り、灰色に変わる。
 * 群れの中の点の置き場所は群れの中の順番で決まり、手放す点は後ろから取り、増える点は後ろへ足すので、残る点は段を送っても動かない。
 * 同じ段で寄る群れは、群れごとに少しずつずらして寄り始める (`waves`)。
 * 箱は空の点の席を全体が最も大きい段の点の数 (足りなければ箱から出る点の数) だけ並べ、上に全体の件数と 1 点の件数、下にどれにも入らない件数を書く。
 * 広い枠は群れを左に、箱を右に置き、狭い枠では箱を上に、群れを下に置く (`arrangeDots`)
 */
import { vennNumber } from "../blocks/circle/regions";
import { dotsOf } from "../dot-count";
import { DOTS_LOOK, DOTS_TYPE } from "../look/dots";
import { type ColorKey, LOOK } from "../look/values";
import { DEFAULT_LANG, type NotationLang } from "../words";
import { textWidth } from "./measure";
import type { Point, Rect, SceneBadge } from "./scene";

/** 点の群れ。`members` は入る集まりの名札 (量の図は項目 1 つ、`none` は空)、`colors` は塗る色で、2 つ以上なら扇形に等分に塗る */
export interface DotGroup {
  key: string;
  members: string[];
  colors: ColorKey[];
}

/** どれにも入らない数の群れの名札 */
export const NONE_KEY = "none";

/** 点の大きさ。`pitch` は隣の点の真ん中どうしの間、`r` は点の半径 */
export interface DotSize {
  pitch: number;
  r: number;
}

/** 広い枠の点と、狭い枠の小さな点 */
export const dotSize = (compact: boolean): DotSize => (compact ? DOTS_LOOK.dot.compact : { pitch: DOTS_LOOK.dot.pitch, r: DOTS_LOOK.dot.r });

/**
 * 1 つの点の行き先。`places` は段ごとの群れの番号で、-1 は箱の中でまだどこにも入らない段、`undefined` はまだ現れないか消えた段。
 * `index` は段ごとの群れの中の順番、`slot` は箱の席 (箱から出る点と `none` の点だけが持つ)、`born` は現れた段 (初めから箱に在る点は -1)、
 * `gone` は消えた段、`waves` は段ごとの寄り始めの順
 */
interface DotTrack {
  places: (number | undefined)[];
  index: number[];
  slot?: number;
  born: number;
  gone?: number;
  waves: number[];
}

/** 段ごと群れごとの点の数 `counts` から、点ごとの行き先と、箱の席の数を決める */
function assignDots(groups: readonly DotGroup[], counts: readonly (readonly number[])[]): { tracks: DotTrack[]; slots: number; waves: number[] } {
  const steps = counts.length;
  const tracks: DotTrack[] = [];
  const members: number[][] = groups.map(() => []);
  const seen = groups.map(() => false);
  let slots = 0;
  const related = (a: number, b: number): boolean => (groups[a]?.members ?? []).some((id) => groups[b]?.members.includes(id));
  const isNone = (g: number): boolean => groups[g]?.key === NONE_KEY;
  const create = (born: number, slot: number | undefined): number => {
    tracks.push({ places: Array.from({ length: steps }, () => undefined), index: Array.from({ length: steps }, () => 0), ...(slot === undefined ? {} : { slot }), born, waves: Array.from({ length: steps }, () => 0) });
    return tracks.length - 1;
  };
  /** 段ごとの、寄るか現れる群れの数 */
  const waves: number[] = [];
  for (let s = 0; s < steps; s++) {
    const want = (g: number): number => counts[s]?.[g] ?? 0;
    const released: { dot: number; from: number }[] = [];
    members.forEach((list, g) => {
      while (list.length > want(g)) released.push({ dot: list.pop() as number, from: g });
    });
    let wave = 0;
    members.forEach((list, g) => {
      const before = list.length;
      if (want(g) <= before) return;
      while (list.length < want(g)) {
        const k = released.findIndex((r) => related(r.from, g));
        if (k >= 0) list.push((released.splice(k, 1)[0] as { dot: number }).dot);
        else if (!seen[g]) {
          const dot = create(-1, slots++);
          // 箱の点は、取られる前の段も箱の中に在る
          for (let b = 0; b < s; b++) (tracks[dot] as DotTrack).places[b] = -1;
          list.push(dot);
        } else list.push(create(s, isNone(g) ? slots++ : undefined));
      }
      for (const dot of list.slice(before)) (tracks[dot] as DotTrack).waves[s] = wave;
      wave += 1;
    });
    waves.push(wave);
    for (const r of released) (tracks[r.dot] as DotTrack).gone = s;
    members.forEach((list, g) => {
      if (list.length > 0) seen[g] = true;
      list.forEach((dot, i) => {
        const track = tracks[dot] as DotTrack;
        track.places[s] = g;
        track.index[s] = i;
      });
    });
  }
  return { tracks, slots, waves };
}

/** 描く点。`at` は段ごとの真ん中、`paint` は段ごとの塗りの名札 (`""` はまだどこにも入らない)、`first` は現れる前の塗り */
export interface PlacedDot {
  at: Point[];
  paint: string[];
  first: string;
  /** 現れた段。初めから箱に在る点は -1 */
  born: number;
  /** 消えた段 */
  gone?: number;
  /** 段ごとの寄り始めの順 */
  waves: number[];
}

/** 字の役。`name` は項目と集まりの名前、`count` は正確な件数、`region` は区画の件数、`title` と `unit` は箱の全体の件数と 1 点の件数、`none` はどれにも入らない件数 */
export type DotTextRole = keyof typeof DOTS_TYPE;

/**
 * 描く字。`texts` は段ごとの字 (出さない段は `undefined`)、`always` を立てた字は最初の段の前から出す。`key` は検査と読み上げの道具が引く名札。
 * `ys` は段ごとの基準線で、点の数で大きさの変わる群れの下に書く字が群れに寄り添うよう、段ごとに高さを替える
 */
export interface DotText {
  role: DotTextRole;
  key: string;
  x: number;
  y: number;
  ys?: number[];
  anchor: "start" | "middle";
  texts: (string | undefined)[];
  always?: boolean;
  color?: ColorKey;
}

/** 全体の箱。`rect` は枠、`holes` は空の点の席の真ん中 */
export interface DotBox {
  rect: Rect;
  holes: Point[];
}

/** 点で数える見た目の置き場所 */
export interface DotPlan {
  size: DotSize;
  unit: number;
  groups: DotGroup[];
  dots: PlacedDot[];
  box: DotBox;
  texts: DotText[];
  /** 段ごとの、寄るか現れる群れの数 */
  waves: number[];
}

/** 図が足す字の言葉。全体の件数、1 点の件数、どれにも入らない件数 */
const DOT_WORDS: Readonly<Record<NotationLang, { whole: (count: string) => string; unit: (unit: string) => string; none: (count: string) => string }>> = {
  ja: { whole: (count) => `全体 ${count}`, unit: (unit) => `1点は${unit}`, none: (count) => `どれにも入らない ${count}` },
  en: { whole: (count) => `Total ${count}`, unit: (unit) => `1 dot = ${unit}`, none: (count) => `In none ${count}` },
};

/** 字の役の、基準線より上と下の高さ */
export const above = (role: DotTextRole): number => DOTS_TYPE[role].size * 0.8;
export const below = (role: DotTextRole): number => DOTS_TYPE[role].size * 0.2;

/** 箱の中身。左上を (0, 0) とし、群れと並べ方が決まってからずらす */
interface BoxDraft {
  w: number;
  h: number;
  slot: (k: number) => Point;
  holes: number;
  texts: DotText[];
  /** どれにも入らない件数の字の真ん中の高さ。字の無い箱は `undefined` */
  noneY?: number;
}

/**
 * 全体の箱。上に全体の件数 `whole` と 1 点の件数 `unit` を書き、空の点の席を `slots` 個並べ、どれにも入らない件数 `nones` (段ごと) を下に書く。
 * `wide` は箱の幅の下限で、狭い枠で箱を図の幅いっぱいに広げる時に渡す
 */
function boxDraft(slots: number, whole: number, unit: number, nones: (number | undefined)[], size: DotSize, lang: NotationLang, wide = 0): BoxDraft {
  const B = DOTS_LOOK.box;
  const words = DOT_WORDS[lang];
  const cols = Math.max(1, Math.min(B.cols, slots));
  const rows = Math.max(1, Math.ceil(slots / cols));
  const holesW = (cols - 1) * size.pitch + size.r * 2;
  const title = words.whole(vennNumber(whole));
  const unitText = words.unit(vennNumber(unit));
  const noneTexts = nones.map((n) => (n === undefined ? undefined : words.none(vennNumber(n))));
  const badge = LOOK.badge.r * 2 + DOTS_LOOK.badge.gap;
  const noneW = Math.max(0, ...noneTexts.map((t) => (t === undefined ? 0 : badge + textWidth(t, DOTS_TYPE.none))));
  const innerW = Math.max(holesW, textWidth(title, DOTS_TYPE.title), textWidth(unitText, DOTS_TYPE.unit), noneW, wide - B.pad * 2);
  const titleY = B.pad + above("title");
  const unitY = titleY + B.row;
  const holesTop = unitY + below("unit") + B.holesGap;
  const left = B.pad + (innerW - holesW) / 2;
  const slot = (k: number): Point => [left + size.r + (k % cols) * size.pitch, holesTop + size.r + Math.floor(k / cols) * size.pitch];
  const holesBottom = holesTop + (rows - 1) * size.pitch + size.r * 2;
  const texts: DotText[] = [
    { role: "title", key: "whole", x: B.pad, y: titleY, anchor: "start", texts: [title], always: true },
    { role: "unit", key: "unit", x: B.pad, y: unitY, anchor: "start", texts: [unitText], always: true },
  ];
  const hasNone = noneTexts.some((t) => t !== undefined);
  let h = holesBottom + B.pad;
  let noneY: number | undefined;
  if (hasNone) {
    const y = holesBottom + B.noneGap + above("none");
    texts.push({ role: "none", key: NONE_KEY, x: B.pad + badge, y, anchor: "start", texts: noneTexts, color: "slate" });
    noneY = y - DOTS_TYPE.none.size * 0.3;
    h = y + below("none") + B.pad;
  }
  return { w: innerW + B.pad * 2, h, slot, holes: slots, texts, ...(noneY === undefined ? {} : { noneY }) };
}

/** 群れの置き場所。左上を (0, 0) とし、`spot` は群れ `g` の `i` 番目の点の真ん中 */
export interface DotArea {
  w: number;
  h: number;
  spot: (g: number, i: number) => Point;
  texts: DotText[];
  /** 段ごとの段の番号の置き場所。何も現れない段は `undefined` */
  badges: (Point | undefined)[];
  /** 段の番号を置けない所 (字の四角) */
  blocked: Rect[];
}

/** 並べ方に渡す値。`groups` と段ごと群れごとの件数 `values`、1 点の件数 `unit`、枠の幅 `width` */
export interface DotInput {
  groups: DotGroup[];
  values: number[][];
  unit: number;
  width?: number;
  lang?: NotationLang;
}

/** 並べた点で数える見た目と、図の幅と高さと段の番号 */
export interface DotLayout {
  plan: DotPlan;
  width: number;
  height: number;
  badges: SceneBadge[];
}

/** 段ごと群れごとの点の数 */
export const dotCounts = (values: readonly (readonly number[])[], unit: number): number[][] => values.map((row) => row.map((v) => dotsOf(v, unit)));

/** 群れの置き場所の作り方。点の大きさと、群れごとの点の最大の数と、群れに使える幅 `room` (枠の幅を書かない図は `undefined`) から作る */
export type DotAreaOf = (size: DotSize, caps: number[], room: number | undefined) => DotArea;

/**
 * 点で数える見た目を並べる。`area` は群れの置き場所を作る。
 * 広い枠は群れを左に箱を右に、群れと箱を横に並べると `width` に収まらない枠は小さな点で箱を上に群れを下に置く
 */
export function arrangeDots(input: DotInput, area: DotAreaOf): DotLayout {
  const { groups, values, unit, width } = input;
  const lang = input.lang ?? DEFAULT_LANG;
  const P = DOTS_LOOK.pad;
  const counts = dotCounts(values, unit);
  const caps = groups.map((_, g) => Math.max(0, ...counts.map((row) => row[g] ?? 0)));
  const { tracks, slots, waves } = assignDots(groups, counts);
  const totals = values.map((row) => row.reduce((a, b) => a + b, 0));
  const whole = Math.max(0, ...totals);
  const holes = Math.max(slots, Math.round(whole / unit));
  const noneAt = groups.findIndex((g) => g.key === NONE_KEY);
  const nones = values.map((row, s) => (noneAt >= 0 && counts.slice(0, s + 1).some((c) => (c[noneAt] ?? 0) > 0) ? row[noneAt] : undefined));

  const wideSize = dotSize(false);
  const wideBox = boxDraft(holes, whole, unit, nones, wideSize, lang);
  const wideArea = area(wideSize, caps, width === undefined ? undefined : width - P * 2 - DOTS_LOOK.area.gap - wideBox.w);
  const wideW = P + wideArea.w + DOTS_LOOK.area.gap + wideBox.w + P;
  const compact = width !== undefined && wideW > width;
  const size = dotSize(compact);
  const groupArea = compact ? area(size, caps, (width ?? 0) - P * 2) : wideArea;
  const box = compact ? boxDraft(holes, whole, unit, nones, size, lang, Math.min(groupArea.w, (width ?? 0) - P * 2)) : wideBox;
  // 広い枠は群れを左、箱を右に上を揃えて置く。狭い枠は箱を上、群れを下に、どちらも真ん中を揃えて置く
  const inner = compact ? Math.max(groupArea.w, box.w) : 0;
  const areaAt: Point = compact ? [P + (inner - groupArea.w) / 2, P + box.h + DOTS_LOOK.area.gap] : [P, P];
  const boxAt: Point = compact ? [P + (inner - box.w) / 2, P] : [P + groupArea.w + DOTS_LOOK.area.gap, P];
  const figureW = compact ? P + inner + P : wideW;
  const figureH = compact ? areaAt[1] + groupArea.h + P : P + Math.max(groupArea.h, box.h) + P;
  const at = (origin: Point, [x, y]: Point): Point => [origin[0] + x, origin[1] + y];
  const slotAt = (k: number): Point => at(boxAt, box.slot(k));
  const spotAt = (g: number, i: number): Point => at(areaAt, groupArea.spot(g, i));

  const dots: PlacedDot[] = tracks.map((track) => {
    const placeOf = (s: number): Point | undefined => {
      const g = track.places[s];
      if (g === undefined) return undefined;
      if (g === -1 || g === noneAt) return slotAt(track.slot ?? 0);
      return spotAt(g, track.index[s] ?? 0);
    };
    const paintOf = (s: number): string | undefined => {
      const g = track.places[s];
      return g === undefined ? undefined : g === -1 ? "" : (groups[g]?.key ?? "");
    };
    const shown = values.map((_, s) => placeOf(s));
    const firstShown = shown.find((p) => p !== undefined) ?? [0, 0];
    const first = track.born === -1 ? "" : (paintOf(track.born) ?? "");
    // 現れる前の段は現れた段の置き場所に、消えた後の段は消える前の置き場所に置く
    let last: Point = track.born === -1 ? slotAt(track.slot ?? 0) : firstShown;
    let lastPaint = first;
    const atSteps: Point[] = [];
    const paints: string[] = [];
    values.forEach((_, s) => {
      last = shown[s] ?? last;
      lastPaint = paintOf(s) ?? lastPaint;
      atSteps.push(last);
      paints.push(lastPaint);
    });
    return { at: atSteps, paint: paints, first, born: track.born, ...(track.gone === undefined ? {} : { gone: track.gone }), waves: track.waves };
  });

  const shift =
    (origin: Point) =>
    (t: DotText): DotText => ({ ...t, x: t.x + origin[0], y: t.y + origin[1], ...(t.ys ? { ys: t.ys.map((y) => y + origin[1]) } : {}) });
  const texts = [...box.texts.map(shift(boxAt)), ...groupArea.texts.map(shift(areaAt))];
  // 段の番号。何も現れない段で、どれにも入らない件数を初めて書いた段は箱の札の左に置き、ほかは前の段の番号と同じ所に置く
  const R = LOOK.badge.r;
  let before: Point = [P + R, P + R];
  const badges: SceneBadge[] = values.map((_, s) => {
    const own = groupArea.badges[s];
    const noneFirst = noneAt >= 0 && (counts[s]?.[noneAt] ?? 0) > 0 && !counts.slice(0, s).some((c) => (c[noneAt] ?? 0) > 0);
    const spot: Point | undefined = own ? at(areaAt, own) : noneFirst && box.noneY !== undefined ? [boxAt[0] + DOTS_LOOK.box.pad + R, boxAt[1] + box.noneY] : undefined;
    before = spot ?? before;
    return { step: s, x: before[0], y: before[1], color: "slate" };
  });
  return {
    plan: { size, unit, groups, dots, box: { rect: { x: boxAt[0], y: boxAt[1], w: box.w, h: box.h }, holes: Array.from({ length: box.holes }, (_, k) => slotAt(k)) }, texts, waves },
    width: figureW,
    height: figureH,
    badges,
  };
}

/** 点の行。`n` 個の点を `cols` 個ずつ左から並べて折り返す。左上の点の真ん中を (0, 0) とする */
export const rowSpot = (i: number, cols: number, size: DotSize): Point => [(i % cols) * size.pitch, Math.floor(i / cols) * size.pitch];

/**
 * 点の群れ。真ん中から近い順に六角の格子の点を並べ、`n` 個の点の真ん中からの置き場所と、群れの半径 (点の縁まで) を返す。
 * 同じ近さの点は 12 時の向きから時計回りに並べるので、点の数が変わっても前の点の置き場所は変わらない
 */
export function clusterSpots(n: number, size: DotSize): { spots: Point[]; radius: number } {
  if (n <= 0) return { spots: [], radius: 0 };
  const K = Math.ceil(Math.sqrt(n)) + 1;
  const dy = (size.pitch * Math.sqrt(3)) / 2;
  const all: { p: Point; d: number; a: number }[] = [];
  for (let row = -K; row <= K; row++) {
    for (let col = -K; col <= K; col++) {
      const p: Point = [(col + (Math.abs(row) % 2) / 2) * size.pitch, row * dy];
      const a = (Math.atan2(p[0], -p[1]) + Math.PI * 2) % (Math.PI * 2);
      all.push({ p, d: Math.round(Math.hypot(p[0], p[1]) * 1000) / 1000, a });
    }
  }
  all.sort((a, b) => a.d - b.d || a.a - b.a);
  const spots = all.slice(0, n).map((x) => x.p);
  return { spots, radius: Math.max(...spots.map(([x, y]) => Math.hypot(x, y))) + size.r };
}

/** 字の四角。基準線 `y` と揃え方から */
export function dotTextRect(t: DotText, text: string): Rect {
  const w = textWidth(text, DOTS_TYPE[t.role]);
  return { x: t.anchor === "middle" ? t.x - w / 2 : t.x, y: t.y - above(t.role), w, h: DOTS_TYPE[t.role].size };
}

/** 段ごとの字のうち一番広い字の幅 */
export const widest = (texts: readonly (string | undefined)[], role: DotTextRole): number => Math.max(0, ...texts.map((t) => (t === undefined ? 0 : textWidth(t, DOTS_TYPE[role]))));
