/**
 * preset node density 網羅 (iter58、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter58。
 * 全 preset の node density (edges/nodes 比率) を verify。
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

describe("iter58: 全 preset × node density 網羅", () => {
  it("集めた見本が見本の一覧と一致する", () => {
    expect(並べた名前(ALL_PRESETS.map((p) => p.name))).toEqual(並べた名前(見本の名前));
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: 矢印の数が箱の数の 10 倍以下`, () => {
      // 下限の「0 以上」 は数え上げた値なので常に真だった (#2500)。 上限だけを見る。
      const n = diagram.nodes.length;
      expect(n, `${name} が箱を 1 つも持たない`).toBeGreaterThan(0);
      expect(
        diagram.edges.length / n,
        `${name} で矢印 ${diagram.edges.length} 本 / 箱 ${n} 個`,
      ).toBeLessThanOrEqual(10);
    });

    it(`${name}: node id が preset 内 unique`, () => {
      const ids = diagram.nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`${name}: title / type field 存在時 string`, () => {
      const d = diagram as unknown as { title?: unknown; type?: unknown };
      if (d.title !== undefined) expect(typeof d.title).toBe("string");
      if (d.type !== undefined) expect(typeof d.type).toBe("string");
    });

    it(`${name}: JSON stringify size < 500KB (異常巨大 preset 検知)`, () => {
      const size = JSON.stringify(diagram).length;
      expect(size).toBeLessThan(500 * 1024);
    });
  }
});
