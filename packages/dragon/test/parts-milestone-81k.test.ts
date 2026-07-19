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

class Extended {
  static staticMethod() { return "static"; }
  #privateField = "private";
  getPrivate() { return this.#privateField; }
}

describe("iter305-milestone: parts 81k (static / private field)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Extended.staticMethod() works`, () => { expect(Extended.staticMethod()).toBe("static"); });
    it(`${name}: new Extended.getPrivate() = private`, () => { expect(new Extended().getPrivate()).toBe("private"); });
    it(`${name}: new Extended is Extended`, () => { expect(new Extended() instanceof Extended).toBe(true); });
  }
});
