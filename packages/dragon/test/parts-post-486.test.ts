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

describe("iter486: parts additional (Map basic)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Map([["a", 1]]).get("a") = 1`, () => { expect(new Map([["a", 1]]).get("a")).toBe(1); });
    it(`${name}: new Map().set("a", 1).get("a") = 1`, () => { expect(new Map().set("a", 1).get("a")).toBe(1); });
    it(`${name}: new Map([["a", 1]]).has("a") = true`, () => { expect(new Map([["a", 1]]).has("a")).toBe(true); });
    it(`${name}: new Map([["a", 1]]).size = 1`, () => { expect(new Map([["a", 1]]).size).toBe(1); });
    it(`${name}: new Map().get("x") = undefined`, () => { expect(new Map().get("x")).toBeUndefined(); });
    it(`${name}: new Map([["a", 1]]).delete("a") = true`, () => { expect(new Map([["a", 1]]).delete("a")).toBe(true); });
    it(`${name}: nodes map to Map preserves size`, () => { const m = new Map(diagram.nodes.map((n, i) => [i, n])); expect(m.size).toBe(diagram.nodes.length); });
  }
});
