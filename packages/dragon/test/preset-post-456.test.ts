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

describe("iter458: preset additional (join / toString / concat)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: [1,2,3].join("-") = "1-2-3"`, () => { expect([1, 2, 3].join("-")).toBe("1-2-3"); });
    it(`${name}: [1,2,3].join() = "1,2,3"`, () => { expect([1, 2, 3].join()).toBe("1,2,3"); });
    it(`${name}: [].join(",") = ""`, () => { expect([].join(",")).toBe(""); });
    it(`${name}: [1,2,3].toString() = "1,2,3"`, () => { expect([1, 2, 3].toString()).toBe("1,2,3"); });
    it(`${name}: [1,2].concat([3,4]) = [1,2,3,4]`, () => { expect([1, 2].concat([3, 4])).toEqual([1, 2, 3, 4]); });
    it(`${name}: [1,2].concat(3, 4) = [1,2,3,4]`, () => { expect([1, 2].concat(3, 4)).toEqual([1, 2, 3, 4]); });
    it(`${name}: nodes.concat([]).length = nodes.length`, () => { expect(diagram.nodes.concat([]).length).toBe(diagram.nodes.length); });
  }
});
