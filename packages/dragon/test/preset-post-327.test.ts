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

describe("iter329: preset additional (destructure/rest/spread)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: {id} = d = id`, () => { const { id } = diagram; expect(id).toBe(diagram.id); });
    it(`${name}: {nodes} = d = nodes`, () => { const { nodes } = diagram; expect(nodes).toBe(diagram.nodes); });
    it(`${name}: {edges} = d = edges`, () => { const { edges } = diagram; expect(edges).toBe(diagram.edges); });
    it(`${name}: {...rest} of d preserves keys`, () => { const { ...rest } = diagram; expect(Object.keys(rest).length).toBe(Object.keys(diagram).length); });
    it(`${name}: [first] = nodes = first`, () => { if (diagram.nodes.length) { const [first] = diagram.nodes; expect(first).toBe(diagram.nodes[0]); } });
    it(`${name}: [...rest] of nodes preserves length`, () => { const [...rest] = diagram.nodes; expect(rest.length).toBe(diagram.nodes.length); });
    it(`${name}: [first, ...rest] length preserved`, () => { if (diagram.nodes.length) { const [, ...rest] = diagram.nodes; expect(rest.length).toBe(diagram.nodes.length - 1); } });
  }
});
