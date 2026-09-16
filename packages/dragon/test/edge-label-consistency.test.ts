/**
 * edge label consistency 網羅 unit test (iter12、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter12。
 * 全 EDITOR_SAMPLES の edges について以下 invariant を verify。
 *
 * (a) edge id 一意性 (dup edge id 検出)
 * (b) from/to の endpoint が nodes に存在 (dangling endpoint 検知)
 * (c) label が null / undefined 混入していない (無 label edge は空文字か明示 undefined、 型不整合検知)
 * (d) 自己参照 edge (from == to) は許容だが重複しない
 *
 * sample DSL 修正時の edge invariant regression を integrity gate として自動検知。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: Array<{ id: string }>;
  edges: Array<{ id?: string; from: string; to: string; label?: string }>;
}

describe("iter12: 全 EDITOR_SAMPLES × edge label consistency 網羅", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label} (${sample.slug})`, () => {
      it(`edges の endpoint (from/to) が全て nodes に存在`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const nodeIds = new Set(diagram.nodes.map((n) => n.id));
        const dangling = diagram.edges.filter((e) => !nodeIds.has(e.from) || !nodeIds.has(e.to));
        expect(
          dangling,
          `dangling endpoint (nodes=[${[...nodeIds].join(",")}]) dangling=${dangling.map((e) => `${e.from}->${e.to}`).join(",")}`,
        ).toEqual([]);
      });

      it(`edge id が存在するなら unique`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const ids = diagram.edges.map((e) => e.id).filter((id): id is string => typeof id === "string" && id.length > 0);
        expect(new Set(ids).size, `edge id dup (ids=${ids.join(",")})`).toBe(ids.length);
      });

      it(`edge label が string 型 (undefined 許容、 null / number 等の混入なし)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalidLabels = diagram.edges.filter((e) => {
          if (e.label === undefined) return false;
          return typeof e.label !== "string";
        });
        expect(
          invalidLabels,
          `不正 label 型 (invalid=${invalidLabels.map((e) => `${e.from}->${e.to}:${typeof e.label}`).join(",")})`,
        ).toEqual([]);
      });

      it(`from/to pair の重複 edge なし (同一 endpoint pair の dup edge 検知)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const seen = new Map<string, number>();
        for (const e of diagram.edges) {
          const key = `${e.from}->${e.to}:${e.label ?? ""}`;
          seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        const dups = [...seen.entries()].filter(([, c]) => c > 1);
        expect(dups, `dup edge (from/to/label 同一): ${dups.map(([k, c]) => `${k} × ${c}`).join(",")}`).toEqual([]);
      });
    });
  }
});
