/**
 * preset animation basic 網羅 (iter63、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter63。
 * 全 preset の animation 関連 property を verify。
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

describe("iter63: 全 preset × animation property verify", () => {
  it("集めた見本が見本の一覧と一致する", () => {
    expect(並べた名前(ALL_PRESETS.map((p) => p.name))).toEqual(並べた名前(見本の名前));
  });

  // **検査の本文で抜けない** (#2500)。 段は任意なので、持つ見本だけを母数にする。
  // 抜ける形にすると、全ての見本が段を持たなくなった日に何も確かめずに通る
  const 段を持つ見本 = ALL_PRESETS.map((p) => ({
    name: p.name,
    phases: (p.diagram as unknown as { phases?: Array<{ focus?: unknown; steps?: unknown }> }).phases,
  })).filter((x): x is { name: string; phases: Array<{ focus?: unknown; steps?: unknown }> } =>
    x.phases !== undefined,
  );

  it("段を持つ見本が 1 件以上ある (走査の生存確認)", () => {
    expect(
      段を持つ見本.length,
      `見本 ${ALL_PRESETS.length} 件のどれも段を持たない`,
    ).toBeGreaterThan(0);
  });

  for (const { name, phases } of 段を持つ見本) {
    it(`${name}: 段が配列で、中身が物である`, () => {
      expect(Array.isArray(phases)).toBe(true);
      for (const p of phases) {
        expect(typeof p).toBe("object");
      }
    });
  }

  for (const { name, diagram } of ALL_PRESETS) {

    it(`${name}: nodes 各 node に id 存在`, () => {
      for (const n of diagram.nodes) {
        expect(typeof n.id).toBe("string");
        expect(n.id.length).toBeGreaterThan(0);
      }
    });

    it(`${name}: edges 全 endpoint が nodes に存在`, () => {
      const ids = new Set(diagram.nodes.map((n) => n.id));
      for (const e of diagram.edges) {
        expect(ids.has(e.from), `edge from ${e.from}`).toBe(true);
        expect(ids.has(e.to), `edge to ${e.to}`).toBe(true);
      }
    });

    it(`${name}: id が preset らしい命名 (parts- prefix なし)`, () => {
      expect(diagram.id.startsWith("parts-")).toBe(false);
    });
  }
});
