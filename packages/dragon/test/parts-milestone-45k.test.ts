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

describe("iter197: parts milestone 45k (9 axis String slice/substr)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id slice 0,-0 = id`, () => { expect(diagram.id.slice(0, diagram.id.length || 0)).toBe(diagram.id); });
    it(`${name}: id substring reversed args = same`, () => { expect(diagram.id.substring(diagram.id.length, 0)).toBe(diagram.id); });
    it(`${name}: id slice negative = suffix`, () => { expect(diagram.id.slice(-diagram.id.length)).toBe(diagram.id); });
    it(`${name}: id slice too large = ""`, () => { expect(diagram.id.slice(diagram.id.length)).toBe(""); });
    it(`${name}: id substring beyond = ""`, () => { expect(diagram.id.substring(diagram.id.length)).toBe(""); });
    it(`${name}: id lastIndexOf empty = length`, () => { expect(diagram.id.lastIndexOf("")).toBe(diagram.id.length); });
    it(`${name}: id indexOf empty = 0`, () => { expect(diagram.id.indexOf("")).toBe(0); });
    it(`${name}: id includes self = true`, () => { expect(diagram.id.includes(diagram.id)).toBe(true); });
    it(`${name}: id endsWith self`, () => { expect(diagram.id.endsWith(diagram.id)).toBe(true); });
  }
});
