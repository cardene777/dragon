/**
 * parts nodes property count 網羅 (iter86、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter86。
 * 全 parts の nodes の property key count verify。
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

describe("iter86: 全 parts × nodes property count 網羅", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: 全 node が id property`, () => {
      for (const n of diagram.nodes) {
        expect("id" in n).toBe(true);
      }
    });

    it(`${name}: 全 node の property key 数 <= 100`, () => {
      for (const n of diagram.nodes) {
        expect(Object.keys(n).length).toBeLessThanOrEqual(100);
      }
    });

    it(`${name}: 全 node の property key 数 >= 1`, () => {
      for (const n of diagram.nodes) {
        expect(Object.keys(n).length).toBeGreaterThanOrEqual(1);
      }
    });

    it(`${name}: 全 node の JSON size < 10KB`, () => {
      for (const n of diagram.nodes) {
        expect(JSON.stringify(n).length).toBeLessThan(10 * 1024);
      }
    });

    it(`${name}: 全 node id が既定 char set`, () => {
      for (const n of diagram.nodes) {
        expect(/^[a-zA-Z0-9_\-.]+$/.test(n.id) || /\p{L}/u.test(n.id)).toBe(true);
      }
    });

    it(`${name}: JSON stringify で circular なし (throw なし)`, () => {
      expect(() => JSON.stringify(diagram)).not.toThrow();
    });
  }
});
