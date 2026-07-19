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

describe("iter461: preset additional (String slice / substring)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: "hello".slice(1, 3) = "el"`, () => { expect("hello".slice(1, 3)).toBe("el"); });
    it(`${name}: "hello".slice(-2) = "lo"`, () => { expect("hello".slice(-2)).toBe("lo"); });
    it(`${name}: "hello".slice(1) = "ello"`, () => { expect("hello".slice(1)).toBe("ello"); });
    it(`${name}: "hello".substring(1, 3) = "el"`, () => { expect("hello".substring(1, 3)).toBe("el"); });
    it(`${name}: "hello".substring(-1) = "hello"`, () => { expect("hello".substring(-1)).toBe("hello"); });
    it(`${name}: "".slice(0, 10) = ""`, () => { expect("".slice(0, 10)).toBe(""); });
    it(`${name}: diagram.id slice preserves`, () => { expect(diagram.id.slice(0)).toBe(diagram.id); });
  }
});
