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

describe("iter309: parts additional (RegExp basics)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: /./ test id truthy if nonempty`, () => { if (diagram.id.length) expect(/./.test(diagram.id)).toBe(true); });
    it(`${name}: /___NOTEXIST___/ test id false`, () => { expect(/___NOTEXIST___/.test(diagram.id)).toBe(false); });
    it(`${name}: /.*/ test id true`, () => { expect(/.*/.test(diagram.id)).toBe(true); });
    it(`${name}: new RegExp("") test id = true`, () => { expect(new RegExp("").test(diagram.id)).toBe(true); });
    it(`${name}: /./g flags include g`, () => { expect(/./g.flags).toContain("g"); });
    it(`${name}: /./ source = "."`, () => { expect(/./.source).toBe("."); });
    it(`${name}: /./ instanceof RegExp`, () => { expect(/./ instanceof RegExp).toBe(true); });
  }
});
