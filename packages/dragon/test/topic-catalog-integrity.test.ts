/**
 * topic catalog integrity 網羅 unit test (iter16、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter16。
 * parts.cdl.ts / presets.cdl.ts の export 全件が (a) 有効 CdlDiagram 形状 (b) 一意 id
 * (c) 命名規約 (parts- prefix / preset id 一致) を満たすか batch 検証。
 * UI 側 sidebar catalog と drift した場合の regression を integrity gate として自動検知。
 */
import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectDiagramExports(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PARTS = collectDiagramExports(PartsMod);
const ALL_PRESETS = collectDiagramExports(PresetsMod);

describe("iter16: topic catalog integrity", () => {
  describe("parts.cdl.ts", () => {
    it(`parts export 数 >= 60`, () => {
      expect(ALL_PARTS.length, `parts count=${ALL_PARTS.length}`).toBeGreaterThanOrEqual(60);
    });

    it(`全 parts の id が一意`, () => {
      const ids = ALL_PARTS.map((p) => p.diagram.id);
      const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(dups, `dup parts id=${dups.join(",")}`).toEqual([]);
    });

    it(`全 parts の id が "parts-" prefix`, () => {
      const invalid = ALL_PARTS.filter((p) => !p.diagram.id.startsWith("parts-"));
      expect(
        invalid.map((p) => `${p.name}:${p.diagram.id}`),
        "parts prefix violation",
      ).toEqual([]);
    });

    it(`全 parts の id が kebab-case`, () => {
      const invalid = ALL_PARTS.filter((p) => !/^parts-[a-z0-9]+(-[a-z0-9]+)*$/.test(p.diagram.id));
      expect(
        invalid.map((p) => `${p.name}:${p.diagram.id}`),
        "kebab-case violation",
      ).toEqual([]);
    });

    it(`全 parts が nodes 非空 (empty diagram 検知)`, () => {
      const empty = ALL_PARTS.filter((p) => !Array.isArray(p.diagram.nodes) || p.diagram.nodes.length === 0);
      expect(
        empty.map((p) => `${p.name}:${p.diagram.id}`),
        "empty nodes",
      ).toEqual([]);
    });
  });

  describe("presets.cdl.ts", () => {
    it(`preset export 数 = 20`, () => {
      expect(ALL_PRESETS.length).toBe(20);
    });

    it(`全 preset の id が一意`, () => {
      const ids = ALL_PRESETS.map((p) => p.diagram.id);
      const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(dups, `dup preset id=${dups.join(",")}`).toEqual([]);
    });

    it(`全 preset が nodes 非空`, () => {
      const empty = ALL_PRESETS.filter((p) => !Array.isArray(p.diagram.nodes) || p.diagram.nodes.length === 0);
      expect(
        empty.map((p) => `${p.name}:${p.diagram.id}`),
        "empty preset",
      ).toEqual([]);
    });
  });

  describe("preset diagram invariants (deeper check)", () => {
    it(`全 preset の title / type field が非空 string (metadata sanity)`, () => {
      const invalid = ALL_PRESETS.filter((p) => {
        const d = p.diagram as unknown as { title?: unknown; type?: unknown };
        const badTitle = d.title !== undefined && (typeof d.title !== "string" || d.title.length === 0);
        const badType = d.type !== undefined && (typeof d.type !== "string" || d.type.length === 0);
        return badTitle || badType;
      });
      expect(
        invalid.map((p) => `${p.name}:${p.diagram.id}`),
        "preset title/type invalid",
      ).toEqual([]);
    });

    it(`全 preset の nodes id が preset 内 unique`, () => {
      const violations: string[] = [];
      for (const p of ALL_PRESETS) {
        const ids = p.diagram.nodes.map((n) => n.id);
        if (new Set(ids).size !== ids.length) {
          violations.push(`${p.name}:${p.diagram.id}`);
        }
      }
      expect(violations, "preset internal dup").toEqual([]);
    });

    it(`全 parts の nodes id が parts 内 unique`, () => {
      const violations: string[] = [];
      for (const p of ALL_PARTS) {
        const ids = p.diagram.nodes.map((n) => n.id);
        if (new Set(ids).size !== ids.length) {
          violations.push(`${p.name}:${p.diagram.id}`);
        }
      }
      expect(violations, "parts internal dup").toEqual([]);
    });
  });
});
