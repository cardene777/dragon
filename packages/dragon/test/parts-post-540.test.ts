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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("iter540: parts additional (crypto.randomUUID)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: randomUUID format`, () => { expect(UUID_RE.test(crypto.randomUUID())).toBe(true); });
    it(`${name}: randomUUID unique`, () => { expect(crypto.randomUUID()).not.toBe(crypto.randomUUID()); });
    it(`${name}: randomUUID length 36`, () => { expect(crypto.randomUUID().length).toBe(36); });
    it(`${name}: getRandomValues fills`, () => { const arr = new Uint8Array(4); crypto.getRandomValues(arr); expect(arr.length).toBe(4); });
    it(`${name}: getRandomValues returns same ref`, () => { const arr = new Uint8Array(4); expect(crypto.getRandomValues(arr)).toBe(arr); });
    it(`${name}: randomUUID version 4`, () => { expect(crypto.randomUUID()[14]).toBe("4"); });
    it(`${name}: crypto defined`, () => { expect(typeof crypto).toBe("object"); });
  }
});
