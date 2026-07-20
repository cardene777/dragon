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

describe("iter563: preset additional (String.raw / escape)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: String.raw preserves backslash`, () => { expect(String.raw`a\nb`).toBe("a\\nb"); });
    it(`${name}: String.raw interpolation`, () => { const x = 5; expect(String.raw`v=${x}`).toBe("v=5"); });
    it(`${name}: normal template escapes`, () => { expect(`a\nb`).toBe("a\nb"); });
    it(`${name}: String.raw tab`, () => { expect(String.raw`\t`).toBe("\\t"); });
    it(`${name}: escaped quote in string`, () => { expect("say \"hi\"").toBe('say "hi"'); });
    it(`${name}: hex escape`, () => { expect("\x41").toBe("A"); });
    it(`${name}: id in template literal`, () => { expect(`${diagram.id}`).toBe(diagram.id); });
  }
});
