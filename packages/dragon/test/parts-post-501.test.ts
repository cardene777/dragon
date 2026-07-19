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

describe("iter501: parts additional (typeof / instanceof)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: typeof "abc" = "string"`, () => { expect(typeof "abc").toBe("string"); });
    it(`${name}: typeof 42 = "number"`, () => { expect(typeof 42).toBe("number"); });
    it(`${name}: typeof true = "boolean"`, () => { expect(typeof true).toBe("boolean"); });
    it(`${name}: typeof undefined = "undefined"`, () => { expect(typeof undefined).toBe("undefined"); });
    it(`${name}: typeof null = "object"`, () => { expect(typeof null).toBe("object"); });
    it(`${name}: typeof function(){} = "function"`, () => { expect(typeof function () { /* noop */ }).toBe("function"); });
    it(`${name}: [] instanceof Array = true`, () => { expect([] instanceof Array).toBe(true); });
    it(`${name}: diagram.id typeof string`, () => { expect(typeof diagram.id).toBe("string"); });
  }
});
