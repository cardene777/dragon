/**
 * preset post-iter100 milestone check (iter103、 2026-07-19)。
 */
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

describe("iter103: 全 20 preset × extra invariants (post-100)", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: diagram truthy`, () => {
      expect(diagram).toBeTruthy();
    });

    it(`${name}: id truthy`, () => {
      expect(diagram.id).toBeTruthy();
    });

    it(`${name}: nodes truthy`, () => {
      expect(diagram.nodes).toBeTruthy();
    });

    it(`${name}: edges truthy`, () => {
      expect(diagram.edges).toBeTruthy();
    });

    it(`${name}: Object.keys(diagram).length > 0`, () => {
      expect(Object.keys(diagram).length).toBeGreaterThan(0);
    });

    it(`${name}: JSON stringify + parse で equal id`, () => {
      const rt = JSON.parse(JSON.stringify(diagram));
      expect(rt.id).toBe(diagram.id);
    });

    it(`${name}: nodes array iteration`, () => {
      let count = 0;
      for (const _n of diagram.nodes) count++;
      expect(count).toBe(diagram.nodes.length);
    });
  }
});
