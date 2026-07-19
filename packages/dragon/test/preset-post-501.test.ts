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

describe("iter503: preset additional (typeof / instanceof)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: typeof "abc" = "string"`, () => { expect(typeof "abc").toBe("string"); });
    it(`${name}: typeof 42 = "number"`, () => { expect(typeof 42).toBe("number"); });
    it(`${name}: typeof true = "boolean"`, () => { expect(typeof true).toBe("boolean"); });
    it(`${name}: typeof undefined = "undefined"`, () => { expect(typeof undefined).toBe("undefined"); });
    it(`${name}: typeof null = "object"`, () => { expect(typeof null).toBe("object"); });
    it(`${name}: typeof function(){} = "function"`, () => { expect(typeof function () { /* noop */ }).toBe("function"); });
    it(`${name}: [] instanceof Array = true`, () => { expect([] instanceof Array).toBe(true); });
    it(`${name}: nodes instanceof Array = true`, () => { expect(diagram.nodes instanceof Array).toBe(true); });
  }
});
