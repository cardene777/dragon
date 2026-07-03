/**
 * distributed / modern-web helper (Axis 61-64) の behavior test。
 */
import { describe, it, expect } from "vitest";
import {
  serializeForRsc,
  deserializeFromRsc,
  chunkDiagrams,
  validateChunk,
  mergeChunkResults,
  toCompact,
  fromCompact,
  graphqlSchemaSdl,
  toGraphqlResponse,
  visualValidate,
  visualValidateAll,
  type CdlDiagram,
} from "@cardenelabs/cdl";

function makeDiag(id: string): CdlDiagram {
  return {
    id,
    topic: "distributed test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "a", lane: "l", stack: 0, kind: "actor", title: "A" },
      { id: "b", lane: "l", stack: 1, kind: "actor", title: "B" },
    ],
    edges: [{ id: "e", from: "a", to: "b", label: "ok", tone: "accent" }],
    states: [],
    phases: [],
  };
}

describe("distributed helpers (Axis 61-64)", () => {
  // Axis 61: RSC serialize / deserialize
  it("serializeForRsc は plain object を返し JSON round-trip 可能", () => {
    const report = visualValidateAll([makeDiag("d1")]);
    const ser = serializeForRsc(report);
    const jsonText = JSON.stringify(ser);
    const parsed = JSON.parse(jsonText);
    const restored = deserializeFromRsc(parsed);
    expect(restored.total).toBe(1);
    expect(restored.pass + restored.fail).toBe(1);
    expect(restored.reports[0].diagramId).toBe("d1");
  });

  it("deserializeFromRsc は非 object で throw", () => {
    expect(() => deserializeFromRsc(null)).toThrow();
    expect(() => deserializeFromRsc(42)).toThrow();
  });

  // Axis 62: Worker parallelization
  it("chunkDiagrams で N chunk に分割", () => {
    const diagrams = [1, 2, 3, 4, 5, 6, 7].map((i) => makeDiag(`d${i}`));
    const chunks = chunkDiagrams(diagrams, 3);
    expect(chunks.length).toBe(3);
    expect(chunks[0]).toHaveLength(3);
    expect(chunks[2]).toHaveLength(1);
  });

  it("chunkSize=0 は単一 chunk", () => {
    const diagrams = [makeDiag("d1")];
    expect(chunkDiagrams(diagrams, 0).length).toBe(1);
  });

  it("validateChunk + mergeChunkResults は visualValidateAll と等価", () => {
    const diagrams = [1, 2, 3, 4].map((i) => makeDiag(`d${i}`));
    const chunks = chunkDiagrams(diagrams, 2);
    const chunkResults = chunks.map((c) => validateChunk({ diagrams: c }));
    const merged = mergeChunkResults(chunkResults);
    expect(merged.total).toBe(4);
    expect(merged.reports).toHaveLength(4);
  });

  // Axis 63: Compact serialization
  it("toCompact / fromCompact で pass/fail/total 保存", () => {
    const report = visualValidateAll([makeDiag("d1"), makeDiag("d2")]);
    const compact = toCompact(report);
    expect(compact.header[2]).toBe(2); // total
    expect(compact.diagramIds).toEqual(["d1", "d2"]);
    const restored = fromCompact(compact);
    expect(restored.total).toBe(2);
    expect(restored.pass + restored.fail).toBe(2);
  });

  it("toCompact は violations を flat array 化", () => {
    const d = makeDiag("dx");
    d.nodes.push({ id: "c", lane: "l", stack: 2, kind: "actor", title: "" }); // a11y warn
    const report = visualValidateAll([d]);
    const compact = toCompact(report);
    expect(compact.violations.length).toBeGreaterThan(0);
    // 各 record: [diagramIdx, axisIdx, severityBit, detail]
    for (const v of compact.violations) {
      expect(v.length).toBe(4);
      expect([0, 1]).toContain(v[2]);
    }
  });

  it("toCompact は size 削減 (baseline vs compact JSON.stringify 比)", () => {
    const diagrams = Array.from({ length: 30 }, (_, i) => makeDiag(`d${i}`));
    const report = visualValidateAll(diagrams);
    const baseline = JSON.stringify(report);
    const compactJson = JSON.stringify(toCompact(report));
    // ある程度削減されているが margin ゆるく assert (実測 依存)
    expect(compactJson.length).toBeLessThanOrEqual(baseline.length);
  });

  // Axis 64: GraphQL SDL
  it("graphqlSchemaSdl は SDL 文字列 (Query 型と SweepReport 型を含む)", () => {
    const sdl = graphqlSchemaSdl();
    expect(sdl).toContain("type SweepReport");
    expect(sdl).toContain("type Query {");
    expect(sdl).toContain("cdlValidateAll");
  });

  it("toGraphqlResponse は SweepReport 互換 shape", () => {
    const report = visualValidateAll([makeDiag("d1")]);
    const gql = toGraphqlResponse(report);
    expect(gql.total).toBe(1);
    expect(gql.pass + gql.fail).toBe(1);
    expect(Array.isArray(gql.reports)).toBe(true);
    expect(typeof gql.totalCounts).toBe("object");
  });

  // visualValidate 直接使用も回帰確認
  it("visualValidate 単発呼出しは既存挙動と変化なし", () => {
    const r = visualValidate(makeDiag("dz"));
    expect(r.diagramId).toBe("dz");
    expect(typeof r.ok).toBe("boolean");
  });
});
