/**
 * parts post-iter100 milestone check (iter101、 2026-07-19)。
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

describe("iter101: 全 parts × extra invariants (post-100)", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: JSON stringify text length > 10 char`, () => {
      expect(JSON.stringify(diagram).length).toBeGreaterThan(10);
    });

    it(`${name}: JSON.stringify includes "id"`, () => {
      expect(JSON.stringify(diagram)).toContain('"id"');
    });

    it(`${name}: JSON.stringify includes "nodes"`, () => {
      expect(JSON.stringify(diagram)).toContain('"nodes"');
    });

    it(`${name}: JSON.stringify includes "edges"`, () => {
      expect(JSON.stringify(diagram)).toContain('"edges"');
    });

    it(`${name}: id starts with "parts-"`, () => {
      expect(diagram.id.substring(0, 6)).toBe("parts-");
    });

    it(`${name}: id length > 6 (parts- + suffix)`, () => {
      expect(diagram.id.length).toBeGreaterThan(6);
    });

    it(`${name}: nodes 全 index 型`, () => {
      for (const n of diagram.nodes) {
        expect(typeof n).toBe("object");
      }
    });
  }
});
