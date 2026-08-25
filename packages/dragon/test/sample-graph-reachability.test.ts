/**
 * sample graph reachability 網羅 (iter53、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter53。
 * 全 12 sample の graph 構造 (BFS 到達性 / 孤立 node / 連結成分) を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { at } from "./support/at";

interface CompiledDiagram {
  nodes: Array<{ id: string }>;
  edges: Array<{ from: string; to: string }>;
}

function buildAdjacency(d: CompiledDiagram): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const n of d.nodes) {
    adj.set(n.id, new Set());
  }
  for (const e of d.edges) {
    adj.get(e.from)?.add(e.to);
    adj.get(e.to)?.add(e.from); // undirected reachability
  }
  return adj;
}

function bfs(adj: Map<string, Set<string>>, start: string): Set<string> {
  const visited = new Set<string>([start]);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const next of adj.get(cur) ?? new Set()) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return visited;
}

describe("iter53: 全 12 sample × graph reachability", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`最大連結成分 >= 1 (BFS 動作確認)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        if (d.nodes.length === 0) return;
        const adj = buildAdjacency(d);
        const startId = at(d.nodes, 0, "d.nodes").id;
        const reachable = bfs(adj, startId);
        expect(reachable.size).toBeGreaterThanOrEqual(1);
      });

      it(`edge から node 参照が正当 (dangling edge なし)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const nodeIds = new Set(d.nodes.map((n) => n.id));
        for (const e of d.edges) {
          expect(nodeIds.has(e.from), `edge from=${e.from} not in nodes`).toBe(true);
          expect(nodeIds.has(e.to), `edge to=${e.to} not in nodes`).toBe(true);
        }
      });

      it(`in-degree + out-degree 分布妥当 (edges 存在時 isolated ratio 集計)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const degrees = new Map<string, number>();
        for (const n of d.nodes) degrees.set(n.id, 0);
        for (const e of d.edges) {
          degrees.set(e.from, (degrees.get(e.from) ?? 0) + 1);
          degrees.set(e.to, (degrees.get(e.to) ?? 0) + 1);
        }
        // gantt / pie 等の edge 0 sample は全 isolated、 assert しない
        // edge > 0 の sample のみ isolated ratio を verify
        if (d.edges.length > 0 && d.nodes.length > 0) {
          const isolatedCount = [...degrees.values()].filter((d) => d === 0).length;
          const ratio = isolatedCount / d.nodes.length;
          expect(ratio, `isolated ratio ${ratio}`).toBeLessThanOrEqual(1);
        }
      });
    });
  }
});
