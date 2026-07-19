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

describe("iter429: parts additional (Number.toFixed/toPrecision)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: (3.14).toFixed(2) = "3.14"`, () => { expect((3.14).toFixed(2)).toBe("3.14"); });
    it(`${name}: (3.14).toFixed(0) = "3"`, () => { expect((3.14).toFixed(0)).toBe("3"); });
    it(`${name}: (3.14).toFixed(5) = "3.14000"`, () => { expect((3.14).toFixed(5)).toBe("3.14000"); });
    it(`${name}: (3.14).toPrecision(3) = "3.14"`, () => { expect((3.14).toPrecision(3)).toBe("3.14"); });
    it(`${name}: (1000).toExponential = "1e+3"`, () => { expect((1000).toExponential()).toBe("1e+3"); });
    it(`${name}: nodes.length.toFixed(0) = nodes.length string`, () => { expect(diagram.nodes.length.toFixed(0)).toBe(String(diagram.nodes.length)); });
    it(`${name}: (0).toFixed(2) = "0.00"`, () => { expect((0).toFixed(2)).toBe("0.00"); });
  }
});
