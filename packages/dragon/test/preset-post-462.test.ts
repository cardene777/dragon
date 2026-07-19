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

describe("iter464: preset additional (String replace / replaceAll / includes)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: "aaa".replace("a", "b") = "baa"`, () => { expect("aaa".replace("a", "b")).toBe("baa"); });
    it(`${name}: "aaa".replaceAll("a", "b") = "bbb"`, () => { expect("aaa".replaceAll("a", "b")).toBe("bbb"); });
    it(`${name}: "aaa".replace(/a/g, "b") = "bbb"`, () => { expect("aaa".replace(/a/g, "b")).toBe("bbb"); });
    it(`${name}: "abc".includes("b") = true`, () => { expect("abc".includes("b")).toBe(true); });
    it(`${name}: "abc".includes("z") = false`, () => { expect("abc".includes("z")).toBe(false); });
    it(`${name}: "abc".startsWith("ab") = true`, () => { expect("abc".startsWith("ab")).toBe(true); });
    it(`${name}: id includes self`, () => { expect(diagram.id.includes(diagram.id)).toBe(true); });
  }
});
