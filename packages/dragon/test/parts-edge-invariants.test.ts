/**
 * parts edge invariants (iter89、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter89。
 * 全 parts の edges detailed invariants verify。
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

describe("iter89: 全 parts × edges detailed invariants", () => {
  it("矢印を持つ部品が 1 件以上ある (空振り防止)", () => {
    /*
     * 矢印を持たない部品が 110 件中 79 件ある (箱だけの部品)。 1 件ずつ矢印の件数を見ると
     * その 79 件で落ちるので、**全体で 1 件以上** を見る。
     * engine が矢印を作らなくなった時、下の繰り返しは 1 度も回らずに通ってしまう。
     */
    const 矢印あり = ALL_PARTS.filter(({ diagram }) => diagram.edges.length > 0);
    expect(矢印あり.length, "矢印を持つ部品が 1 件も無い").toBeGreaterThan(0);
  });

  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: edges 配列 型`, () => {
      expect(Array.isArray(diagram.edges)).toBe(true);
    });

    it(`${name}: 各 edge が object`, () => {
      for (const e of diagram.edges) {
        expect(typeof e).toBe("object");
      }
    });

    it(`${name}: 各 edge が from/to 型`, () => {
      for (const e of diagram.edges) {
        expect(typeof e.from).toBe("string");
        expect(typeof e.to).toBe("string");
      }
    });

    it(`${name}: 全 edge の from が nodes に含まれる`, () => {
      const nodeIds = new Set(diagram.nodes.map((n) => n.id));
      for (const e of diagram.edges) {
        expect(nodeIds.has(e.from)).toBe(true);
      }
    });

    it(`${name}: 全 edge の to が nodes に含まれる`, () => {
      const nodeIds = new Set(diagram.nodes.map((n) => n.id));
      for (const e of diagram.edges) {
        expect(nodeIds.has(e.to)).toBe(true);
      }
    });

    it(`${name}: edges.length integer`, () => {
      expect(Number.isInteger(diagram.edges.length)).toBe(true);
    });
  }
});
