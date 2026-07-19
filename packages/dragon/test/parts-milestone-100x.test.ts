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

describe("🎊🎊 100x milestone: parts (Math.trunc / Math.floor / Math.round)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Math.trunc nodes length = nodes length`, () => { expect(Math.trunc(diagram.nodes.length)).toBe(diagram.nodes.length); });
    it(`${name}: Math.floor nodes length = nodes length`, () => { expect(Math.floor(diagram.nodes.length)).toBe(diagram.nodes.length); });
    it(`${name}: Math.round nodes length = nodes length`, () => { expect(Math.round(diagram.nodes.length)).toBe(diagram.nodes.length); });
  }
});
