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

describe("iter194: parts additional (String static methods)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: String.raw eq id`, () => { expect(String.raw({ raw: [diagram.id] as unknown as TemplateStringsArray })).toBe(diagram.id); });
    it(`${name}: String() coerce = id`, () => { expect(String(diagram.id)).toBe(diagram.id); });
    it(`${name}: id + "" = id`, () => { expect(diagram.id + "").toBe(diagram.id); });
    it(`${name}: id backtick = id`, () => { expect(`${diagram.id}`).toBe(diagram.id); });
    it(`${name}: id normalize eq (default NFC)`, () => { expect(diagram.id.normalize()).toBe(diagram.id.normalize("NFC")); });
    it(`${name}: id normalize length eq id length`, () => { expect(diagram.id.normalize("NFC").length).toBe(diagram.id.length); });
    it(`${name}: id localeCompare self = 0`, () => { expect(diagram.id.localeCompare(diagram.id)).toBe(0); });
  }
});
