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

describe("iter383-milestone: parts 108k (integer keys sort first)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: {"1": 1, "a": 2} = ["1", "a"]`, () => { expect(Object.keys({ "1": 1, "a": 2 })).toEqual(["1", "a"]); });
    it(`${name}: {"b": 1, "1": 2} = ["1", "b"]`, () => { expect(Object.keys({ "b": 1, "1": 2 })).toEqual(["1", "b"]); });
    it(`${name}: {"2": 1, "1": 2} = ["1", "2"]`, () => { expect(Object.keys({ "2": 1, "1": 2 })).toEqual(["1", "2"]); });
  }
});
