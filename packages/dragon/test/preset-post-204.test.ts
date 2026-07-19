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

describe("iter206: preset additional (String replace/replaceAll)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id replace empty = same`, () => { expect(diagram.id.replace("", "")).toBe(diagram.id); });
    it(`${name}: id replaceAll self self = same`, () => { expect(diagram.id.replaceAll(diagram.id, diagram.id)).toBe(diagram.id); });
    it(`${name}: id replace self "" = ""`, () => { expect(diagram.id.replace(diagram.id, "")).toBe(""); });
    it(`${name}: id replaceAll nonexistent = id`, () => { expect(diagram.id.replaceAll("___NOTEXIST___", "X")).toBe(diagram.id); });
    it(`${name}: id replace nonexistent regex = id`, () => { expect(diagram.id.replace(/___NOTEXIST_XYZ___/, "Q")).toBe(diagram.id); });
    it(`${name}: id normalize NFC idempotent`, () => { expect(diagram.id.normalize("NFC").normalize("NFC")).toBe(diagram.id.normalize("NFC")); });
    it(`${name}: id normalize NFD idempotent`, () => { expect(diagram.id.normalize("NFD").normalize("NFD")).toBe(diagram.id.normalize("NFD")); });
  }
});
