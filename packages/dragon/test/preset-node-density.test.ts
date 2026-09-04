/**
 * preset node density 網羅 (iter58、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter58。
 * 全 21 preset の node density (edges/nodes 比率) を verify。
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

describe("iter58: 全 21 preset × node density 網羅", () => {
  it(`preset 数 = 21`, () => {
    expect(ALL_PRESETS.length).toBe(21);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: edge density (edges/nodes) が 0-10 範囲`, () => {
      const n = diagram.nodes.length;
      if (n > 0) {
        const density = diagram.edges.length / n;
        expect(density).toBeGreaterThanOrEqual(0);
        expect(density).toBeLessThanOrEqual(10);
      }
    });

    it(`${name}: node id が preset 内 unique`, () => {
      const ids = diagram.nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`${name}: title / type field 存在時 string`, () => {
      const d = diagram as unknown as { title?: unknown; type?: unknown };
      if (d.title !== undefined) expect(typeof d.title).toBe("string");
      if (d.type !== undefined) expect(typeof d.type).toBe("string");
    });

    it(`${name}: JSON stringify size < 500KB (異常巨大 preset 検知)`, () => {
      const size = JSON.stringify(diagram).length;
      expect(size).toBeLessThan(500 * 1024);
    });
  }
});
