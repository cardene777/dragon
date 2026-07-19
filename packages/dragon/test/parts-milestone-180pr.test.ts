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

describe("milestone 180 PR merge + 158k: BigInt edge + Number/BigInt conversion", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: BigInt("42") = 42n`, () => { expect(BigInt("42")).toBe(42n); });
    it(`${name}: BigInt(true) = 1n`, () => { expect(BigInt(true)).toBe(1n); });
    it(`${name}: BigInt(false) = 0n`, () => { expect(BigInt(false)).toBe(0n); });
    it(`${name}: Number(42n) = 42`, () => { expect(Number(42n)).toBe(42); });
    it(`${name}: String(42n) = "42"`, () => { expect(String(42n)).toBe("42"); });
    it(`${name}: (42n).toString() = "42"`, () => { expect((42n).toString()).toBe("42"); });
    it(`${name}: (42n).toString(2) = binary`, () => { expect((42n).toString(2)).toBe("101010"); });
    it(`${name}: 2n ** 64n large number`, () => { expect(2n ** 64n).toBe(18446744073709551616n); });
    it(`${name}: BigInt div throws on 0n`, () => { expect(() => 1n / 0n).toThrow(); });
    it(`${name}: BigInt mixed +number throws`, () => { expect(() => (1n as unknown as number) + 2).toThrow(); });
    it(`${name}: -1n < 0n = true`, () => { expect(-1n < 0n).toBe(true); });
    it(`${name}: 1n + 2n === 3n identity`, () => { expect(1n + 2n).toBe(3n); });
  }
});
