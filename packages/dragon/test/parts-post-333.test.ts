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

describe("iter333: parts additional (Nullish/Optional chaining)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id ?? "def" = id`, () => { expect(diagram.id ?? "def").toBe(diagram.id); });
    it(`${name}: null ?? id = id`, () => { expect((null as string | null) ?? diagram.id).toBe(diagram.id); });
    it(`${name}: undefined ?? id = id`, () => { expect((undefined as string | undefined) ?? diagram.id).toBe(diagram.id); });
    it(`${name}: d?.id = id`, () => { expect(diagram?.id).toBe(diagram.id); });
    it(`${name}: d?.nodes?.length = nodes length`, () => { expect(diagram?.nodes?.length).toBe(diagram.nodes.length); });
    it(`${name}: undefined?.id = undefined`, () => { const u: undefined | typeof diagram = undefined; expect(u?.id).toBeUndefined(); });
    it(`${name}: null?.id = undefined`, () => { const n: null | typeof diagram = null; expect(n?.id).toBeUndefined(); });
  }
});
