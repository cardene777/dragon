/**
 * preset property details (iter94、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter94。
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

describe("iter94: 全 20 preset × property details", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: top-level property key 数 >= 1`, () => {
      expect(Object.keys(diagram).length).toBeGreaterThanOrEqual(1);
    });

    it(`${name}: top-level property key 数 <= 30`, () => {
      expect(Object.keys(diagram).length).toBeLessThanOrEqual(30);
    });

    it(`${name}: id property 存在`, () => {
      expect("id" in diagram).toBe(true);
    });

    it(`${name}: nodes property 存在`, () => {
      expect("nodes" in diagram).toBe(true);
    });

    it(`${name}: edges property 存在`, () => {
      expect("edges" in diagram).toBe(true);
    });

    it(`${name}: node count > 0`, () => {
      expect(diagram.nodes.length).toBeGreaterThan(0);
    });

    it(`${name}: JSON stringify + parse round-trip 一致`, () => {
      const s1 = JSON.stringify(diagram);
      const s2 = JSON.stringify(JSON.parse(s1));
      expect(s1).toBe(s2);
    });
  }
});
