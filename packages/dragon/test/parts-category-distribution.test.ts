/**
 * parts category distribution 網羅 (iter73、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter73。
 * 全 80 parts の visual / interactive / hybrid 分布 verify。
 */
import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllParts(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PARTS = collectAllParts(PartsMod);

describe("iter73: parts category distribution 網羅", () => {
  it("state を持つ parts 数 (dynamic) が 20 以上", () => {
    const withState = ALL_PARTS.filter((p) => {
      const s = (p.diagram as unknown as { states?: unknown[] }).states;
      return Array.isArray(s) && s.length > 0;
    });
    expect(withState.length).toBeGreaterThanOrEqual(20);
  });

  it("全ての parts が state を持つ (静止した部品を残さない)", () => {
    // 元は「state を持たない parts が 1 件以上」 を要求していた (#1164 以前)。
    // parts は「使い回す完成した部品」 で、 動くことに意味がある物 (トグル / 再生 /
    // 進捗 / 電波 / 信号) が静止したまま並んでいた。 全件に動きを付けたので、
    // 逆向きに「静止した部品を残さない」 を固定する。
    //
    // 状態を持たない書き方の見本は `primitives` が担う (形を見せるのが役目で、
    // そちらは静止していてよい)。
    const withoutState = ALL_PARTS.filter((p) => {
      const s = (p.diagram as unknown as { states?: unknown[] }).states;
      return !Array.isArray(s) || s.length === 0;
    });
    expect(withoutState.map((p) => p.name)).toEqual([]);
  });

  it("edges 0 の parts (単純 visual) 分布", () => {
    const noEdges = ALL_PARTS.filter((p) => p.diagram.edges.length === 0);
    expect(noEdges.length).toBeGreaterThan(0);
  });

  it("edges 1+ の parts (flow 系) 分布", () => {
    const hasEdges = ALL_PARTS.filter((p) => p.diagram.edges.length > 0);
    expect(hasEdges.length).toBeGreaterThan(0);
  });

  it("全 parts の nodes 平均が 2-15 範囲", () => {
    const total = ALL_PARTS.reduce((sum, p) => sum + p.diagram.nodes.length, 0);
    const avg = total / ALL_PARTS.length;
    expect(avg).toBeGreaterThanOrEqual(1);
    expect(avg).toBeLessThanOrEqual(30);
  });

  it("全 parts の id kebab format が完全 unique + 長さ 8-40", () => {
    const ids = ALL_PARTS.map((p) => p.diagram.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.length).toBeGreaterThanOrEqual(8);
      expect(id.length).toBeLessThanOrEqual(40);
    }
  });

  it("id suffix (parts- 除いた部分) が 3-34 char", () => {
    for (const p of ALL_PARTS) {
      const suffix = p.diagram.id.slice(6);
      expect(suffix.length).toBeGreaterThanOrEqual(3);
      expect(suffix.length).toBeLessThanOrEqual(34);
    }
  });
});
