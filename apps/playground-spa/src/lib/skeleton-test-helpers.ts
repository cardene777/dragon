import { CdlDiagramView, type CdlDiagram, type LaidDiagram } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export const 骨組みの許容差 = 0.01;

export type 骨組みの数値表 = Record<string, number>;

function 数値属性(element: Element, name: string): number {
  const value = element.getAttribute(name);
  if (value === null) throw new Error(`${element.tagName} に ${name} が無い`);
  return Number(value);
}

function 線の経路点を入れる(値: 骨組みの数値表, prefix: string, d: string): void {
  const numbers = d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/giu)?.map(Number) ?? [];
  for (let index = 0; index < numbers.length; index += 2) {
    値[`${prefix}.point[${index / 2}].x`] = numbers[index]!;
    if (numbers[index + 1] !== undefined) 値[`${prefix}.point[${index / 2}].y`] = numbers[index + 1]!;
  }
}

function 段の見出しを入れる(値: 骨組みの数値表, diagram: CdlDiagram, laid: LaidDiagram): void {
  if (!laid.lanes.some((lane) => lane.stage !== undefined)) return;

  const markup = renderToStaticMarkup(
    createElement(CdlDiagramView, { diagram, laid, hideHeader: true }),
  );
  const document = new JSDOM(markup, { contentType: "image/svg+xml" }).window.document;
  for (const lane of document.querySelectorAll("[data-cdl-lane]")) {
    const id = lane.getAttribute("data-cdl-lane");
    const column = lane.querySelector('[data-cdl-role="stage-column"]');
    const number = lane.querySelector('[data-cdl-role="stage-number"]');
    const name = lane.querySelector('[data-cdl-role="stage-name"]');
    const divider = lane.querySelector('[data-cdl-role="stage-divider"]');
    if (id === null || column === null || number === null || name === null || divider === null) continue;

    const prefix = `header.${id}`;
    for (const [part, element, attributes] of [
      ["column", column, ["x", "y", "width", "height"]],
      ["number", number, ["x", "y", "font-size"]],
      ["name", name, ["x", "y", "font-size"]],
      ["divider", divider, ["x1", "y1", "x2", "y2"]],
    ] as const) {
      for (const attribute of attributes) {
        値[`${prefix}.${part}.${attribute}`] = 数値属性(element, attribute);
      }
    }
  }
}

export function 骨組みを測る(diagram: CdlDiagram, laid: LaidDiagram): 骨組みの数値表 {
  const 値: 骨組みの数値表 = {
    "frame.x": laid.viewBox.x,
    "frame.y": laid.viewBox.y,
    "frame.width": laid.viewBox.w,
    "frame.height": laid.viewBox.h,
  };

  for (const node of laid.nodes) {
    const prefix = `box.${node.id}`;
    値[`${prefix}.x`] = node.cx - node.w / 2;
    値[`${prefix}.y`] = node.cy - node.h / 2;
    値[`${prefix}.width`] = node.w;
    値[`${prefix}.height`] = node.h;
    if (node.chartLineSize?.periodY !== undefined) {
      値[`figure.${node.id}.line.periodY`] = node.chartLineSize.periodY;
    }
    if (node.chartSlopeSize?.axisGap !== undefined) {
      値[`figure.${node.id}.slope.axisGap`] = node.chartSlopeSize.axisGap;
    }
    if (node.chartStackedLayout?.barWidth !== undefined) {
      値[`figure.${node.id}.stacked.barWidth`] = node.chartStackedLayout.barWidth;
    }
    if (node.quadrantSize?.plotSize !== undefined) {
      値[`figure.${node.id}.quadrant.plotSize`] = node.quadrantSize.plotSize;
    }
  }

  const labelBoxes = new Map(
    laid.bboxes
      .filter((box) => box.kind === "edge-label")
      .map((box) => [box.id, box] as const),
  );
  for (const edge of laid.edges) {
    const prefix = `line.${edge.id}`;
    線の経路点を入れる(値, prefix, edge.d);
    const label = labelBoxes.get(edge.id);
    if (label === undefined) continue;
    値[`label.${edge.id}.x`] = label.x;
    値[`label.${edge.id}.y`] = label.y;
    値[`label.${edge.id}.width`] = label.w;
    値[`label.${edge.id}.height`] = label.h;
  }

  段の見出しを入れる(値, diagram, laid);
  return 値;
}

export function 骨組みの差(
  id: string,
  palette: string,
  基準: 骨組みの数値表,
  対象: 骨組みの数値表,
): string[] {
  const keys = new Set([...Object.keys(基準), ...Object.keys(対象)]);
  return [...keys].flatMap((key) => {
    const expected = 基準[key];
    const actual = 対象[key];
    if (expected === undefined || actual === undefined) {
      return [`${id} / ${palette} / ${key}: ${expected ?? "無し"} -> ${actual ?? "無し"} (差: 比較不能)`];
    }
    const delta = actual - expected;
    return Math.abs(delta) <= 骨組みの許容差
      ? []
      : [`${id} / ${palette} / ${key}: ${expected} -> ${actual} (差: ${delta})`];
  });
}
