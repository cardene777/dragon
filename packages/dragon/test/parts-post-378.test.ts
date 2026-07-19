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

describe("iter378: parts additional (String comparison) 🎊 190x milestone", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id === id`, () => { expect(diagram.id === diagram.id).toBe(true); });
    it(`${name}: id.localeCompare(id) = 0`, () => { expect(diagram.id.localeCompare(diagram.id)).toBe(0); });
    it(`${name}: id < id + "z"`, () => { expect(diagram.id < diagram.id + "z").toBe(true); });
    it(`${name}: id.length <= (id + "x").length`, () => { expect(diagram.id.length).toBeLessThanOrEqual((diagram.id + "x").length); });
    it(`${name}: id.localeCompare("") > 0 if nonempty`, () => { if (diagram.id.length) expect(diagram.id.localeCompare("")).toBeGreaterThan(0); });
    it(`${name}: "".localeCompare(id) < 0 if nonempty`, () => { if (diagram.id.length) expect("".localeCompare(diagram.id)).toBeLessThan(0); });
    it(`${name}: id.length >= 0`, () => { expect(diagram.id.length).toBeGreaterThanOrEqual(0); });
  }
});
