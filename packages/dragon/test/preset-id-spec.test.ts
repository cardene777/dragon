/**
 * preset id spec 網羅 (iter77、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter77。
 * 全 20 preset の id / diagram property spec 準拠 verify。
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

describe("iter77: 全 20 preset × id spec 網羅", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id が非空 + 100 char 以下`, () => {
      expect(diagram.id.length).toBeGreaterThan(0);
      expect(diagram.id.length).toBeLessThanOrEqual(100);
    });

    it(`${name}: id が識別子 form ([a-zA-Z][a-zA-Z0-9_-]*)`, () => {
      expect(/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(diagram.id)).toBe(true);
    });

    it(`${name}: nodes / edges 配列 非空 (nodes 少なくとも 1)`, () => {
      expect(diagram.nodes.length).toBeGreaterThanOrEqual(1);
    });

    it(`${name}: type field 存在時 string 型`, () => {
      const type = (diagram as unknown as { type?: unknown }).type;
      if (type !== undefined) {
        expect(typeof type).toBe("string");
      }
    });
  }
});
