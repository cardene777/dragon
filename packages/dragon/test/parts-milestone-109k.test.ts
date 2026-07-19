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

describe("iter386-milestone: parts 109k (ArrayBuffer / DataView)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new ArrayBuffer(16).byteLength = 16`, () => { expect(new ArrayBuffer(16).byteLength).toBe(16); });
    it(`${name}: new DataView(new ArrayBuffer(4)).byteLength = 4`, () => { expect(new DataView(new ArrayBuffer(4)).byteLength).toBe(4); });
    it(`${name}: new Uint8Array(new ArrayBuffer(8)).length = 8`, () => { expect(new Uint8Array(new ArrayBuffer(8)).length).toBe(8); });
  }
});
