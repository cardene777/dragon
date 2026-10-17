// @vitest-environment jsdom

import { CdlDiagramView, layout, type CdlDiagram } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as Charts from "@/topics/catalog/charts.cdl";

import { 図の配色を変える } from "./palette-switch";
import { 字幅 } from "./text-width-estimate";

const 浮彫でも図表寸法を保つ4図 = {
  月ごとの配達数: Charts.monthlyDeliveriesLine,
  打ち手の手間と効き目: Charts.measureEffortQuadrant,
  配達の結果: Charts.deliveryResultStacked,
  営業所ごとの定時率: Charts.onTimeRateSlope,
} as const satisfies Record<string, CdlDiagram>;

const 図表札の頭 = 61;
const 図表札の足 = 36;
const 必要な余白 = 6;

type 外接 = { left: number; top: number; right: number; bottom: number };

function 数(element: Element, name: string): number | undefined {
  const value = element.getAttribute(name);
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function 回す(bounds: 外接, transform: string | null): 外接 {
  const match = transform?.match(/rotate\((-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\)/u);
  if (match === null || match === undefined) return bounds;
  const angle = Number(match[1]) * Math.PI / 180;
  const cx = Number(match[2]);
  const cy = Number(match[3]);
  const corners: ReadonlyArray<readonly [number, number]> = [
    [bounds.left, bounds.top],
    [bounds.right, bounds.top],
    [bounds.right, bounds.bottom],
    [bounds.left, bounds.bottom],
  ];
  const points = corners.map(([x, y]) => ({
    x: cx + (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle),
    y: cy + (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle),
  }));
  return {
    left: Math.min(...points.map((point) => point.x)),
    top: Math.min(...points.map((point) => point.y)),
    right: Math.max(...points.map((point) => point.x)),
    bottom: Math.max(...points.map((point) => point.y)),
  };
}

function 要素の外接(element: Element): 外接 | undefined {
  const tag = element.tagName.toLowerCase();
  if (tag === "text") {
    const x = 数(element, "x");
    const y = 数(element, "y");
    const fontSize = 数(element, "font-size");
    if (x === undefined || y === undefined || fontSize === undefined) return undefined;
    const width = 字幅(element.textContent ?? "", fontSize);
    const anchor = element.getAttribute("text-anchor");
    const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
    return 回す({ left, top: y - fontSize, right: left + width, bottom: y + fontSize * 0.25 }, element.getAttribute("transform"));
  }

  const stroke = (数(element, "stroke-width") ?? 0) / 2;
  if (tag === "circle" || tag === "ellipse") {
    const cx = 数(element, "cx");
    const cy = 数(element, "cy");
    const rx = tag === "circle" ? 数(element, "r") : 数(element, "rx");
    const ry = tag === "circle" ? 数(element, "r") : 数(element, "ry");
    if (cx === undefined || cy === undefined || rx === undefined || ry === undefined) return undefined;
    return { left: cx - rx - stroke, top: cy - ry - stroke, right: cx + rx + stroke, bottom: cy + ry + stroke };
  }

  if (tag === "line") {
    const x1 = 数(element, "x1");
    const y1 = 数(element, "y1");
    const x2 = 数(element, "x2");
    const y2 = 数(element, "y2");
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return undefined;
    return {
      left: Math.min(x1, x2) - stroke,
      top: Math.min(y1, y2) - stroke,
      right: Math.max(x1, x2) + stroke,
      bottom: Math.max(y1, y2) + stroke,
    };
  }

  if (tag === "polyline") {
    const values = element.getAttribute("points")?.match(/-?(?:\d+\.?\d*|\.\d+)/gu)?.map(Number) ?? [];
    const xs = values.filter((_, index) => index % 2 === 0);
    const ys = values.filter((_, index) => index % 2 === 1);
    if (xs.length === 0 || ys.length === 0) return undefined;
    return {
      left: Math.min(...xs) - stroke,
      top: Math.min(...ys) - stroke,
      right: Math.max(...xs) + stroke,
      bottom: Math.max(...ys) + stroke,
    };
  }

  const x = 数(element, "x");
  const y = 数(element, "y");
  const width = 数(element, "width");
  const height = 数(element, "height");
  if (x === undefined || y === undefined || width === undefined || height === undefined) return undefined;
  return { left: x - stroke, top: y - stroke, right: x + width + stroke, bottom: y + height + stroke };
}

function 図表の外接(document: Document): 外接 {
  const drawable = new Set<Element>();
  for (const root of document.querySelectorAll('[data-cdl-role^="chart-"], [data-cdl-role^="quadrant-"]')) {
    if (["text", "rect", "path", "line", "circle", "ellipse", "polyline"].includes(root.tagName.toLowerCase())) {
      drawable.add(root);
    } else {
      for (const element of root.querySelectorAll("text, rect, path, line, circle, ellipse, polyline")) {
        drawable.add(element);
      }
    }
  }
  const bounds = [...drawable].flatMap((element) => {
    const value = 要素の外接(element);
    return value === undefined ? [] : [value];
  });
  if (bounds.length === 0) throw new Error("図表の外接を測る要素が無い");
  return {
    left: Math.min(...bounds.map((value) => value.left)),
    top: Math.min(...bounds.map((value) => value.top)),
    right: Math.max(...bounds.map((value) => value.right)),
    bottom: Math.max(...bounds.map((value) => value.bottom)),
  };
}

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

      const content = document.querySelector('[data-cdl-role^="chart-"], [data-cdl-role^="quadrant-"]');
      expect(content, `${name}: 図表`).not.toBeNull();
      const node = layout(relief).nodes[0];
      if (node === undefined) throw new Error(`${name}: 図表の節が無い`);
      const contentTransform = `translate(${node.cx - node.w / 2} ${node.cy - node.h / 2 + 図表札の頭})`;
      const contentGroup = content?.closest("g[transform]");
      expect(contentGroup?.getAttribute("transform"), `${name}: 共通の図表原点`).toBe(contentTransform);
      const following = document.defaultView?.Node.DOCUMENT_POSITION_FOLLOWING ?? 4;
      expect(
        inset !== null && content !== null && (inset.compareDocumentPosition(content) & following) !== 0,
        `${name}: 凹み面より後ろに図表を描く`,
      ).toBe(true);
    }
  });

  it("対象4図の図表と札は凹み面の内側へ6以上の余白で収まる", () => {
    for (const [name, diagram] of Object.entries(浮彫でも図表寸法を保つ4図)) {
      const relief = 図の配色を変える(diagram, "relief");
      const node = layout(relief).nodes[0];
      if (node === undefined) throw new Error(`${name}: 図表の節が無い`);
      expect(node.figureInset, name).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });

      const bounds = 図表の外接(描いた文書(relief));
      const surface = {
        left: node.figureInset?.left ?? 18,
        top: node.figureInset?.top ?? 4,
        right: node.w - (node.figureInset?.right ?? 18),
        bottom: node.h - 図表札の頭 - 図表札の足 - (node.figureInset?.bottom ?? 8),
      };
      const margins = [
        bounds.left - surface.left,
        bounds.top - surface.top,
        surface.right - bounds.right,
        surface.bottom - bounds.bottom,
      ];
      expect(Math.min(...margins), `${name}: 凹み面の内側の余白 ${margins.join(", ")}`).toBeGreaterThanOrEqual(必要な余白);
    }
  });
});
