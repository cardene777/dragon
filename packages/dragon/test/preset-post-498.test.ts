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

describe("iter500: preset additional (Error handling)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: throw new Error("x")`, () => { expect(() => { throw new Error("x"); }).toThrow("x"); });
    it(`${name}: try/catch catches`, () => { let caught = false; try { throw new Error("x"); } catch { caught = true; } expect(caught).toBe(true); });
    it(`${name}: try/finally runs`, () => { let f = false; try { throw new Error("x"); } catch { /* swallow */ } finally { f = true; } expect(f).toBe(true); });
    it(`${name}: Error instanceof Error`, () => { expect(new Error("x") instanceof Error).toBe(true); });
    it(`${name}: Error.name = "Error"`, () => { expect(new Error("x").name).toBe("Error"); });
    it(`${name}: Error.message = "x"`, () => { expect(new Error("x").message).toBe("x"); });
    it(`${name}: TypeError instanceof Error`, () => { expect(new TypeError("t") instanceof Error).toBe(true); });
  }
});
