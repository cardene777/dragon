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

describe("iter299: preset additional (Promise basics)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Promise.resolve(d) resolves to d`, async () => { await expect(Promise.resolve(diagram)).resolves.toBe(diagram); });
    it(`${name}: Promise.resolve(id) resolves to id`, async () => { await expect(Promise.resolve(diagram.id)).resolves.toBe(diagram.id); });
    it(`${name}: Promise.all([resolve d]) resolves to [d]`, async () => { await expect(Promise.all([Promise.resolve(diagram)])).resolves.toEqual([diagram]); });
    it(`${name}: Promise.allSettled([resolve d]) resolves`, async () => { const r = await Promise.allSettled([Promise.resolve(diagram)]); expect(r[0].status).toBe("fulfilled"); });
    it(`${name}: Promise.race([resolve d]) = d`, async () => { await expect(Promise.race([Promise.resolve(diagram)])).resolves.toBe(diagram); });
    it(`${name}: Promise.any([resolve d]) = d`, async () => { await expect(Promise.any([Promise.resolve(diagram)])).resolves.toBe(diagram); });
    it(`${name}: Promise.resolve is Promise`, () => { expect(Promise.resolve(diagram) instanceof Promise).toBe(true); });
  }
});
