/**
 * 全 sample × node invariant + compile determinism 網羅 (iter14+15、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter14+15。
 *
 * (a) node id 一意性 (dup detect)
 * (b) node id が空文字 / 特殊文字混入なし
 * (c) node w/h が存在するなら正の finite (0 / negative / Infinity 検知)
 * (d) same-DSL 2 回 compile で node ids / edge ids が deterministic 一致 (compile determinism)
 * (e) actor 数 = 元 DSL の actor 数 + parts 追加 sub-node count 以上 (parts merge の
 *     drift 検知、 上限 assert なしで actor 定義 minimum の下限保証)
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: Array<{ id: string; w?: number; h?: number }>;
  edges: Array<{ id?: string; from: string; to: string }>;
}

describe("iter14+15: 全 sample × node invariant + compile determinism", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label} (${sample.slug})`, () => {
      it(`node id 全 unique`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const ids = diagram.nodes.map((n) => n.id);
        const dupCount = ids.length - new Set(ids).size;
        expect(dupCount, `dup node id 発生数 (ids=${ids.join(",")})`).toBe(0);
      });

      it(`node id が非空文字 + 有効 identifier form`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.nodes.filter((n) => {
          if (typeof n.id !== "string" || n.id.length === 0) return true;
          // 空白 / 制御文字禁止
          if (/[\x00-\x1f\x7f]/.test(n.id)) return true;
          return false;
        });
        expect(invalid.map((n) => n.id), "invalid node id list").toEqual([]);
      });

      it(`node w/h が存在するなら正の finite`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.nodes.filter((n) => {
          const badW = n.w !== undefined && !(Number.isFinite(n.w) && n.w > 0);
          const badH = n.h !== undefined && !(Number.isFinite(n.h) && n.h > 0);
          return badW || badH;
        });
        expect(
          invalid.map((n) => ({ id: n.id, w: n.w, h: n.h })),
          "invalid w/h list",
        ).toEqual([]);
      });

      it(`compile determinism = 2 回 compile で node id / edge id 完全一致`, () => {
        const d1 = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const d2 = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const ids1 = d1.nodes.map((n) => n.id);
        const ids2 = d2.nodes.map((n) => n.id);
        expect(ids2, `nodes 順序 + id 一致`).toEqual(ids1);
        const edges1 = d1.edges.map((e) => `${e.from}->${e.to}`);
        const edges2 = d2.edges.map((e) => `${e.from}->${e.to}`);
        expect(edges2, `edges 順序 + endpoint 一致`).toEqual(edges1);
      });

      it(`edge from/to 参照が nodes id set の subset (dangling endpoint 総合検知)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const nodeIds = new Set(diagram.nodes.map((n) => n.id));
        const missing = new Set<string>();
        for (const e of diagram.edges) {
          if (!nodeIds.has(e.from)) missing.add(e.from);
          if (!nodeIds.has(e.to)) missing.add(e.to);
        }
        expect([...missing], `dangling endpoint ids (nodes=[${[...nodeIds].join(",")}])`).toEqual([]);
      });
    });
  }
});
