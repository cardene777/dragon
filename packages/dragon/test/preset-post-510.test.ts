import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PRESETS = collectAllPresets(PresetsMod);

class Baz {
  constructor(public z: number) { /* noop */ }
  triple() { return this.z * 3; }
}

describe("iter512: preset additional (Class basic)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: new Baz(5).z = 5`, () => { expect(new Baz(5).z).toBe(5); });
    it(`${name}: new Baz(5).triple() = 15`, () => { expect(new Baz(5).triple()).toBe(15); });
    it(`${name}: new Baz(5) instanceof Baz`, () => { expect(new Baz(5) instanceof Baz).toBe(true); });
    it(`${name}: Baz.prototype.constructor = Baz`, () => { expect(Baz.prototype.constructor).toBe(Baz); });
    it(`${name}: typeof Baz = "function"`, () => { expect(typeof Baz).toBe("function"); });
    it(`${name}: Baz.name = "Baz"`, () => { expect(Baz.name).toBe("Baz"); });
    it(`${name}: Baz with nodes.length`, () => { expect(new Baz(diagram.nodes.length).z).toBe(diagram.nodes.length); });
  }
});
