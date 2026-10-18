// @vitest-environment jsdom

import {
  layout,
  predictLabelBBoxWorld,
  type CdlDiagram,
} from "@cardenelabs/cdl";
import { THEMES, textDslToDiagram } from "@cardenelabs/dragon";
import { describe, expect, it, vi } from "vitest";

import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";
import { カタログの図を組む } from "./catalog-layout";
import { 記法つき, 部品の一覧 } from "./catalog-source-cases";
import { 図の配色を変える, 画面の色, type 配色 } from "./palette-switch";
import { 骨組みの差, 骨組みの許容差, 骨組みを測る } from "./skeleton-test-helpers";

const 比べる配色 = [...THEMES, 画面の色] as const satisfies readonly 配色[];

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

describe("見本帳は配色を替えても図ごとの骨組みを保つ (#2908 / #2926)", () => {
  it("記法を通る見本は組み立て済みの widest をそのまま配置する", () => {
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const differences: string[] = [];
      for (const { key, yaml } of 記法つき()) {
        const diagram = textDslToDiagram(yaml, { partsCatalog: 部品の一覧 });
        expect(diagram.textMetrics, key).toBe("widest");
        const built = カタログの図を組む(diagram);
        if (JSON.stringify(built) !== JSON.stringify(layout(diagram))) {
          differences.push(key);
        }
        const 以前の字幅: CdlDiagram["textMetrics"] =
          diagram.palette === "terminal" ? "monospace" : "proportional";
        const 以前の測り方 = { ...diagram, textMetrics: 以前の字幅 };
        if (JSON.stringify(カタログの図を組む(以前の測り方)) !== JSON.stringify(built)) {
          differences.push(`${key} (以前の測り方との差)`);
        }
      }
      expect(differences, `widest を組み直した見本: ${differences.join(", ")}`).toEqual([]);
    } finally {
      warnings.mockRestore();
    }
  }, 120_000);

  it("全ての見本の箱・線・線札・段見出し・円の区画・図枠が 10 配色で同じ", async () => {
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
            if (widestNode !== undefined && widestNode.w + 骨組みの許容差 < node.w) {
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
            if (box !== undefined && box.w + 骨組みの許容差 < textWidth) {
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
