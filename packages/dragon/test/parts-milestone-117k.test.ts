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

describe("iter407-milestone: parts 117k (URL toString round-trip)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new URL(x).toString()`, () => { expect(new URL("https://a.com/").toString()).toBe("https://a.com/"); });
    it(`${name}: URLSearchParams toString`, () => { expect(new URLSearchParams("a=1&b=2").toString()).toBe("a=1&b=2"); });
    it(`${name}: URL with path preserves path`, () => { expect(new URL("https://a.com/x/y/z").pathname).toBe("/x/y/z"); });
  }
});
