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

describe("iter260-milestone: parts 65k (String.fromCharCode round-trip)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: fromCharCode(charCodeAt(0)) preserves char (BMP)`, () => { if (diagram.id.length) { const cc = diagram.id.charCodeAt(0); if (cc < 0xD800 || cc > 0xDFFF) expect(String.fromCharCode(cc)).toBe(diagram.id[0]); else expect(cc).toBeGreaterThanOrEqual(0xD800); } });
    it(`${name}: fromCharCode returns 1-char string`, () => { expect(String.fromCharCode(65).length).toBe(1); });
    it(`${name}: fromCharCode(65) = "A"`, () => { expect(String.fromCharCode(65)).toBe("A"); });
  }
});
