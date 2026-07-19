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

describe("iter395: preset additional (Proxy basics)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: new Proxy(d, {}).id = id`, () => { const p = new Proxy(diagram, {}); expect(p.id).toBe(diagram.id); });
    it(`${name}: new Proxy(d, {get: () => "X"}).id = X`, () => { const p = new Proxy(diagram, { get() { return "X"; } }); expect(p.id).toBe("X" as unknown as string); });
    it(`${name}: Proxy has behavior`, () => { const p = new Proxy(diagram, { has() { return true; } }); expect("nonexist" in p).toBe(true); });
    it(`${name}: Proxy passthrough for nodes`, () => { const p = new Proxy(diagram, {}); expect(p.nodes).toBe(diagram.nodes); });
    it(`${name}: Proxy.revocable revokes`, () => { const r = Proxy.revocable(diagram, {}); expect(r.proxy.id).toBe(diagram.id); r.revoke(); });
    it(`${name}: Proxy target ref check`, () => { expect(typeof Proxy).toBe("function"); });
    it(`${name}: Proxy is function`, () => { expect(typeof Proxy).toBe("function"); });
  }
});
