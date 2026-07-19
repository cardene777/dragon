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

describe("iter407: preset additional (URL/URLSearchParams)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: new URL("https://a.com").href = "https://a.com/"`, () => { expect(new URL("https://a.com").href).toBe("https://a.com/"); });
    it(`${name}: new URL("https://a.com/x").pathname = /x`, () => { expect(new URL("https://a.com/x").pathname).toBe("/x"); });
    it(`${name}: new URLSearchParams("a=1").get("a") = "1"`, () => { expect(new URLSearchParams("a=1").get("a")).toBe("1"); });
    it(`${name}: new URLSearchParams("a=1&b=2").size = 2`, () => { expect(new URLSearchParams("a=1&b=2").size).toBe(2); });
    it(`${name}: URLSearchParams append/get`, () => { const p = new URLSearchParams(); p.append("k", "v"); expect(p.get("k")).toBe("v"); });
    it(`${name}: URLSearchParams has/delete`, () => { const p = new URLSearchParams("a=1"); expect(p.has("a")).toBe(true); p.delete("a"); expect(p.has("a")).toBe(false); });
    it(`${name}: URL protocol https:`, () => { expect(new URL("https://a.com").protocol).toBe("https:"); });
  }
});
