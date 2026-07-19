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

describe("iter278-milestone: parts 71k (encodeURI/decodeURI round-trip)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: decodeURI(encodeURI(id)) = id`, () => { expect(decodeURI(encodeURI(diagram.id))).toBe(diagram.id); });
    it(`${name}: decodeURIComponent(encodeURIComponent(id)) = id`, () => { expect(decodeURIComponent(encodeURIComponent(diagram.id))).toBe(diagram.id); });
    it(`${name}: encodeURI returns string`, () => { expect(typeof encodeURI(diagram.id)).toBe("string"); });
  }
});
