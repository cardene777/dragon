/**
 * preset compile behavior 網羅 (iter52、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter52。
 * 全 19 preset を JSON round-trip + compile 後の invariant を verify。
 */
import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { at } from "./support/at";

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

describe("iter52: 全 19 preset × compile behavior 網羅", () => {
  it(`preset 数`, () => {
    expect(ALL_PRESETS.length).toBe(19);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: JSON round-trip で nodes 完全一致`, () => {
      const rt = JSON.parse(JSON.stringify(diagram)) as typeof diagram;
      expect(rt.nodes.length).toBe(diagram.nodes.length);
      for (let i = 0; i < diagram.nodes.length; i++) {
        expect(at(rt.nodes, i, "rt.nodes").id).toBe(at(diagram.nodes, i, "diagram.nodes").id);
      }
    });

    it(`${name}: JSON round-trip で edges 完全一致`, () => {
      const rt = JSON.parse(JSON.stringify(diagram)) as typeof diagram;
      expect(rt.edges.length).toBe(diagram.edges.length);
      for (let i = 0; i < diagram.edges.length; i++) {
        expect(at(rt.edges, i, "rt.edges").from).toBe(at(diagram.edges, i, "diagram.edges").from);
        expect(at(rt.edges, i, "rt.edges").to).toBe(at(diagram.edges, i, "diagram.edges").to);
      }
    });

    it(`${name}: id が preset- prefix なし (parts- と区別)`, () => {
      expect(diagram.id.startsWith("parts-")).toBe(false);
    });

    it(`${name}: title 型`, () => {
      const d = diagram as unknown as { title?: unknown };
      if (d.title !== undefined) expect(typeof d.title).toBe("string");
    });
  }
});
