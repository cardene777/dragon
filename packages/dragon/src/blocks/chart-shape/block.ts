/**
 * 量の図の見た目のブロック (#3560)。
 *
 * 量の図の部品 (`only: chart`)。図の種類の行の `[shape: donut]` か `[shape: bar]` か `[shape: funnel]` で見た目を選ぶ。必ず書き、段ごとに替えない。
 * `donut` は項目ごとの割合をドーナツの弧の角度で、`bar` は項目ごとの量を横棒の長さで描く。
 * `funnel` (#3621) は項目を段ごとに減る漏斗の段として、上から左揃えの横棒で描き、前の項目との差を薄い棒で残して去った数と割合を書く。
 * `shape` は箱と範囲の行で形を選ぶ鍵と同じ綴りで、図の種類の行に書けるのは量の図だけ。ほかの種類の図の行に書いた `shape` は読む処理 (`parser.ts`) が断る。
 * 原本の JSON では根の種類の欄 `chart` の `shape` に持つ。
 */
import type { Block } from "../block";

/** 量の図の見た目。`donut` は割合をドーナツで、`bar` は量を横棒で、`funnel` は段ごとに減る量を漏斗の横棒で描く */
export const CHART_SHAPES = ["donut", "bar", "funnel"] as const;

export type ChartShape = (typeof CHART_SHAPES)[number];

export const block: Block = {
  name: "chart-shape",
  rank: 140,
  attach: { how: "attach-to-figure", only: "chart" },
  words: { attrs: { diagram: ["shape"] } },
  // 量の図は見た目を必ず書く決まりを持つ
  always: true,
};
