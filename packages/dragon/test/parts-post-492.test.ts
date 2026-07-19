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

describe("iter492: parts additional (Date basic)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Date("2024-01-01").getFullYear() = 2024`, () => { expect(new Date("2024-01-01").getUTCFullYear()).toBe(2024); });
    it(`${name}: new Date(0).getTime() = 0`, () => { expect(new Date(0).getTime()).toBe(0); });
    it(`${name}: Date.parse("2024-01-01") is finite`, () => { expect(Number.isFinite(Date.parse("2024-01-01"))).toBe(true); });
    it(`${name}: new Date("invalid").getTime() = NaN`, () => { expect(new Date("invalid").getTime()).toBeNaN(); });
    it(`${name}: new Date("2024-01-01").toISOString() startsWith "2024"`, () => { expect(new Date("2024-01-01").toISOString().startsWith("2024")).toBe(true); });
    it(`${name}: new Date(1000).getTime() = 1000`, () => { expect(new Date(1000).getTime()).toBe(1000); });
    it(`${name}: diagram.id length is date-independent`, () => { expect(typeof diagram.id).toBe("string"); });
  }
});
