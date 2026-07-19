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

describe("iter419: preset additional (crypto.randomUUID/getRandomValues)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: typeof crypto = object`, () => { expect(typeof crypto).toBe("object"); });
    it(`${name}: typeof crypto.randomUUID = function`, () => { expect(typeof crypto.randomUUID).toBe("function"); });
    it(`${name}: crypto.randomUUID() length = 36`, () => { expect(crypto.randomUUID().length).toBe(36); });
    it(`${name}: crypto.randomUUID() has "-"`, () => { expect(crypto.randomUUID()).toContain("-"); });
    it(`${name}: two randomUUID != each other`, () => { expect(crypto.randomUUID()).not.toBe(crypto.randomUUID()); });
    it(`${name}: typeof crypto.getRandomValues = function`, () => { expect(typeof crypto.getRandomValues).toBe("function"); });
    it(`${name}: crypto.getRandomValues fills buffer`, () => { const buf = new Uint8Array(16); crypto.getRandomValues(buf); expect(buf.length).toBe(16); });
  }
});
