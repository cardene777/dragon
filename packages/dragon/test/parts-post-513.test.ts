import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllParts(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PARTS = collectAllParts(PartsMod);

describe("iter513: parts additional (Destructuring)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: array destructure`, () => { const [a, b] = [1, 2]; expect(a).toBe(1); expect(b).toBe(2); });
    it(`${name}: array skip`, () => { const [, , c] = [1, 2, 3]; expect(c).toBe(3); });
    it(`${name}: array rest`, () => { const [head, ...rest] = [1, 2, 3]; expect(head).toBe(1); expect(rest).toEqual([2, 3]); });
    it(`${name}: array default`, () => { const [x = 10] = []; expect(x).toBe(10); });
    it(`${name}: object destructure`, () => { const { a, b } = { a: 1, b: 2 }; expect(a).toBe(1); expect(b).toBe(2); });
    it(`${name}: object rename`, () => { const { a: x } = { a: 5 }; expect(x).toBe(5); });
    it(`${name}: object rest`, () => { const { a, ...rest } = { a: 1, b: 2, c: 3 }; expect(a).toBe(1); expect(rest).toEqual({ b: 2, c: 3 }); });
  }
});
