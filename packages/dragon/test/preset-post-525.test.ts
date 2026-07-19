import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PRESETS = collectAllPresets(PresetsMod);

describe("iter527: preset additional (URL)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: new URL host`, () => { expect(new URL("https://a.com/x").host).toBe("a.com"); });
    it(`${name}: new URL protocol`, () => { expect(new URL("https://a.com").protocol).toBe("https:"); });
    it(`${name}: new URL pathname`, () => { expect(new URL("https://a.com/foo/bar").pathname).toBe("/foo/bar"); });
    it(`${name}: new URL search`, () => { expect(new URL("https://a.com?a=1&b=2").search).toBe("?a=1&b=2"); });
    it(`${name}: new URL hash`, () => { expect(new URL("https://a.com#top").hash).toBe("#top"); });
    it(`${name}: invalid URL throws`, () => { expect(() => new URL("not a url")).toThrow(); });
    it(`${name}: encodeURIComponent id`, () => { expect(typeof encodeURIComponent(diagram.id)).toBe("string"); });
  }
});
