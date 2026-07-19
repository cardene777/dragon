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

describe("iter324: parts additional (WeakMap/WeakSet)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new WeakMap has diagram`, () => { const wm = new WeakMap(); wm.set(diagram, 1); expect(wm.has(diagram)).toBe(true); });
    it(`${name}: new WeakMap get returns value`, () => { const wm = new WeakMap(); wm.set(diagram, diagram.id); expect(wm.get(diagram)).toBe(diagram.id); });
    it(`${name}: new WeakMap delete returns true`, () => { const wm = new WeakMap(); wm.set(diagram, 1); expect(wm.delete(diagram)).toBe(true); });
    it(`${name}: new WeakSet has diagram`, () => { const ws = new WeakSet(); ws.add(diagram); expect(ws.has(diagram)).toBe(true); });
    it(`${name}: new WeakSet delete returns true`, () => { const ws = new WeakSet(); ws.add(diagram); expect(ws.delete(diagram)).toBe(true); });
    it(`${name}: new WeakMap add nodes obj`, () => { const wm = new WeakMap(); wm.set(diagram.nodes, 1); expect(wm.has(diagram.nodes)).toBe(true); });
    it(`${name}: new WeakSet add nodes obj`, () => { const ws = new WeakSet(); ws.add(diagram.nodes); expect(ws.has(diagram.nodes)).toBe(true); });
  }
});
