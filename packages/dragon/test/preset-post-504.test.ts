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

describe("iter506: preset additional (BigInt basic)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: typeof 1n = "bigint"`, () => { expect(typeof 1n).toBe("bigint"); });
    it(`${name}: BigInt(1) = 1n`, () => { expect(BigInt(1)).toBe(1n); });
    it(`${name}: 1n + 2n = 3n`, () => { expect(1n + 2n).toBe(3n); });
    it(`${name}: 2n * 3n = 6n`, () => { expect(2n * 3n).toBe(6n); });
    it(`${name}: 10n / 3n = 3n (floor)`, () => { expect(10n / 3n).toBe(3n); });
    it(`${name}: 1n == 1 = true (loose)`, () => { expect(1n == 1).toBe(true); });
    it(`${name}: 1n === 1 = false (strict)`, () => { expect(1n === 1 as unknown as bigint).toBe(false); });
  }
});
