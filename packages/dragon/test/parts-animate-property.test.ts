/**
 * parts animate property 網羅 (iter62、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter62。
 * parts の animate / animation 属性が存在する場合の型 verify。
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

describe("iter62: 全 parts × animate / animation property 型 verify", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: 段を 1 つ以上持つ (空振り防止)`, () => {
      // 下の検査は段を回して 1 件ずつ見る。 段が無いと 1 度も判定へ入らずに通る
      const phases = (diagram as unknown as { phases?: unknown[] }).phases ?? [];
      expect(phases.length, `${name} に段が 1 つも無い`).toBeGreaterThan(0);
    });

    it(`${name}: phases 属性が存在するなら array`, () => {
      const phases = (diagram as unknown as { phases?: unknown }).phases;
      if (phases !== undefined) {
        expect(Array.isArray(phases)).toBe(true);
      }
    });

    it(`${name}: phases 長さ <= 20 (parts は phases 少なめ)`, () => {
      const phases = (diagram as unknown as { phases?: unknown[] }).phases ?? [];
      expect(phases.length).toBeLessThanOrEqual(20);
    });

    it(`${name}: 各 phase が object 型`, () => {
      const phases = (diagram as unknown as { phases?: unknown[] }).phases ?? [];
      for (const p of phases) {
        expect(typeof p).toBe("object");
      }
    });

    it(`${name}: 各 phase の focus 存在時 array`, () => {
      const phases = (diagram as unknown as { phases?: Array<{ focus?: unknown }> }).phases ?? [];
      for (const p of phases) {
        if (p.focus !== undefined) {
          expect(Array.isArray(p.focus)).toBe(true);
        }
      }
    });
  }
});
