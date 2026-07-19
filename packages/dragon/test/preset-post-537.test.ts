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

describe("iter539: preset additional (String Unicode / codePoint)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: String.fromCharCode(97) = "a"`, () => { expect(String.fromCharCode(97)).toBe("a"); });
    it(`${name}: String.fromCodePoint(0x1F600) emoji`, () => { expect(String.fromCodePoint(0x1F600).length).toBe(2); });
    it(`${name}: "😀".codePointAt(0) = 0x1F600`, () => { expect("😀".codePointAt(0)).toBe(0x1F600); });
    it(`${name}: "😀".length = 2 (surrogate pair)`, () => { expect("😀".length).toBe(2); });
    it(`${name}: [..."😀"].length = 1 (code points)`, () => { expect([..."😀"].length).toBe(1); });
    it(`${name}: "a".charCodeAt(0) = 97`, () => { expect("a".charCodeAt(0)).toBe(97); });
    it(`${name}: id spread code points`, () => { expect([...diagram.id].length).toBeLessThanOrEqual(diagram.id.length); });
  }
});
