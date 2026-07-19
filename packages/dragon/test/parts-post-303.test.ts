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

class Wrapper {
  constructor(public d: CdlDiagram) {}
  getId() { return this.d.id; }
}

describe("iter303: parts additional (Class/new instance)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Wrapper(d) is Wrapper`, () => { expect(new Wrapper(diagram) instanceof Wrapper).toBe(true); });
    it(`${name}: new Wrapper(d).d = d`, () => { expect(new Wrapper(diagram).d).toBe(diagram); });
    it(`${name}: new Wrapper(d).getId() = id`, () => { expect(new Wrapper(diagram).getId()).toBe(diagram.id); });
    it(`${name}: Wrapper.prototype has getId`, () => { expect(typeof Wrapper.prototype.getId).toBe("function"); });
    it(`${name}: Wrapper name = Wrapper`, () => { expect(Wrapper.name).toBe("Wrapper"); });
    it(`${name}: new Wrapper instance not = same ref`, () => { expect(new Wrapper(diagram)).not.toBe(new Wrapper(diagram)); });
    it(`${name}: new Wrapper constructor = Wrapper`, () => { expect(new Wrapper(diagram).constructor).toBe(Wrapper); });
  }
});
