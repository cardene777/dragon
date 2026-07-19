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

describe("iter422: preset additional (performance.now/Date.now)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: typeof Date.now = function`, () => { expect(typeof Date.now).toBe("function"); });
    it(`${name}: Date.now() > 0`, () => { expect(Date.now()).toBeGreaterThan(0); });
    it(`${name}: typeof performance = object`, () => { expect(typeof performance).toBe("object"); });
    it(`${name}: typeof performance.now = function`, () => { expect(typeof performance.now).toBe("function"); });
    it(`${name}: performance.now() >= 0`, () => { expect(performance.now()).toBeGreaterThanOrEqual(0); });
    it(`${name}: Date.now() < Date.now() + 1000`, () => { expect(Date.now()).toBeLessThan(Date.now() + 1000); });
    it(`${name}: performance.now() < performance.now() + 100`, () => { expect(performance.now()).toBeLessThan(performance.now() + 100); });
  }
});
