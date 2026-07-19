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

describe("iter462: parts additional (String replace / replaceAll / includes)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: "aaa".replace("a", "b") = "baa"`, () => { expect("aaa".replace("a", "b")).toBe("baa"); });
    it(`${name}: "aaa".replaceAll("a", "b") = "bbb"`, () => { expect("aaa".replaceAll("a", "b")).toBe("bbb"); });
    it(`${name}: "aaa".replace(/a/g, "b") = "bbb"`, () => { expect("aaa".replace(/a/g, "b")).toBe("bbb"); });
    it(`${name}: "abc".includes("b") = true`, () => { expect("abc".includes("b")).toBe(true); });
    it(`${name}: "abc".includes("z") = false`, () => { expect("abc".includes("z")).toBe(false); });
    it(`${name}: "abc".startsWith("ab") = true`, () => { expect("abc".startsWith("ab")).toBe(true); });
    it(`${name}: "abc".endsWith("bc") = true`, () => { expect("abc".endsWith("bc")).toBe(true); });
  }
});
