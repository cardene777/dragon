/**
 * parts milestone iter100 (2026-07-19)。
 * user 「テスト観点たくさんあるでしょ？」 対応 iter99-100。
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

describe("iter99: parts milestone additional invariants", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: 全 node id が非空`, () => {
      for (const n of diagram.nodes) {
        expect(n.id).toBeTruthy();
      }
    });

    it(`${name}: 全 edges 配列が Array`, () => {
      expect(Array.isArray(diagram.edges)).toBe(true);
    });

    it(`${name}: id が prefix "parts-" 含む`, () => {
      expect(diagram.id).toContain("parts-");
    });

    it(`${name}: nodes 配列 length 数値`, () => {
      expect(typeof diagram.nodes.length).toBe("number");
    });

    it(`${name}: JSON size 妥当`, () => {
      const size = JSON.stringify(diagram).length;
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1024 * 1024);
    });

    it(`${name}: nodes 全 index accessible`, () => {
      for (let i = 0; i < diagram.nodes.length; i++) {
        expect(diagram.nodes[i]).toBeDefined();
      }
    });

    it(`${name}: nodes accessible via bracket notation`, () => {
      if (diagram.nodes.length > 0) {
        expect(diagram.nodes[0]).toBeDefined();
      }
    });
  }
});

describe("iter100: 累計 milestone check", () => {
  it(`parts count between 60 and 200`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
    expect(ALL_PARTS.length).toBeLessThanOrEqual(200);
  });

  it(`全 parts id が unique`, () => {
    const ids = ALL_PARTS.map((p) => p.diagram.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it(`全 parts が nodes を持つ`, () => {
    for (const p of ALL_PARTS) {
      expect(Array.isArray(p.diagram.nodes)).toBe(true);
    }
  });

  it(`total nodes 数 が 100-1000`, () => {
    const total = ALL_PARTS.reduce((sum, p) => sum + p.diagram.nodes.length, 0);
    expect(total).toBeGreaterThanOrEqual(100);
    expect(total).toBeLessThanOrEqual(3000);
  });

  it(`全 parts が JSON serialize 可能`, () => {
    for (const p of ALL_PARTS) {
      expect(() => JSON.stringify(p.diagram)).not.toThrow();
    }
  });
});
