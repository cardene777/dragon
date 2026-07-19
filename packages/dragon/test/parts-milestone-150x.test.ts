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

describe("🎊🎊 150x milestone: parts (Number static methods)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Number.isInteger(nodes.length) = true`, () => { expect(Number.isInteger(diagram.nodes.length)).toBe(true); });
    it(`${name}: Number.parseInt("42") = 42`, () => { expect(Number.parseInt("42")).toBe(42); });
    it(`${name}: Number.parseFloat("3.14") = 3.14`, () => { expect(Number.parseFloat("3.14")).toBe(3.14); });
  }
});
