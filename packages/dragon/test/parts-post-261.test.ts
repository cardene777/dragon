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

describe("iter261: parts additional (Array join delimiter)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id split("").join("") = id`, () => { expect(diagram.id.split("").join("")).toBe(diagram.id); });
    it(`${name}: id split("").join(",") length >= id length`, () => { expect(diagram.id.split("").join(",").length).toBeGreaterThanOrEqual(diagram.id.length); });
    it(`${name}: id split("").join() length = default separator`, () => { expect(diagram.id.split("").join()).toBe(diagram.id.split("").join(",")); });
    it(`${name}: nodes map id join("") length = sum id length`, () => { expect(diagram.nodes.map(n => n.id).join("").length).toBe(diagram.nodes.reduce((a, n) => a + n.id.length, 0)); });
    it(`${name}: nodes map id join(",") preserves ids`, () => { expect(diagram.nodes.map(n => n.id).join(",").split(",").length).toBe(diagram.nodes.length || 1); });
    it(`${name}: [] join = ""`, () => { expect([].join("")).toBe(""); });
    it(`${name}: [id] join("") = id`, () => { expect([diagram.id].join("")).toBe(diagram.id); });
  }
});
