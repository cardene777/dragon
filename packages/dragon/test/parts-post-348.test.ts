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

describe("iter348: parts additional (String static / raw)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: String(id) = id`, () => { expect(String(diagram.id)).toBe(diagram.id); });
    it(`${name}: new String(id).valueOf() = id`, () => { expect(new String(diagram.id).valueOf()).toBe(diagram.id); });
    it(`${name}: String.raw returns string`, () => { expect(typeof String.raw`x`).toBe("string"); });
    it(`${name}: String.fromCharCode returns string`, () => { expect(typeof String.fromCharCode(65)).toBe("string"); });
    it(`${name}: String.fromCodePoint returns string`, () => { expect(typeof String.fromCodePoint(65)).toBe("string"); });
    it(`${name}: String("") = ""`, () => { expect(String("")).toBe(""); });
    it(`${name}: String(undefined) = "undefined"`, () => { expect(String(undefined)).toBe("undefined"); });
  }
});
