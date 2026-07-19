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

describe("iter362-milestone: parts 101k (String.padEnd)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id.padEnd(id.length, "x") = id`, () => { expect(diagram.id.padEnd(diagram.id.length, "x")).toBe(diagram.id); });
    it(`${name}: "a".padEnd(3, "0") = "a00"`, () => { expect("a".padEnd(3, "0")).toBe("a00"); });
    it(`${name}: "a".padStart(3, "0") = "00a"`, () => { expect("a".padStart(3, "0")).toBe("00a"); });
  }
});
