/**
 * ひな形の最後の段が、その図が何の図かを名乗る (#2641)。
 *
 * ひな形の頁は「この図は何か」 を見せる場所なので、最後の段で図の型を名乗る。
 * 「処理の順番を左から右へ 1 本の流れで示す図」 のような題で、`withSteps()` が最後の段の
 * `title` を省いた時に図の `topic` を入れる形で作られる。
 *
 * ## 決まりだけあって、守られているかを誰も見ていなかった
 *
 * 揃っていない状態が 2 度、数えるまで残っていた。
 *
 * | いつ | 何が揃っていなかったか |
 * |---|---|
 * | #2637 の前 | 17 組のうち 4 組で、簡単な版は名乗るのに複雑な版が番号付きの段で終わっていた |
 * | #2639 の前 | 16 のひな形のうち 3 つが、簡単な版も複雑な版も名乗らなかった |
 *
 * どちらも手で直したが、次にひな形を足した人が同じ形を守るかは何も見ていなかった。
 *
 * ## 語や番号の形では判定しない
 *
 * 「番号で終わっていないこと」 を見る形にすると、`1.2 倍で見る` のような小数を番号と
 * 読み違える (#2637 で実測)。 **`withSteps()` が入れる値がまさに `topic` なので、
 * 実物から導ける値どうしを突き合わせる**。
 *
 * ## ひな形の頁だけを見る
 *
 * 同じ「番号 + 末尾に要約」 の形は `primitives` の場面の図 30 件も使うが、あちらの要約は
 * `topic` と別の字で書かれている (`topic` が `scene: 監査 (auditor → 帳簿 → regulator)` で、
 * 末尾の題が `監査の流れ`)。 一致で見る形は、`withSteps()` が引き継ぐ頁にしか当たらない。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import { 並べた名前, 見本の名前 } from "../../../apps/playground-spa/src/lib/preset-exports";

/** 図として export されている見本を集める (名前と実物の組) */
const 見本 = (): Array<[string, CdlDiagram]> =>
  Object.entries(PresetsMod as Record<string, unknown>)
    .filter(([, v]) => {
      if (!v || typeof v !== "object") return false;
      const d = v as Partial<CdlDiagram>;
      return typeof d.id === "string" && Array.isArray(d.nodes) && Array.isArray(d.phases);
    })
    .map(([k, v]) => [k, v as CdlDiagram]);

describe("ひな形の最後の段が図の型を名乗る (#2641)", () => {
  it("集めた見本が見本の名前の一覧と一致する", () => {
    // **走査から外れた見本があれば落ちる** (#2139)。 数を書かず名前で突き合わせる
    expect(
      並べた名前(見本().map(([k]) => k)),
      "走査した見本と見本の名前の一覧がずれている (足す場所 = preset-exports.ts)",
    ).toEqual(並べた名前(見本の名前));
  });

  it("段が 2 つ以上ある図は、最後の段の題が図の型を名乗る", () => {
    const 名乗らない: string[] = [];
    let 母数 = 0;
    for (const [名, d] of 見本()) {
      // 段が 1 つしかない図は「送った先」 が無いので、末尾という位置が意味を持たない
      if (d.phases.length < 2) continue;
      母数 += 1;
      const 末 = d.phases[d.phases.length - 1]?.title ?? "";
      const 型 = d.topic ?? "";
      if (末 === 型) continue;
      名乗らない.push(`${名} (${d.id}) 末尾=「${末}」 topic=「${型}」`);
    }
    // **0 件の報告には母数を併記する** = 走査が空振りした状態と区別が付かなくなる
    expect(
      母数,
      "段が 2 つ以上あるひな形が 1 件も取れていない (import か走査が壊れている)",
    ).toBeGreaterThan(0);
    expect(
      名乗らない,
      `最後の段が図の型を名乗らないひな形がある (母数 ${母数} 図)。` +
        ` 最後の段の title を外すと withSteps が topic を入れる\n  ${名乗らない.join("\n  ")}`,
    ).toHaveLength(0);
  });

});
