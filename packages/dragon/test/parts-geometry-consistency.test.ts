/**
 * parts geometry consistency 網羅 unit test (iter17、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter17。
 * parts.cdl.ts の全 parts の geometry 属性 (w / h / radius / thickness 等) が
 * 正の finite float であることを batch 検証。 typo で NaN / negative / 0 混入時の
 * regression 検知 gate。
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

function isPositiveFinite(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

// geometry 属性の検査対象 (存在する場合のみ検査)
const GEOM_FIELDS = ["w", "h", "radius", "outerRadius", "innerRadius", "thickness"] as const;

describe("iter17: 全 parts × geometry 属性 consistency", () => {
  it(`parts export 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`parts ${name} (${diagram.id}) の全 node geometry field 正 finite`, () => {
      const violations: Array<{ nodeId: string; field: string; value: unknown }> = [];
      for (const node of diagram.nodes) {
        for (const field of GEOM_FIELDS) {
          const value = (node as unknown as Record<string, unknown>)[field];
          if (value !== undefined && !isPositiveFinite(value)) {
            violations.push({ nodeId: node.id, field, value });
          }
        }
      }
      expect(
        violations,
        `geometry violations in ${name}: ${JSON.stringify(violations)}`,
      ).toEqual([]);
    });

    it(`parts ${name} (${diagram.id}) の全 node.lane が string 型`, () => {
      const violations: string[] = [];
      for (const node of diagram.nodes) {
        const lane = (node as unknown as { lane?: unknown }).lane;
        if (lane !== undefined && typeof lane !== "string") {
          violations.push(`${node.id}:lane=${JSON.stringify(lane)}`);
        }
      }
      expect(violations).toEqual([]);
    });

    it(`parts ${name} (${diagram.id}) の全 node.stack が number 型 (存在する場合)`, () => {
      const violations: string[] = [];
      for (const node of diagram.nodes) {
        const stack = (node as unknown as { stack?: unknown }).stack;
        if (stack !== undefined && (typeof stack !== "number" || !Number.isFinite(stack))) {
          violations.push(`${node.id}:stack=${JSON.stringify(stack)}`);
        }
      }
      expect(violations).toEqual([]);
    });
  }
});
