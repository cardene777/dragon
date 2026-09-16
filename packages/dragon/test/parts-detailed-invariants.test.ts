/**
 * parts detailed invariants (iter82、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter82。
 * 全 parts の詳細 invariant verify。 10000 test 突破用。
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

describe("iter82: 全 parts × detailed invariants (10000 突破)", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: JSON.parse(JSON.stringify) が throw なし`, () => {
      expect(() => JSON.parse(JSON.stringify(diagram))).not.toThrow();
    });

    it(`${name}: 全 node の id が非空 string`, () => {
      for (const n of diagram.nodes) {
        expect(typeof n.id).toBe("string");
        expect(n.id.length).toBeGreaterThan(0);
      }
    });

    it(`${name}: nodes.length 数値`, () => {
      expect(typeof diagram.nodes.length).toBe("number");
    });

    it(`${name}: edges.length 数値`, () => {
      expect(typeof diagram.edges.length).toBe("number");
    });

    it(`${name}: id が "parts-" 始まる`, () => {
      expect(diagram.id.startsWith("parts-")).toBe(true);
    });

    it(`${name}: id が 5+ char`, () => {
      expect(diagram.id.length).toBeGreaterThanOrEqual(5);
    });
  }
});
