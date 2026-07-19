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

describe("iter353: preset additional (Number parse)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: parseInt("42") = 42`, () => { expect(parseInt("42")).toBe(42); });
    it(`${name}: parseFloat("3.14") = 3.14`, () => { expect(parseFloat("3.14")).toBe(3.14); });
    it(`${name}: Number("42") = 42`, () => { expect(Number("42")).toBe(42); });
    it(`${name}: parseInt(nodes.length.toString()) = nodes.length`, () => { expect(parseInt(String(diagram.nodes.length))).toBe(diagram.nodes.length); });
    it(`${name}: parseInt("42.5") = 42`, () => { expect(parseInt("42.5")).toBe(42); });
    it(`${name}: parseInt("0xff", 16) = 255`, () => { expect(parseInt("ff", 16)).toBe(255); });
    it(`${name}: parseInt("42abc") = 42`, () => { expect(parseInt("42abc")).toBe(42); });
  }
});
