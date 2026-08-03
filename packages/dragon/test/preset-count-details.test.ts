/**
 * preset count details (iter97、 2026-07-19)。
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

describe("iter97: 全 20 preset × count details", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes.length >= 1`, () => {
      expect(diagram.nodes.length).toBeGreaterThanOrEqual(1);
    });

    it(`${name}: nodes.length <= 100`, () => {
      expect(diagram.nodes.length).toBeLessThanOrEqual(100);
    });

    it(`${name}: edges.length <= 500`, () => {
      expect(diagram.edges.length).toBeLessThanOrEqual(500);
    });

    it(`${name}: nodes.length + edges.length <= 500`, () => {
      expect(diagram.nodes.length + diagram.edges.length).toBeLessThanOrEqual(500);
    });

    it(`${name}: nodes count integer`, () => {
      expect(Number.isInteger(diagram.nodes.length)).toBe(true);
    });

    it(`${name}: edges count integer`, () => {
      expect(Number.isInteger(diagram.edges.length)).toBe(true);
    });

    it(`${name}: nodes + edges ratio 妥当`, () => {
      const ratio = diagram.edges.length / Math.max(1, diagram.nodes.length);
      expect(ratio).toBeLessThanOrEqual(10);
    });
  }
});
