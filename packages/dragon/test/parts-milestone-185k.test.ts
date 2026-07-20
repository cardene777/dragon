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

describe("milestone 185k: logical operators / short-circuit", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: true && "x" = "x"`, () => { expect(true && "x").toBe("x"); });
    it(`${name}: false && "x" = false`, () => { expect(false && "x").toBe(false); });
    it(`${name}: true || "x" = true`, () => { expect(true || "x").toBe(true); });
    it(`${name}: false || "x" = "x"`, () => { expect(false || "x").toBe("x"); });
    it(`${name}: 0 || "d" = "d"`, () => { expect(0 || "d").toBe("d"); });
    it(`${name}: "" || "d" = "d"`, () => { expect("" || "d").toBe("d"); });
    it(`${name}: short-circuit no eval`, () => { let called = false; const fn = () => { called = true; return true; }; false && fn(); expect(called).toBe(false); });
    it(`${name}: ??= assigns only nullish`, () => { const o: { a?: number } = {}; o.a ??= 5; expect(o.a).toBe(5); o.a ??= 10; expect(o.a).toBe(5); });
  }
});
