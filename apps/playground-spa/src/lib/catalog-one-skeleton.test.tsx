// @vitest-environment jsdom

import {
  CdlDiagramView,
  layout,
  predictLabelBBoxWorld,
  type CdlDiagram,
  type LaidDiagram,
} from "@cardenelabs/cdl";
import { THEMES } from "@cardenelabs/dragon";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";
import { カタログの図を組む } from "./catalog-layout";
import { 図の配色を変える, 画面の色, type 配色 } from "./palette-switch";

const 許容差 = 0.01;
const 比べる配色 = [...THEMES, 画面の色] as const satisfies readonly 配色[];

type 数値表 = Record<string, number>;

type 見本 = {
  id: string;
  diagram: CdlDiagram;
};

function 項目の見本(item: CatalogItem): 見本[] {
  if (item.patterns === undefined) return [{ id: item.diagram.id, diagram: item.diagram }];
  return item.patterns.map((pattern) => ({ id: pattern.diagram.id, diagram: pattern.diagram }));
}

async function 頁に出る見本を集める(): Promise<見本[]> {
  const items = [
    ...Object.values(CATALOG_ITEMS).flat(),
    ...(await loadPartsItems()),
  ];
  return items.flatMap(項目の見本);
}

function 数値属性(element: Element, name: string): number {
  const value = element.getAttribute(name);
  if (value === null) throw new Error(`${element.tagName} に ${name} が無い`);
  return Number(value);
}

function 線の経路点を入れる(値: 数値表, prefix: string, d: string): void {
  const numbers = d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/giu)?.map(Number) ?? [];
  for (let index = 0; index < numbers.length; index += 2) {
    値[`${prefix}.point[${index / 2}].x`] = numbers[index]!;
    if (numbers[index + 1] !== undefined) 値[`${prefix}.point[${index / 2}].y`] = numbers[index + 1]!;
  }
}

function 段の見出しを入れる(値: 数値表, diagram: CdlDiagram, laid: LaidDiagram): void {
  if (!laid.lanes.some((lane) => lane.stage !== undefined)) return;

  const markup = renderToStaticMarkup(
    <CdlDiagramView diagram={diagram} laid={laid} hideHeader />,
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

function 骨組みを測る(diagram: CdlDiagram, laid: LaidDiagram): 数値表 {
  const 値: 数値表 = {
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

function 骨組みの差(
  id: string,
  palette: 配色,
  基準: 数値表,
  対象: 数値表,
): string[] {
  const keys = new Set([...Object.keys(基準), ...Object.keys(対象)]);
  return [...keys].flatMap((key) => {
    const expected = 基準[key];
    const actual = 対象[key];
    if (expected === undefined || actual === undefined) {
      return [`${id} / ${palette} / ${key}: ${expected ?? "無し"} -> ${actual ?? "無し"} (差: 比較不能)`];
    }
    const delta = actual - expected;
    return Math.abs(delta) <= 許容差
      ? []
      : [`${id} / ${palette} / ${key}: ${expected} -> ${actual} (差: ${delta})`];
  });
}

describe("見本帳は配色を替えても図ごとの骨組みを保つ (#2908)", () => {
  it("全ての見本の箱・線・線札・段見出し・図枠が 10 配色で同じ", async () => {
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const differences: string[] = [];
      for (const { id, diagram } of await 頁に出る見本を集める()) {
        const built = カタログの図を組む(diagram);
        expect(built.textMetrics, `${id} の字の測り方`).toBe("widest");
        const baseDiagram = 図の配色を変える(built, 画面の色);
        const base = 骨組みを測る(baseDiagram, baseDiagram);
        for (const palette of 比べる配色) {
          const themed = 図の配色を変える(built, palette);
          differences.push(...骨組みの差(id, palette, base, 骨組みを測る(themed, themed)));
        }
      }
      const failedPairs = new Set(differences.map((difference) => difference.split(" / ").slice(0, 2).join(" / ")));
      const failedIds = new Set([...failedPairs].map((pair) => pair.split(" / ")[0]!));
      const byPalette = Object.fromEntries(
        比べる配色.map((palette) => [
          palette,
          [...failedPairs]
            .filter((pair) => pair.endsWith(` / ${palette}`))
            .map((pair) => pair.split(" / ")[0]!)
            .sort(),
        ]),
      );
      const summary = [
        `失敗図 ${failedIds.size}、図×配色 ${failedPairs.size}、差分 ${differences.length}`,
        ...Object.entries(byPalette).map(([palette, ids]) => `${palette}: ${ids.length} 件 [${ids.join(", ")}]`),
      ].join("\n");
      expect(differences, `${summary}\n${differences.join("\n")}`).toEqual([]);
    } finally {
      warnings.mockRestore();
    }
  }, 120_000);

  it("全ての見本の字が比例・等幅のどちらでも箱と札に収まる", async () => {
    const overflows: string[] = [];
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      for (const { id, diagram } of await 頁に出る見本を集める()) {
        const widest = カタログの図を組む(diagram);
        for (const textMetrics of ["proportional", "monospace"] as const) {
          const singleFont = layout({ ...diagram, textMetrics });
          for (const node of singleFont.nodes) {
            const widestNode = widest.nodes.find((item) => item.id === node.id);
            if (widestNode !== undefined && widestNode.w + 許容差 < node.w) {
              overflows.push(
                `${id} / ${textMetrics} / ${JSON.stringify(node.title)}: 箱 ${widestNode.w} < 必要幅 ${node.w}`,
              );
            }
          }
          for (const edge of widest.edges) {
            if (!edge.label?.trim() && !edge.sub?.trim()) continue;
            const measuredEdge = { ...edge };
            delete measuredEdge.labelSize;
            // 自動札の幅は実字幅に左右18ずつを足す。固定札は余白を除いた実字幅だけ収まればよい。
            const textWidth = predictLabelBBoxWorld(measuredEdge, textMetrics).w - 36;
            const box = widest.bboxes.find((item) => item.kind === "edge-label" && item.id === edge.id);
            if (box !== undefined && box.w + 許容差 < textWidth) {
              overflows.push(
                `${id} / ${textMetrics} / ${JSON.stringify(edge.label ?? edge.sub ?? "")}: 札 ${box.w} < 字幅 ${textWidth}`,
              );
            }
          }
        }
      }
    } finally {
      warnings.mockRestore();
    }
    expect(overflows, overflows.join("\n")).toEqual([]);
  }, 120_000);
});
