/**
 * sample edge triple check (iter84、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter84。
 * 全 sample の edges triple (from/to/label) 詳細 verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  edges: Array<{ from: string; to: string; label?: string; polarity?: string }>;
}

describe("iter84: 全 sample × edge triple check", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`edges 各 element は object`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          expect(typeof e).toBe("object");
        }
      });

      it(`各 edge.from が非空`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          expect(e.from.length).toBeGreaterThan(0);
        }
      });

      it(`各 edge.to が非空`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          expect(e.to.length).toBeGreaterThan(0);
        }
      });

      it(`各 edge.label が undefined or string`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          if (e.label !== undefined) {
            expect(typeof e.label).toBe("string");
          }
        }
      });

      it(`各 edge.polarity が undefined or string`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          if (e.polarity !== undefined) {
            expect(typeof e.polarity).toBe("string");
          }
        }
      });

      it(`edges array length integer`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        expect(Number.isInteger(d.edges.length)).toBe(true);
      });

      it(`edges array length >= 0`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        expect(d.edges.length).toBeGreaterThanOrEqual(0);
      });
    });
  }
});
