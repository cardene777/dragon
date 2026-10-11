// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

import * as Charts from "@/topics/catalog/charts.cdl";
import * as Presets from "@/topics/catalog/presets.cdl";

import { 図の配色を変える } from "./palette-switch";

const 浮彫で中身を収める図 = {
  棒: Charts.branchParcelsBar,
  折れ線: Charts.monthlyDeliveriesLine,
  漏斗: Charts.orderToDeliveryFunnel,
  ガント: Charts.sortingShelfGantt,
  気持ちの道のり: Charts.shipperFeelingJourney,
  四象限: Charts.measureEffortQuadrant,
  半円: Charts.onTimeShareGauge,
  内訳の帯: Charts.deliveryResultStacked,
  傾き: Charts.onTimeRateSlope,
} as const satisfies Record<string, CdlDiagram>;

const 見本帳の14図 = {
  棒: Charts.branchParcelsBar,
  円: Charts.parcelStatusPie,
  漏斗: Charts.orderToDeliveryFunnel,
  四象限: Charts.measureEffortQuadrant,
  傾き: Charts.onTimeRateSlope,
  折れ線: Charts.monthlyDeliveriesLine,
  半円: Charts.onTimeShareGauge,
  升目: Charts.parcelSizeWaffle,
  ガント: Charts.sortingShelfGantt,
  気持ちの道のり: Charts.shipperFeelingJourney,
  内訳の帯: Charts.deliveryResultStacked,
  段の箱: Presets.presetDeliveryStages,
  路線図: Presets.presetDeliveryMetro,
  時間軸: Presets.presetDeliveryTimeline,
} as const satisfies Record<string, CdlDiagram>;

const 他の意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon"] as const;

function 描く(diagram: CdlDiagram): string {
  return renderToStaticMarkup(
    <CdlDiagramView diagram={diagram} hideHeader focusPhaseId={diagram.phases.at(-1)?.id} />,
  );
}

function 描いた文書(diagram: CdlDiagram): Document {
  return new JSDOM(描く(diagram)).window.document;
}

type はみ出し = { role: string; attribute: string; value: number; limit: number };

/**
 * 凹み面の原点へ移された中身の、数値で表せる端を調べる。
 * text は baseline に font-size の 30% を足し、日本語フォントの下端まで含める。
 */
function 凹み面からはみ出すもの(diagram: CdlDiagram): はみ出し[] {
  const dom = new JSDOM(描く(diagram));
  const inset = dom.window.document.querySelector('[data-cdl-role="figure-content-inset"]');
  if (!(inset instanceof dom.window.SVGElement)) throw new Error("凹み面が描かれていない");
  const width = Number(inset.getAttribute("width"));
  const height = Number(inset.getAttribute("height"));
  const transform = `translate(${inset.getAttribute("x")} ${inset.getAttribute("y")})`;
  const content = [...(inset.parentElement?.children ?? [])].find(
    (element) => element.tagName.toLowerCase() === "g" && element.getAttribute("transform") === transform,
  );
  if (!(content instanceof dom.window.SVGElement)) throw new Error("凹み面の中身が見つからない");

  const overflow: はみ出し[] = [];
  const push = (element: Element, attribute: string, value: number, limit: number): void => {
    if (value < -0.001 || value > limit + 0.001) {
      overflow.push({
        role: element.getAttribute("data-cdl-role") ?? element.tagName.toLowerCase(),
        attribute,
        value,
        limit,
      });
    }
  };
  const number = (element: Element, attribute: string): number | undefined => {
    const value = element.getAttribute(attribute);
    return value === null ? undefined : Number(value);
  };

  for (const element of content.querySelectorAll("rect, path, circle, line, text")) {
    for (const attribute of ["x", "cx", "x1", "x2"] as const) {
      const value = number(element, attribute);
      if (value !== undefined) push(element, attribute, value, width);
    }
    for (const attribute of ["y", "cy", "y1", "y2"] as const) {
      const value = number(element, attribute);
      if (value !== undefined) push(element, attribute, value, height);
    }

    const x = number(element, "x");
    const y = number(element, "y");
    const elementWidth = number(element, "width");
    const elementHeight = number(element, "height");
    if (x !== undefined && elementWidth !== undefined) push(element, "x + width", x + elementWidth, width);
    if (y !== undefined && elementHeight !== undefined) push(element, "y + height", y + elementHeight, height);

    const cx = number(element, "cx");
    const cy = number(element, "cy");
    const radius = number(element, "r");
    if (cx !== undefined && radius !== undefined) {
      push(element, "cx - r", cx - radius, width);
      push(element, "cx + r", cx + radius, width);
    }
    if (cy !== undefined && radius !== undefined) {
      push(element, "cy - r", cy - radius, height);
      push(element, "cy + r", cy + radius, height);
    }

    if (element.tagName.toLowerCase() === "text" && y !== undefined) {
      const fontSize = number(element, "font-size") ?? 16;
      push(element, "text bottom", y + fontSize * 0.3, height);
      push(element, "text top", y - fontSize, height);
    }
  }
  return overflow;
}

describe("浮彫の凹み面へ中身を収める (#2854)", () => {
  it("見本の凹み面から導いた配置を使い、棒の並びは round 8 を保つ", () => {
    const stacked = 描いた文書(図の配色を変える(Charts.deliveryResultStacked, "relief"));
    const rate = [...stacked.querySelectorAll('[data-cdl-role="chart-stacked-bar-rate"]')]
      .find((element) => element.textContent === "19%");
    const slices = [...(rate?.parentElement?.querySelectorAll('[data-cdl-role="chart-stacked-bar-slice"]') ?? [])];
    const barEnd = Math.max(...slices.map((element) =>
      Number(element.getAttribute("x")) + Number(element.getAttribute("width"))));
    expect(Number(rate?.getAttribute("x")) - barEnd).toBeCloseTo(62.56, 10);
    expect(62.56 - 26.56).toBe(36);

    const line = 描いた文書(図の配色を変える(Charts.monthlyDeliveriesLine, "relief"));
    const monthY = [...line.querySelectorAll('[data-cdl-role="chart-line-label"]')]
      .map((element) => Number(element.getAttribute("y")));
    expect(new Set(monthY)).toEqual(new Set([343.988]));
    expect(355.988 - monthY[0]!).toBe(12);

    const quadrant = 描いた文書(図の配色を変える(Charts.measureEffortQuadrant, "relief"));
    const night = [...quadrant.querySelectorAll('[data-cdl-role="quadrant-point-label"]')]
      .find((element) => element.textContent === "夜の便");
    expect(Number(night?.getAttribute("x"))).toBeCloseTo(327.96284, 8);
    expect(337.08284 - Number(night?.getAttribute("x"))).toBeCloseTo(9.12, 8);

    const bar = 描いた文書(図の配色を変える(Charts.branchParcelsBar, "relief"));
    const labels = Object.fromEntries(
      [...bar.querySelectorAll('[data-cdl-role="chart-bar-label"]')]
        .map((element) => [element.textContent, Number(element.getAttribute("x"))]),
    );
    expect(labels).toMatchObject({
      東京: 178.68533333333335,
      名古屋: 455,
      福岡: 593.1573333333333,
      札幌: 731.3146666666667,
    });
  });

  it("holdsContent を持つ 9 図で字・線・点・棒・帯の端が凹み面の内側にある", () => {
    for (const [name, diagram] of Object.entries(浮彫で中身を収める図)) {
      expect(凹み面からはみ出すもの(図の配色を変える(diagram, "relief")), name).toEqual([]);
    }
  });

  it("気持ちの道のりは凹み面でも縮めず、見本の字・段間・主線・点を保つ", () => {
    const document = 描いた文書(図の配色を変える(Charts.shipperFeelingJourney, "relief"));
    const inset = document.querySelector('[data-cdl-role="figure-content-inset"]');
    const levels = [...document.querySelectorAll('[data-cdl-role="journey-level-name"]')];
    const rules = [...document.querySelectorAll('[data-cdl-role="journey-level-rule"]')];
    const actors = [...document.querySelectorAll('[data-cdl-role="journey-step"] > text')];
    const points = [...document.querySelectorAll('[data-cdl-role="journey-step"] > circle:first-of-type')];
    const line = document.querySelector('[data-cdl-role="journey-line"]');
    const note = document.querySelector('[data-cdl-role="journey-opportunity"] > text');

    expect(inset?.getAttribute("height"), "384 - 見出し 61 - 足 36").toBe("287");
    expect(levels.map((element) => element.getAttribute("font-size"))).toEqual(
      Array.from({ length: 5 }, () => "19"),
    );
    expect(actors.map((element) => element.getAttribute("font-size"))).toEqual(
      Array.from({ length: 6 }, () => "20"),
    );
    expect(note?.getAttribute("font-size")).toBe("18");
    const ruleY = rules.map((element) => Number(element.getAttribute("y1")));
    for (const [index, y] of ruleY.slice(1).entries()) {
      expect(y - ruleY[index]!).toBeCloseTo(40, 10);
    }
    expect(line?.getAttribute("stroke-width")).toBe("5");
    expect(points.map((element) => element.getAttribute("stroke-width"))).toEqual(
      Array.from({ length: 6 }, () => "3.5"),
    );
    expect(points.map((element) => element.getAttribute("stroke"))).toEqual(
      Array.from({ length: 6 }, () => line?.getAttribute("stroke")),
    );
  });

  it("折れ線の round 8 の periodY なら月の字の下端を検出する", () => {
    const relief = structuredClone(図の配色を変える(Charts.monthlyDeliveriesLine, "relief"));
    if (relief.nodes[0]?.chartLineSize !== undefined) relief.nodes[0].chartLineSize.periodY = 355.988;
    expect(凹み面からはみ出すもの(relief)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "chart-line-label", attribute: "text bottom" }),
      ]),
    );
  });

  it("14 図 × 他の 6 意匠は浮彫を経由しても描画 SVG が 1 文字も変わらない", () => {
    let compared = 0;
    for (const [name, diagram] of Object.entries(見本帳の14図)) {
      const relief = 図の配色を変える(diagram, "relief");
      for (const palette of 他の意匠) {
        const direct = 描く(図の配色を変える(diagram, palette));
        const afterRelief = 描く(図の配色を変える(relief, palette));
        expect(afterRelief, `${name}/${palette}`).toBe(direct);
        compared += 1;
      }
    }
    expect(compared).toBe(84);
  });
});
