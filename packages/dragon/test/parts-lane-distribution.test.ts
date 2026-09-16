/**
 * parts lane distribution 網羅 (iter54、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter54。
 * 全 parts の lane 別 node 分布を verify。 極端偏り検知。
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

describe("iter54: 全 parts × lane distribution", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: lane 名は英数字 + hyphen / underscore`, () => {
      const invalid: string[] = [];
      for (const node of diagram.nodes) {
        const lane = (node as unknown as { lane?: string }).lane;
        if (typeof lane === "string") {
          if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(lane)) {
            invalid.push(`${node.id}:lane="${lane}"`);
          }
        }
      }
      expect(invalid).toEqual([]);
    });

    it(`${name}: 単一 lane 内 node 数 <= 20`, () => {
      const laneCounts = new Map<string, number>();
      for (const node of diagram.nodes) {
        const lane = (node as unknown as { lane?: string }).lane;
        if (typeof lane === "string") {
          laneCounts.set(lane, (laneCounts.get(lane) ?? 0) + 1);
        }
      }
      for (const [lane, count] of laneCounts) {
        expect(count, `${name}:lane[${lane}] = ${count}`).toBeLessThanOrEqual(20);
      }
    });

    it(`${name}: lane が存在するなら 1 char 以上`, () => {
      for (const node of diagram.nodes) {
        const lane = (node as unknown as { lane?: string }).lane;
        if (typeof lane === "string") {
          expect(lane.length).toBeGreaterThan(0);
        }
      }
    });
  }
});
