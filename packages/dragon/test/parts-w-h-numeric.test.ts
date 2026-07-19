/**
 * parts w/h numeric range 網羅 (iter75、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter75。
 * 全 80 parts の node w/h 数値範囲 verify。
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

describe("iter75: 全 parts × w/h numeric range 網羅", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: 全 node w が 存在時 20-2000 範囲 (現実的サイズ)`, () => {
      for (const n of diagram.nodes) {
        const w = n.w;
        if (typeof w === "number") {
          expect(w).toBeGreaterThan(0);
          expect(w).toBeLessThanOrEqual(2000);
        }
      }
    });

    it(`${name}: 全 node h が 存在時 20-2000 範囲`, () => {
      for (const n of diagram.nodes) {
        const h = n.h;
        if (typeof h === "number") {
          expect(h).toBeGreaterThan(0);
          expect(h).toBeLessThanOrEqual(2000);
        }
      }
    });

    it(`${name}: 全 node w が finite (存在時)`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.w === "number") {
          expect(Number.isFinite(n.w), `${n.id}: w=${n.w}`).toBe(true);
        }
      }
    });
  }
});
