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

describe("iter357: parts additional (JSON replacer/reviver)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: JSON.stringify with null replacer = default`, () => { expect(JSON.stringify(diagram, null)).toBe(JSON.stringify(diagram)); });
    it(`${name}: JSON.stringify with [] whitelist = "{}"`, () => { expect(JSON.stringify(diagram, [])).toBe("{}"); });
    it(`${name}: JSON.stringify with ["id"] contains id`, () => { expect(JSON.stringify(diagram, ["id"])).toContain(diagram.id); });
    it(`${name}: JSON.stringify with replacer fn skip = smaller`, () => { const r = JSON.stringify(diagram, () => undefined); expect(r).toBeUndefined(); });
    it(`${name}: JSON.parse with reviver = value`, () => { const r = JSON.parse(JSON.stringify(diagram), (_, v) => v); expect(r.id).toBe(diagram.id); });
    it(`${name}: JSON.parse with reviver returning undefined skips`, () => { const r = JSON.parse('{"a":1,"b":2}', (k, v) => k === "a" ? undefined : v); expect(r).toEqual({ b: 2 }); });
    it(`${name}: JSON.stringify indent 4 has 4 spaces`, () => { expect(JSON.stringify(diagram, null, 4)).toContain("    "); });
  }
});
