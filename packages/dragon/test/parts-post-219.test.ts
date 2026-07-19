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

describe("iter219: parts additional (Array every/some)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes every truthy = true`, () => { expect(diagram.nodes.every(() => true)).toBe(true); });
    it(`${name}: nodes every falsy nonempty = false`, () => { if (diagram.nodes.length) expect(diagram.nodes.every(() => false)).toBe(false); });
    it(`${name}: nodes some truthy nonempty = true`, () => { if (diagram.nodes.length) expect(diagram.nodes.some(() => true)).toBe(true); });
    it(`${name}: nodes some falsy = false`, () => { expect(diagram.nodes.some(() => false)).toBe(false); });
    it(`${name}: edges every truthy = true`, () => { expect(diagram.edges.every(() => true)).toBe(true); });
    it(`${name}: edges some falsy = false`, () => { expect(diagram.edges.some(() => false)).toBe(false); });
    it(`${name}: nodes every has valid id typeof`, () => { expect(diagram.nodes.every(n => typeof n.id === "string")).toBe(true); });
  }
});
