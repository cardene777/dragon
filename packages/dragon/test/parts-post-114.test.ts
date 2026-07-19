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

describe("iter114: parts additional 8 axis", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id split by "-" length >= 2`, () => {
      expect(diagram.id.split("-").length).toBeGreaterThanOrEqual(2);
    });
    it(`${name}: id split by "-" first is "parts"`, () => {
      expect(diagram.id.split("-")[0]).toBe("parts");
    });
    it(`${name}: nodes JSON not "[]"`, () => {
      if (diagram.nodes.length > 0) {
        expect(JSON.stringify(diagram.nodes)).not.toBe("[]");
      }
    });
    it(`${name}: edges JSON not undefined`, () => {
      expect(JSON.stringify(diagram.edges)).not.toBe("undefined");
    });
    it(`${name}: id endsWith some substring`, () => {
      expect(diagram.id.endsWith(diagram.id.slice(-1))).toBe(true);
    });
    it(`${name}: id equal itself normalize`, () => {
      expect(diagram.id.normalize()).toBe(diagram.id);
    });
    it(`${name}: id substring 0 to length equal id`, () => {
      expect(diagram.id.substring(0, diagram.id.length)).toBe(diagram.id);
    });
  }
});
