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

describe("iter410: preset additional (btoa/atob base64)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: btoa("abc") = "YWJj"`, () => { expect(btoa("abc")).toBe("YWJj"); });
    it(`${name}: atob("YWJj") = "abc"`, () => { expect(atob("YWJj")).toBe("abc"); });
    it(`${name}: atob(btoa("hello")) = "hello"`, () => { expect(atob(btoa("hello"))).toBe("hello"); });
    it(`${name}: btoa("") = ""`, () => { expect(btoa("")).toBe(""); });
    it(`${name}: atob("") = ""`, () => { expect(atob("")).toBe(""); });
    it(`${name}: typeof btoa = function`, () => { expect(typeof btoa).toBe("function"); });
    it(`${name}: typeof atob = function`, () => { expect(typeof atob).toBe("function"); });
  }
});
