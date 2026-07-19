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

describe("iter203: preset additional (Array.reverse/sort)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes slice reverse reverse = orig`, () => { expect(diagram.nodes.slice().reverse().reverse()).toEqual(diagram.nodes); });
    it(`${name}: edges slice reverse reverse = orig`, () => { expect(diagram.edges.slice().reverse().reverse()).toEqual(diagram.edges); });
    it(`${name}: nodes slice reverse length preserved`, () => { expect(diagram.nodes.slice().reverse().length).toBe(diagram.nodes.length); });
    it(`${name}: id split reverse reverse = id`, () => { expect(diagram.id.split("").reverse().reverse().join("")).toBe(diagram.id); });
    it(`${name}: nodes slice sort by id length preserves count`, () => { expect(diagram.nodes.slice().sort((a, b) => a.id.length - b.id.length).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes slice sort idempotent`, () => { const s = diagram.nodes.slice().sort((a, b) => a.id.localeCompare(b.id)); expect(s.slice().sort((a, b) => a.id.localeCompare(b.id))).toEqual(s); });
    it(`${name}: edges slice sort by from preserves length`, () => { expect(diagram.edges.slice().sort((a, b) => a.from.localeCompare(b.from)).length).toBe(diagram.edges.length); });
  }
});
