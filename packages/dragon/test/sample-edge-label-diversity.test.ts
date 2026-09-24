/**
 * sample edge label diversity 網羅 (iter80、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter80。
 * 全 sample の edge label の多様性を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  edges: Array<{ from: string; to: string; label?: string }>;
}

/**
 * 札を持つ見本だけを集める。 札が 1 本も無い見本 (円グラフ 等) は
 * 「札の性質」 を持たないので、判定の母数から外す。
 *
 * **検査の本文で抜けない** (#2500)。 抜ける形は、母数が空になった日に
 * 何も確かめずに通る形と見分けが付かない。
 */
const 札を持つ見本 = EDITOR_SAMPLES.map((sample) => {
  const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
  const labels = d.edges.map((e) => e.label ?? "").filter((l) => l.length > 0);
  return { sample, d, labels };
}).filter((x) => x.labels.length > 0);

/** 矢印を持つ見本。 上と同じ理由で母数から外す */
const 矢印を持つ見本 = EDITOR_SAMPLES.map((sample) => ({
  sample,
  d: textDslToDiagram(sample.code),
})).filter((x) => x.d.edges.length > 0);

describe("iter80: 全 sample × edge label diversity", () => {
  it("札を持つ見本と矢印を持つ見本が 1 件以上ある (走査の生存確認)", () => {
    // 0 件だと、下の検査が全部何も確かめずに通る
    expect(札を持つ見本.length, `見本 ${EDITOR_SAMPLES.length} 件のどれも札を持たない`).toBeGreaterThan(0);
    expect(矢印を持つ見本.length, `見本 ${EDITOR_SAMPLES.length} 件のどれも矢印を持たない`).toBeGreaterThan(0);
  });

  // 消した 2 件 (#2500)。
  //
  // 「edge label 分布」 は `単一 label / 全 label <= 1` を見ており、部分を全体で割った値は
  // 常に 1 以下なので何も確かめていなかった。 comment は「単一 label > 50% の検知」 と
  // 書くが、実測では動物クラス階層が同じ札を 2 本とも使う (100%) = 継承の図では正しい形で、
  // 50% は守るべき性質ではない。
  //
  // 「空 label edge 比率 == 100% or < 100%」 は名前が全ての場合を覆っており、
  // 守る性質が 1 つも書かれていない。

  for (const { sample, labels } of 札を持つ見本) {
    it(`${sample.label}: 札の平均の長さが 60 字以下`, () => {
      const avg = labels.reduce((sum, l) => sum + l.length, 0) / labels.length;
      expect(avg, `札 ${labels.length} 本の平均`).toBeLessThanOrEqual(60);
    });
  }

  for (const { sample, d } of 矢印を持つ見本) {
    it(`${sample.label}: 行き先が違う矢印が全体の 40% 以上 (実 flow 検知)`, () => {
      // **名前は 40% と言い、本文は 0 以上を見ていた** (#2500)。 名前の側に揃えた。
      // 実測 (2026-09-22) では矢印を持つ 7 図すべてで 100%。
      const nonLoop = d.edges.filter((e) => e.from !== e.to).length;
      expect(
        nonLoop / d.edges.length,
        `${sample.label} で行き先が違う矢印が ${nonLoop} / ${d.edges.length} 本`,
      ).toBeGreaterThanOrEqual(0.4);
    });
  }
});
