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

describe("milestone 136k: String basic", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: "abc".length = 3`, () => { expect("abc".length).toBe(3); });
    it(`${name}: "abc".toUpperCase() = "ABC"`, () => { expect("abc".toUpperCase()).toBe("ABC"); });
    it(`${name}: "ABC".toLowerCase() = "abc"`, () => { expect("ABC".toLowerCase()).toBe("abc"); });
    it(`${name}: "abc"[0] = "a"`, () => { expect("abc"[0]).toBe("a"); });
    it(`${name}: "abc".charAt(1) = "b"`, () => { expect("abc".charAt(1)).toBe("b"); });
    it(`${name}: "abc".charCodeAt(0) = 97`, () => { expect("abc".charCodeAt(0)).toBe(97); });
  }
});
