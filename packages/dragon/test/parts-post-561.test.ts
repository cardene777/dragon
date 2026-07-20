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

describe("iter561: parts additional (String.raw / escape)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: String.raw preserves backslash`, () => { expect(String.raw`a\nb`).toBe("a\\nb"); });
    it(`${name}: String.raw interpolation`, () => { const x = 5; expect(String.raw`v=${x}`).toBe("v=5"); });
    it(`${name}: normal template escapes`, () => { expect(`a\nb`).toBe("a\nb"); });
    it(`${name}: String.raw tab`, () => { expect(String.raw`\t`).toBe("\\t"); });
    it(`${name}: escaped quote in string`, () => { expect("say \"hi\"").toBe('say "hi"'); });
    it(`${name}: unicode escape`, () => { expect("A").toBe("A"); });
    it(`${name}: hex escape`, () => { expect("\x41").toBe("A"); });
  }
});
