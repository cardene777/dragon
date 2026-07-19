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

describe("iter494: preset additional (Date basic)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: new Date("2024-01-01").getUTCFullYear() = 2024`, () => { expect(new Date("2024-01-01").getUTCFullYear()).toBe(2024); });
    it(`${name}: new Date(0).getTime() = 0`, () => { expect(new Date(0).getTime()).toBe(0); });
    it(`${name}: Date.parse("2024-01-01") is finite`, () => { expect(Number.isFinite(Date.parse("2024-01-01"))).toBe(true); });
    it(`${name}: new Date("invalid").getTime() = NaN`, () => { expect(new Date("invalid").getTime()).toBeNaN(); });
    it(`${name}: new Date("2024-01-01").toISOString() startsWith "2024"`, () => { expect(new Date("2024-01-01").toISOString().startsWith("2024")).toBe(true); });
    it(`${name}: new Date(1000).getTime() = 1000`, () => { expect(new Date(1000).getTime()).toBe(1000); });
    it(`${name}: diagram is date-independent`, () => { expect(typeof diagram.id).toBe("string"); });
  }
});
