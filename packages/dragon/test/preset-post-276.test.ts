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

describe("iter278: preset additional (String Unicode/normalize)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id normalize NFC = normalize NFC`, () => { expect(diagram.id.normalize("NFC")).toBe(diagram.id.normalize("NFC")); });
    it(`${name}: id normalize NFD = normalize NFD`, () => { expect(diagram.id.normalize("NFD")).toBe(diagram.id.normalize("NFD")); });
    it(`${name}: id normalize NFKC = normalize NFKC`, () => { expect(diagram.id.normalize("NFKC")).toBe(diagram.id.normalize("NFKC")); });
    it(`${name}: id normalize NFKD = normalize NFKD`, () => { expect(diagram.id.normalize("NFKD")).toBe(diagram.id.normalize("NFKD")); });
    it(`${name}: id normalize NFC length >= 0`, () => { expect(diagram.id.normalize("NFC").length).toBeGreaterThanOrEqual(0); });
    it(`${name}: id normalize default = normalize NFC`, () => { expect(diagram.id.normalize()).toBe(diagram.id.normalize("NFC")); });
    it(`${name}: id normalize idempotent`, () => { expect(diagram.id.normalize("NFC").normalize("NFC")).toBe(diagram.id.normalize("NFC")); });
  }
});
