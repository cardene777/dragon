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

describe("milestone 140k (大台): String match / matchAll / normalize", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: "abc".match(/b/) not null`, () => { expect("abc".match(/b/)).not.toBeNull(); });
    it(`${name}: "abc".match(/z/) is null`, () => { expect("abc".match(/z/)).toBeNull(); });
    it(`${name}: "abc".match(/b/)?.[0] = "b"`, () => { expect("abc".match(/b/)?.[0]).toBe("b"); });
    it(`${name}: "aaa".match(/a/g) length = 3`, () => { expect("aaa".match(/a/g)?.length).toBe(3); });
    it(`${name}: [..."aaa".matchAll(/a/g)].length = 3`, () => { expect([..."aaa".matchAll(/a/g)].length).toBe(3); });
    it(`${name}: "abc".normalize() = "abc"`, () => { expect("abc".normalize()).toBe("abc"); });
    it(`${name}: "abc".normalize("NFC") = "abc"`, () => { expect("abc".normalize("NFC")).toBe("abc"); });
    it(`${name}: id normalize preserves`, () => { expect(diagram.id.normalize()).toBe(diagram.id); });
  }
});
