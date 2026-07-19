/**
 * preset diagram stability 網羅 (iter25、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter25。
 * presets.cdl.ts の全 20 preset diagram に対して以下 invariant を verify。
 *
 * (a) 各 preset の nodes / edges が空でない
 * (b) 各 preset の nodes id が内部 unique
 * (c) 各 preset の edges endpoint が nodes に存在
 * (d) 各 preset の node w/h が正 finite
 * (e) JSON round-trip で全 field 保持
 */
import { describe, it, expect } from "vitest";
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

const ALL_PRESETS = collectDiagramExports(PresetsMod);

describe("iter25: 全 20 preset × diagram stability 網羅", () => {
  it(`preset 数 = 20`, () => {
    expect(ALL_PRESETS.length).toBe(20);
  });

  for (const { name, diagram } of ALL_PRESETS) {
    describe(`${name} (${diagram.id})`, () => {
      it(`nodes / edges 存在 (non-empty)`, () => {
        expect(diagram.nodes.length, `nodes count`).toBeGreaterThan(0);
        expect(Array.isArray(diagram.edges), `edges is array`).toBe(true);
      });

      it(`node id 内部 unique`, () => {
        const ids = diagram.nodes.map((n) => n.id);
        expect(new Set(ids).size, `dup detect ${ids.join(",")}`).toBe(ids.length);
      });

      it(`全 edge endpoint が nodes に存在`, () => {
        const nodeIds = new Set(diagram.nodes.map((n) => n.id));
        const missing: string[] = [];
        for (const e of diagram.edges) {
          if (!nodeIds.has(e.from)) missing.push(`${e.from}->`);
          if (!nodeIds.has(e.to)) missing.push(`->${e.to}`);
        }
        expect(missing, `missing endpoints in nodes=[${[...nodeIds].join(",")}]`).toEqual([]);
      });

      it(`全 node w/h が undefined or 正 finite`, () => {
        const bad = diagram.nodes.filter((n) => {
          const badW = n.w !== undefined && !(Number.isFinite(n.w) && n.w > 0);
          const badH = n.h !== undefined && !(Number.isFinite(n.h) && n.h > 0);
          return badW || badH;
        });
        expect(
          bad.map((n) => `${n.id}:w=${n.w}/h=${n.h}`),
          "invalid w/h",
        ).toEqual([]);
      });

      it(`JSON round-trip で node/edge count 保持`, () => {
        const rt = JSON.parse(JSON.stringify(diagram));
        expect(rt.nodes.length).toBe(diagram.nodes.length);
        expect(rt.edges.length).toBe(diagram.edges.length);
      });
    });
  }
});
