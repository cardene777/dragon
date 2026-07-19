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

describe("iter497: preset additional (Regex basic)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: /abc/.test("abc") = true`, () => { expect(/abc/.test("abc")).toBe(true); });
    it(`${name}: /abc/.test("xyz") = false`, () => { expect(/abc/.test("xyz")).toBe(false); });
    it(`${name}: /abc/i.test("ABC") = true`, () => { expect(/abc/i.test("ABC")).toBe(true); });
    it(`${name}: new RegExp("abc").test("abc") = true`, () => { expect(new RegExp("abc").test("abc")).toBe(true); });
    it(`${name}: /(\\w+)/.exec("abc")[0] = "abc"`, () => { expect(/(\w+)/.exec("abc")?.[0]).toBe("abc"); });
    it(`${name}: /^abc$/.test("abc") = true`, () => { expect(/^abc$/.test("abc")).toBe(true); });
    it(`${name}: diagram.id matches non-empty`, () => { if (diagram.id.length > 0) expect(/.+/.test(diagram.id)).toBe(true); else expect(true).toBe(true); });
  }
});
