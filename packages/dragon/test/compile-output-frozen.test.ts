/**
 * 図種ごとの組み立て結果を丸ごと固定する (#2030)。
 *
 * ## 何のためにあるか
 *
 * `compile.ts` (8,337 行) を file に分けていく間、**出力が 1 byte も変わらないこと** を
 * 証明するための網。 分割は純粋な移動なので、組み立てた結果は前後で完全に一致するはず。
 *
 * ## 既存の網では足りない
 *
 * `golden.test.ts` は 7 図種 100 件を覆うが、見ているのは骨格 (枠・箱・矢印の数と位置、
 * `viewBox`) だけ。 知らせ (`notices`) ・ 色 ・ 式の名札 ・ 部品の上書きは骨格に入らないので、
 * そこが変わっても通る。 覆う図種も 24 種のうち 7 種にとどまる。
 *
 * ここでは `compileToCdl` が返すもの全体と知らせ全体を、24 図種すべてについて記録する。
 *
 * ## 記録は動かす前に取る
 *
 * 動かした後に記録を作ると、移動で変わった値がそのまま正解として焼き付き、何も証明しない。
 * この検査は分割の commit より前に入れて記録を確定させる。
 *
 * ## 母集団は編集画面の見本
 *
 * `EDITOR_SAMPLES` は 24 図種すべてを 1 件以上覆う。 図種を足した時に見本も足す作りなので、
 * ここを母集団にすると新しい図種が自動で網に入る。 覆えた図種の数を検査の中で数え、
 * 1 種でも落ちたら空振りとして落とす。
 */
import { describe, expect, it } from "vitest";

import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { textDslToDiagram } from "../src";

/** 分岐表が持つ図種。 `compileToCdl` の `switch (doc.type)` と 1 対 1 で並ぶ */
const 図種 = [
  "sequence",
  "flow",
  "swimlane",
  "er",
  "state",
  "topology",
  "solidity",
  "gantt",
  "class",
  "pie",
  "bar",
  "line",
  "gauge",
  "radial",
  "stat",
  "waffle",
  "stacked",
  "slope",
  "funnel",
  "tree",
  "journey",
  "quadrant",
  "c4",
  "mind",
] as const;

/**
 * 見本 1 件を組み立てて、図と知らせの両方を返す。
 *
 * 入口は `textDslToDiagram` にする = 実際に使われる経路と同じ形で通す。 `compileToCdl` を
 * 直に呼ぶと、読み取りと入口の間で起きる変化を見落とす。
 */
function 組み立てる(code: string): { 図: unknown; 知らせ: unknown } {
  const 知らせ: unknown[] = [];
  const 図 = textDslToDiagram(code, { onNotice: (n) => 知らせ.push(n) });
  return { 図, 知らせ };
}

/** 見本の本文に書かれた図種。 分岐表のどの枝を通るかを決める */
function 見本の図種(code: string): string | null {
  return /^type:\s*([a-z0-9]+)\s*$/m.exec(code)?.[1] ?? null;
}

const 覆えた = new Set(
  EDITOR_SAMPLES.map((s) => 見本の図種(s.code)).filter((t): t is string => t !== null),
);

describe("組み立ての結果を丸ごと固定する (#2030)", () => {
  it.each(EDITOR_SAMPLES.map((s) => [s.slug, s.code] as const))(
    "%s の図と知らせが記録と一致する",
    (_slug, code) => {
      expect(組み立てる(code)).toMatchSnapshot();
    },
  );
});

describe("網が図種を取りこぼしていない (#2030)", () => {
  it("分岐表の 24 図種を 1 件以上ずつ覆う", () => {
    // 覆えていない図種があると、その組み立て器を動かしても記録が 1 行も動かない。
    // 「差分 0 行」 が移動の証拠になるのは、全ての枝を通している時だけ。
    const 抜け = 図種.filter((t) => !覆えた.has(t));

    expect(抜け, `見本が無い図種がある (見本 ${EDITOR_SAMPLES.length} 件を走査)`).toEqual([]);
    expect(覆えた.size, "図種を 1 つも読み取れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("見本が 1 件も記録漏れしていない", () => {
    // 記録の数と見本の数が食い違うと、落ちない見本が混ざる。
    expect(EDITOR_SAMPLES.length).toBeGreaterThanOrEqual(図種.length);
  });
});
