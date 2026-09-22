/**
 * layoutWithValidation の修復 loop 動作を確認する behavior test。
 *
 * cdl 側 unit test に置くのが本来だが、 cdl package は tsup build 前提で test runner なし。
 * dragon 側 vitest 環境で catalog diagram を素材に、 loop 経路の side effect を assert する。
 */
import { describe, it, expect } from "vitest";
import { layoutWithValidation, visualValidate } from "@cardenelabs/cdl";
import type { CdlDiagram, Violation } from "@cardenelabs/cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";

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
    // 実在を先に確かめる (#2494)。 確かめないと、図を消した日に黙って通る
    expect(target, "pattern-passthrough が見つからない").toBeDefined();
    if (!target) return;
    const result = layoutWithValidation(target, { fix: true, maxFixLoops: 0 });
    expect(result.fixLoops).toBe(0);
  });

  it("全 patterns diagram で報告される axis 数の合計が visualValidate と一致", () => {
    // **名前が言う照合を本文でしていなかった** (#2500)。 `visualValidate` を呼ばず
    // 「0 以上」 を見ており、配列の長さは必ず 0 以上なので何も確かめていなかった。
    expect(patternsDiagrams.length, "パターンの図を 1 枚も集められていない").toBeGreaterThan(0);
    for (const d of patternsDiagrams) {
      const 通した = layoutWithValidation(d, { fix: false }).report.violations;
      // fix:false なので violations は visualValidate 単発と同じになるはず
      const 単発 = visualValidate(d).violations;
      expect(
        通した.map((v) => v.axis).sort(),
        `${d.id} で報告される軸が visualValidate と違う`,
      ).toEqual(単発.map((v) => v.axis).sort());
    }
  });

  it("h3 back-detour 適用で edge-node-cross error が実際に減る (実効性検証)", () => {
    // pattern-passthrough は intentional な a→router→c edge-node-cross を持つ。
    // 修復後の error count が修復前を下回ることを assert。
    const target = patternsDiagrams.find((d) => d.id === "pattern-passthrough");
    expect(target).toBeDefined();
    if (!target) return;

    const beforeReport = visualValidate(target);
    const beforeCross = beforeReport.violations.filter((v) => v.axis === "edge-node-cross");
    expect(beforeCross.length).toBeGreaterThan(0);

    const fixed = layoutWithValidation(target, { fix: true, maxFixLoops: 3 });
    const afterCross = fixed.report.violations.filter((v) => v.axis === "edge-node-cross");

    // 修復後の edge-node-cross は修復前より少ない or 同数 (back-detour で解消できないケースは残る)
    expect(afterCross.length).toBeLessThanOrEqual(beforeCross.length);
    // h3 heuristic が最低 1 回は適用されている
    expect(fixed.appliedHeuristics.filter((h) => h === "h3-edge-back-detour").length).toBeGreaterThan(0);
  });

  it("修復 loop 数が maxFixLoops を超えない (振動防止)", () => {
    const target = patternsDiagrams.find((d) => d.id === "pattern-passthrough");
    expect(target, "pattern-passthrough が見つからない").toBeDefined();
    if (!target) return;
    const result = layoutWithValidation(target, { fix: true, maxFixLoops: 3 });
    expect(result.fixLoops).toBeLessThanOrEqual(3);
    expect(result.appliedHeuristics.length).toBeLessThanOrEqual(3);
  });

  it("修復 heuristics 適用時に元の diagram は破壊されない (immutable 契約)", () => {
    const target = patternsDiagrams.find((d) => d.id === "pattern-passthrough");
    expect(target, "pattern-passthrough が見つからない").toBeDefined();
    if (!target) return;
    const originalEdges = JSON.parse(JSON.stringify(target.edges));
    layoutWithValidation(target, { fix: true, maxFixLoops: 3 });
    // 元 diagram の edges 配列が改変されていない
    expect(target.edges).toEqual(originalEdges);
  });

  /**
   * 自然発火しない軸を待つ形をやめた (#2494)。
   *
   * ここには「`label-inside-viewbox` が出たら h1 の手が呼ばれる」 と
   * 「`node-overlap` が出たら h2 の手が呼ばれる」 の 2 件が在った。
   * どちらも条件が成立せず、**何も確かめずに通っていた**。
   *
   * | 待っていた軸 | 実測 (2026-09-22) |
   * |---|---|
   * | `label-inside-viewbox` | 極長の札と大きなずらしを与えても発火しない |
   * | `node-overlap` | パターンの図 12 枚のうち 0 枚 |
   *
   * 描画側は「正常なカタログでは自然発火しない軸」 の一覧を持ち、2 つともそこに載っている。
   * 待っても永久に来ない。
   *
   * **手が効くことは確かめられない**。 描画側の注記が「発火するのは型どおりでない入力を
   * 作った時 (検査の変異 等)」 と書いており、記法からその入力を作れない。
   * 確かめられないことをここに書いて残す。
   *
   * 代わりに **カタログの全図でその 2 軸が 0 件** を見る。 0 件が意味を持つよう、
   * 走査した枚数を併記する = 0 枚を走査した時の 0 件と区別が付かなくなるため。
   */
  const 自然発火しない軸 = ["label-inside-viewbox", "node-overlap"] as const;

  it.each(自然発火しない軸)("パターンの図で %s が出ない", (軸) => {
    // 空振り防止。 走査する図が 0 枚なら、下の 0 件は何も言っていない
    expect(patternsDiagrams.length, "パターンの図を 1 枚も集められていない").toBeGreaterThan(0);

    const 出た = patternsDiagrams
      .filter((d) => visualValidate(d).violations.some((v) => v.axis === 軸))
      .map((d) => d.id);

    expect(
      出た,
      `${軸} がパターンの図で出た (${patternsDiagrams.length} 枚を走査)。` +
        ` 描画側がこの軸を自然発火なしとする一覧から外したか、図の側に異常が入った`,
    ).toEqual([]);
  });

  it("走査した図が発火する軸を 1 つ以上持つ (判定の生存確認)", () => {
    /*
     * 上の 2 件はどちらも 0 件を期待する。 走査の仕方が何も見つけない形になっていると
     * 永久に通るため、**同じ走査で 1 件以上見つかる軸** があることを確かめる。
     */
    const 何か出た = patternsDiagrams.filter((d) => visualValidate(d).violations.length > 0);
    expect(
      何か出た.length,
      `パターンの図 ${patternsDiagrams.length} 枚のどれも違反を 1 件も出さない (走査が効いていない)`,
    ).toBeGreaterThan(0);
  });

  it("修復 heuristics が「不要な axis」 まで trigger しない (副作用なし)", () => {
    // primitives-extra のような error 0 の diagram では修復 loop が 0 回に留まる
    const cleanDiag: CdlDiagram = {
      id: "clean-test",
      topic: "clean test",
      lanes: [{ id: "l1", x: 0, width: 200 }],
      nodes: [
        { id: "a", lane: "l1", stack: 0, kind: "actor", title: "A" },
        { id: "b", lane: "l1", stack: 1, kind: "actor", title: "B" },
      ],
      edges: [{ id: "e", from: "a", to: "b", label: "test", tone: "accent" }],
      states: [],
      phases: [],
    };
    const result = layoutWithValidation(cleanDiag, { fix: true, maxFixLoops: 3 });
    // needsRetry-対象の axis が無いので loop 0 回
    const hasRetryTargets = result.report.violations.some((v: Violation) =>
      ["edge-label-overlap", "edge-label-proximity", "arrow-endpoint-anchoring",
       "label-char-range", "node-overlap", "edge-crossing", "edge-node-cross",
       "label-inside-viewbox"].includes(v.axis),
    );
    if (!hasRetryTargets) {
      expect(result.fixLoops).toBe(0);
      expect(result.appliedHeuristics).toEqual([]);
    }
  });
});
