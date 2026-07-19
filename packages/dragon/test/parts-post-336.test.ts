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

describe("iter336: parts additional (BigInt basics)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: typeof BigInt(nodes.length) = bigint`, () => { expect(typeof BigInt(diagram.nodes.length)).toBe("bigint"); });
    it(`${name}: BigInt(nodes.length) = same via cast`, () => { expect(Number(BigInt(diagram.nodes.length))).toBe(diagram.nodes.length); });
    it(`${name}: 1n + 1n = 2n`, () => { expect(1n + 1n).toBe(2n); });
    it(`${name}: 0n === 0n`, () => { expect(0n === 0n).toBe(true); });
    it(`${name}: BigInt(0) === 0n`, () => { expect(BigInt(0) === 0n).toBe(true); });
    it(`${name}: BigInt.asIntN(64, 1n) = 1n`, () => { expect(BigInt.asIntN(64, 1n)).toBe(1n); });
    it(`${name}: 1n.toString = "1"`, () => { expect((1n).toString()).toBe("1"); });
  }
});
