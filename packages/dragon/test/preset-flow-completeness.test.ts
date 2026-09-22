/**
 * preset flow completeness 網羅 (iter81、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter81。
 * 全 preset diagram の flow / edge 完全性 verify。
 */
import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { 並べた名前, 見本の名前 } from "../../../apps/playground-spa/src/lib/preset-exports";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PRESETS = collectAllPresets(PresetsMod);

describe("iter81: 全 preset × flow completeness", () => {
  it("集めた見本が見本の一覧と一致する", () => {
    expect(並べた名前(ALL_PRESETS.map((p) => p.name))).toEqual(並べた名前(見本の名前));
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: 箱を 1 つ以上持つ (空振り防止)`, () => {
      // 下の検査は箱を回して 1 件ずつ見る。 箱が無いと 1 度も判定へ入らずに通る
      expect(diagram.nodes.length, `${name} に箱が 1 つも無い`).toBeGreaterThan(0);
    });

    it(`${name}: 全 edge from が nodes に含まれる`, () => {
      const ids = new Set(diagram.nodes.map((n) => n.id));
      for (const e of diagram.edges) {
        expect(ids.has(e.from)).toBe(true);
      }
    });

    it(`${name}: 全 edge to が nodes に含まれる`, () => {
      const ids = new Set(diagram.nodes.map((n) => n.id));
      for (const e of diagram.edges) {
        expect(ids.has(e.to)).toBe(true);
      }
    });

    it(`${name}: 全 node id が非空`, () => {
      for (const n of diagram.nodes) {
        expect(n.id.length).toBeGreaterThan(0);
      }
    });

    it(`${name}: JSON size < 200KB`, () => {
      expect(JSON.stringify(diagram).length).toBeLessThan(200 * 1024);
    });

    it(`${name}: id が preset 内で unique (nodes)`, () => {
      const ids = diagram.nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});
