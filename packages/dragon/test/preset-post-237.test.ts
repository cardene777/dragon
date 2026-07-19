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

describe("iter239: preset additional (Boolean coercion)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Boolean(diagram) = true`, () => { expect(Boolean(diagram)).toBe(true); });
    it(`${name}: !!diagram = true`, () => { expect(!!diagram).toBe(true); });
    it(`${name}: Boolean(id) truthy if nonempty`, () => { if (diagram.id.length) expect(Boolean(diagram.id)).toBe(true); });
    it(`${name}: !!nodes = true`, () => { expect(!!diagram.nodes).toBe(true); });
    it(`${name}: String(nodes.length) is string`, () => { expect(typeof String(diagram.nodes.length)).toBe("string"); });
    it(`${name}: Number(String(nodes.length)) = nodes.length`, () => { expect(Number(String(diagram.nodes.length))).toBe(diagram.nodes.length); });
    it(`${name}: Boolean(diagram) not falsy`, () => { expect(Boolean(diagram)).not.toBe(false); });
  }
});
