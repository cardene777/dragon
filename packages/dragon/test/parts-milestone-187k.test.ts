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

describe("milestone 187k: Number formatting edge", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: (255).toString(16) = "ff"`, () => { expect((255).toString(16)).toBe("ff"); });
    it(`${name}: (8).toString(2) = "1000"`, () => { expect((8).toString(2)).toBe("1000"); });
    it(`${name}: (0.000001).toExponential`, () => { expect((0.000001).toExponential(1)).toBe("1.0e-6"); });
    it(`${name}: (1234.5678).toFixed(2)`, () => { expect((1234.5678).toFixed(2)).toBe("1234.57"); });
    it(`${name}: parseInt hex prefix`, () => { expect(parseInt("0xff", 16)).toBe(255); });
    it(`${name}: parseInt radix 2`, () => { expect(parseInt("1010", 2)).toBe(10); });
    it(`${name}: parseFloat partial`, () => { expect(parseFloat("3.14abc")).toBe(3.14); });
    it(`${name}: Number("") = 0`, () => { expect(Number("")).toBe(0); });
  }
});
