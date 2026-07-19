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

describe("iter342: parts additional (bitwise ops)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.length & 0 = 0`, () => { expect(diagram.nodes.length & 0).toBe(0); });
    it(`${name}: nodes.length | 0 = nodes.length`, () => { expect(diagram.nodes.length | 0).toBe(diagram.nodes.length); });
    it(`${name}: nodes.length ^ 0 = nodes.length`, () => { expect(diagram.nodes.length ^ 0).toBe(diagram.nodes.length); });
    it(`${name}: nodes.length ^ nodes.length = 0`, () => { expect(diagram.nodes.length ^ diagram.nodes.length).toBe(0); });
    it(`${name}: ~~nodes.length = nodes.length`, () => { expect(~~diagram.nodes.length).toBe(diagram.nodes.length); });
    it(`${name}: nodes.length << 0 = nodes.length`, () => { expect(diagram.nodes.length << 0).toBe(diagram.nodes.length); });
    it(`${name}: nodes.length >> 0 = nodes.length`, () => { expect(diagram.nodes.length >> 0).toBe(diagram.nodes.length); });
  }
});
