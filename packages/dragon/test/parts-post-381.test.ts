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

describe("iter381: parts additional (Object spread order)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: {a:1, b:2} keys ordered`, () => { expect(Object.keys({ a: 1, b: 2 })).toEqual(["a", "b"]); });
    it(`${name}: {b:1, a:2} keys ordered`, () => { expect(Object.keys({ b: 1, a: 2 })).toEqual(["b", "a"]); });
    it(`${name}: {...d, extra: 1} last key = extra`, () => { const keys = Object.keys({ ...diagram, extra: 1 }); expect(keys[keys.length - 1]).toBe("extra"); });
    it(`${name}: {a: 1, ...{b: 2}} = {a:1, b:2}`, () => { expect({ a: 1, ...{ b: 2 } }).toEqual({ a: 1, b: 2 }); });
    it(`${name}: {...{a: 1}, a: 2} = {a: 2}`, () => { expect({ ...{ a: 1 }, a: 2 }).toEqual({ a: 2 }); });
    it(`${name}: {a: 1, ...{a: 2}} = {a: 2}`, () => { expect({ a: 1, ...{ a: 2 } }).toEqual({ a: 2 }); });
    it(`${name}: {} keys length = 0`, () => { expect(Object.keys({}).length).toBe(0); });
  }
});
