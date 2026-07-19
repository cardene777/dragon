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

describe("milestone 154k: Regex groups / flags", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: /(a)(b)/.exec("ab") groups`, () => { const m = /(a)(b)/.exec("ab"); expect(m?.[1]).toBe("a"); expect(m?.[2]).toBe("b"); });
    it(`${name}: named group`, () => { const m = /(?<first>\w)/.exec("abc"); expect(m?.groups?.first).toBe("a"); });
    it(`${name}: /a/g.flags = "g"`, () => { expect(/a/g.flags).toBe("g"); });
    it(`${name}: /a/gim.flags contains gim`, () => { expect(/a/gim.flags).toContain("g"); expect(/a/gim.flags).toContain("i"); expect(/a/gim.flags).toContain("m"); });
    it(`${name}: /a/g.source = "a"`, () => { expect(/a/g.source).toBe("a"); });
    it(`${name}: /a/g.global = true`, () => { expect(/a/g.global).toBe(true); });
  }
});
