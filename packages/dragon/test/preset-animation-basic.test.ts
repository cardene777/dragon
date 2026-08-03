/**
 * preset animation basic 網羅 (iter63、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter63。
 * 全 20 preset の animation 関連 property を verify。
 */
import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

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

describe("iter63: 全 20 preset × animation property verify", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: phases 存在時 array + phase 内部 sanity`, () => {
      const phases = (diagram as unknown as { phases?: Array<{ focus?: unknown; steps?: unknown }> }).phases;
      if (phases === undefined) return;
      expect(Array.isArray(phases)).toBe(true);
      for (const p of phases) {
        expect(typeof p).toBe("object");
      }
    });

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
