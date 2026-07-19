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

describe("iter133: preset additional 13 axis (JSON safety)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: JSON stringify id ok`, () => { expect(() => JSON.stringify(diagram.id)).not.toThrow(); });
    it(`${name}: JSON stringify nodes ok`, () => { expect(() => JSON.stringify(diagram.nodes)).not.toThrow(); });
    it(`${name}: JSON stringify edges ok`, () => { expect(() => JSON.stringify(diagram.edges)).not.toThrow(); });
    it(`${name}: JSON parse id ok`, () => { const s = JSON.stringify(diagram.id); expect(JSON.parse(s)).toBe(diagram.id); });
    it(`${name}: JSON round-trip nodes length`, () => { const p = JSON.parse(JSON.stringify(diagram.nodes)); expect(p.length).toBe(diagram.nodes.length); });
    it(`${name}: JSON round-trip edges length`, () => { const p = JSON.parse(JSON.stringify(diagram.edges)); expect(p.length).toBe(diagram.edges.length); });
    it(`${name}: id JSON starts with dq`, () => { expect(JSON.stringify(diagram.id).startsWith('"')).toBe(true); });
  }
});
