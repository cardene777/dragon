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

describe("iter260: preset additional (charCode/codePoint)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id charCodeAt(0) is number`, () => { if (diagram.id.length) expect(typeof diagram.id.charCodeAt(0)).toBe("number"); });
    it(`${name}: id codePointAt(0) is number`, () => { if (diagram.id.length) expect(typeof diagram.id.codePointAt(0)).toBe("number"); });
    it(`${name}: id charAt(0) is string`, () => { expect(typeof diagram.id.charAt(0)).toBe("string"); });
    it(`${name}: id charCodeAt(-1) is NaN`, () => { expect(Number.isNaN(diagram.id.charCodeAt(-1))).toBe(true); });
    it(`${name}: id codePointAt(-1) is undefined`, () => { expect(diagram.id.codePointAt(-1)).toBeUndefined(); });
    it(`${name}: id charAt(length) = ""`, () => { expect(diagram.id.charAt(diagram.id.length)).toBe(""); });
    it(`${name}: id charCodeAt(length) is NaN`, () => { expect(Number.isNaN(diagram.id.charCodeAt(diagram.id.length))).toBe(true); });
  }
});
