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
 * 見本帳を開いた時に読まない図の種類なので、後から読む塊に入れる (#3248)
 */
import { textBox, textWidth } from "../../layout/measure";
import { besideSameSpot, type Layout, type Rect, type SceneBadge } from "../../layout/scene";
import { CHART_LOOK, CHART_TYPE } from "../../look/chart";
import { COLOR_ORDER, type ColorKey, LOOK } from "../../look/values";
import type { ChartShape, DiagramModel } from "../../schema";
import { DEFAULT_LANG, type NotationLang } from "../../words";

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
}

/** 漏斗の見た目の、図が足す字 (#3621)。去った数と、最後の段の残った割合の行の名前 */
const FUNNEL_WORDS: Readonly<Record<NotationLang, { left: (count: string) => string; total: string }>> = {
  ja: { left: (count) => `${count}が去った`, total: "最後まで残った" },
  en: { left: (count) => `${count} left`, total: "Made it to the end" },
};

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
  const placed = shape === "bar" ? barPlan(items, values, options) : donutPlan(items, values, options);
  return { kind: "chart", ...base, badges: badgesOf(diagram), width: placed.width, height: placed.height, chart: placed.plan };
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
