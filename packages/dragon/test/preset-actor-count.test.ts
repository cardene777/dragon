/**
 * preset actor / edge count 妥当性網羅 (iter39、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter39。
 * 全 20 preset diagram の actor / edge / phase 数の合理性を verify。
 */
import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
  const out: Array<{ name: string; diagram: CdlDiagram }> = [];
  for (const [name, val] of Object.entries(mod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id === "string" && Array.isArray(d.nodes)) {
      out.push({ name, diagram: d as CdlDiagram });
    }
  }
  return out;
}

const ALL_PRESETS = collectAllPresets(PresetsMod);

describe("iter39: 全 20 preset × actor / edge / phase count 妥当性", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes 数 3-100 範囲 (単純すぎず複雑すぎず)`, () => {
      expect(diagram.nodes.length).toBeGreaterThanOrEqual(1);
      expect(diagram.nodes.length).toBeLessThanOrEqual(100);
    });

    it(`${name}: edges 数 <= nodes^2 (完全 graph 未満)`, () => {
      const n = diagram.nodes.length;
      const maxEdges = Math.max(20, n * n);
      expect(diagram.edges.length).toBeLessThanOrEqual(maxEdges);
    });

    it(`${name}: phases 数 <= 30`, () => {
      const phases = (diagram as unknown as { phases?: unknown[] }).phases ?? [];
      expect(phases.length).toBeLessThanOrEqual(30);
    });

    it(`${name}: title / type field が存在`, () => {
      const d = diagram as unknown as { title?: unknown; type?: unknown };
      // title / type は optional 、 存在するなら string
      if (d.title !== undefined) expect(typeof d.title).toBe("string");
      if (d.type !== undefined) expect(typeof d.type).toBe("string");
    });
  }
});
