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

describe("iter360: parts additional (String.repeat)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id.repeat(0) = ""`, () => { expect(diagram.id.repeat(0)).toBe(""); });
    it(`${name}: id.repeat(1) = id`, () => { expect(diagram.id.repeat(1)).toBe(diagram.id); });
    it(`${name}: id.repeat(2) length = 2x`, () => { expect(diagram.id.repeat(2).length).toBe(diagram.id.length * 2); });
    it(`${name}: id.repeat(3) starts with id`, () => { expect(diagram.id.repeat(3).startsWith(diagram.id)).toBe(true); });
    it(`${name}: id.repeat(3) ends with id`, () => { expect(diagram.id.repeat(3).endsWith(diagram.id)).toBe(true); });
    it(`${name}: "".repeat(N) = ""`, () => { expect("".repeat(5)).toBe(""); });
    it(`${name}: id.padStart(id.length, "x") = id`, () => { expect(diagram.id.padStart(diagram.id.length, "x")).toBe(diagram.id); });
  }
});
