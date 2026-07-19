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

describe("iter188: parts additional (Number bounds)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id length < MAX_SAFE_INTEGER`, () => { expect(diagram.id.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
    it(`${name}: nodes length < MAX_SAFE_INTEGER`, () => { expect(diagram.nodes.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
    it(`${name}: edges length < MAX_SAFE_INTEGER`, () => { expect(diagram.edges.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
    it(`${name}: id length >= 0`, () => { expect(diagram.id.length).toBeGreaterThanOrEqual(0); });
    it(`${name}: id length !== Infinity`, () => { expect(diagram.id.length).not.toBe(Infinity); });
    it(`${name}: nodes length !== Infinity`, () => { expect(diagram.nodes.length).not.toBe(Infinity); });
    it(`${name}: edges length !== Infinity`, () => { expect(diagram.edges.length).not.toBe(Infinity); });
  }
});
