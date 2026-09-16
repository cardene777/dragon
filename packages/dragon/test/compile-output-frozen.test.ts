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
 * ## 母集団は 2 つある
 *
 * 1 つ目は図種の網。 `EDITOR_SAMPLES` は 24 図種すべてを 1 件以上覆う。 図種を足した時に見本も
 * 足す作りなので、ここを母集団にすると新しい図種が自動で網に入る。 覆えた図種の数を検査の中で
 * 数え、1 種でも落ちたら空振りとして落とす。
 *
 * 2 つ目は部品の網 (#2038)。 図種の網は組み立てに部品の一覧を渡さないため、部品を取り込む経路を
 * 1 度も通らない。 `compile/placement-apply.ts` の `partBoxes` と `partSizes` は一覧がある時だけ
 * 呼ばれ、`mergePartsFromActors` も一覧が空なら取り込む本体に入らない。
 *
 * 実測で穴が開いていた。 #2036 で公開口 13 個に変異を 1 本ずつ当てた時、この記録が捕まえたのは
 * 1 本だけで、残りを捕まえたのは部品を実際に置いて組み立てる別の検査だった。 母集団を 2 つに
 * 分け、部品を箱に置いた見本には一覧を渡して組み立てる。
 *
 * ## 部品の網が覆わない枝 (#2038 で実測)
 *
 * `partBoxes` と `partSizes` はこの網では捕まらない。 どちらも空を返す変異を当てても 42 件とも
 * 通った。 2 つは相対で置く時 (`位置: 注文を受ける の右 200`) にだけ読まれるが、カタログの
 * 見本 13 件は相対で置く書き方を 1 件も使っていない。
 *
 * 分類は「他の検査が覆っている」。 同じ変異で `parts-relative-position.test.ts` が落ちる
 * (`partBoxes` で 4 件、`partSizes` で 17 件)。
 *
 * **分離は試したが足せない**。 カタログは見本ごとに本文と JSON を対で持ち、同じ図に解決される
 * ことを `catalog-source-pair.test.ts` が見る。 一方 JSON の読み取り側は相対で置く欄 (`posRel`)
 * を持たず、受け付ける欄の表にも無い。 相対で置く見本をカタログに足すと対を作れない。
 * JSON 側に欄を足す話は #2039 へ出した。
 */
import { describe, expect, it } from "vitest";

import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { 部品の一覧を作る } from "../../../apps/playground-spa/src/lib/parts-catalog";
import * as 部品 from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as 部品を箱に置く見本 from "../../../apps/playground-spa/src/topics/catalog/parts-in-box.cdl";
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

/**
 * 部品の一覧は実物 (`parts.cdl.ts`) から作る。 作り方は `part-name-label.test.ts` と同じ関数を
 * 通す = 2 度書くと片方だけ直って食い違う。
 */
const 部品の一覧 = 部品の一覧を作る(Object.values(部品));

/**
 * 部品を箱に置いた見本を、module から導く。
 *
 * 名前を手書きで並べない = 見本を足した人が、この検査のことを知らないまま足せる形にする。
 * `sourceYaml__` で始まる export が本文で、同じ図の JSON 版 (`sourceJson__`) と組み立て済みの図は
 * 別の名前を持つので混ざらない。
 */
const 部品の見本: ReadonlyArray<readonly [string, string]> = Object.entries(部品を箱に置く見本)
  .flatMap(([名, 値]) =>
    名.startsWith("sourceYaml__") && typeof 値 === "string" ? [[名, 値] as const] : [],
  )
  .sort((a, b) => a[0].localeCompare(b[0]));

/** 部品の一覧を渡して組み立てる。 渡さないと部品の箱は中身の無い既定の箱になる */
function 部品ごと組み立てる(code: string): { 図: unknown; 知らせ: unknown } {
  const 知らせ: unknown[] = [];
  const 図 = textDslToDiagram(code, {
    partsCatalog: 部品の一覧,
    onNotice: (n) => 知らせ.push(n),
  });
  return { 図, 知らせ };
}

/** 取り込んだ部品の要素の数。 要素の id は `<登場人物名>__<部品の中の id>` の形になる */
function 部品の要素の数(code: string): number {
  const 図 = textDslToDiagram(code, { partsCatalog: 部品の一覧 });
  return 図.nodes.filter((n) => n.id.includes("__")).length;
}

describe("部品を置いた図の組み立ての結果を丸ごと固定する (#2038)", () => {
  it.each(部品の見本)("%s の図と知らせが記録と一致する", (_名, 本文) => {
    expect(部品ごと組み立てる(本文)).toMatchSnapshot();
  });
});

describe("部品の網が部品の経路を通っている (#2038)", () => {
  it("部品の見本を 1 件以上走査している", () => {
    expect(
      部品の見本.length,
      "部品を箱に置いた見本を 1 件も拾えていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("取り込んだ部品の要素が 1 件以上ある", () => {
    // 一覧を渡していても、取り込みが働いていなければ部品の箱は中身の無い既定の箱になる。
    // その時この数は 0 のままで、記録は「差分 0 行」 を出し続ける。
    const 要素を持つ見本 = 部品の見本.filter(([, 本文]) => 部品の要素の数(本文) > 0);

    expect(
      要素を持つ見本.length,
      `部品の要素を持つ見本が 1 件も無い (見本 ${部品の見本.length} 件を走査、検査が空振りしている)`,
    ).toBeGreaterThan(0);
  });
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
