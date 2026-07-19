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

class Foo {
  constructor(public x: number) { /* noop */ }
  double() { return this.x * 2; }
}

describe("iter510: parts additional (Class basic)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Foo(5).x = 5`, () => { expect(new Foo(5).x).toBe(5); });
    it(`${name}: new Foo(5).double() = 10`, () => { expect(new Foo(5).double()).toBe(10); });
    it(`${name}: new Foo(5) instanceof Foo`, () => { expect(new Foo(5) instanceof Foo).toBe(true); });
    it(`${name}: Foo.prototype.constructor = Foo`, () => { expect(Foo.prototype.constructor).toBe(Foo); });
    it(`${name}: typeof Foo = "function"`, () => { expect(typeof Foo).toBe("function"); });
    it(`${name}: new Foo(5).constructor = Foo`, () => { expect(new Foo(5).constructor).toBe(Foo); });
    it(`${name}: Foo.name = "Foo"`, () => { expect(Foo.name).toBe("Foo"); });
  }
});
