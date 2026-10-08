/**
 * 宅配の見本 13 件が持つ形の要素数を、最後の段を描いた SVG で固定する (#2837)。
 *
 * `描けない` 行も現在の DOM 数を固定する。描く側が近づいて数が変わった時に検査を落とし、
 * 見本数と一致した行から宣言を外せるようにする。対応する DOM が無い時だけ仮の role を使う。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, computeStateValues, layout, type CdlDiagram } from "@cardenelabs/cdl";
import * as Charts from "@/topics/catalog/charts.cdl";

const 宅配の鍵 = [
  "deliveryOfficeTree", "redeliveryIdeasMind", "branchParcelsBar", "monthlyDeliveriesLine",
  "parcelStatusPie", "orderToDeliveryFunnel", "measureEffortQuadrant", "onTimeRateSlope",
  "onTimeShareGauge", "parcelSizeWaffle", "deliveryResultStacked", "sortingShelfGantt",
  "shipperFeelingJourney",
] as const;

type 宅配の鍵 = (typeof 宅配の鍵)[number];
type 形の要素 = {
  鍵: 宅配の鍵;
  要素: string;
  見本の数: number;
  今の数: number;
  role: string;
  描ける: boolean;
  理由?: string;
  下書き?: string;
  仮の役割名?: boolean;
};

const 形の要素たち: 形の要素[] = [
  { 鍵: "deliveryOfficeTree", 要素: "名前と補足を持つ箱", 見本の数: 7, 今の数: 7, role: "tree-node", 描ける: true },
  { 鍵: "deliveryOfficeTree", 要素: "箱の補足", 見本の数: 7, 今の数: 7, role: "tree-node-subtitle", 描ける: true },
  { 鍵: "deliveryOfficeTree", 要素: "直角の枝", 見本の数: 6, 今の数: 6, role: "tree-edge", 描ける: true },
  { 鍵: "deliveryOfficeTree", 要素: "枝の先の矢印", 見本の数: 6, 今の数: 0, role: "role+attr:tree-edge|marker-end=", 描ける: false, 理由: "tree-edge に矢じりが無い", 下書き: ".context/scratch/2837/cdl-issue-tree-presentation.md" },
  { 鍵: "deliveryOfficeTree", 要素: "根を他と同じ枠で描く箱", 見本の数: 7, 今の数: 6, role: "role+attr:tree-node|fill=\"var(--cdl-chip-fill, #f4f6fb)\"", 描ける: false, 理由: "根だけ gradient で塗る", 下書き: ".context/scratch/2837/cdl-issue-tree-presentation.md" },
  { 鍵: "deliveryOfficeTree", 要素: "段ごとの枝の色", 見本の数: 2, 今の数: 1, role: "unique-attr:tree-edge|stroke", 描ける: false, 理由: "全 tree-edge が accent 1 色", 下書き: ".context/scratch/2837/cdl-issue-tree-presentation.md" },

  { 鍵: "redeliveryIdeasMind", 要素: "中心", 見本の数: 1, 今の数: 1, role: "text+attrs:再配達を減らす|font-weight=\"700\"", 描ける: true },
  { 鍵: "redeliveryIdeasMind", 要素: "枝", 見本の数: 4, 今の数: 4, role: "texts:置き場所|時間|知らせる|受け取り方", 描ける: true },
  { 鍵: "redeliveryIdeasMind", 要素: "葉", 見本の数: 8, 今の数: 8, role: "texts:置き配|宅配ロッカー|時間指定|夜の便|前日に知らせる|着く前に電話|コンビニで受け取る|職場に届ける", 描ける: true },
  { 鍵: "redeliveryIdeasMind", 要素: "中心から葉までの接続", 見本の数: 12, 今の数: 12, role: "mind-edge", 描ける: true },
  { 鍵: "redeliveryIdeasMind", 要素: "枝ごとに違う色", 見本の数: 4, 今の数: 4, role: "unique-attr:mind-edge|stroke", 描ける: true },
  { 鍵: "redeliveryIdeasMind", 要素: "葉の下線", 見本の数: 8, 今の数: 0, role: "mind-leaf-underline", 描ける: false, 理由: "葉は字だけで線を描かない", 下書き: ".context/scratch/2837/cdl-issue-mind-presentation.md", 仮の役割名: true },
  { 鍵: "redeliveryIdeasMind", 要素: "中心を枠だけで描く", 見本の数: 1, 今の数: 0, role: "tag+attrs:rect|rx=\"22\"|fill=\"var(--cdl-chip-fill, #f4f6fb)\"", 描ける: false, 理由: "中心を tone の面で塗る", 下書き: ".context/scratch/2837/cdl-issue-mind-presentation.md" },

  { 鍵: "branchParcelsBar", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "branchParcelsBar", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "branchParcelsBar", 要素: "棒", 見本の数: 5, 今の数: 5, role: "chart-bar", 描ける: true },
  { 鍵: "branchParcelsBar", 要素: "点線の目盛り", 見本の数: 5, 今の数: 5, role: "chart-bar-tick", 描ける: true },
  { 鍵: "branchParcelsBar", 要素: "値の札", 見本の数: 5, 今の数: 5, role: "chart-bar-value", 描ける: true },
  { 鍵: "branchParcelsBar", 要素: "斜線を当てる主役", 見本の数: 1, 今の数: 1, role: "role+attr:chart-bar|data-cdl-emphasis=\"primary\"", 描ける: true },

  { 鍵: "monthlyDeliveriesLine", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "monthlyDeliveriesLine", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "monthlyDeliveriesLine", 要素: "実績の線", 見本の数: 1, 今の数: 1, role: "chart-line", 描ける: true },
  { 鍵: "monthlyDeliveriesLine", 要素: "中抜きの点", 見本の数: 5, 今の数: 5, role: "tag+attrs:circle|r=\"5\"|fill=\"var(--cdl-node-fill, #ffffff)\"", 描ける: true },
  { 鍵: "monthlyDeliveriesLine", 要素: "始まりと終わりだけの値", 見本の数: 2, 今の数: 5, role: "chart-line-value", 描ける: false, 理由: "全ての点へ値を描く", 下書き: ".context/scratch/2837/cdl-issue-chart-line-plan.md" },
  { 鍵: "monthlyDeliveriesLine", 要素: "計画の点線", 見本の数: 1, 今の数: 0, role: "chart-line-plan", 描ける: false, 理由: "chart-line は 1 系列だけを描く", 下書き: ".context/scratch/2837/cdl-issue-chart-line-plan.md", 仮の役割名: true },

  { 鍵: "parcelStatusPie", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "parcelStatusPie", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "parcelStatusPie", 要素: "輪の区画", 見本の数: 4, 今の数: 4, role: "chart-pie-slice", 描ける: true },
  { 鍵: "parcelStatusPie", 要素: "中心の合計値", 見本の数: 1, 今の数: 1, role: "texts:1,284", 描ける: true },
  { 鍵: "parcelStatusPie", 要素: "中心の単位『件』", 見本の数: 1, 今の数: 0, role: "texts:件", 描ける: false, 理由: "中心の下は固定の『合計』", 下書き: ".context/scratch/2837/cdl-issue-pie-center-unit.md" },
  { 鍵: "parcelStatusPie", 要素: "右の一覧と値", 見本の数: 4, 今の数: 4, role: "chart-pie-table-row", 描ける: true },

  { 鍵: "orderToDeliveryFunnel", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "orderToDeliveryFunnel", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "orderToDeliveryFunnel", 要素: "段ごとの値", 見本の数: 4, 今の数: 4, role: "texts:12,000|3,400|2,900|2,750", 描ける: true },
  { 鍵: "orderToDeliveryFunnel", 要素: "段から次への率", 見本の数: 3, 今の数: 0, role: "funnel-conversion-rate", 描ける: false, 理由: "離脱率を描き、見本の通過率を選べない", 下書き: ".context/scratch/2837/cdl-issue-funnel-conversion.md", 仮の役割名: true },
  { 鍵: "orderToDeliveryFunnel", 要素: "中央に寄せた比例の横棒", 見本の数: 4, 今の数: 0, role: "funnel-proportional-bar", 描ける: false, 理由: "現在はじょうごの台形を描く", 下書き: ".context/scratch/2837/cdl-issue-funnel-conversion.md", 仮の役割名: true },
  { 鍵: "orderToDeliveryFunnel", 要素: "最後の段の斜線", 見本の数: 1, 今の数: 0, role: "funnel-stage-hatch", 描ける: false, 理由: "funnel に主役の斜線が無い", 下書き: ".context/scratch/2837/cdl-issue-highlight-hatch.md", 仮の役割名: true },

  { 鍵: "measureEffortQuadrant", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "measureEffortQuadrant", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "measureEffortQuadrant", 要素: "点", 見本の数: 5, 今の数: 5, role: "quadrant-point", 描ける: true },
  { 鍵: "measureEffortQuadrant", 要素: "点の名前", 見本の数: 5, 今の数: 5, role: "quadrant-point-label", 描ける: true },
  { 鍵: "measureEffortQuadrant", 要素: "軸の名前", 見本の数: 2, 今の数: 4, role: "contains-list:手間 小|手間 大|効き目 小|効き目 大", 描ける: false, 理由: "左右上下の端を 4 名で描き、見本の 2 軸名にできない", 下書き: ".context/scratch/2837/cdl-issue-quadrant-axis-labels.md" },
  { 鍵: "measureEffortQuadrant", 要素: "象限の名前", 見本の数: 4, 今の数: 4, role: "texts:先にやる|計画してやる|ついでにやる|やらない", 描ける: true },

  { 鍵: "onTimeRateSlope", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "onTimeRateSlope", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "onTimeRateSlope", 要素: "縦軸", 見本の数: 2, 今の数: 2, role: "chart-slope-axis", 描ける: true },
  { 鍵: "onTimeRateSlope", 要素: "縦軸の見出し（先月 / 今月）", 見本の数: 2, 今の数: 0, role: "texts:先月|今月", 描ける: false, 理由: "描く側は『前 / 今』に固定する", 下書き: ".context/scratch/2837/cdl-issue-slope-emphasis.md" },
  { 鍵: "onTimeRateSlope", 要素: "営業所を結ぶ線", 見本の数: 4, 今の数: 4, role: "chart-slope-line", 描ける: true },
  { 鍵: "onTimeRateSlope", 要素: "両端の点", 見本の数: 8, 今の数: 8, role: "chart-slope-dot", 描ける: true },
  { 鍵: "onTimeRateSlope", 要素: "両端の名札", 見本の数: 8, 今の数: 8, role: "chart-slope-name", 描ける: true },
  { 鍵: "onTimeRateSlope", 要素: "主役 2 本だけの色", 見本の数: 2, 今の数: 4, role: "role+attr-not:chart-slope-line|stroke=\"var(--cdl-text-mute, #8a8678)\"", 描ける: false, 理由: "主役以外にも系列色を配る", 下書き: ".context/scratch/2837/cdl-issue-slope-emphasis.md" },

  { 鍵: "onTimeShareGauge", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "onTimeShareGauge", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "onTimeShareGauge", 要素: "定時と遅れの半円区画", 見本の数: 2, 今の数: 2, role: "chart-gauge-arc", 描ける: true },
  { 鍵: "onTimeShareGauge", 要素: "0 と 100 の目盛り", 見本の数: 2, 今の数: 0, role: "chart-gauge-scale-endpoint", 描ける: false, 理由: "固定目盛りを描く欄が無い", 下書き: ".context/scratch/2837/cdl-issue-gauge-target.md", 仮の役割名: true },
  { 鍵: "onTimeShareGauge", 要素: "中央の 78%", 見本の数: 1, 今の数: 0, role: "chart-gauge-current-value", 描ける: false, 理由: "中央には区画の合計 100 を描く", 下書き: ".context/scratch/2837/cdl-issue-gauge-target.md", 仮の役割名: true },
  { 鍵: "onTimeShareGauge", 要素: "目標の印", 見本の数: 1, 今の数: 0, role: "chart-gauge-target", 描ける: false, 理由: "gauge に目標値の欄が無い", 下書き: ".context/scratch/2837/cdl-issue-gauge-target.md", 仮の役割名: true },
  { 鍵: "onTimeShareGauge", 要素: "先月より +6 の差分札", 見本の数: 1, 今の数: 0, role: "chart-gauge-delta", 描ける: false, 理由: "previous は内側の輪になり差分札を描かない", 下書き: ".context/scratch/2837/cdl-issue-gauge-target.md", 仮の役割名: true },

  { 鍵: "parcelSizeWaffle", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "parcelSizeWaffle", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "parcelSizeWaffle", 要素: "升目", 見本の数: 100, 今の数: 100, role: "chart-waffle-cell", 描ける: true },
  { 鍵: "parcelSizeWaffle", 要素: "升目の 3 色", 見本の数: 3, 今の数: 3, role: "unique-attr:chart-waffle-cell|fill", 描ける: true },
  { 鍵: "parcelSizeWaffle", 要素: "右の一覧", 見本の数: 3, 今の数: 0, role: "chart-waffle-item-right", 描ける: false, 理由: "一覧を左へ固定して描く", 下書き: ".context/scratch/2837/cdl-issue-waffle-legend.md", 仮の役割名: true },

  { 鍵: "deliveryResultStacked", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "deliveryResultStacked", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "deliveryResultStacked", 要素: "月ごとの帯", 見本の数: 5, 今の数: 2, role: "chart-stacked-bar-row", 描ける: false, 理由: "stacked は前と今の 2 本まで", 下書き: ".context/scratch/2837/cdl-issue-stacked-periods.md" },
  { 鍵: "deliveryResultStacked", 要素: "3 区画 × 5 か月", 見本の数: 15, 今の数: 6, role: "chart-stacked-bar-slice", 描ける: false, 理由: "2 本分の 6 区画だけを描く", 下書き: ".context/scratch/2837/cdl-issue-stacked-periods.md" },
  { 鍵: "deliveryResultStacked", 要素: "右の率", 見本の数: 5, 今の数: 4, role: "chart-stacked-bar-slice-text", 描ける: false, 理由: "率を区画内へ置き、細い区画では省く", 下書き: ".context/scratch/2837/cdl-issue-stacked-periods.md" },
  { 鍵: "deliveryResultStacked", 要素: "上の凡例", 見本の数: 3, 今の数: 0, role: "chart-stacked-bar-legend-top", 描ける: false, 理由: "3 件の凡例を帯の下へ置く", 下書き: ".context/scratch/2837/cdl-issue-stacked-periods.md", 仮の役割名: true },

  { 鍵: "sortingShelfGantt", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "sortingShelfGantt", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "sortingShelfGantt", 要素: "工程の帯", 見本の数: 6, 今の数: 6, role: "gantt-bar", 描ける: true },
  { 鍵: "sortingShelfGantt", 要素: "月の見出し", 見本の数: 5, 今の数: 5, role: "gantt-tick", 描ける: true },
  { 鍵: "sortingShelfGantt", 要素: "依存の矢印", 見本の数: 4, 今の数: 3, role: "gantt-arrow", 描ける: false, 理由: "1 工程につき親を 1 件だけ持ち、試すへの 2 本目が落ちる", 下書き: ".context/scratch/2837/cdl-issue-gantt-multiple-dependencies.md" },
  { 鍵: "sortingShelfGantt", 要素: "主役の斜線", 見本の数: 3, 今の数: 0, role: "gantt-bar-hatch", 描ける: false, 理由: "accent の帯を 3 本に分けられるが斜線を当てる印が無い", 下書き: ".context/scratch/2837/cdl-issue-highlight-hatch.md", 仮の役割名: true },
  { 鍵: "sortingShelfGantt", 要素: "1 行おきの地", 見本の数: 3, 今の数: 3, role: "gantt-row", 描ける: true },
  { 鍵: "sortingShelfGantt", 要素: "月内位置の端点", 見本の数: 7, 今の数: 7, role: "diagram:gantt-fractional-endpoint", 描ける: true },
  { 鍵: "sortingShelfGantt", 要素: "本番の節目", 見本の数: 1, 今の数: 0, role: "gantt-milestone", 描ける: false, 理由: "同じ始終点も 1 目盛り幅の帯にする", 下書き: ".context/scratch/2837/cdl-issue-gantt-markers.md", 仮の役割名: true },
  { 鍵: "sortingShelfGantt", 要素: "今日の点線", 見本の数: 1, 今の数: 0, role: "gantt-today", 描ける: false, 理由: "今日を渡す欄が無い", 下書き: ".context/scratch/2837/cdl-issue-gantt-markers.md", 仮の役割名: true },

  { 鍵: "shipperFeelingJourney", 要素: "札の見出し", 見本の数: 1, 今の数: 1, role: "figure-title", 描ける: true },
  { 鍵: "shipperFeelingJourney", 要素: "札の足（種別 + 単位）", 見本の数: 1, 今の数: 0, role: "figure-footer", 描ける: false, 理由: "図の足を渡す欄と描画が無い", 下書き: ".context/scratch/2837/cdl-issue-figure-card-footer.md", 仮の役割名: true },
  { 鍵: "shipperFeelingJourney", 要素: "5 段の気持ちの名前", 見本の数: 5, 今の数: 3, role: "texts:最高|満足|普通|不満|怒り", 描ける: false, 理由: "最高を大満足、普通をふつうと描く", 下書き: ".context/scratch/2837/cdl-issue-journey-opportunity.md" },
  { 鍵: "shipperFeelingJourney", 要素: "中抜きの点", 見本の数: 6, 今の数: 6, role: "tag+attrs:circle|r=\"9\"|fill=\"var(--cdl-node-fill, #ffffff)\"", 描ける: true },
  { 鍵: "shipperFeelingJourney", 要素: "気持ちを結ぶ線", 見本の数: 1, 今の数: 1, role: "journey-line", 描ける: true },
  { 鍵: "shipperFeelingJourney", 要素: "見本どおりの谷の注記", 見本の数: 1, 今の数: 0, role: "contains:不在票に気づかなかった", 描ける: false, 理由: "固定幅へ収めるため不在票に気づかずへ短くした", 下書き: ".context/scratch/2837/cdl-issue-journey-opportunity.md" },
  { 鍵: "shipperFeelingJourney", 要素: "谷の点の真下に置く注記", 見本の数: 1, 今の数: 0, role: "journey-opportunity-below-point", 描ける: false, 理由: "図の下の札として固定位置へ置く", 下書き: ".context/scratch/2837/cdl-issue-journey-opportunity.md", 仮の役割名: true },
  { 鍵: "shipperFeelingJourney", 要素: "字に合わせた注記の幅", 見本の数: 1, 今の数: 0, role: "journey-opportunity-fit-width", 描ける: false, 理由: "札の幅を 110 に固定する", 下書き: ".context/scratch/2837/cdl-issue-journey-opportunity.md", 仮の役割名: true },
];

const 図を引く = (鍵: 宅配の鍵): CdlDiagram | undefined =>
  (Charts as unknown as Record<string, CdlDiagram>)[鍵];

const 最後を描く = (図: CdlDiagram): string => {
  const 配置済み = layout(図);
  const 最後の値 = computeStateValues(配置済み, Math.max(0, 配置済み.phases.length - 1), 1);
  const 静止図: CdlDiagram = {
    ...図,
    states: (図.states ?? []).map((状態) => ({
      ...状態,
      initial: 最後の値[状態.id] ?? 状態.initial,
    })),
    phases: [{
      id: "最後",
      duration: 1,
      title: "最後",
      body: "",
      activate: [],
      tweens: [],
      sets: [],
    }],
  };
  return renderToStaticMarkup(<CdlDiagramView diagram={layout(静止図)} hideHeader />);
};

const roleの数 = (svg: string, role: string, 図: CdlDiagram): number => {
  if (role === "chart-pie-table-row") {
    return Math.max(0, [...svg.matchAll(/data-cdl-role="chart-pie-table-rule"/gu)].length - 1);
  }
  if (role === "diagram:gantt-fractional-endpoint") {
    const 配置済み = layout(図);
    const 値 = computeStateValues(配置済み, Math.max(0, 配置済み.phases.length - 1), 1);
    const 数 = (v: number | string): number | undefined => {
      if (typeof v === "number") return v;
      const m = v.match(/^\{(.+)\}$/u);
      const resolved = m === null ? Number(v) : Number(値[m[1]!]);
      return Number.isFinite(resolved) ? resolved : undefined;
    };
    return 図.nodes
      .flatMap((node) => node.ganttData ?? [])
      .flatMap((task) => [数(task.startIdx), 数(task.endIdx)])
      .filter((v): v is number => v !== undefined && !Number.isInteger(v)).length;
  }
  const 開始タグ = svg.match(/<[^>]+>/gu) ?? [];
  if (role.startsWith("role+attr:")) {
    const [roleName, attribute] = role.slice("role+attr:".length).split("|");
    if (roleName === undefined || attribute === undefined) return 0;
    return 開始タグ.filter((tag) => tag.includes(`data-cdl-role="${roleName}"`) && tag.includes(attribute)).length;
  }
  if (role.startsWith("role+attr-not:")) {
    const [roleName, attribute] = role.slice("role+attr-not:".length).split("|");
    if (roleName === undefined || attribute === undefined) return 0;
    return 開始タグ.filter((tag) => tag.includes(`data-cdl-role="${roleName}"`) && !tag.includes(attribute)).length;
  }
  if (role.startsWith("tag+attrs:")) {
    const [tagName, ...attributes] = role.slice("tag+attrs:".length).split("|");
    if (tagName === undefined) return 0;
    return 開始タグ.filter((tag) => tag.startsWith(`<${tagName}`) && attributes.every((attribute) => tag.includes(attribute))).length;
  }
  if (role.startsWith("unique-attr:")) {
    const [roleName, attributeName] = role.slice("unique-attr:".length).split("|");
    if (roleName === undefined || attributeName === undefined) return 0;
    const values = 開始タグ
      .filter((tag) => tag.includes(`data-cdl-role="${roleName}"`))
      .map((tag) => tag.match(new RegExp(`${attributeName}="([^"]+)"`, "u"))?.[1])
      .filter((value): value is string => value !== undefined);
    return new Set(values).size;
  }
  if (role.startsWith("text+attrs:")) {
    const [content, ...attributes] = role.slice("text+attrs:".length).split("|");
    if (content === undefined) return 0;
    return 開始タグ.filter((tag) => tag.startsWith("<text") && attributes.every((attribute) => tag.includes(attribute)))
      .filter((tag) => svg.slice(svg.indexOf(tag) + tag.length).startsWith(content)).length;
  }
  if (role.startsWith("tag:")) return svg.split(`<${role.slice("tag:".length)}`).length - 1;
  if (role.startsWith("contains:")) return svg.split(role.slice("contains:".length)).length - 1;
  if (role.startsWith("contains-list:")) return role.slice("contains-list:".length).split("|").reduce((count, text) => count + svg.split(text).length - 1, 0);
  if (role.startsWith("texts:")) return role.slice("texts:".length).split("|").reduce((count, text) => count + svg.split(`>${text}<`).length - 1, 0);
  return [...svg.matchAll(new RegExp(`data-cdl-role="${role}"`, "g"))].length;
};

describe("宅配の見本の形要素 (#2837)", () => {
  it("新しい 13 件を全て描ける", () => {
    expect(宅配の鍵.filter((鍵) => 図を引く(鍵) === undefined), "図が無い鍵").toEqual([]);
  });

  it("仕分け棚の最後の段は 6 月から 10 月までの見出しを順に描く", () => {
    const 図 = 図を引く("sortingShelfGantt");
    expect(図, "sortingShelfGantt が無い").toBeDefined();
    if (図 === undefined) throw new Error("sortingShelfGantt が無い");
    const 見出し = [...最後を描く(図).matchAll(/<text[^>]*data-cdl-role="gantt-tick"[^>]*>([^<]*)<\/text>/gu)]
      .map((一致) => 一致[1] ?? "");
    expect(見出し).toEqual(["6月", "7月", "8月", "9月", "10月"]);
  });

  it.each(形の要素たち)("$鍵: $要素", ({ 鍵, 見本の数, 今の数, role, 描ける, 理由, 下書き, 仮の役割名 }) => {
    const 図 = 図を引く(鍵);
    expect(図, `${鍵} が無い`).toBeDefined();
    if (図 === undefined) throw new Error(`${鍵} が無い`);
    const 実数 = roleの数(最後を描く(図), role, 図);
    expect(実数, `${鍵} の ${role} の現在数が変わった`).toBe(今の数);
    if (描ける) {
      expect(実数, `${鍵} の ${role}`).toBe(見本の数);
    } else {
      expect(理由, `${鍵} の描けない理由が無い`).toBeTruthy();
      expect(下書き, `${鍵} の課題下書きが無い`).toBeTruthy();
      expect(実数, `${role} が見本数へ揃ったので「描けない」宣言を外す`).not.toBe(見本の数);
      if (仮の役割名) expect(実数, `${role} は仮の役割名なので現在は 0 件`).toBe(0);
    }
  });
});
