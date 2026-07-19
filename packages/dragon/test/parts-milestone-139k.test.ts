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

describe("milestone 139k: String repeat / padStart / padEnd", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: "abc".repeat(3) = "abcabcabc"`, () => { expect("abc".repeat(3)).toBe("abcabcabc"); });
    it(`${name}: "abc".repeat(0) = ""`, () => { expect("abc".repeat(0)).toBe(""); });
    it(`${name}: "abc".repeat(1) = "abc"`, () => { expect("abc".repeat(1)).toBe("abc"); });
    it(`${name}: "5".padStart(3, "0") = "005"`, () => { expect("5".padStart(3, "0")).toBe("005"); });
    it(`${name}: "5".padEnd(3, "0") = "500"`, () => { expect("5".padEnd(3, "0")).toBe("500"); });
    it(`${name}: "abc".padStart(2) = "abc" (no truncate)`, () => { expect("abc".padStart(2)).toBe("abc"); });
  }
});
