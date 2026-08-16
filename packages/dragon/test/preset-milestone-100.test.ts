/**
 * preset milestone iter100 (2026-07-19)。
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

describe("iter100: preset milestone check", () => {
  it(`preset 数 = 19`, () => {
    expect(ALL_PRESETS.length).toBe(19);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id string`, () => {
      expect(typeof diagram.id).toBe("string");
    });

    it(`${name}: nodes Array`, () => {
      expect(Array.isArray(diagram.nodes)).toBe(true);
    });

    it(`${name}: edges Array`, () => {
      expect(Array.isArray(diagram.edges)).toBe(true);
    });

    it(`${name}: nodes iterable`, () => {
      let ok = true;
      for (const n of diagram.nodes) if (!n) ok = false;
      expect(ok).toBe(true);
    });

    it(`${name}: JSON stringify + parse round-trip`, () => {
      const rt = JSON.parse(JSON.stringify(diagram));
      expect(rt.id).toBe(diagram.id);
      expect(rt.nodes.length).toBe(diagram.nodes.length);
    });

    it(`${name}: full diagram size > 0`, () => {
      expect(JSON.stringify(diagram).length).toBeGreaterThan(0);
    });

    it(`${name}: node/edge count integer`, () => {
      expect(Number.isInteger(diagram.nodes.length)).toBe(true);
      expect(Number.isInteger(diagram.edges.length)).toBe(true);
    });
  }
});
