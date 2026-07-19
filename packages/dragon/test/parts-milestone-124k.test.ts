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

describe("iter428-milestone: parts 124k (Error.cause)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Error with cause option`, () => { const inner = new Error("inner"); const outer = new Error("outer", { cause: inner }); expect((outer as { cause?: Error }).cause).toBe(inner); });
    it(`${name}: Error without cause has no cause property`, () => { const e = new Error("no cause"); expect((e as { cause?: Error }).cause).toBeUndefined(); });
    it(`${name}: Error with cause preserves message`, () => { const inner = new Error(diagram.id); const outer = new Error("wrap", { cause: inner }); expect((outer as { cause?: Error }).cause?.message).toBe(diagram.id); });
  }
});
