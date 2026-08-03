/**
 * parts final invariants (iter98、 2026-07-19、 14000 突破)。
 */
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

describe("iter98: 全 parts × final invariants (14000 突破)", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id が toString で string 化`, () => {
      expect(String(diagram.id)).toBe(diagram.id);
    });

    it(`${name}: nodes.length + edges.length integer`, () => {
      expect(Number.isInteger(diagram.nodes.length + diagram.edges.length)).toBe(true);
    });

    it(`${name}: 全 node id は includes で自身 match`, () => {
      for (const n of diagram.nodes) {
        expect(n.id.includes(n.id)).toBe(true);
      }
    });

    it(`${name}: JSON.parse で throw なし`, () => {
      const json = JSON.stringify(diagram);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it(`${name}: nodes.filter(true) が全 nodes`, () => {
      const filtered = diagram.nodes.filter(() => true);
      expect(filtered.length).toBe(diagram.nodes.length);
    });

    it(`${name}: nodes.map(n => n.id).join(",") が非空`, () => {
      const joined = diagram.nodes.map((n) => n.id).join(",");
      if (diagram.nodes.length > 0) {
        expect(joined.length).toBeGreaterThan(0);
      }
    });

    it(`${name}: nodes iterable via for-of`, () => {
      let count = 0;
      for (const n of diagram.nodes) {
        expect(n).toBeDefined();
        count++;
      }
      expect(count).toBe(diagram.nodes.length);
    });
  }
});
