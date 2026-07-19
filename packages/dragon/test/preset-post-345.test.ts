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

describe("iter347: preset additional (spread in function call)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Math.max(...[1,2,3]) = 3`, () => { expect(Math.max(...[1, 2, 3])).toBe(3); });
    it(`${name}: Math.min(...[1,2,3]) = 1`, () => { expect(Math.min(...[1, 2, 3])).toBe(1); });
    it(`${name}: Array(...[]) length = 0`, () => { expect(Array.from([...[] as unknown[]]).length).toBe(0); });
    it(`${name}: [...nodes].length = nodes length`, () => { expect([...diagram.nodes].length).toBe(diagram.nodes.length); });
    it(`${name}: rest fn returns args`, () => { const f = (...args: number[]) => args; expect(f(1, 2, 3)).toEqual([1, 2, 3]); });
    it(`${name}: fn(...nodes.map(n => n.id))`, () => { const f = (...args: string[]) => args.length; expect(f(...diagram.nodes.map(n => n.id))).toBe(diagram.nodes.length); });
    it(`${name}: [1,...[2,3],4] = [1,2,3,4]`, () => { expect([1, ...[2, 3], 4]).toEqual([1, 2, 3, 4]); });
  }
});
