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

describe("iter362: preset additional (String.repeat)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id.repeat(0) = ""`, () => { expect(diagram.id.repeat(0)).toBe(""); });
    it(`${name}: id.repeat(1) = id`, () => { expect(diagram.id.repeat(1)).toBe(diagram.id); });
    it(`${name}: id.repeat(2) length = 2x`, () => { expect(diagram.id.repeat(2).length).toBe(diagram.id.length * 2); });
    it(`${name}: id.repeat(3) starts with id`, () => { expect(diagram.id.repeat(3).startsWith(diagram.id)).toBe(true); });
    it(`${name}: id.repeat(3) ends with id`, () => { expect(diagram.id.repeat(3).endsWith(diagram.id)).toBe(true); });
    it(`${name}: "".repeat(N) = ""`, () => { expect("".repeat(5)).toBe(""); });
    it(`${name}: id.padStart(id.length, "x") = id`, () => { expect(diagram.id.padStart(diagram.id.length, "x")).toBe(diagram.id); });
  }
});
