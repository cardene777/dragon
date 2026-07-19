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

describe("iter417: parts additional (crypto.randomUUID/getRandomValues)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: typeof crypto = object`, () => { expect(typeof crypto).toBe("object"); });
    it(`${name}: typeof crypto.randomUUID = function`, () => { expect(typeof crypto.randomUUID).toBe("function"); });
    it(`${name}: crypto.randomUUID() length = 36`, () => { expect(crypto.randomUUID().length).toBe(36); });
    it(`${name}: crypto.randomUUID() has "-"`, () => { expect(crypto.randomUUID()).toContain("-"); });
    it(`${name}: two randomUUID != each other`, () => { expect(crypto.randomUUID()).not.toBe(crypto.randomUUID()); });
    it(`${name}: typeof crypto.getRandomValues = function`, () => { expect(typeof crypto.getRandomValues).toBe("function"); });
    it(`${name}: crypto.getRandomValues fills buffer`, () => { const buf = new Uint8Array(16); crypto.getRandomValues(buf); expect(buf.length).toBe(16); });
  }
});
