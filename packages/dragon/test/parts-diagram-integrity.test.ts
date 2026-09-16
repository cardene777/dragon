/**
 * parts diagram integrity 網羅 (iter66、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter66。
 * 全 parts の diagram integrity を verify。
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

describe("iter66: 全 parts × diagram integrity 網羅", () => {
  it(`parts 検出`, () => {
    expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60);
  });

  it(`全 parts id が一意`, () => {
    const ids = ALL_PARTS.map((p) => p.diagram.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: parts- prefix + kebab-case`, () => {
      expect(diagram.id.startsWith("parts-")).toBe(true);
      const suffix = diagram.id.slice(6);
      expect(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(suffix)).toBe(true);
    });

    it(`${name}: title (id.suffix と対応) 存在時 string`, () => {
      const d = diagram as unknown as { title?: unknown };
      if (d.title !== undefined) {
        expect(typeof d.title).toBe("string");
      }
    });

    it(`${name}: 全 edge id (存在時) が unique`, () => {
      const edgeIds = diagram.edges
        .map((e) => (e as unknown as { id?: string }).id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      expect(new Set(edgeIds).size).toBe(edgeIds.length);
    });

    it(`${name}: 全 state id (存在時) が unique`, () => {
      const states = (diagram as unknown as { states?: Array<{ id: string }> }).states ?? [];
      const stateIds = states.map((s) => s.id);
      expect(new Set(stateIds).size).toBe(stateIds.length);
    });
  }
});
