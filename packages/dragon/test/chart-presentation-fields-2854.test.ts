import type { CdlDiagram } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";

import { jsonToDiagram, textDslToDiagram } from "../src";

type 図の節 = CdlDiagram["nodes"][number];

const YAMLの節 = (body: string): 図の節 => textDslToDiagram(body).nodes[0]!;
const JSONの節 = (body: Record<string, unknown>): 図の節 =>
  jsonToDiagram({ title: "T", flow: [], ...body }).nodes[0]!;

describe("#2854 3段目b の図表の欄", () => {
  it("折れ線の2系列と沈んだ系列を飛ばす指定を YAML / JSON から渡す", () => {
    const series = [
      {
        label: "計画",
        points: [
          { label: "6月", value: 900 },
          { label: "10月", value: 1600 },
        ],
        dash: "dotted",
        marker: "none",
        valueIndexes: [1],
      },
      {
        points: [
          { label: "6月", value: 820 },
          { label: "10月", value: 1510 },
        ],
        marker: "hollow",
        valueIndexes: [0, 1],
      },
    ];
    const yaml = YAMLの節(`title: "T"
type: chart
shape: line
chartLineSeries: ${JSON.stringify(series)}
chartSeriesSkipMuted: true
actors:
  - 6月: "820"
`);
    const json = JSONの節({
      type: "chart",
      shape: "line",
      chartLineSeries: series,
      chartSeriesSkipMuted: true,
      actors: [{ name: "6月", value: "820" }],
    });

    for (const node of [yaml, json]) {
      expect(node.chartLineSeries).toEqual(series);
      expect(node.chartSeriesSkipMuted).toBe(true);
    }
  });

  it("円の中心ラベル・2列の表・細い輪を YAML / JSON から渡す", () => {
    const yaml = YAMLの節(`title: "T"
type: chart
shape: pie
form: table
chartPieCenterLabel: "件"
chartPieTableColumns: value
chartPieRingWidth: thin
actors:
  - 完了: { value: "10", tone: muted }
`);
    const json = JSONの節({
      type: "chart",
      shape: "pie",
      form: "table",
      chartPieCenterLabel: "件",
      chartPieTableColumns: "value",
      chartPieRingWidth: "thin",
      actors: [{ name: "完了", value: "10", tone: "muted" }],
    });

    for (const node of [yaml, json]) {
      expect(node).toMatchObject({
        chartPieCenterLabel: "件",
        chartPieTableColumns: "value",
        chartPieRingWidth: "thin",
      });
      expect(node.chartData?.[0]?.tone).toBe("muted");
    }
  });

  it("漏斗の比例棒・通過率・段の tone / emphasis を YAML / JSON から渡す", () => {
    const yaml = YAMLの節(`title: "T"
type: funnel
funnelForm: proportional-bars
funnelRate: conversion
chartSeriesSkipMuted: true
actors:
  - 見た: { value: "12000", tone: muted }
  - 届いた: { value: "2740", emphasis: primary }
`);
    const json = JSONの節({
      type: "funnel",
      funnelForm: "proportional-bars",
      funnelRate: "conversion",
      chartSeriesSkipMuted: true,
      actors: [
        { name: "見た", value: "12000", tone: "muted" },
        { name: "届いた", value: "2740", emphasis: "primary" },
      ],
    });

    for (const node of [yaml, json]) {
      expect(node).toMatchObject({
        funnelForm: "proportional-bars",
        funnelRate: "conversion",
        chartSeriesSkipMuted: true,
      });
      expect(node.funnelData?.[0]?.tone).toBe("muted");
      expect(node.funnelData?.[1]?.emphasis).toBe("primary");
    }
  });

  it("四象限の方向形の軸名と右側の点名を YAML / JSON から渡す", () => {
    const yaml = YAMLの節(`title: "T"
type: quadrant
quadrantPointLabelSide: right
axes:
  x: { label: "手間", direction: true }
  y: { label: "効き目", direction: true }
actors:
  - A: { value: "左上", at: [0.2, 0.8] }
`);
    const json = JSONの節({
      type: "quadrant",
      quadrantPointLabelSide: "right",
      axes: {
        x: { label: "手間", direction: true },
        y: { label: "効き目", direction: true },
      },
      actors: [{ name: "A", value: "左上", at: [0.2, 0.8] }],
    });

    for (const node of [yaml, json]) {
      expect(node.quadrantPointLabelSide).toBe("right");
      expect(node.quadrantData?.xAxis).toEqual({ label: "手間", direction: true });
      expect(node.quadrantData?.yAxis).toEqual({ label: "効き目", direction: true });
    }
  });

  it("升目の右の一覧を YAML / JSON から渡す", () => {
    const yaml = YAMLの節(`title: "T"
type: chart
shape: waffle
chartWaffleLegendPosition: right
actors:
  - 大きい: { value: "17", tone: muted }
`);
    const json = JSONの節({
      type: "chart",
      shape: "waffle",
      chartWaffleLegendPosition: "right",
      actors: [{ name: "大きい", value: "17", tone: "muted" }],
    });

    for (const node of [yaml, json]) {
      expect(node.chartWaffleLegendPosition).toBe("right");
      expect(node.chartData?.[0]?.tone).toBe("muted");
    }
  });

  it("内訳の5期間・率・上の凡例と系列の id / emphasis を YAML / JSON から渡す", () => {
    const periods = [
      { label: "6月", values: [79, 19, 2] },
      { label: "7月", values: [81, 17, 2] },
      { label: "8月", values: [77, 21, 2] },
      { label: "9月", values: [83, 16, 1] },
      { label: "10月", values: [86, 13, 1] },
    ];
    const yaml = YAMLの節(`title: "T"
type: chart
shape: stacked
chartStackedPeriods: ${JSON.stringify(periods)}
chartStackedRateId: "再配達"
chartStackedLegendPosition: top
chartSeriesSkipMuted: true
actors:
  - 一度で届いた: { value: "86", tone: muted }
  - 再配達: { value: "13", emphasis: primary }
  - 戻った: "1"
`);
    const json = JSONの節({
      type: "chart",
      shape: "stacked",
      chartStackedPeriods: periods,
      chartStackedRateId: "再配達",
      chartStackedLegendPosition: "top",
      chartSeriesSkipMuted: true,
      actors: [
        { name: "一度で届いた", value: "86", tone: "muted" },
        { name: "再配達", value: "13", emphasis: "primary" },
        { name: "戻った", value: "1" },
      ],
    });

    for (const node of [yaml, json]) {
      expect(node.chartStackedPeriods).toEqual(periods);
      expect(node.chartStackedRateId).toBe("再配達");
      expect(node.chartStackedLegendPosition).toBe("top");
      expect(node.chartSeriesSkipMuted).toBe(true);
      expect(node.chartData?.[1]).toMatchObject({ id: "再配達", emphasis: "primary" });
    }
  });

  it("傾き図の時点名・主役・単位と datum id を YAML / JSON から渡す", () => {
    const yaml = YAMLの節(`title: "T"
type: chart
shape: slope
chartSlopePeriods: ["先月", "今月"]
chartSlopeEmphasisIds: ["大阪", "名古屋"]
chartSlopeUnit: "%"
actors:
  - 名古屋: { value: "85", previous: "79" }
  - 大阪: { value: "80", previous: "86" }
`);
    const json = JSONの節({
      type: "chart",
      shape: "slope",
      chartSlopePeriods: ["先月", "今月"],
      chartSlopeEmphasisIds: ["大阪", "名古屋"],
      chartSlopeUnit: "%",
      actors: [
        { name: "名古屋", value: "85", previous: "79" },
        { name: "大阪", value: "80", previous: "86" },
      ],
    });

    for (const node of [yaml, json]) {
      expect(node.chartSlopePeriods).toEqual(["先月", "今月"]);
      expect(node.chartSlopeEmphasisIds).toEqual(["大阪", "名古屋"]);
      expect(node.chartSlopeUnit).toBe("%");
      expect(node.chartData?.map((datum) => datum.id)).toEqual(["名古屋", "大阪"]);
    }
  });

  it("半円の固定の尺を YAML / JSON から渡す", () => {
    const gauge = { max: 100, current: 78, target: 80, previous: 72, previousLabel: "先月" };
    const yaml = YAMLの節(`title: "T"
type: chart
shape: gauge
chartGaugeValue: ${JSON.stringify(gauge)}
actors:
  - 遅れた: { value: "22", tone: muted }
`);
    const json = JSONの節({
      type: "chart",
      shape: "gauge",
      chartGaugeValue: gauge,
      actors: [{ name: "遅れた", value: "22", tone: "muted" }],
    });

    for (const node of [yaml, json]) {
      expect(node.chartGaugeValue).toEqual(gauge);
      expect(node.chartData?.[0]?.tone).toBe("muted");
    }
  });
});
