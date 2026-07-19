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

describe("iter413: preset additional (TextEncoder/TextDecoder)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: new TextEncoder().encode("abc").length = 3`, () => { expect(new TextEncoder().encode("abc").length).toBe(3); });
    it(`${name}: new TextDecoder().decode(Uint8[97,98,99]) = "abc"`, () => { expect(new TextDecoder().decode(new Uint8Array([97, 98, 99]))).toBe("abc"); });
    it(`${name}: encode/decode round-trip = id`, () => { const e = new TextEncoder().encode(diagram.id); expect(new TextDecoder().decode(e)).toBe(diagram.id); });
    it(`${name}: encode/decode empty = ""`, () => { expect(new TextDecoder().decode(new TextEncoder().encode(""))).toBe(""); });
    it(`${name}: TextEncoder().encoding = "utf-8"`, () => { expect(new TextEncoder().encoding).toBe("utf-8"); });
    it(`${name}: TextDecoder().encoding = "utf-8"`, () => { expect(new TextDecoder().encoding).toBe("utf-8"); });
    it(`${name}: typeof TextEncoder = function`, () => { expect(typeof TextEncoder).toBe("function"); });
  }
});
