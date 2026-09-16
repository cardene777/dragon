/**
 * 全 EDITOR_SAMPLES の animation.focus 参照整合性 網羅 unit test (iter10、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter10。
 * 各 sample の animation phase / step の focus[] に列挙される actor / edge 名が、
 * 実際の diagram.actors / diagram.edges に存在するかを batch 検証する。
 *
 * dangling reference (存在しない actor / edge を focus に指定) を検知することで、
 * sample DSL 修正時の regression を防ぐ integrity gate として機能する。
 *
 * 全見本の phase / step ごとの focus 参照を全件 traverse。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { compile } from "@cardenelabs/cdl";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { at } from "./support/at";

interface CompiledDiagram {
  nodes: Array<{ id: string }>;
  edges: Array<{ id?: string; from: string; to: string }>;
  phases?: Array<{
    focus?: Array<string>;
    steps?: Array<{ focus?: Array<string> }>;
  }>;
}

function collectFocusRefs(diagram: CompiledDiagram): Array<{ phaseIdx: number; stepIdx: number | null; ref: string }> {
  const out: Array<{ phaseIdx: number; stepIdx: number | null; ref: string }> = [];
  if (!diagram.phases) return out;
  for (let p = 0; p < diagram.phases.length; p++) {
    const phase = at(diagram.phases, p, "diagram.phases");
    if (Array.isArray(phase.focus)) {
      for (const ref of phase.focus) {
        out.push({ phaseIdx: p, stepIdx: null, ref });
      }
    }
    if (Array.isArray(phase.steps)) {
      for (let s = 0; s < phase.steps.length; s++) {
        const step = at(phase.steps, s, "phase.steps");
        if (Array.isArray(step.focus)) {
          for (const ref of step.focus) {
            out.push({ phaseIdx: p, stepIdx: s, ref });
          }
        }
      }
    }
  }
  return out;
}

function isEdgeRef(ref: string): boolean {
  return ref.includes("->") || ref.includes("→");
}

describe("iter10: 全 EDITOR_SAMPLES × animation focus 参照整合性 網羅", () => {
  it(`見本が 1 件以上ある (参照整合性の検査が空振りしていない)`, () => {
    // 件数を数字と比べる宣言は samples-validate.test.ts の 1 か所に置く (#2060)
    expect(EDITOR_SAMPLES.length, "見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label} (${sample.slug})`, () => {
      it(`compile 成功`, () => {
        const diagram = textDslToDiagram(sample.code);
        expect(diagram).toBeDefined();
        expect(() => compile(diagram)).not.toThrow();
      });

      it(`animation focus の全 actor 参照が nodes に存在`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const nodeIds = new Set(diagram.nodes.map((n) => n.id));
        const focusRefs = collectFocusRefs(diagram);
        const actorRefs = focusRefs.filter((r) => !isEdgeRef(r.ref));
        const missing = actorRefs.filter((r) => !nodeIds.has(r.ref));
        expect(
          missing,
          `dangling actor refs (nodes=[${[...nodeIds].join(",")}]) missing=${missing.map((m) => `phase${m.phaseIdx}/step${m.stepIdx}:${m.ref}`).join(",")}`,
        ).toEqual([]);
      });

      it(`animation focus の全 edge 参照が edges に存在`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const focusRefs = collectFocusRefs(diagram);
        const edgeRefs = focusRefs.filter((r) => isEdgeRef(r.ref));
        // edge ref の format = "from -> to" (or "→"), normalize
        const edgeIds = new Set<string>();
        for (const e of diagram.edges) {
          if (e.id) edgeIds.add(e.id);
          edgeIds.add(`${e.from} -> ${e.to}`);
          edgeIds.add(`${e.from} → ${e.to}`);
        }
        const missing = edgeRefs.filter((r) => !edgeIds.has(r.ref));
        expect(
          missing,
          `dangling edge refs (edges=[${diagram.edges.map((e) => `${e.from}->${e.to}`).join(",")}]) missing=${missing.map((m) => `phase${m.phaseIdx}/step${m.stepIdx}:${m.ref}`).join(",")}`,
        ).toEqual([]);
      });
    });
  }
});
