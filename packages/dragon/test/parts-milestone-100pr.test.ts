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

describe("🎊🎊 100 PR merge milestone: parts (Reflect.ownKeys / Reflect.has)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Reflect.ownKeys length >= 3`, () => { expect(Reflect.ownKeys(diagram).length).toBeGreaterThanOrEqual(3); });
    it(`${name}: Reflect.has(id) = true`, () => { expect(Reflect.has(diagram, "id")).toBe(true); });
    it(`${name}: Reflect.has(nonexist) = false`, () => { expect(Reflect.has(diagram, "___NOTEXIST___")).toBe(false); });
  }
});
