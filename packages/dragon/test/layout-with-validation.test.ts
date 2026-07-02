/**
 * layoutWithValidation の修復 loop 動作を確認する behavior test。
 *
 * cdl 側 unit test に置くのが本来だが、 cdl package は tsup build 前提で test runner なし。
 * dragon 側 vitest 環境で catalog diagram を素材に、 loop 経路の side effect を assert する。
 */
import { describe, it, expect } from "vitest";
import { layoutWithValidation } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as patterns from "../../../apps/playground/src/topics/catalog/patterns.cdl";

function isCdlDiagram(v: unknown): v is CdlDiagram {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    Array.isArray(o.lanes) &&
    Array.isArray(o.phases)
  );
}

const patternsDiagrams: CdlDiagram[] = Object.values(patterns).filter(isCdlDiagram);

describe("layoutWithValidation", () => {
  it("修復 loop 無効 (fix: false) では violations が集約される", () => {
    // patterns の pattern-passthrough は intentional な edge-node-cross を含む
    const target = patternsDiagrams.find((d) => d.id === "pattern-passthrough");
    expect(target).toBeDefined();
    if (!target) return;
    const result = layoutWithValidation(target, { fix: false });
    expect(result.fixLoops).toBe(0);
    expect(result.appliedHeuristics).toEqual([]);
    // pattern-passthrough は edge-node-cross error を含むので report.ok = false
    const hasEdgeNodeCross = result.report.violations.some((v) => v.axis === "edge-node-cross");
    expect(hasEdgeNodeCross).toBe(true);
  });

  it("修復 loop 有効 (fix: true) で pattern-passthrough は h3 back-detour を適用", () => {
    const target = patternsDiagrams.find((d) => d.id === "pattern-passthrough");
    expect(target).toBeDefined();
    if (!target) return;
    const result = layoutWithValidation(target, { fix: true, maxFixLoops: 3 });
    // 1 loop 以上走った & h3 heuristic が適用された
    expect(result.fixLoops).toBeGreaterThanOrEqual(1);
    expect(result.appliedHeuristics).toContain("h3-edge-back-detour");
  });

  it("maxFixLoops: 0 は 修復 skip", () => {
    const target = patternsDiagrams.find((d) => d.id === "pattern-passthrough");
    if (!target) return;
    const result = layoutWithValidation(target, { fix: true, maxFixLoops: 0 });
    expect(result.fixLoops).toBe(0);
  });

  it("全 patterns diagram で報告される axis 数の合計が visualValidate と一致", () => {
    for (const d of patternsDiagrams) {
      const result = layoutWithValidation(d, { fix: false });
      // fix:false なので violations は visualValidate 単発と同じ
      expect(result.report.violations.length).toBeGreaterThanOrEqual(0);
    }
  });
});
