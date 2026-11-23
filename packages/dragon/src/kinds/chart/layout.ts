/**
 * 量の図 (`chart`、#3560) の並べ方。
 *
 * 段ごとに項目の値を決め、ドーナツなら弧の角度と凡例の行を、横棒なら棒の行と棒の長さを置く。
 * 値は段の中の `set` が書いた値で、書かない項目は前の段の値を保ち、まだ値の無い項目は 0 とする。
 * ドーナツの弧は 12 時の向きから時計回りに、宣言した順に並べ、角度は値を段の合計で割った割合にする。
 * 横棒は宣言した順に上から並べ、長さは値を全ての段で一番大きい値で割った割合にする。段ごとに一番大きい値で割ると、
 * 一番大きい棒が段を送っても伸び縮みせず、値の変わりが長さに出ないため。
 * 段の番号は左上の角に置き、同じ所で段ごとに数字を入れ替える。ドーナツは段の名前を輪の真ん中に、横棒は番号の右に出す。
 * 枠の幅 `width` を渡すと、凡例を輪の右に置けない幅では輪の下に置き、横棒は一番大きい値の棒を枠に入る長さまで縮める。
 * 漏斗の見た目 (#3621) は、宣言した順に上から段の行を並べ、左端を揃えた棒を最初の段の値に比べた長さにし、前の段との差を薄い棒にして去った数を書く。
 * 段の番号は段の中で最初に値を書いた項目の行の左に置き、最後の段で、最初の段のうち最後の段まで残った割合の行を足す (`funnelPlan`)。
 * `set none` (#3635) を書いた図は、ドーナツと横棒ではどれにも入らない数を最後の項目の後ろに灰色の項目として足す。
 * 点で数える見た目 (#3635) は、項目ごとに点を 1 行に並べて折り返し、全体の箱から項目の行へ点を寄せる (`dotsPlan`、共通の部品は `layout/dots.ts`)。
 * 折れ線の見た目 (#3802) は、段を時間の軸の点にして段の順に等しい間で横に並べ、縦の軸を 0 から刻みで切り上げた上端までにし、
 * 項目ごとに値を書いた段から点を置いて結ぶ (`linePlan`)。凡例は図の上の行に置き、止めて置く図はその上に図の題の行を足す。
 * 見本帳を開いた時に読まない図の種類なので、後から読む塊に入れる (#3248)
 */
import { CHART_NONE, takesNone } from "../../blocks/chart-item/read";
import { unitOf } from "../../dot-count";
import { above, arrangeDots, type DotArea, type DotGroup, type DotPlan, type DotText, dotsOverview, dotTextRect, NONE_KEY, rowSpot, widest } from "../../layout/dots";
import { textBox, textWidth } from "../../layout/measure";
import { besideSameSpot, type Layout, type Point, type Rect, type SceneBadge } from "../../layout/scene";
import { CHART_LOOK, CHART_TYPE } from "../../look/chart";
import { DOTS_LOOK, DOTS_TYPE } from "../../look/dots";
import { COLOR_ORDER, type ColorKey, LOOK } from "../../look/values";
import type { ChartShape, DiagramModel } from "../../schema";
import { DEFAULT_LANG, type NotationLang } from "../../words";
import type { OverviewShape } from "../parts";

/** 並べた項目。色を書かない項目には宣言した順に色の役を配った */
export interface ChartRow {
  id: string;
  name: string;
  color: ColorKey;
}

/** ドーナツの弧。始まりの角度と広がりは度で、12 時の向きから時計回りに測る */
export interface ChartArc {
  start: number;
  sweep: number;
}

/** ドーナツの凡例の行。`x` と `y` は色の見本の左端と行の真ん中、`name` と `share` は名前と割合の字の基準線の左端 */
export interface ChartLegendRow {
  item: string;
  x: number;
  y: number;
  swatch: Rect;
  name: { x: number; y: number };
  share: { x: number; y: number };
}

/** 横棒の行。`name` は名前の字の四角、`track` は一番大きい値の棒の長さの置き場 */
export interface ChartBarRow {
  item: string;
  name: Rect;
  track: Rect;
}

/** 字の基準線の左端 */
export interface ChartSpot {
  x: number;
  y: number;
}

/**
 * 漏斗の見た目 (#3621) の段の行。項目ごとに 1 つで、宣言した順に上から並ぶ。`y` は棒の真ん中、`first` は項目の値を初めて書いた段 (無ければ -1)。
 * `name` と `count` は段の名前と段の数の字の基準線の左端、`rateEnd` は前の段に対する割合の字の右端。
 * `counts` と `rates` は段ごとの段の数と前の段に対する割合の字で、値を書く前の段と、前の段の値が 0 の段は `undefined`
 */
export interface FunnelRow {
  item: string;
  y: number;
  first: number;
  name: ChartSpot;
  count: ChartSpot;
  rateEnd: number;
  counts: (string | undefined)[];
  rates: (string | undefined)[];
}

/** 前の段との差の薄い棒。`from` から `to` までの段 (`to` を含む) に同じ長さで出す。`link` は前の段の棒の端から下ろす点線の x と上下の端 */
export interface FunnelGap {
  item: string;
  from: number;
  to: number;
  rect: Rect;
  link: { x: number; y1: number; y2: number };
  /** 去った数の字と、字の基準線と揃え方。薄い棒に収まる時は真ん中に、収まらない時は前の段の棒の端の右に書く */
  text: string;
  label: ChartSpot & { anchor: "start" | "middle" };
}

/**
 * 最後の段の、最初の段のうち最後の段まで残った割合の行。`name` は行の名前、`rate` は残った割合で、どちらも字と基準線を持つ。
 * `bar` は最後の段の数の棒、`rest` は去った数の薄い棒、`ticks` は間の段の棒の端の x、`left` は去った数の字
 */
export interface FunnelTotal {
  step: number;
  y: number;
  item: string;
  name: ChartSpot & { text: string };
  rate: ChartSpot & { text: string };
  bar: Rect;
  rest?: Rect;
  ticks: number[];
  left?: ChartSpot & { text: string; anchor: "start" | "middle" };
}

/** 漏斗の見た目の置き場所。`bar` は最初の段の棒の長さの置き場で、どの段の棒も左端を揃えてこの長さを縮める */
export interface FunnelPlan {
  rows: FunnelRow[];
  bar: Rect;
  gaps: FunnelGap[];
  total?: FunnelTotal;
}

/** 折れ線の見た目 (#3802) の縦の軸の刻み。`y` は刻みの線の高さ、`label` は値の字の基準線の左端 */
export interface LineTick {
  value: number;
  text: string;
  y: number;
  label: ChartSpot;
}

/** 折れ線の見た目の凡例の 1 項目。`key` は色の線の左端と右端と高さ、`name` は名前の字の基準線の左端 */
export interface LineKey {
  item: string;
  key: { x1: number; x2: number; y: number };
  name: ChartSpot;
}

/**
 * 折れ線の見た目の 1 本の線。`first` は項目の値を初めて書いた段で、`points` は段ごとの点 (値を書く前の段は `undefined`)。
 * `values` は段ごとの値の字と基準線の左端で、同じ段の字どうしが重ならないよう縦にずらしてある
 */
export interface LineSeries {
  item: string;
  first: number;
  points: (ChartSpot | undefined)[];
  values: ((ChartSpot & { text: string }) | undefined)[];
}

/**
 * 折れ線の見た目の置き場所。`grid` は刻みの線の左端と右端、`labels` は段ごとの横の軸の名前の基準線の真ん中、
 * `title` は止めて置く図の図の題の基準線の左端
 */
export interface LinePlan {
  ticks: LineTick[];
  grid: { x1: number; x2: number };
  labels: (ChartSpot & { text: string })[];
  legend: LineKey[];
  series: LineSeries[];
  title?: ChartSpot & { text: string };
}

/** 量の図の置き場所 */
export interface ChartPlan {
  shape: ChartShape;
  items: ChartRow[];
  /** 段ごと項目ごとの値。まだ値の無い項目は 0 */
  values: number[][];
  /** 段の名前の字の基準線。ドーナツは輪の真ん中に真ん中を揃え、横棒は左端を揃える */
  title: { x: number; y: number; anchor: "start" | "middle" };
  /** ドーナツの輪の真ん中と、輪の線の真ん中の半径と、輪の太さ */
  ring?: { cx: number; cy: number; r: number; width: number };
  /** 段ごと項目ごとのドーナツの弧 */
  arcs?: ChartArc[][];
  /** ドーナツの凡例の行。宣言した順 */
  legend?: ChartLegendRow[];
  /** 横棒の行。宣言した順 */
  bars?: ChartBarRow[];
  /** 段ごと項目ごとの横棒の長さ。漏斗の見た目では、最初の段の棒に対する長さ */
  lengths?: number[][];
  /** 漏斗の見た目 (#3621) の段の行と薄い棒と残った割合の行 */
  funnel?: FunnelPlan;
  /** 点で数える見た目 (#3635) の点と箱と字 */
  dots?: DotPlan;
  /** 折れ線の見た目 (#3802) の軸と凡例と線 */
  line?: LinePlan;
}

export interface ChartLayout extends Layout {
  kind: "chart";
  chart: ChartPlan;
}

export interface ChartLayoutOptions {
  /** 描く枠の幅。書かなければ凡例を輪の右に置き、棒を決まった長さで描く */
  width?: number;
  /** 漏斗の見た目の去った数と残った割合の行の字の言葉。書かなければ英語 */
  lang?: NotationLang;
  /** 止めて置く図か (#3801)。折れ線の見た目は図の上の行に図の題を出し、段の番号の丸の空きを取らない */
  figure?: boolean;
}

/** 漏斗の見た目の、図が足す字 (#3621)。去った数と、最後の段の残った割合の行の名前 */
const FUNNEL_WORDS: Readonly<Record<NotationLang, { left: (count: string) => string; total: string }>> = {
  ja: { left: (count) => `${count}が去った`, total: "最後まで残った" },
  en: { left: (count) => `${count} left`, total: "Made it to the end" },
};

/** どれにも入らない数 (#3635) の項目の名前。ドーナツの凡例と横棒の左に出す */
const NONE_NAME: Readonly<Record<NotationLang, string>> = { ja: "どれにも入らない", en: "In none" };

/**
 * 段ごとのどれにも入らない数 (#3635)。`set none` を書かない段は前の段の値を保ち、書く前の段は 0。
 * どの段にも書かない図と、漏斗と折れ線の見た目は `undefined`
 */
function noneValues(diagram: DiagramModel): number[] | undefined {
  if (!takesNone(diagram.chart?.shape)) return undefined;
  let now = 0;
  let written = false;
  const values = diagram.steps.map((step) => {
    for (const event of step.events) {
      if (event.type !== "set" || event.item !== CHART_NONE) continue;
      now = event.value;
      written = true;
    }
    return now;
  });
  return written ? values : undefined;
}

/** 段ごと項目ごとの値。`set` を書かない項目は前の段の値を保ち、まだ値の無い項目は 0 */
export function chartValues(diagram: DiagramModel): number[][] {
  const items = diagram.chart?.items ?? [];
  let now = items.map(() => 0);
  return diagram.steps.map((step) => {
    now = [...now];
    for (const event of step.events) {
      if (event.type !== "set") continue;
      const i = items.findIndex((item) => item.id === event.item);
      if (i >= 0) now[i] = event.value;
    }
    return now;
  });
}

/** 段の番号。左上の角に置き、同じ所で段ごとに数字を入れ替える */
function badgesOf(diagram: DiagramModel): SceneBadge[] {
  const at = CHART_LOOK.pad + LOOK.badge.r;
  const badges: SceneBadge[] = diagram.steps.map((_, step) => ({ step, x: at, y: at, color: "slate" }));
  return besideSameSpot(badges, () => true, () => true);
}

/** 量の図を並べる */
export function layoutChart(diagram: DiagramModel, options: ChartLayoutOptions = {}): ChartLayout {
  const items: ChartRow[] = (diagram.chart?.items ?? []).map((item, i) => ({ id: item.id, name: item.name, color: item.color ?? (COLOR_ORDER[i % COLOR_ORDER.length] as ColorKey) }));
  const values = chartValues(diagram);
  const shape = diagram.chart?.shape ?? "donut";
  const base = { regions: [], boxes: [], lifelines: [], edges: [], labels: [], actions: [], paths: [], ends: [] };
  if (shape === "funnel") {
    const placed = funnelPlan(items, values, diagram, options);
    return { kind: "chart", ...base, badges: funnelBadges(diagram, placed.plan.funnel as FunnelPlan), width: placed.width, height: placed.height, chart: placed.plan };
  }
  if (shape === "line") {
    const placed = linePlan(items, values, diagram, options);
    return { kind: "chart", ...base, badges: badgesOf(diagram), width: placed.width, height: placed.height, chart: placed.plan };
  }
  const nones = noneValues(diagram);
  if (shape === "dots") {
    const placed = dotsPlan(items, values, nones, diagram, options);
    return { kind: "chart", ...base, badges: placed.badges, width: placed.width, height: placed.height, chart: placed.plan };
  }
  // どれにも入らない数は、最後の項目の後ろの灰色の項目にする
  const rows = nones ? [...items, { id: CHART_NONE, name: NONE_NAME[options.lang ?? DEFAULT_LANG], color: "slate" as ColorKey }] : items;
  const all = nones ? values.map((row, s) => [...row, nones[s] ?? 0]) : values;
  const placed = shape === "bar" ? barPlan(rows, all, options) : donutPlan(rows, all, options);
  return { kind: "chart", ...base, badges: badgesOf(diagram), width: placed.width, height: placed.height, chart: placed.plan };
}

/**
 * 点で数える見た目 (#3635)。項目を宣言した順に上から並べ、項目ごとに左に段の番号と名前と正確な件数を、右に点の行を置く。
 * 点の行は折り返す点の数を全ての項目で揃え、枠の幅を書かない図は `DOTS_LOOK.rows.cols` 個で、書いた図は群れに使える幅に収まる数で折り返す。
 * 名前と件数は項目の値を初めて書いた段から出し、段の番号はその段に初めて値を書いた項目の名前の左に置く。どれにも入らない数は全体の箱に残す
 */
function dotsPlan(items: ChartRow[], values: number[][], nones: number[] | undefined, diagram: DiagramModel, options: ChartLayoutOptions): { plan: ChartPlan; width: number; height: number; badges: SceneBadge[] } {
  const groups: DotGroup[] = items.map((item) => ({ key: item.id, members: [item.id], colors: [item.color] }));
  if (nones) groups.push({ key: NONE_KEY, members: [], colors: ["slate"] });
  const all = nones ? values.map((row, s) => [...row, nones[s] ?? 0]) : values;
  const unit = unitOf(
    all.map((row) => row.reduce((a, b) => a + b, 0)),
    diagram.chart?.unit,
  );
  const firsts = items.map((item) => diagram.steps.findIndex((step) => step.events.some((e) => e.type === "set" && e.item === item.id)));
  const R = LOOK.badge.r;
  const W = DOTS_LOOK.rows;
  const nameX = R * 2 + DOTS_LOOK.badge.gap;
  const counts = items.map((_, i) => values.map((row, s) => ((firsts[i] ?? -1) >= 0 && s >= (firsts[i] ?? 0) ? grouped(row[i] ?? 0) : undefined)));
  const nameW = Math.max(0, ...items.map((item) => textWidth(item.name, DOTS_TYPE.name)), ...counts.map((texts) => widest(texts, "count")));
  const area = (size: { pitch: number; r: number }, caps: number[], room: number | undefined): DotArea => {
    const x0 = nameX + nameW + W.nameGap;
    const most = Math.max(1, ...caps.slice(0, items.length));
    const fit = room === undefined ? W.cols : Math.floor((room - x0 - size.r * 2) / size.pitch) + 1;
    const cols = Math.max(1, Math.min(most, room === undefined ? fit : Math.min(W.most, fit)));
    const texts: DotText[] = [];
    const tops: number[] = [];
    let y = 0;
    items.forEach((item, i) => {
      const rows = Math.max(1, Math.ceil((caps[i] ?? 0) / cols));
      const nameY = y + above("name");
      const countY = nameY + W.countRow;
      tops.push(y);
      const shown = values.map((_, s) => ((firsts[i] ?? -1) >= 0 && s >= (firsts[i] ?? 0) ? item.name : undefined));
      texts.push({ role: "name", key: item.id, x: nameX, y: nameY, anchor: "start", texts: shown, color: item.color });
      texts.push({ role: "count", key: item.id, x: nameX, y: countY, anchor: "start", texts: counts[i] ?? [] });
      y += Math.max(countY - y + DOTS_TYPE.count.size * 0.2, (rows - 1) * size.pitch + size.r * 2) + W.gap;
    });
    const spot = (g: number, k: number): [number, number] => {
      const [dx, dy] = rowSpot(k, cols, size);
      return [x0 + size.r + dx, (tops[g] ?? 0) + size.r + dy];
    };
    const badges = values.map((_, s) => {
      const i = firsts.indexOf(s);
      return i < 0 ? undefined : ([R, (tops[i] ?? 0) + above("name") - DOTS_TYPE.name.size * 0.3] as [number, number]);
    });
    const blocked = texts.flatMap((t) => {
      const widest = t.texts.find((text) => text !== undefined);
      return widest === undefined ? [] : [dotTextRect(t, widest)];
    });
    return { w: x0 + (cols - 1) * size.pitch + size.r * 2, h: y - W.gap, spot, texts, badges, blocked };
  };
  const placed = arrangeDots({ groups, values: all, unit, ...(options.width === undefined ? {} : { width: options.width }), ...(options.lang ? { lang: options.lang } : {}) }, area);
  return {
    plan: { shape: "dots", items, values, title: { x: DOTS_LOOK.pad, y: DOTS_LOOK.pad, anchor: "start" }, dots: placed.plan },
    width: placed.width,
    height: placed.height,
    badges: besideSameSpot(placed.badges, () => false, () => true),
  };
}

/** 3 桁ごとに `,` で区切った数。小数は書いたまま続ける */
function grouped(value: number): string {
  const [whole = "0", part] = String(value).split(".");
  const digits = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
  return part === undefined ? digits : `${digits}.${part}`;
}

/** 2 つの値の差。小数の引き算の端数を落とす */
const less = (a: number, b: number): number => Number((a - b).toFixed(6));

/** `part` が `whole` に占める割合。10% 以上は整数に、10% 未満は小数 1 桁に丸める */
function percent(part: number, whole: number): string {
  const share = (part / whole) * 100;
  const tenth = Math.round(share * 10) / 10;
  return `${tenth >= 10 ? Math.round(share) : tenth}%`;
}

/**
 * 漏斗の見た目 (#3621)。宣言した順に上から段の行を並べ、行は段の番号と、段の名前と段の数と前の段に対する割合と、左端を揃えた棒を持つ。
 * 棒の長さは、その段の値を最初の段の値 (全ての段で一番大きい値) で割った割合で、値を書いた段から出す。
 * 前の段との差は、その段の棒の端から前の段の棒の端までの薄い棒にして、去った数を書く。同じ長さが続く段は 1 つの薄い棒にまとめる。
 * 項目が 2 つ以上の時、最後の段の行の下に、最初の段のうち最後の段まで残った割合の行を置き、最後の段にだけ出す。
 * 去った数は薄い棒に収まる時は真ん中に、収まらない時は前の段の棒の端の右に書き、図の幅はその字まで含める
 */
function funnelPlan(items: ChartRow[], values: number[][], diagram: DiagramModel, options: ChartLayoutOptions): { plan: ChartPlan; width: number; height: number } {
  const P = CHART_LOOK.pad;
  const F = CHART_LOOK.funnel;
  const r = LOOK.badge.r;
  const words = FUNNEL_WORDS[options.lang ?? DEFAULT_LANG];
  const firsts = items.map((item) => diagram.steps.findIndex((step) => step.events.some((e) => e.type === "set" && e.item === item.id)));
  const lastStep = diagram.steps.length - 1;
  const last = values[lastStep] ?? [];
  const totalShown = items.length > 1 && (last[0] ?? 0) > 0;
  const totalRate = totalShown ? percent(last[items.length - 1] ?? 0, last[0] ?? 0) : "";
  // 段の名前と、段の数と割合の列の幅
  const nameW = Math.max(0, ...items.map((item) => textWidth(item.name, CHART_TYPE.stage)), totalShown ? textWidth(words.total, CHART_TYPE.stage) : 0);
  const countW = Math.max(0, ...values.flat().map((value) => textWidth(grouped(value), CHART_TYPE.count)), textWidth(totalRate, CHART_TYPE.count));
  const rateW = textWidth("100%", CHART_TYPE.share);
  const textX = P + r * 2 + F.badgeGap;
  const rateEnd = textX + Math.max(nameW, countW + F.rateGap + rateW);
  const x0 = rateEnd + F.barGap;
  const track = options.width !== undefined && x0 + F.track + P > options.width ? Math.max(F.trackMin, options.width - x0 - P) : F.track;
  const most = Math.max(0, ...values.map((row) => row[0] ?? 0));
  const lengths = values.map((row) => row.map((value) => (most > 0 ? (value / most) * track : 0)));
  const pitch = F.h + F.gap;
  const rows: FunnelRow[] = items.map((item, i) => {
    const y = P + F.h / 2 + pitch * i;
    const first = firsts[i] ?? -1;
    const shown = (s: number): boolean => first >= 0 && s >= first;
    const counts = values.map((row, s) => (shown(s) ? grouped(row[i] ?? 0) : undefined));
    const rates = values.map((row, s) => (shown(s) && i > 0 && (row[i - 1] ?? 0) > 0 ? percent(row[i] ?? 0, row[i - 1] ?? 0) : undefined));
    return { item: item.id, y, first, name: { x: textX, y: y + F.nameAt }, count: { x: textX, y: y + F.countAt }, rateEnd, counts, rates };
  });
  let right = x0 + track;
  /** 去った数の字を、`x` から `w` の長さの所の真ん中に置く。収まらない時は `outside` の右に置き、図の幅をその字まで広げる */
  const labelOf = (text: string, x: number, w: number, y: number, outside = x + w): ChartSpot & { anchor: "start" | "middle" } => {
    const tw = textWidth(text, CHART_TYPE.left);
    if (w >= tw + F.labelPad * 2) return { x: x + w / 2, y, anchor: "middle" };
    right = Math.max(right, outside + F.labelPad + tw);
    return { x: outside + F.labelPad, y, anchor: "start" };
  };
  const drop = CHART_TYPE.left.size * F.textDrop;
  const gaps: FunnelGap[] = [];
  items.forEach((item, i) => {
    const row = rows[i] as FunnelRow;
    const above = rows[i - 1];
    if (!above || row.first < 0) return;
    for (let s = row.first; s <= lastStep; s++) {
      const a = lengths[s]?.[i] ?? 0;
      const b = lengths[s]?.[i - 1] ?? 0;
      const left = less(values[s]?.[i - 1] ?? 0, values[s]?.[i] ?? 0);
      const prev = gaps.at(-1);
      if (prev && prev.item === item.id && prev.to === s - 1 && Math.abs(prev.rect.x - (x0 + a)) < 1e-6 && Math.abs(prev.rect.w - (b - a)) < 1e-6) {
        prev.to = s;
        continue;
      }
      if (b - a <= 0 || left <= 0) continue;
      const text = words.left(grouped(left));
      const rect = { x: x0 + a, y: row.y - F.h / 2, w: b - a, h: F.h };
      gaps.push({ item: item.id, from: s, to: s, rect, link: { x: x0 + b, y1: above.y + F.h / 2 + F.linkInset, y2: row.y - F.h / 2 }, text, label: labelOf(text, rect.x, rect.w, row.y + drop) });
    }
  });
  let bottom = (rows.at(-1)?.y ?? P) + F.h / 2;
  let total: FunnelTotal | undefined;
  if (totalShown) {
    const y = bottom + F.gap + F.totalGap + F.h / 2;
    const ends = items.map((_, i) => lengths[lastStep]?.[i] ?? 0);
    const kept = ends.at(-1) ?? 0;
    const full = ends[0] ?? 0;
    const ticks = ends.slice(1, -1).filter((end) => end > kept && end < full);
    const leftCount = less(last[0] ?? 0, last[items.length - 1] ?? 0);
    total = {
      step: lastStep,
      y,
      item: (items.at(-1) as ChartRow).id,
      name: { x: textX, y: y + F.nameAt, text: words.total },
      rate: { x: textX, y: y + F.countAt, text: totalRate },
      bar: { x: x0, y: y - F.h / 2, w: kept, h: F.h },
      ticks: ticks.map((end) => x0 + end),
    };
    if (full > kept && leftCount > 0) {
      total.rest = { x: x0 + kept, y: y - F.h / 2, w: full - kept, h: F.h };
      // 去った数は、間の段の目盛りで分けた中で一番長い所の真ん中に書く。収まらなければ最初の段の棒の端の右に書く
      const cuts = [kept, ...ticks, full];
      const spans = cuts.slice(1).map((to, k) => ({ from: cuts[k] ?? kept, to }));
      const widest = spans.reduce((a, b) => (b.to - b.from > a.to - a.from ? b : a));
      const text = words.left(grouped(leftCount));
      total.left = { ...labelOf(text, x0 + widest.from, widest.to - widest.from, y + drop, x0 + full), text };
    }
    bottom = y + F.h / 2;
  }
  return {
    plan: {
      shape: "funnel",
      items,
      values,
      title: { x: textX, y: P, anchor: "start" },
      lengths,
      funnel: { rows, bar: { x: x0, y: P, w: track, h: F.h }, gaps, ...(total ? { total } : {}) },
    },
    width: right + P,
    height: bottom + P,
  };
}

/**
 * 漏斗の見た目の段の番号。段の中で最初に値を書いた項目の行の左に置き、値を書かない最後の段は残った割合の行の左に置く。
 * 値を書かないほかの段は最初の段の行に置く。同じ所に置く後の段の番号は、前の番号と数字を入れ替える
 */
function funnelBadges(diagram: DiagramModel, funnel: FunnelPlan): SceneBadge[] {
  const x = CHART_LOOK.pad + LOOK.badge.r;
  const last = diagram.steps.length - 1;
  const badges: SceneBadge[] = diagram.steps.map((step, s) => {
    const set = step.events.find((e) => e.type === "set");
    const row = set?.type === "set" ? funnel.rows.find((r) => r.item === set.item) : undefined;
    const y = row?.y ?? (s === last && funnel.total ? funnel.total.y : (funnel.rows[0]?.y ?? 0));
    return { step: s, x, y, color: "slate" };
  });
  return besideSameSpot(badges, () => true, () => true);
}

/**
 * 縦の軸の刻み。一番大きい値 `most` を刻みの線の数の目安 `ticks` で割った数を、1 か 2 か 2.5 か 5 に 10 の累乗を掛けた数へ切り上げる。
 * 値が全て 0 の時は 1
 */
function tickStep(most: number, ticks: number): number {
  if (most <= 0) return 1;
  const raw = most / ticks;
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((k) => k * power).find((step) => step >= raw * (1 - 1e-9)) ?? 10 * power;
}

/**
 * 折れ線の見た目 (#3802)。上から、止めて置く図の図の題の行、凡例の行、縦の軸と線と点、横の軸の名前の順に置く。
 * 縦の軸は 0 から、一番大きい値を刻み (`tickStep`) で切り上げた上端までで、全ての段で同じ上端を使い、段を送っても線の高さを変えない。
 * 横の軸は段の題を段の順に等しい間で並べ、点の間は一番長い段の題が収まる幅にする。枠の幅を渡した時は、収まるまで点の間を `pitchMin` まで縮める。
 * 項目の点は値を書いた段から置き、値を書かない段は前の段の値の高さに置く。段ごとの値の字は、点の上、下、右、左の順に、線と点と先に置いた字に掛からない所に書く (#3812)。
 * 凡例は段の番号の丸の右から項目を宣言した順に横に並べ、枠に収まらない項目は次の行へ送る。止めて置く図は丸を描かないので、凡例を左端から並べる
 */
function linePlan(items: ChartRow[], values: number[][], diagram: DiagramModel, options: ChartLayoutOptions): { plan: ChartPlan; width: number; height: number } {
  const P = CHART_LOOK.pad;
  const L = CHART_LOOK.line;
  const R = LOOK.badge.r;
  const figure = options.figure === true;
  const { steps } = diagram;
  const firsts = items.map((item) => steps.findIndex((step) => step.events.some((e) => e.type === "set" && e.item === item.id)));
  const drop = (size: number): number => size * L.textDrop;
  // 縦の軸の刻みの値
  const most = Math.max(0, ...values.flat());
  const step = tickStep(most, L.ticks);
  const count = Math.max(1, Math.ceil(most / step - 1e-9));
  const tickValues = Array.from({ length: count + 1 }, (_, k) => Number((k * step).toFixed(10)));
  const top = tickValues.at(-1) ?? 1;
  // 止めて置く図の図の題の行と、凡例の行
  let y = P;
  let title: (ChartSpot & { text: string }) | undefined;
  if (figure && diagram.title) {
    title = { x: P, y: y + CHART_TYPE.title.size * 0.8, text: diagram.title };
    y += CHART_TYPE.title.size + L.titleGap;
  }
  const legendX = figure ? P : P + R * 2 + L.badgeGap;
  // 段の番号の丸を描く図は、凡例の最初の行の真ん中を丸の真ん中に揃える
  const firstRow = figure ? y + L.row / 2 : P + R;
  const limit = options.width === undefined ? Number.POSITIVE_INFINITY : options.width - P;
  const legend: LineKey[] = [];
  let x = legendX;
  let rows = 0;
  let legendRight = legendX;
  for (const item of items) {
    const w = L.keyW + L.keyGap + textWidth(item.name, CHART_TYPE.name);
    if (x > legendX && x + w > limit) {
      rows++;
      x = legendX;
    }
    const cy = firstRow + rows * L.row;
    legend.push({ item: item.id, key: { x1: x, x2: x + L.keyW, y: cy }, name: { x: x + L.keyW + L.keyGap, y: cy + drop(CHART_TYPE.name.size) } });
    legendRight = Math.max(legendRight, x + w);
    x += w + L.itemGap;
  }
  const legendBottom = firstRow + rows * L.row + L.row / 2;
  y = legendBottom + L.legendGap;
  // 縦の軸と横の軸。上端の刻みの値の字が凡例の行に掛からないよう、字の半分の高さを空ける
  const plotTop = y + CHART_TYPE.value.size / 2;
  const plotBottom = plotTop + L.plotH;
  const tickW = Math.max(0, ...tickValues.map((value) => textWidth(grouped(value), CHART_TYPE.value)));
  const axisX = P + tickW + L.tickGap;
  const widest = Math.max(0, ...steps.map((s) => textWidth(s.title, CHART_TYPE.name)));
  const valueW = Math.max(0, ...values.flat().map((value) => textWidth(grouped(value), CHART_TYPE.value)));
  // 最初の点と最後の点の値の字も、点の真上に置けるだけ空ける
  const x0 = axisX + Math.max(L.inset, widest / 2, valueW / 2 + L.valueSpace);
  const rightRoom = Math.max(L.pointR + L.valueGap + valueW, widest / 2, L.inset);
  let pitch = Math.max(L.pitch, widest + L.labelGap);
  if (options.width !== undefined && steps.length > 1) {
    const fit = (options.width - P - rightRoom - x0) / (steps.length - 1);
    if (fit < pitch) pitch = Math.max(L.pitchMin, fit);
  }
  const xs = steps.map((_, s) => x0 + s * pitch);
  const lastX = xs.at(-1) ?? x0;
  const yOf = (value: number): number => plotBottom - (value / top) * L.plotH;
  const ticks: LineTick[] = tickValues.map((value) => {
    const text = grouped(value);
    const at = yOf(value);
    return { value, text, y: at, label: { x: axisX - L.tickGap - textWidth(text, CHART_TYPE.value), y: at + drop(CHART_TYPE.value.size) } };
  });
  const labelY = plotBottom + L.xDrop;
  const labels = steps.map((s, k) => ({ x: xs[k] ?? x0, y: labelY, text: s.title }));
  const series: LineSeries[] = items.map((item, i) => {
    const first = firsts[i] ?? -1;
    const points = values.map((row, s) => (first >= 0 && s >= first ? { x: xs[s] ?? x0, y: yOf(row[i] ?? 0) } : undefined));
    return { item: item.id, first, points, values: points.map(() => undefined) };
  });
  // 段ごとの値の字 (#3812)。点の上、下、右、左の順に字の四角を置いてみて、線の区間と点の丸と先に置いた字に掛からず、
  // 凡例の行の下から 0 の線の上まで、縦の軸から図の右の端までに収まる最初の所に置く。どこも掛かる時は、掛かる物が一番少ない所に置く
  placeLineValues(series, values, { top: legendBottom, bottom: plotBottom, left: axisX, right: lastX + rightRoom });
  const width = Math.max(lastX + L.inset, lastX + rightRoom, legendRight, title ? P + textWidth(title.text, CHART_TYPE.title) : 0) + P;
  return {
    plan: {
      shape: "line",
      items,
      values,
      title: { x: P, y: P, anchor: "start" },
      line: { ticks, grid: { x1: axisX, x2: lastX + L.inset }, labels, legend, series, ...(title ? { title } : {}) },
    },
    width,
    height: labelY + CHART_TYPE.name.size * 0.2 + P,
  };
}

/** 折れ線の値の字を置く所の外の枠。上は凡例の行の下、下は 0 の線、左は縦の軸、右は図の右の端 */
interface ValueArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** 線の区間 (`a`-`b`) が四角を通るか。区間を四角で切り詰め、残る長さが在るかで見る */
function segmentCrosses(box: Rect, a: ChartSpot, b: ChartSpot): boolean {
  let lo = 0;
  let hi = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  for (const [p, q] of [
    [-dx, a.x - box.x],
    [dx, box.x + box.w - a.x],
    [-dy, a.y - box.y],
    [dy, box.y + box.h - a.y],
  ] as const) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) lo = Math.max(lo, r);
    else hi = Math.min(hi, r);
    if (lo > hi) return false;
  }
  return true;
}

/**
 * 折れ線の値の字を置く (#3812)。段の順に、同じ段では点の高い順に、点の上 (真ん中揃え)、下、右、左の順に字の四角を置いてみる。
 * 線の区間 (線の太さの半分を空ける) と点の丸 (縁を含む) と先に置いた字 (`valueSpace` を空ける) に掛からず、枠 `area` に収まる最初の所に置く。
 * どこも掛かる時は、掛かる物と枠から出る辺の数が一番少ない所に置く。字の `x` は左端、`y` は基準線
 */
function placeLineValues(series: LineSeries[], values: number[][], area: ValueArea): void {
  const L = CHART_LOOK.line;
  const style = CHART_TYPE.value;
  const segments = series.flatMap((line) => {
    const points = line.points.filter((p): p is ChartSpot => p !== undefined);
    return points.slice(1).map((b, k) => [points[k] as ChartSpot, b] as const);
  });
  const dots = series.flatMap((line) => line.points.filter((p): p is ChartSpot => p !== undefined));
  const placed: Rect[] = [];
  const dotR = L.pointR + L.pointEdge / 2;
  const steps = Math.max(0, ...series.map((line) => line.points.length));
  for (let s = 0; s < steps; s++) {
    const here = series.flatMap((line, i) => {
      const point = line.points[s];
      return point ? [{ line, i, point }] : [];
    });
    here.sort((a, b) => a.point.y - b.point.y);
    for (const { line, i, point } of here) {
      const text = grouped(values[s]?.[i] ?? 0);
      const w = textWidth(text, style);
      const side = point.y + style.size * L.textDrop;
      const candidates: ChartSpot[] = [
        { x: point.x - w / 2, y: point.y - L.pointR - L.valueRise - style.size * 0.2 },
        { x: point.x - w / 2, y: point.y + L.pointR + L.valueRise + style.size * 0.8 },
        { x: point.x + L.pointR + L.valueGap, y: side },
        { x: point.x - L.pointR - L.valueGap - w, y: side },
      ];
      const cost = (spot: ChartSpot): number => {
        const box = textBox(text, spot.x, spot.y, style);
        const pad = { x: box.x - L.stroke / 2, y: box.y - L.stroke / 2, w: box.w + L.stroke, h: box.h + L.stroke };
        const room = { x: box.x - L.valueSpace, y: box.y - L.valueSpace, w: box.w + L.valueSpace * 2, h: box.h + L.valueSpace * 2 };
        let n = 0;
        for (const [a, b] of segments) if (segmentCrosses(pad, a, b)) n++;
        for (const dot of dots) {
          const away = Math.hypot(Math.max(0, box.x - dot.x, dot.x - box.x - box.w), Math.max(0, box.y - dot.y, dot.y - box.y - box.h));
          if (away < dotR) n++;
        }
        for (const other of placed) if (room.x < other.x + other.w && other.x < room.x + room.w && room.y < other.y + other.h && other.y < room.y + room.h) n++;
        if (box.y < area.top) n++;
        if (box.y + box.h > area.bottom) n++;
        if (box.x < area.left) n++;
        if (box.x + box.w > area.right) n++;
        return n;
      };
      let best = candidates[0] as ChartSpot;
      let least = Number.POSITIVE_INFINITY;
      for (const spot of candidates) {
        const n = cost(spot);
        if (n < least) {
          best = spot;
          least = n;
        }
        if (n === 0) break;
      }
      placed.push(textBox(text, best.x, best.y, style));
      line.values[s] = { x: best.x, y: best.y, text };
    }
  }
}

/** ドーナツ。輪を左に、凡例を右に置き、狭い枠では凡例を輪の下に置く */
function donutPlan(items: ChartRow[], values: number[][], options: ChartLayoutOptions): { plan: ChartPlan; width: number; height: number } {
  const P = CHART_LOOK.pad;
  const D = CHART_LOOK.donut;
  const outer = D.r + D.width / 2;
  const nameW = Math.max(0, ...items.map((item) => textWidth(item.name, CHART_TYPE.name)));
  const shareW = textWidth("100%", CHART_TYPE.share);
  const legendW = D.swatch + D.swatchGap + nameW + D.shareGap + shareW;
  const legendH = items.length * D.row;
  const besideW = P + outer * 2 + D.legendGap + legendW + P;
  const stacked = options.width !== undefined && besideW > options.width;
  const width = stacked ? Math.max(P + outer * 2 + P, P + legendW + P) : besideW;
  const ringH = stacked ? outer * 2 : Math.max(outer * 2, legendH);
  const cx = stacked ? width / 2 : P + outer;
  const cy = P + ringH / 2;
  const legendX = stacked ? P : P + outer * 2 + D.legendGap;
  const legendTop = stacked ? P + outer * 2 + D.below : cy - legendH / 2;
  const nameDrop = CHART_TYPE.name.size * D.titleDrop;
  const legend: ChartLegendRow[] = items.map((item, i) => {
    const y = legendTop + D.row * (i + 0.5);
    return {
      item: item.id,
      x: legendX,
      y,
      swatch: { x: legendX, y: y - D.swatch / 2, w: D.swatch, h: D.swatch },
      name: { x: legendX + D.swatch + D.swatchGap, y: y + nameDrop },
      share: { x: legendX + D.swatch + D.swatchGap + nameW + D.shareGap, y: y + nameDrop },
    };
  });
  const arcs = values.map((row) => {
    const total = row.reduce((a, b) => a + b, 0);
    let start = 0;
    return row.map((value) => {
      const sweep = total > 0 ? (value / total) * 360 : 0;
      const arc = { start, sweep };
      start += sweep;
      return arc;
    });
  });
  const height = stacked ? legendTop + legendH + P : P + ringH + P;
  return {
    plan: {
      shape: "donut",
      items,
      values,
      title: { x: cx, y: cy + CHART_TYPE.title.size * D.titleDrop, anchor: "middle" },
      ring: { cx, cy, r: D.r, width: D.width },
      arcs,
      legend,
    },
    width,
    height,
  };
}

/** 横棒。段の番号と段の名前を上の行に、名前と棒と値を宣言した順に下へ並べる */
function barPlan(items: ChartRow[], values: number[][], options: ChartLayoutOptions): { plan: ChartPlan; width: number; height: number } {
  const P = CHART_LOOK.pad;
  const B = CHART_LOOK.bar;
  const r = LOOK.badge.r;
  const nameW = Math.max(0, ...items.map((item) => textWidth(item.name, CHART_TYPE.name)));
  const valueW = Math.max(0, ...values.flat().map((value) => textWidth(String(value), CHART_TYPE.value)));
  const trackX = P + nameW + B.nameGap;
  const rest = trackX + B.valueGap + valueW + P;
  const track = options.width !== undefined && rest + B.track > options.width ? Math.max(B.trackMin, options.width - rest) : B.track;
  const top = P + r * 2 + B.top;
  const drop = CHART_TYPE.name.size * B.textDrop;
  const bars: ChartBarRow[] = items.map((item, i) => {
    const y = top + (B.h + B.gap) * i;
    return { item: item.id, name: textBox(item.name, P, y + B.h / 2 + drop, CHART_TYPE.name), track: { x: trackX, y, w: track, h: B.h } };
  });
  const most = Math.max(0, ...values.flat());
  const lengths = values.map((row) => row.map((value) => (most > 0 ? (value / most) * track : 0)));
  const height = top + (B.h + B.gap) * items.length - B.gap + P;
  return {
    plan: {
      shape: "bar",
      items,
      values,
      title: { x: P + r * 2 + B.titleGap, y: P + r + CHART_TYPE.title.size * B.textDrop, anchor: "start" },
      bars,
      lengths,
    },
    width: rest + track,
    height,
  };
}

/** 折れ線の点の半径 */
const POINT_R = 5;

/** 全体図の輪の区切りを結ぶ点の間の角度 (度)。全体図の大きさに縮めても縁が角張って見えない細かさにする */
const RING_STEP = 3;

/**
 * ドーナツの輪の 1 つの区切りを、外の縁と内の縁の点で囲んだ形 (#3852)。
 * 本体の図と同じく 12 時の向きから時計回りに測り、隣の区切りと続いて見えないよう両端を `gap` の半分ずつ削る (`blocks/chart-set/draw.ts` の `arcState`)
 */
function ringSegment(ring: NonNullable<ChartPlan["ring"]>, arc: ChartArc): Point[] {
  const gap = Math.min((CHART_LOOK.donut.gap / (2 * Math.PI * ring.r)) * 360, arc.sweep);
  const from = arc.start + gap / 2;
  const to = arc.start + arc.sweep - gap / 2;
  const n = Math.max(2, Math.ceil((to - from) / RING_STEP));
  const at = (radius: number, degree: number): Point => {
    const t = ((degree - 90) * Math.PI) / 180;
    return [ring.cx + radius * Math.cos(t), ring.cy + radius * Math.sin(t)];
  };
  const edge = (radius: number, a: number, b: number): Point[] => Array.from({ length: n + 1 }, (_, i) => at(radius, a + ((b - a) * i) / n));
  return [...edge(ring.r + ring.width / 2, from, to), ...edge(ring.r - ring.width / 2, to, from)];
}

/**
 * 量の図の全体図に描く部品 (#3849)。
 * 折れ線の見た目 (`[shape: line]`) は目盛りの範囲を地、項目ごとの折れ線を線、値の在る点を点で描く。
 * 漏斗の見た目 (`[shape: funnel]`) は最後の段の長さの棒を札、減った分の四角を地で描く。
 * 棒の見た目 (`[shape: bar]`) は棒の通り道を地、最後の段の長さの棒を札で描く。
 * 点で数える見た目 (`[shape: dots]`) は点の図の共通の部品が描く。
 * 輪の見た目 (`[shape: donut]`) は、最後の段で値を持つ項目の輪の区切りを項目の色の塗った形で、
 * 凡例の行を色の見本の左端から割合の字の右端までの項目の色の札で描く。狭い枠では寄って追う形になるため (見本の os-share は幅 300 以下、staking-rewards は幅 332 以下、#3852)
 */
export function chartOverview(layout: ChartLayout): OverviewShape[] {
  const plan = layout.chart;
  const colorOf = (id: string): ColorKey => plan.items.find((item) => item.id === id)?.color ?? "slate";
  const last = plan.lengths?.[plan.lengths.length - 1] ?? [];
  if (plan.dots) return dotsOverview(plan.dots);
  if (plan.ring && plan.arcs && plan.legend) {
    const { ring } = plan;
    const arcs = plan.arcs[plan.arcs.length - 1] ?? [];
    const shareW = textWidth("100%", CHART_TYPE.share);
    return [
      ...plan.items.flatMap((item, i): OverviewShape[] => {
        const arc = arcs[i];
        return arc && arc.sweep > 0 ? [{ area: ringSegment(ring, arc), color: item.color }] : [];
      }),
      ...plan.legend.map(
        (row): OverviewShape => ({ rect: { x: row.swatch.x, y: row.swatch.y, w: row.share.x + shareW - row.swatch.x, h: row.swatch.h }, band: false, color: colorOf(row.item) }),
      ),
    ];
  }
  if (plan.line) {
    const { ticks, grid, series } = plan.line;
    const ys = ticks.map((t) => t.y);
    const top = Math.min(...ys);
    const spots = (s: (typeof series)[number]): Point[] => s.points.flatMap((p) => (p ? [[p.x, p.y] satisfies Point] : []));
    return [
      ...(ys.length > 0 ? [{ rect: { x: grid.x1, y: top, w: grid.x2 - grid.x1, h: Math.max(...ys) - top }, band: true, color: "slate" } satisfies OverviewShape] : []),
      ...series.map((s): OverviewShape => ({ line: spots(s), color: colorOf(s.item) })),
      ...series.flatMap((s) => spots(s).map(([cx, cy]): OverviewShape => ({ disc: { cx, cy, r: POINT_R }, band: false, color: colorOf(s.item) }))),
    ];
  }
  if (plan.funnel) {
    const f = plan.funnel;
    const h = CHART_LOOK.funnel.h;
    return [
      ...f.gaps.map((gap): OverviewShape => ({ rect: gap.rect, band: true, color: "rose" })),
      ...plan.items.flatMap((item, i): OverviewShape[] => {
        const row = f.rows[i];
        return row && row.first >= 0 ? [{ rect: { x: f.bar.x, y: row.y - h / 2, w: last[i] ?? f.bar.w, h }, band: false, color: item.color }] : [];
      }),
    ];
  }
  if (plan.bars) {
    return plan.bars.flatMap((row, i): OverviewShape[] => [
      { rect: row.track, band: true, color: colorOf(row.item) },
      { rect: { ...row.track, w: last[i] ?? 0 }, band: false, color: colorOf(row.item) },
    ]);
  }
  return [];
}
