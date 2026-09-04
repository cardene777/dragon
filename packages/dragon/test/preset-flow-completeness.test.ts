/**
 * preset flow completeness 網羅 (iter81、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter81。
 * 全 21 preset diagram の flow / edge 完全性 verify。
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

describe("iter81: 全 21 preset × flow completeness", () => {
  it(`preset 数 = 21`, () => {
    expect(ALL_PRESETS.length).toBe(21);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: 全 edge from が nodes に含まれる`, () => {
      const ids = new Set(diagram.nodes.map((n) => n.id));
      for (const e of diagram.edges) {
        expect(ids.has(e.from)).toBe(true);
      }
    });

    it(`${name}: 全 edge to が nodes に含まれる`, () => {
      const ids = new Set(diagram.nodes.map((n) => n.id));
      for (const e of diagram.edges) {
        expect(ids.has(e.to)).toBe(true);
      }
    });

    it(`${name}: 全 node id が非空`, () => {
      for (const n of diagram.nodes) {
        expect(n.id.length).toBeGreaterThan(0);
      }
    });

    it(`${name}: JSON size < 200KB`, () => {
      expect(JSON.stringify(diagram).length).toBeLessThan(200 * 1024);
    });

    it(`${name}: id が preset 内で unique (nodes)`, () => {
      const ids = diagram.nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});
