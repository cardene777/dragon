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

describe("iter282: parts additional (Function bind/call/apply)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: identity fn returns diagram`, () => { const f = (x: CdlDiagram) => x; expect(f(diagram)).toBe(diagram); });
    it(`${name}: identity.call(null, d) = d`, () => { const f = function (x: CdlDiagram) { return x; }; expect(f.call(null, diagram)).toBe(diagram); });
    it(`${name}: identity.apply(null, [d]) = d`, () => { const f = function (x: CdlDiagram) { return x; }; expect(f.apply(null, [diagram])).toBe(diagram); });
    it(`${name}: identity.bind(null)(d) = d`, () => { const f = function (x: CdlDiagram) { return x; }; expect(f.bind(null)(diagram)).toBe(diagram); });
    it(`${name}: identity.bind(null, d)() = d`, () => { const f = function (x: CdlDiagram) { return x; }; expect(f.bind(null, diagram)()).toBe(diagram); });
    it(`${name}: typeof identity = function`, () => { expect(typeof ((x: CdlDiagram) => x)).toBe("function"); });
    it(`${name}: identity.length = 1`, () => { expect(((x: CdlDiagram) => x).length).toBe(1); });
  }
});
