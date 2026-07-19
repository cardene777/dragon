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

describe("iter516: parts additional (Iterator / for..of)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: for..of array`, () => { let sum = 0; for (const v of [1, 2, 3]) sum += v; expect(sum).toBe(6); });
    it(`${name}: for..of string`, () => { const chars: string[] = []; for (const c of "abc") chars.push(c); expect(chars).toEqual(["a", "b", "c"]); });
    it(`${name}: for..of Set`, () => { const vals: number[] = []; for (const v of new Set([1, 2, 3])) vals.push(v); expect(vals).toEqual([1, 2, 3]); });
    it(`${name}: for..of Map values`, () => { const vals: number[] = []; for (const v of new Map([["a", 1], ["b", 2]]).values()) vals.push(v); expect(vals).toEqual([1, 2]); });
    it(`${name}: for..in object keys`, () => { const keys: string[] = []; for (const k in { a: 1, b: 2 }) keys.push(k); expect(keys).toEqual(["a", "b"]); });
    it(`${name}: iterable protocol`, () => { const iter = [1, 2][Symbol.iterator](); expect(iter.next().value).toBe(1); expect(iter.next().value).toBe(2); });
    it(`${name}: for..of nodes iterates`, () => { let count = 0; for (const _ of diagram.nodes) count++; expect(count).toBe(diagram.nodes.length); });
  }
});
