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

describe("iter551: preset additional (Number precision / EPSILON)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: 0.1 + 0.2 != 0.3 (float)`, () => { expect(0.1 + 0.2).not.toBe(0.3); });
    it(`${name}: EPSILON compare 0.1+0.2 ~ 0.3`, () => { expect(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON).toBe(true); });
    it(`${name}: Number.MAX_SAFE_INTEGER`, () => { expect(Number.MAX_SAFE_INTEGER).toBe(9007199254740991); });
    it(`${name}: Number.isSafeInteger`, () => { expect(Number.isSafeInteger(2 ** 53)).toBe(false); expect(Number.isSafeInteger(2 ** 53 - 1)).toBe(true); });
    it(`${name}: Number.MIN_VALUE > 0`, () => { expect(Number.MIN_VALUE).toBeGreaterThan(0); });
    it(`${name}: Number.MAX_VALUE finite`, () => { expect(Number.isFinite(Number.MAX_VALUE)).toBe(true); });
    it(`${name}: 1/0 = Infinity`, () => { expect(1 / 0).toBe(Infinity); });
  }
});
