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

describe("iter196: preset additional (String static methods)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: String.raw eq id`, () => { expect(String.raw({ raw: [diagram.id] as unknown as TemplateStringsArray })).toBe(diagram.id); });
    it(`${name}: String() coerce = id`, () => { expect(String(diagram.id)).toBe(diagram.id); });
    it(`${name}: id + "" = id`, () => { expect(diagram.id + "").toBe(diagram.id); });
    it(`${name}: id backtick = id`, () => { expect(`${diagram.id}`).toBe(diagram.id); });
    it(`${name}: id normalize eq (default NFC)`, () => { expect(diagram.id.normalize()).toBe(diagram.id.normalize("NFC")); });
    it(`${name}: id normalize length eq id length`, () => { expect(diagram.id.normalize("NFC").length).toBe(diagram.id.length); });
    it(`${name}: id localeCompare self = 0`, () => { expect(diagram.id.localeCompare(diagram.id)).toBe(0); });
  }
});
