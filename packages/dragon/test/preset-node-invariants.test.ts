/**
 * preset node invariants (iter85、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter85。
 * 全 20 preset の node property を追加軸で verify。
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

describe("iter85: 全 20 preset × node invariants", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: 各 node id が非空 string`, () => {
      for (const n of diagram.nodes) {
        expect(typeof n.id).toBe("string");
        expect(n.id.length).toBeGreaterThan(0);
      }
    });

    it(`${name}: 各 node id char <= 40`, () => {
      for (const n of diagram.nodes) {
        expect(n.id.length).toBeLessThanOrEqual(40);
      }
    });

    it(`${name}: 各 node w (存在時) 正の finite <= 2000`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.w === "number") {
          expect(n.w).toBeGreaterThan(0);
          expect(n.w).toBeLessThanOrEqual(2000);
        }
      }
    });

    it(`${name}: 各 node h (存在時) 正の finite <= 2000`, () => {
      for (const n of diagram.nodes) {
        if (typeof n.h === "number") {
          expect(n.h).toBeGreaterThan(0);
          expect(n.h).toBeLessThanOrEqual(2000);
        }
      }
    });

    it(`${name}: 各 node title (存在時) <= 100 char`, () => {
      for (const n of diagram.nodes) {
        const title = (n as unknown as { title?: string }).title;
        if (typeof title === "string") {
          expect(title.length).toBeLessThanOrEqual(100);
        }
      }
    });

    it(`${name}: JSON round-trip で nodes 情報保持`, () => {
      const rt = JSON.parse(JSON.stringify(diagram));
      expect(rt.nodes.length).toBe(diagram.nodes.length);
    });
  }
});
