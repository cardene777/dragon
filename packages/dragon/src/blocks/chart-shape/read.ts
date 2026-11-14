/**
 * 量の図の見た目のブロックの読み方 (#3560)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 図の種類の行の `[shape: <見た目>]` は読む処理 (`parser.ts`) が読んで読んでいる記法の状態に置き、
 * 最初の段を始める時か記法の終わりに、書いてあるかと `donut` か `bar` か `funnel` かを確かめる。書き戻しは図の種類の行を書く所 (`printer.ts`) が持つ。
 * 漏斗の見た目の値が段を進むほど減るかは、値の行を読む所 (`blocks/chart-set/read.ts`) が確かめる。
 * 点で数える見た目 (#3635) の 1 点の件数 `[unit: <数>]` は、点で数える見た目の図だけに書け、0 より大きい数かをここで確かめる。
 * 点の数が上限を超える段が無いかは、全ての段の値を読んだ値の行を読む所が確かめる。
 * 2つの軸で置く図だけの見た目 `scatter` (#3637) を書いた量の図は、書ける図の種類を言って止める
 */
import { fail, isOneOf, list } from "../../read-kit";
import { type BlockReading, none } from "../block";
import { CHART_SHAPES } from "../definition-values";
import { isUnit } from "../../dot-count";
import { DOTS_TEXT } from "./dots";

export interface ChartShapeMessages {
  /** 量の図の図の種類の行に `[shape: ]` が無い */
  chartNeedsShape: string;
  /** `shape` に `donut` と `bar` と `funnel` と `dots` のほかの値を書いた */
  chartBadShape: (shapes: readonly string[]) => string;
  /** 2つの軸で置く図だけの見た目 `scatter` (#3637) を量の図に書いた */
  chartScatter: (shapes: readonly string[]) => string;
  /** 点で数える見た目でない量の図に `unit` を書いた (#3635) */
  chartUnitNeedsDots: string;
  /** `unit` の値が 0 より大きい数でない (#3635) */
  chartUnitAmount: (value: string) => string;
}

export const reading: BlockReading<ChartShapeMessages> = {
  settle: (state, head) => {
    const { shape, unit } = state.figure.chart;
    if (shape === undefined) throw fail(head, 0, state.m.chartNeedsShape);
    // 点数で点を打つ見た目は量の図の見た目と取り違えやすいので、書ける図の種類を言って止める
    if (shape.value === "scatter") throw fail(head, shape.at, state.m.chartScatter(CHART_SHAPES));
    if (!isOneOf(CHART_SHAPES, shape.value)) throw fail(head, shape.at, state.m.chartBadShape(CHART_SHAPES));
    if (unit && shape.value !== "dots") throw fail(head, unit.at, state.m.chartUnitNeedsDots);
    if (unit && !isUnit(unit.value)) throw fail(head, unit.at, state.m.chartUnitAmount(unit.value));
  },
  read: none("見た目は図の種類の行の属性で、行の頭の語を持たない"),
  print: none("図の種類の行の shape は、図の種類の行を書く所 (printer.ts) が書く"),
  messages: {
    ja: {
      chartNeedsShape: "chart (量の図) の最初の行に [shape: donut] か [shape: bar] か [shape: funnel] か [shape: dots] を書く",
      chartBadShape: (shapes) => `shape には ${list(shapes)} のどれかを書く`,
      chartScatter: (shapes) => `[shape: scatter] は matrix (2つの軸で置く図) にだけ書ける。chart (量の図) の shape には ${list(shapes)} のどれかを書く`,
      chartUnitNeedsDots: DOTS_TEXT.ja.unitNeedsDots,
      chartUnitAmount: DOTS_TEXT.ja.unitAmount,
    },
    en: {
      chartNeedsShape: "Write [shape: donut], [shape: bar], [shape: funnel] or [shape: dots] on the first line of a chart",
      chartBadShape: (shapes) => `Write one of ${list(shapes)} for shape`,
      chartScatter: (shapes) => `[shape: scatter] can be written only in two-axis matrices. Write one of ${list(shapes)} for the shape of a chart`,
      chartUnitNeedsDots: DOTS_TEXT.en.unitNeedsDots,
      chartUnitAmount: DOTS_TEXT.en.unitAmount,
    },
  },
};
