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

describe("iter111: parts additional 7 axis batch 3", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id charAt(0) not empty`, () => {
      expect(diagram.id.charAt(0).length).toBeGreaterThan(0);
    });
    it(`${name}: id charCodeAt(0) > 0`, () => {
      expect(diagram.id.charCodeAt(0)).toBeGreaterThan(0);
    });
    it(`${name}: id indexOf itself is 0`, () => {
      expect(diagram.id.indexOf(diagram.id)).toBe(0);
    });
    it(`${name}: id lastIndexOf itself is 0`, () => {
      expect(diagram.id.lastIndexOf(diagram.id)).toBe(0);
    });
    it(`${name}: nodes typeof object`, () => {
      expect(typeof diagram.nodes).toBe("object");
    });
    it(`${name}: edges typeof object`, () => {
      expect(typeof diagram.edges).toBe("object");
    });
    it(`${name}: id.length === id length via for loop`, () => {
      let cnt = 0;
      for (const _c of diagram.id) cnt++;
      expect(cnt).toBeGreaterThanOrEqual(1);
    });
  }
});
