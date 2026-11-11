/**
 * 量の図の見た目のブロックの読み方 (#3560)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 図の種類の行の `[shape: <見た目>]` は読む処理 (`parser.ts`) が読んで読んでいる記法の状態に置き、
 * 最初の段を始める時か記法の終わりに、書いてあるかと `donut` か `bar` か `funnel` かを確かめる。書き戻しは図の種類の行を書く所 (`printer.ts`) が持つ。
 * 漏斗の見た目の値が段を進むほど減るかは、値の行を読む所 (`blocks/chart-set/read.ts`) が確かめる
 */
import { fail, isOneOf, list } from "../../read-kit";
import { type BlockReading, none } from "../block";
import { CHART_SHAPES } from "./block";

export interface ChartShapeMessages {
  /** 量の図の図の種類の行に `[shape: ]` が無い */
  chartNeedsShape: string;
  /** `shape` に `donut` と `bar` のほかの値を書いた */
  chartBadShape: (shapes: readonly string[]) => string;
}

export const reading: BlockReading<ChartShapeMessages> = {
  settle: (state, head) => {
    const shape = state.figure.chart.shape;
    if (shape === undefined) throw fail(head, 0, state.m.chartNeedsShape);
    if (!isOneOf(CHART_SHAPES, shape.value)) throw fail(head, shape.at, state.m.chartBadShape(CHART_SHAPES));
  },
  read: none("見た目は図の種類の行の属性で、行の頭の語を持たない"),
  print: none("図の種類の行の shape は、図の種類の行を書く所 (printer.ts) が書く"),
  messages: {
    ja: {
      chartNeedsShape: "chart (量の図) の最初の行に [shape: donut] か [shape: bar] か [shape: funnel] を書く",
      chartBadShape: (shapes) => `shape には ${list(shapes)} のどれかを書く`,
    },
    en: {
      chartNeedsShape: "Write [shape: donut], [shape: bar] or [shape: funnel] on the first line of a chart",
      chartBadShape: (shapes) => `Write one of ${list(shapes)} for shape`,
    },
  },
};
