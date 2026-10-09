import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, computeStateValues, layout, type CdlDiagram } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";
import * as Charts from "@/topics/catalog/charts.cdl";

const cards = {
  branchParcelsBar: { label: "棒 / 今月", note: "単位 件" },
  monthlyDeliveriesLine: { label: "折れ線", note: "計画 と 実績" },
  parcelStatusPie: { label: "内訳", note: "合計 1,284 件" },
  sortingShelfGantt: { label: "ガント", note: "色の付いた棒が遅れると本番も遅れる" },
  shipperFeelingJourney: { label: "ジャーニー", note: "最高 から 怒り の 5 段" },
  orderToDeliveryFunnel: { label: "漏斗 / 先月", note: "件" },
  measureEffortQuadrant: { label: "四象限", note: "左上から手を付ける" },
  onTimeRateSlope: { label: "傾き", note: "先月 → 今月" },
  onTimeShareGauge: { label: "半円", note: "目標 80%" },
  parcelSizeWaffle: { label: "升目", note: "1 マス = 1%" },
  deliveryResultStacked: { label: "内訳の帯 / 月ごと", note: "%" },
} as const;

const chart = (key: keyof typeof cards): CdlDiagram => Charts[key];
const node = (diagram: CdlDiagram) => diagram.nodes[0]!;
const render = (diagram: CdlDiagram, 最後 = false) => {
  if (!最後) return renderToStaticMarkup(<CdlDiagramView diagram={diagram} hideHeader />);
  const 配置済み = layout(diagram);
  const 最後の値 = computeStateValues(配置済み, Math.max(0, 配置済み.phases.length - 1), 1);
  const 静止図: CdlDiagram = {
    ...diagram,
    states: (diagram.states ?? []).map((state) => ({
      ...state,
      initial: 最後の値[state.id] ?? state.initial,
    })),
    phases: [{ id: "最後", duration: 1, title: "最後", body: "", activate: [], tweens: [], sets: [] }],
  };
  return renderToStaticMarkup(<CdlDiagramView diagram={layout(静止図)} hideHeader />);
};

const 数の属性 = (tag: string, name: string): number => {
  const value = new RegExp(`${name}="([^"]+)"`, "u").exec(tag)?.[1];
  if (value === undefined) throw new Error(`${name} 属性が無い: ${tag}`);
  return Number(value);
};

describe("宅配の見本へ 3 段目 c の値を当てる (#2854)", () => {
  it("図表・数・工程の 11 図が見出し帯と見本どおりの足を持つ", () => {
    for (const [key, expected] of Object.entries(cards) as [keyof typeof cards, (typeof cards)[keyof typeof cards]][]) {
      const diagram = chart(key);
      expect(node(diagram).figureCard, key).toEqual(expected);
      const markup = render(diagram);
      expect(markup, `${key}: figure-footer`).toContain('data-cdl-role="figure-footer"');
      expect(markup, `${key}: label`).toContain(`>${expected.label}<`);
      expect(markup, `${key}: note`).toContain(`>${expected.note}<`);
    }
  });

  it("木は同じ枠・段ごとの枝色・6 本の三角矢じりを使う", () => {
    const diagram = Charts.deliveryOfficeTree;
    expect(node(diagram)).toMatchObject({
      treeNodeForm: "frame",
      treeEdgeTone: "depth",
      treeEdgeHead: "triangle",
      w: 1712,
      h: 416,
    });
    const markup = render(diagram, true);
    const edges = (markup.match(/<[^>]+>/gu) ?? [])
      .filter((tag) => tag.includes('data-cdl-role="tree-edge"'));
    expect(edges.filter((tag) => tag.includes("marker-end="))).toHaveLength(6);
    const strokes = edges
      .map((tag) => /stroke="([^"]+)"/u.exec(tag)?.[1])
      .filter((stroke): stroke is string => stroke !== undefined);
    expect(new Set(strokes).size).toBe(2);
  });

  it("放射を outline で描く", () => {
    const diagram = Charts.redeliveryIdeasMind;
    expect(node(diagram).mindForm).toBe("outline");
    expect(render(diagram)).toContain('data-cdl-mind-form="outline"');
  });

  it("ジャーニーは 5 段名・直線・罫と、谷の点の下に全文の注記を持つ", () => {
    const diagram = Charts.shipperFeelingJourney;
    expect(node(diagram)).toMatchObject({
      journeyForm: "rules",
      journeyLineForm: "straight",
      journeyLabels: {
        delighted: "最高",
        happy: "満足",
        neutral: "普通",
        frustrated: "不満",
        angry: "怒り",
      },
      w: 1712,
      h: 384,
    });
    const opportunity = node(diagram).journeyData?.find((item) => item.opportunity !== undefined);
    expect(opportunity).toMatchObject({
      opportunity: "不在票に気づかなかった",
      opportunityPosition: "below-point",
    });
    const markup = render(diagram, true);
    expect(markup).toContain("不在票に気づかなかった");
    expect(markup).toContain('data-cdl-role="journey-opportunity"');
  });

  it("谷の注記は点と同じ横位置で中心から 34 下に置く", () => {
    const diagram = Charts.shipperFeelingJourney;
    const opportunityIndex = node(diagram).journeyData?.findIndex(
      (item) => item.opportunity === "不在票に気づかなかった",
    ) ?? -1;
    expect(opportunityIndex).toBeGreaterThanOrEqual(0);

    const markup = render(diagram, true);
    const pointTags = markup.match(/<circle[^>]*r="9"[^>]*>/gu) ?? [];
    const pointTag = pointTags[opportunityIndex];
    if (pointTag === undefined) throw new Error("谷の点が無い");
    const annotationTag = /(<text[^>]*>)不在票に気づかなかった<\/text>/u.exec(markup)?.[1];
    if (annotationTag === undefined) throw new Error("谷の注記が無い");

    expect(数の属性(annotationTag, "x"), "注記の中心 x").toBe(数の属性(pointTag, "cx"));
    expect(数の属性(annotationTag, "y"), "注記の中心からの y 差")
      .toBe(数の属性(pointTag, "cy") + 34);
  });

  it("見本帳だけが 16 の倍数の横長／低い札を指定する", () => {
    const journey = node(Charts.shipperFeelingJourney);
    const tree = node(Charts.deliveryOfficeTree);
    expect([journey.w, journey.h, tree.w, tree.h].every((value) => typeof value === "number" && value % 16 === 0)).toBe(true);
    expect(journey.w).toBeGreaterThan(journey.h ?? 0);
    expect(tree.h).toBeLessThan(480);
  });
});
