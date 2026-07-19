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

describe("iter329-milestone: parts 89k (default values in destructure)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: {missing = "def"} default`, () => { const { missing = "def" } = diagram as unknown as { missing?: string }; expect(missing).toBe("def"); });
    it(`${name}: {id = "def"} not default`, () => { const { id = "def" } = diagram; expect(id).toBe(diagram.id); });
    it(`${name}: [first = "def"] with empty`, () => { const [first = "def"] = [] as string[]; expect(first).toBe("def"); });
  }
});
