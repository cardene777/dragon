/**
 * parts node w details (iter95、 2026-07-19)。
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

describe("iter95: 全 parts × node w details", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: 箱を 1 つ以上持つ (空振り防止)`, () => {
      // 下の検査は箱を回して 1 件ずつ見る。 箱が無いと 1 度も判定へ入らずに通る
      expect(diagram.nodes.length, `${name} に箱が 1 つも無い`).toBeGreaterThan(0);
    });

    it(`${name}: 全 node w 型 number or undefined`, () => {
      for (const n of diagram.nodes) {
        if (n.w !== undefined) {
          expect(typeof n.w).toBe("number");
        }
      }
    });

    it(`${name}: 全 node h 型 number or undefined`, () => {
      for (const n of diagram.nodes) {
        if (n.h !== undefined) {
          expect(typeof n.h).toBe("number");
        }
      }
    });

    it(`${name}: w 存在時 > 0`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.w === "number") {
          expect(n.w).toBeGreaterThan(0);
        }
      }
    });

    it(`${name}: h 存在時 > 0`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.h === "number") {
          expect(n.h).toBeGreaterThan(0);
        }
      }
    });

    it(`${name}: w * h < 4000000 (area limit)`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.w === "number" && typeof n.h === "number") {
          expect(n.w * n.h).toBeLessThan(4000000);
        }
      }
    });

    it(`${name}: w/h ratio 妥当 (0.05 - 20)`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.w === "number" && typeof n.h === "number") {
          const ratio = n.w / n.h;
          expect(ratio).toBeGreaterThan(0.05);
          expect(ratio).toBeLessThan(20);
        }
      }
    });
  }
});
