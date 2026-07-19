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

describe("iter236-milestone: parts 57k (String split behavior)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id split "" length = id length`, () => { expect(diagram.id.split("").length).toBe(diagram.id.length); });
    it(`${name}: id split "" join "" = id`, () => { expect(diagram.id.split("").join("")).toBe(diagram.id); });
    it(`${name}: id split "___NOTEXIST___" length 1`, () => { expect(diagram.id.split("___NOTEXIST___").length).toBe(1); });
  }
});
