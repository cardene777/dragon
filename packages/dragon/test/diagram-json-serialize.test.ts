/**
 * diagram JSON serialize round-trip verify (iter23、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter23。
 * compile 後の diagram object を JSON.stringify + parse で round-trip、
 * (a) circular reference なし (b) 情報損失なし (c) node/edge id 保持 を verify。
 * share URL / snapshot 経路の serialize regression 検知 gate。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: Array<{ id: string }>;
  edges: Array<{ from: string; to: string }>;
}

describe("iter23: 全 12 sample × diagram JSON serialize round-trip", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`JSON.stringify + parse で throw なし (circular reference なし)`, () => {
        const diagram = textDslToDiagram(sample.code);
        expect(() => {
          const json = JSON.stringify(diagram);
          JSON.parse(json);
        }).not.toThrow();
      });

      it(`round-trip 後の node id 完全一致`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const roundTrip = JSON.parse(JSON.stringify(diagram)) as CompiledDiagram;
        const ids1 = diagram.nodes.map((n) => n.id);
        const ids2 = roundTrip.nodes.map((n) => n.id);
        expect(ids2).toEqual(ids1);
      });

      it(`round-trip 後の edge from/to 完全一致`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const roundTrip = JSON.parse(JSON.stringify(diagram)) as CompiledDiagram;
        const e1 = diagram.edges.map((e) => `${e.from}->${e.to}`);
        const e2 = roundTrip.edges.map((e) => `${e.from}->${e.to}`);
        expect(e2).toEqual(e1);
      });

      it(`round-trip 後の node count / edge count 完全一致`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const rt = JSON.parse(JSON.stringify(diagram)) as CompiledDiagram;
        expect(rt.nodes.length).toBe(diagram.nodes.length);
        expect(rt.edges.length).toBe(diagram.edges.length);
      });
    });
  }
});
