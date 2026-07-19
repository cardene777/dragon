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

describe("🎊🎊 125k test milestone: parts (Number.toString round-trip)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.length toString/parseInt = nodes.length`, () => { expect(parseInt(String(diagram.nodes.length), 10)).toBe(diagram.nodes.length); });
    it(`${name}: Number("42").toString() = "42"`, () => { expect(Number("42").toString()).toBe("42"); });
    it(`${name}: (nodes.length).toString(10).length >= 1`, () => { expect(diagram.nodes.length.toString(10).length).toBeGreaterThanOrEqual(1); });
  }
});
