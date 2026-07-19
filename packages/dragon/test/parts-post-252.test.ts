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

describe("iter252: parts additional (String startsWith/endsWith edge cases)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id startsWith "" = true`, () => { expect(diagram.id.startsWith("")).toBe(true); });
    it(`${name}: id endsWith "" = true`, () => { expect(diagram.id.endsWith("")).toBe(true); });
    it(`${name}: id includes "" = true`, () => { expect(diagram.id.includes("")).toBe(true); });
    it(`${name}: id startsWith self = true`, () => { expect(diagram.id.startsWith(diagram.id)).toBe(true); });
    it(`${name}: id endsWith self = true`, () => { expect(diagram.id.endsWith(diagram.id)).toBe(true); });
    it(`${name}: id includes self = true`, () => { expect(diagram.id.includes(diagram.id)).toBe(true); });
    it(`${name}: id startsWith self+"X" = false`, () => { expect(diagram.id.startsWith(diagram.id + "X")).toBe(false); });
  }
});
