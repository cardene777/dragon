// @vitest-environment jsdom

import { CdlDiagramView, layout, type CdlDiagram } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as Charts from "@/topics/catalog/charts.cdl";

import { 図の配色を変える } from "./palette-switch";

const 浮彫でも図表寸法を保つ4図 = {
  月ごとの配達数: Charts.monthlyDeliveriesLine,
  打ち手の手間と効き目: Charts.measureEffortQuadrant,
  配達の結果: Charts.deliveryResultStacked,
  営業所ごとの定時率: Charts.onTimeRateSlope,
} as const satisfies Record<string, CdlDiagram>;

function 図表の骨組み(diagram: CdlDiagram): object {
  const node = layout(diagram).nodes[0];
  if (node === undefined) throw new Error("図表の節が無い");
  return {
    cx: node.cx,
    cy: node.cy,
    w: node.w,
    h: node.h,
    chartLineSize: node.chartLineSize,
    chartSlopeSize: node.chartSlopeSize,
    chartStackedLayout: node.chartStackedLayout,
    quadrantSize: node.quadrantSize,
  };
}

function 描いた文書(diagram: CdlDiagram): Document {
  const markup = renderToStaticMarkup(
    <CdlDiagramView diagram={diagram} hideHeader focusPhaseId={diagram.phases.at(-1)?.id} />,
  );
  return new JSDOM(markup).window.document;
}

describe("浮彫の凹み面は図表を動かさない飾りにする (#2908)", () => {
  it("対象4図は浮彫でも図面と同じ位置・大きさを保つ", () => {
    for (const [name, diagram] of Object.entries(浮彫でも図表寸法を保つ4図)) {
      expect(
        図表の骨組み(図の配色を変える(diagram, "relief")),
        name,
      ).toEqual(図表の骨組み(図の配色を変える(diagram, "blueprint")));
    }
  });

  it("対象4図は凹み面を描くが、中身を凹み面の原点へ移さない", () => {
    for (const [name, diagram] of Object.entries(浮彫でも図表寸法を保つ4図)) {
      const relief = 図の配色を変える(diagram, "relief");
      expect(relief, name).not.toHaveProperty("figureInsetByTheme");
      expect(relief.nodes[0]?.figureInset, name).not.toHaveProperty("holdsContent");

      const document = 描いた文書(relief);
      const inset = document.querySelector('[data-cdl-role="figure-content-inset"]');
      expect(inset, `${name}: 凹み面`).not.toBeNull();
      const contentTransform = `translate(${inset?.getAttribute("x")} ${inset?.getAttribute("y")})`;
      const moved = [...(inset?.parentElement?.children ?? [])].some(
        (element) => element.tagName.toLowerCase() === "g" && element.getAttribute("transform") === contentTransform,
      );
      expect(moved, `${name}: 凹み面に合わせた中身の移動`).toBe(false);

      const content = document.querySelector('[data-cdl-role^="chart-"], [data-cdl-role^="quadrant-"]');
      expect(content, `${name}: 図表`).not.toBeNull();
      const following = document.defaultView?.Node.DOCUMENT_POSITION_FOLLOWING ?? 4;
      expect(
        inset !== null && content !== null && (inset.compareDocumentPosition(content) & following) !== 0,
        `${name}: 凹み面より後ろに図表を描く`,
      ).toBe(true);
    }
  });
});
