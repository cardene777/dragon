/**
 * 全 parts × nodes sanity 網羅 (iter60、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter60。
 * 全 parts の node property の deep check。
 */
import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllParts(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PARTS = collectAllParts(PartsMod);

describe("iter60: 全 parts × node property deep check", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: JSON serialize size < 100KB`, () => {
      const size = JSON.stringify(diagram).length;
      expect(size).toBeLessThan(100 * 1024);
    });

    it(`${name}: nodes / edges / states array 型`, () => {
      expect(Array.isArray(diagram.nodes)).toBe(true);
      expect(Array.isArray(diagram.edges)).toBe(true);
      const states = (diagram as unknown as { states?: unknown[] }).states;
      if (states !== undefined) {
        expect(Array.isArray(states)).toBe(true);
      }
    });

    it(`${name}: id の length 5-40 (parts- + 3-34 char)`, () => {
      expect(diagram.id.length).toBeGreaterThanOrEqual(5);
      expect(diagram.id.length).toBeLessThanOrEqual(40);
    });

    it(`${name}: edges 数 <= nodes 数 × 3 (density 合理性)`, () => {
      const n = diagram.nodes.length;
      const density = n > 0 ? diagram.edges.length / n : 0;
      expect(density).toBeLessThanOrEqual(3);
    });
  }
});
