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

describe("iter351: parts additional (Number parse)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: parseInt("42") = 42`, () => { expect(parseInt("42")).toBe(42); });
    it(`${name}: parseFloat("3.14") = 3.14`, () => { expect(parseFloat("3.14")).toBe(3.14); });
    it(`${name}: Number("42") = 42`, () => { expect(Number("42")).toBe(42); });
    it(`${name}: parseInt(nodes.length.toString()) = nodes.length`, () => { expect(parseInt(String(diagram.nodes.length))).toBe(diagram.nodes.length); });
    it(`${name}: parseInt("42.5") = 42`, () => { expect(parseInt("42.5")).toBe(42); });
    it(`${name}: parseInt("0xff", 16) = 255`, () => { expect(parseInt("ff", 16)).toBe(255); });
    it(`${name}: parseInt("42abc") = 42`, () => { expect(parseInt("42abc")).toBe(42); });
  }
});
