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
 * 見本帳を開いた時に読まない図の種類なので、後から読む塊に入れる (#3248)
 */
import { textBox, textWidth } from "../../layout/measure";
import { besideSameSpot, type Layout, type Rect, type SceneBadge } from "../../layout/scene";
import { CHART_LOOK, CHART_TYPE } from "../../look/chart";
import { COLOR_ORDER, type ColorKey, LOOK } from "../../look/values";
import type { ChartShape, DiagramModel } from "../../schema";

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
  /** 段ごと項目ごとの横棒の長さ */
  lengths?: number[][];
}

export interface ChartLayout extends Layout {
  kind: "chart";
  chart: ChartPlan;
}

export interface ChartLayoutOptions {
  /** 描く枠の幅。書かなければ凡例を輪の右に置き、棒を決まった長さで描く */
  width?: number;
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
  const base = { regions: [], boxes: [], lifelines: [], edges: [], labels: [], actions: [], paths: [], ends: [], badges: badgesOf(diagram) };
  const placed = shape === "bar" ? barPlan(items, values, options) : donutPlan(items, values, options);
  return { kind: "chart", ...base, width: placed.width, height: placed.height, chart: placed.plan };
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
