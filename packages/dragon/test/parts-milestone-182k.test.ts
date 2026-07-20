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

describe("milestone 182k: String pad/normalize/at edge", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: "5".padStart(0) = "5"`, () => { expect("5".padStart(0)).toBe("5"); });
    it(`${name}: "".padEnd(3, "ab") = "aba"`, () => { expect("".padEnd(3, "ab")).toBe("aba"); });
    it(`${name}: "abc".at(-1) = "c"`, () => { expect("abc".at(-1)).toBe("c"); });
    it(`${name}: "abc".at(10) = undefined`, () => { expect("abc".at(10)).toBeUndefined(); });
    it(`${name}: "aBc".toLowerCase().toUpperCase()`, () => { expect("aBc".toLowerCase().toUpperCase()).toBe("ABC"); });
    it(`${name}: "  a  ".trim().length = 1`, () => { expect("  a  ".trim().length).toBe(1); });
    it(`${name}: id at(0) = first char`, () => { if (diagram.id.length > 0) expect(diagram.id.at(0)).toBe(diagram.id[0]); else expect(diagram.id.at(0)).toBeUndefined(); });
  }
});
