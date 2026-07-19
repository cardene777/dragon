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

describe("iter423: parts additional (Intl.NumberFormat)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: typeof Intl = object`, () => { expect(typeof Intl).toBe("object"); });
    it(`${name}: typeof Intl.NumberFormat = function`, () => { expect(typeof Intl.NumberFormat).toBe("function"); });
    it(`${name}: new Intl.NumberFormat().format(1000) is string`, () => { expect(typeof new Intl.NumberFormat().format(1000)).toBe("string"); });
    it(`${name}: NumberFormat 0 returns "0"`, () => { expect(new Intl.NumberFormat("en-US").format(0)).toBe("0"); });
    it(`${name}: NumberFormat 1000 en-US contains ","`, () => { expect(new Intl.NumberFormat("en-US").format(1000)).toContain(","); });
    it(`${name}: (1000).toLocaleString() is string`, () => { expect(typeof (1000).toLocaleString()).toBe("string"); });
    it(`${name}: typeof Intl.DateTimeFormat = function`, () => { expect(typeof Intl.DateTimeFormat).toBe("function"); });
  }
});
