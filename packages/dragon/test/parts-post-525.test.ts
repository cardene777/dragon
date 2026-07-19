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

describe("iter525: parts additional (URL)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new URL("https://a.com/x") host`, () => { expect(new URL("https://a.com/x").host).toBe("a.com"); });
    it(`${name}: new URL protocol`, () => { expect(new URL("https://a.com").protocol).toBe("https:"); });
    it(`${name}: new URL pathname`, () => { expect(new URL("https://a.com/foo/bar").pathname).toBe("/foo/bar"); });
    it(`${name}: new URL search`, () => { expect(new URL("https://a.com?a=1&b=2").search).toBe("?a=1&b=2"); });
    it(`${name}: new URL hash`, () => { expect(new URL("https://a.com#top").hash).toBe("#top"); });
    it(`${name}: invalid URL throws`, () => { expect(() => new URL("not a url")).toThrow(); });
    it(`${name}: new URL("./b", "https://a.com/c/") resolves`, () => { expect(new URL("./b", "https://a.com/c/").href).toBe("https://a.com/c/b"); });
  }
});
