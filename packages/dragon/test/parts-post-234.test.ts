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

describe("iter234: parts additional (String search/match)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id search empty regex = 0`, () => { expect(diagram.id.search(new RegExp(""))).toBe(0); });
    it(`${name}: id search nonexistent = -1`, () => { expect(diagram.id.search(/___NOTEXIST_ZXY___/)).toBe(-1); });
    it(`${name}: id match empty = null OR []`, () => { const r = diagram.id.match(""); expect(r === null || Array.isArray(r)).toBe(true); });
    it(`${name}: id match nonexistent = null`, () => { expect(diagram.id.match(/___NOTEXIST_ZXY___/)).toBeNull(); });
    it(`${name}: id matchAll nonexistent = 0 iterations`, () => { expect([...diagram.id.matchAll(/___NOTEXIST_ZXY___/g)].length).toBe(0); });
    it(`${name}: id search self >= 0`, () => { if (diagram.id.length) expect(diagram.id.search(diagram.id)).toBe(0); });
    it(`${name}: id split with self = ["",""]`, () => { if (diagram.id.length) expect(diagram.id.split(diagram.id)).toEqual(["", ""]); });
  }
});
