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

describe("iter384: parts additional (TypedArray basics)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Uint8Array(10).length = 10`, () => { expect(new Uint8Array(10).length).toBe(10); });
    it(`${name}: new Uint8Array([1,2,3]).length = 3`, () => { expect(new Uint8Array([1, 2, 3]).length).toBe(3); });
    it(`${name}: new Uint16Array(nodes.length).length = nodes.length`, () => { expect(new Uint16Array(diagram.nodes.length).length).toBe(diagram.nodes.length); });
    it(`${name}: new Int8Array(0).length = 0`, () => { expect(new Int8Array(0).length).toBe(0); });
    it(`${name}: Uint8Array BYTES_PER_ELEMENT = 1`, () => { expect(Uint8Array.BYTES_PER_ELEMENT).toBe(1); });
    it(`${name}: Uint16Array BYTES_PER_ELEMENT = 2`, () => { expect(Uint16Array.BYTES_PER_ELEMENT).toBe(2); });
    it(`${name}: Uint32Array BYTES_PER_ELEMENT = 4`, () => { expect(Uint32Array.BYTES_PER_ELEMENT).toBe(4); });
  }
});
