/**
 * preset edge / state 網羅 (iter87、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter87。
 * 全 20 preset の edges / states プロパティ verify。
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

describe("iter87: 全 20 preset × edges / states 網羅", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: edges array`, () => {
      expect(Array.isArray(diagram.edges)).toBe(true);
    });

    it(`${name}: 各 edge が object`, () => {
      for (const e of diagram.edges) {
        expect(typeof e).toBe("object");
      }
    });

    it(`${name}: 各 edge が from/to`, () => {
      for (const e of diagram.edges) {
        expect(typeof e.from).toBe("string");
        expect(typeof e.to).toBe("string");
      }
    });

    it(`${name}: 各 edge の label 型 (undefined or string)`, () => {
      for (const e of diagram.edges) {
        const label = (e as unknown as { label?: unknown }).label;
        if (label !== undefined) {
          expect(typeof label).toBe("string");
        }
      }
    });

    it(`${name}: states property が array or undefined`, () => {
      const states = (diagram as unknown as { states?: unknown }).states;
      if (states !== undefined) {
        expect(Array.isArray(states)).toBe(true);
      }
    });

    it(`${name}: JSON stringify 経路 throw なし`, () => {
      expect(() => JSON.stringify(diagram)).not.toThrow();
    });
  }
});
