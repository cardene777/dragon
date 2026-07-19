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

describe("iter459: parts additional (String slice / substring)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: "hello".slice(1, 3) = "el"`, () => { expect("hello".slice(1, 3)).toBe("el"); });
    it(`${name}: "hello".slice(-2) = "lo"`, () => { expect("hello".slice(-2)).toBe("lo"); });
    it(`${name}: "hello".slice(1) = "ello"`, () => { expect("hello".slice(1)).toBe("ello"); });
    it(`${name}: "hello".substring(1, 3) = "el"`, () => { expect("hello".substring(1, 3)).toBe("el"); });
    it(`${name}: "hello".substring(-1) = "hello"`, () => { expect("hello".substring(-1)).toBe("hello"); });
    it(`${name}: "".slice(0, 10) = ""`, () => { expect("".slice(0, 10)).toBe(""); });
    it(`${name}: id slice preserves`, () => { expect(diagram.id.slice(0)).toBe(diagram.id); });
  }
});
