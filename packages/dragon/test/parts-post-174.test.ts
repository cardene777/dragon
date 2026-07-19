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

describe("iter174: parts additional (encoded)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id encodeURI ok`, () => { expect(() => encodeURI(diagram.id)).not.toThrow(); });
    it(`${name}: id encodeURIComponent ok`, () => { expect(() => encodeURIComponent(diagram.id)).not.toThrow(); });
    it(`${name}: id decodeURI round-trip`, () => { expect(decodeURI(encodeURI(diagram.id))).toBe(diagram.id); });
    it(`${name}: id decodeURIComponent round-trip`, () => { expect(decodeURIComponent(encodeURIComponent(diagram.id))).toBe(diagram.id); });
    it(`${name}: id encodeURI truthy`, () => { expect(encodeURI(diagram.id)).toBeTruthy(); });
    it(`${name}: id encodeURIComponent length >= id length`, () => { expect(encodeURIComponent(diagram.id).length).toBeGreaterThanOrEqual(diagram.id.length); });
    it(`${name}: id encodeURI no throw`, () => { expect(typeof encodeURI(diagram.id)).toBe("string"); });
  }
});
