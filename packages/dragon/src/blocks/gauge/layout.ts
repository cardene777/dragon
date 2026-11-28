/**
 * 量の目盛りの大きさと中の形 (#3880)。手順の図と列の図の並べ方が目盛りの置き場を空ける時と、描き方が中の形を描く時に、同じ決まりで組む。
 *
 * 目盛りは 3 行で組む。1 行目は左に名前、右に「値 / 上限 単位」の字。2 行目は横の棒と、その右の増えた量の札。
 * 予約した量を持つ段が 1 つでも在る目盛りは、棒の行の下に確定と予約の内訳の行を空ける (#3895)。
 * 上限を超える段が 1 つでも在る目盛りは、その下の行に上限を超えた札の置き場を空ける。上限を書かない目盛りは棒を描かず、
 * 1 行で名前と「値 単位」の字と増えた量の札を並べる。
 * 棒の地は上限を超える値の伸びる所まで含み、上限の位置は最も大きい値が地の右の端に来る長さで決める。
 * 超える値の無い目盛りは、上限の位置が地の右の端になる。
 * 段ごとの値は段の終わりの総量 (確定と予約の合計) で、値を書く前の段は 0、書かない段は前の段の値を保つ。
 * この file は手順の図と列の図の後から読む塊と描き方だけが読み、最初に読む script に入れない。
 */
import { hasWide, textWidth } from "../../layout/measure";
import type { Layout, Rect, SceneBox } from "../../layout/scene";
import { type ColorKey, LOOK, type TextStyle, TYPE } from "../../look/values";
import type { DiagramModel } from "../../schema";
import type { NotationLang } from "../../words";
import type { Gauge } from "./block";
import { GAUGE_WORDS } from "./words";

const G = LOOK.gauge;

/**
 * 量の目盛り 1 つの置き場所。`on` は目盛りを置いた箱で、図の上の帯の目盛りは持たない。
 * 中の名前と棒と札の位置は、この四角と宣言と段ごとの値から描く時に決まった形で組む (`gaugeParts`)。
 * `over` は上限を超えた段に出す札の字で、宣言の `over` か描く言葉の既定の字。
 * `split` は内訳の行の確定と予約の語で、予約を持つ段が在る目盛りだけが持つ (#3895)
 */
export interface SceneGauge extends Rect {
  id: string;
  on?: string;
  color: ColorKey;
  over: string;
  split?: Split;
}

/** 内訳の行の、確定した量と予約した量の語 (#3895) */
export type Split = readonly [confirmed: string, held: string];

/**
 * 目盛りを置いた図の置き場所。目盛りを置ける図の種類 (手順の図と列の図) の、目盛りを宣言した図だけが `gauges` を持つ。
 * 共通の置き場所の形 (`Layout`) には足さない。配管の図の置き場所が同じ名前の欄に別の物を持つため
 */
export type GaugeLayout = Layout & { gauges?: SceneGauge[] };

/** 箱を持たない目盛り (図の上の帯の目盛り) の色 */
const TOP_COLOR: ColorKey = "blue";

/** 目盛りの字の中で最も小さい字の大きさ。列の図が横に並べるかを決める時に読む */
export const GAUGE_TEXT_MIN = Math.min(TYPE.gaugeName.size, TYPE.gaugeValue.size, TYPE.gaugeTag.size, TYPE.gaugeOver.size, TYPE.gaugeSplit.size);

/** 和文を含む字は、等幅の字の形を同じ大きさと太さの和文の字にする */
export const styleFor = (text: string, style: TextStyle): TextStyle => (style.family === "mono" && hasWide(text) ? { ...style, family: "sans" } : style);

/** 字の幅。和文を含む字は和文の字で測る */
const widthOf = (text: string, style: TextStyle): number => textWidth(text, styleFor(text, style));

/** 数の字。小数は書いた桁までにし、引き算で出た端数を落とす */
export const numberText = (n: number): string => String(Number(n.toFixed(6)));

/** 値の字。上限を持つ目盛りは「値 / 上限 単位」、持たない目盛りは「値 単位」 */
export function valueText(gauge: Gauge, value: number): string {
  const unit = gauge.unit === undefined ? "" : ` ${gauge.unit}`;
  return gauge.limit === undefined ? `${numberText(value)}${unit}` : `${numberText(value)} / ${numberText(gauge.limit)}${unit}`;
}

/** 前の段からの増えた量か減った量の字。増えた量は `+`、減った量は `−` (U+2212) を付ける */
export const deltaText = (delta: number): string => `${delta > 0 ? "+" : "−"}${numberText(Math.abs(delta))}`;

/** 目盛りごとの、段の終わりの総量 (確定と予約の合計)。値を書く前の段は 0、書かない段は前の段の値を保つ */
export function gaugeValues(diagram: DiagramModel): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const gauge of diagram.gauge ?? []) {
    let now = 0;
    out.set(
      gauge.id,
      diagram.steps.map((step) => {
        for (const e of step.events) if (e.type === "gauge" && e.gauge === gauge.id) now = e.value + (e.hold ?? 0);
        return now;
      }),
    );
  }
  return out;
}

/** 目盛りごとの、段の終わりの予約した量 (#3895)。`hold` を書かない `set` は 0 に戻し、`set` を書かない段は前の段の量を保つ */
export function gaugeHolds(diagram: DiagramModel): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const gauge of diagram.gauge ?? []) {
    let now = 0;
    out.set(
      gauge.id,
      diagram.steps.map((step) => {
        for (const e of step.events) if (e.type === "gauge" && e.gauge === gauge.id) now = e.hold ?? 0;
        return now;
      }),
    );
  }
  return out;
}

/** 内訳の行の 2 つの字。確定した量 (`total` から `hold` を引いた量) と予約した量に語を添える */
export const splitTexts = (split: Split, total: number, hold: number): [string, string] => [`${split[0]} ${numberText(total - hold)}`, `${split[1]} ${numberText(hold)}`];

/** 内訳の行の幅。色の四角と字を 2 組並べる */
const splitW = (texts: readonly string[]): number => texts.reduce((w, t, k) => w + (k > 0 ? G.splitItemGap : 0) + G.swatch + G.swatchGap + widthOf(t, TYPE.gaugeSplit), 0);

/** 予約した量を持つ段が在るか。上限を書かない目盛りは棒を描かないので予約を見せない */
const holdsAny = (gauge: Gauge, holds: readonly number[]): boolean => gauge.limit !== undefined && holds.some((h) => h > 0);

/** 段ごとの前の段からの差。値を書く前は 0 から数え、変わらない段は 0 */
export const deltasOf = (values: readonly number[]): number[] => values.map((v, s) => v - (s === 0 ? 0 : (values[s - 1] ?? 0)));

/** 上限を超える段が在るか */
const goesOver = (gauge: Gauge, values: readonly number[]): boolean => gauge.limit !== undefined && values.some((v) => v > (gauge.limit as number));

/** 増えた量の札の幅 */
export const chipW = (text: string): number => widthOf(text, TYPE.gaugeTag) + G.chipPadX * 2;
/** 札の中で最も広い札の幅。値の変わる段が無ければ 0 */
const chipMost = (values: readonly number[]): number => Math.max(0, ...deltasOf(values).flatMap((d) => (d === 0 ? [] : [chipW(deltaText(d))])));
/** 上限を超えた札の幅 */
export const overW = (text: string): number => widthOf(text, TYPE.gaugeOver) + G.overPadX * 2;

/** 目盛りが要る幅と高さ。`over` は上限を超えた札の字、`holds` は段ごとの予約した量、`split` は内訳の行の語 */
export function gaugeSize(gauge: Gauge, values: readonly number[], over: string, holds: readonly number[] = [], split?: Split): { w: number; h: number } {
  const name = widthOf(gauge.name, TYPE.gaugeName);
  const value = Math.max(...[0, ...values].map((v) => widthOf(valueText(gauge, v), TYPE.gaugeValue)));
  const chip = chipMost(values);
  const chipRoom = chip > 0 ? G.chipGap + chip : 0;
  if (gauge.limit === undefined) return { w: name + G.nameGap + value + chipRoom, h: Math.max(G.textH, chip > 0 ? G.chipH : 0) };
  const over_ = goesOver(gauge, values);
  const held = split !== undefined && holdsAny(gauge, holds);
  const splitMost = held ? Math.max(0, ...values.map((v, s) => ((holds[s] ?? 0) > 0 ? splitW(splitTexts(split, v, holds[s] ?? 0)) : 0))) : 0;
  const w = Math.max(Math.max(name + G.nameGap + value, G.minBar) + chipRoom, over_ ? overW(over) : 0, splitMost);
  return { w, h: G.textH + G.rowGap + G.chipH + (held ? G.splitGap + G.splitH : 0) + (over_ ? G.overGap + G.overH : 0) };
}

/** 目盛りの中の形。字の基準線と、棒の地と上限の位置と、札の左の端と、上限を超えた札の四角 */
export interface GaugeParts {
  /** 名前の左の端と基準線 */
  nameX: number;
  baseline: number;
  /** 値の字の端。上限を持つ目盛りは右の端 (`end`)、持たない目盛りは左の端 (`start`) */
  valueX: number;
  valueAnchor: "start" | "end";
  /** 棒の地。上限を持つ目盛りだけが持つ */
  track?: Rect;
  /** 上限の位置の横の位置と、上限までの棒の長さ */
  limitX?: number;
  span?: number;
  /** 増えた量の札の左の端と上の端 */
  chipX: number;
  chipY: number;
  /** 上限を超えた札の上の端 */
  overY?: number;
  /** 内訳の行の上の端。予約を持つ段が在る目盛りだけが持つ (#3895) */
  splitY?: number;
}

/** 置いた目盛り `scene` の中の形。並べ方が空けた四角に、`gaugeSize` と同じ決まりで組む */
export function gaugeParts(scene: SceneGauge, gauge: Gauge, values: readonly number[], holds: readonly number[] = []): GaugeParts {
  const baseline = scene.y + G.textH - 4;
  const chip = chipMost(values);
  const chipRoom = chip > 0 ? G.chipGap + chip : 0;
  if (gauge.limit === undefined) {
    const valueX = scene.x + widthOf(gauge.name, TYPE.gaugeName) + G.nameGap;
    const value = Math.max(...[0, ...values].map((v) => widthOf(valueText(gauge, v), TYPE.gaugeValue)));
    return { nameX: scene.x, baseline, valueX, valueAnchor: "start", chipX: valueX + value + G.chipGap, chipY: scene.y + G.textH / 2 - G.chipH / 2 };
  }
  const trackW = scene.w - chipRoom;
  const rowY = scene.y + G.textH + G.rowGap;
  const track = { x: scene.x, y: rowY + (G.chipH - G.barH) / 2, w: trackW, h: G.barH };
  const most = Math.max(gauge.limit, ...values);
  const span = (trackW * gauge.limit) / most;
  const held = scene.split !== undefined && holdsAny(gauge, holds);
  const splitRoom = held ? G.splitGap + G.splitH : 0;
  return {
    nameX: scene.x,
    baseline,
    valueX: scene.x + trackW,
    valueAnchor: "end",
    track,
    limitX: track.x + span,
    span,
    chipX: track.x + trackW + G.chipGap,
    chipY: rowY,
    ...(goesOver(gauge, values) ? { overY: rowY + G.chipH + splitRoom + G.overGap } : {}),
    ...(held ? { splitY: rowY + G.chipH + G.splitGap } : {}),
  };
}

/** 置く前の目盛り。宣言と段ごとの値と、要る幅と高さと、上限を超えた札の字と、予約を持つ段が在る目盛りの内訳の行の語 */
export interface GaugePlan {
  gauge: Gauge;
  values: number[];
  w: number;
  h: number;
  over: string;
  split?: Split;
}

/**
 * 図の目盛りを置く前の形にする。`boxes` は目盛りを置ける箱の名札で、`on` が無い箱を指す目盛り (原本の JSON にだけ書ける) は図の上の帯に置く。
 * 上限を超えた札の既定の字と内訳の行の確定と予約の語は、描く言葉 `lang` の目盛りの語 (`words.ts`) から読む
 */
export function planGauges(diagram: DiagramModel, boxes: readonly string[], lang: NotationLang): { under: Map<string, GaugePlan[]>; top: GaugePlan[] } {
  const { over, split } = GAUGE_WORDS[lang];
  const values = gaugeValues(diagram);
  const holds = gaugeHolds(diagram);
  const under = new Map<string, GaugePlan[]>();
  const top: GaugePlan[] = [];
  for (const gauge of diagram.gauge ?? []) {
    const own = values.get(gauge.id) ?? [];
    const held = holds.get(gauge.id) ?? [];
    const text = gauge.over ?? over;
    // 予約を持つ段が無い目盛りは内訳の語を持たず、今と同じ形で置く
    const words = holdsAny(gauge, held) ? split : undefined;
    const plan: GaugePlan = { gauge, values: own, ...gaugeSize(gauge, own, text, held, words), over: text, ...(words ? { split: words } : {}) };
    if (gauge.on !== undefined && boxes.includes(gauge.on)) under.set(gauge.on, [...(under.get(gauge.on) ?? []), plan]);
    else top.push(plan);
  }
  return { under, top };
}

/** 宣言した順に縦に積んだ目盛りの高さ。目盛りが無ければ 0 */
export const stackHeight = (plans: readonly GaugePlan[]): number => plans.reduce((h, p, k) => h + p.h + (k > 0 ? G.stack : 0), 0);

/** 箱の下に要る高さ。箱の下の端から最後の目盛りの下の端まで (`gap` は箱と 1 つ目の目盛りの間)。目盛りが無ければ 0 */
export const roomUnder = (plans: readonly GaugePlan[] | undefined, gap: number = G.below): number => (plans && plans.length > 0 ? gap + stackHeight(plans) : 0);

/** 積んだ目盛りの中で最も広い幅。目盛りが無ければ 0 */
export const widest = (plans: readonly GaugePlan[] | undefined): number => Math.max(0, ...(plans ?? []).map((p) => p.w));

/** 目盛りを `x` と `y` から下へ宣言した順に積む。`w` を渡すと全ての目盛りをその幅にし、渡さなければ要る幅のまま置く */
export function stackGauges(plans: readonly GaugePlan[], x: number, y: number, color: ColorKey, w?: number): SceneGauge[] {
  let top = y;
  return plans.map((plan) => {
    const placed: SceneGauge = {
      id: plan.gauge.id,
      ...(plan.gauge.on !== undefined ? { on: plan.gauge.on } : {}),
      color,
      over: plan.over,
      ...(plan.split ? { split: plan.split } : {}),
      x,
      y: top,
      w: w ?? plan.w,
      h: plan.h,
    };
    top += plan.h + G.stack;
    return placed;
  });
}

/** 箱 `box` の下の目盛り。箱の色で描く */
export const underBox = (plans: readonly GaugePlan[], box: SceneBox, x: number, gap: number = G.below, w?: number): SceneGauge[] => stackGauges(plans, x, box.y + box.h + gap, box.color, w);

/** 図の上の帯の目盛り */
export const topBand = (plans: readonly GaugePlan[], x: number, y: number): SceneGauge[] => stackGauges(plans, x, y, TOP_COLOR);

/** 置いた目盛りを図の置き場所に足す。目盛りが無い図は欄を持たない */
export function withGauges(layout: GaugeLayout, gauges: SceneGauge[]): void {
  if (gauges.length > 0) layout.gauges = gauges;
}

/** 図の置き場所が持つ目盛り。目盛りを置けない図の種類は持たない */
export const gaugesOf = (layout: Layout): SceneGauge[] | undefined => (layout as GaugeLayout).gauges;
