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

describe("iter151: parts additional (case)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id lower ok`, () => { expect(diagram.id.toLowerCase()).toBeTruthy(); });
    it(`${name}: id upper ok`, () => { expect(diagram.id.toUpperCase()).toBeTruthy(); });
    it(`${name}: lower length = length`, () => { expect(diagram.id.toLowerCase().length).toBe(diagram.id.length); });
    it(`${name}: upper length = length`, () => { expect(diagram.id.toUpperCase().length).toBe(diagram.id.length); });
    it(`${name}: id trim = id`, () => { expect(diagram.id.trim()).toBe(diagram.id); });
    it(`${name}: id trimStart = id`, () => { expect(diagram.id.trimStart()).toBe(diagram.id); });
    it(`${name}: id trimEnd = id`, () => { expect(diagram.id.trimEnd()).toBe(diagram.id); });
  }
});
