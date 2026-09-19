/**
 * cdl が描ける種別すべてに catalog の見本がある (#1152)。
 *
 * `#1152` は「図表系 10 種に見本が無い」 という見立てで始まったが、 **その見立て自体が誤り**
 * だった。 catalog の file を種別名で grep して判断したところ、 `presets` が helper 経由で
 * 組み立てる分が文字列として現れず、 9 種を見落としていた。 実際に無かったのは `chart-bar` の
 * 1 種だけ。
 *
 * この検査はその再発を防ぐ。 **grep ではなく組み上がった図を読む** ので、 どう書かれていても
 * 数え落とさない。
 *
 * 件数を固定する検査 (`catalog-name-parity.test.ts`) では捕まらない。 あちらは「catalog の
 * 図の数が変わっていないか」 を見るだけで、 cdl 側に何があるかを知らないため。
 *
 * ここは **cdl の種別一覧を正として突き合わせる**。 cdl が種別を足したら、 見本を足すまで
 * 落ちる。
 */

import { describe, expect, it } from "vitest";
import { NODE_KINDS } from "@cardenelabs/cdl";

import { 実在する群 } from "../../../../packages/dragon/test/support/catalog-groups";

/**
 * カタログの群を **dir の走査で集める** (#2314)。
 *
 * 以前は `import` を 1 群ずつ手で並べており、`parts-in-box` と `parts-motion` が抜けていた。
 * 抜けた群にしか無い種別が出た日に「見本が無い」 と誤って落ちる。
 *
 * 走査は `packages/dragon/test/support/responsive-accepted.ts` にも在るが、あちらは
 * `vite/client` を引けない都合で `import.meta.glob` の型を自前で宣言しており、
 * 画面側から読むと型が衝突する。 走査は各側に置き、**突き合わせる相手** だけを共有する。
 */
const 群ごと: Record<string, unknown> = import.meta.glob("@/topics/catalog/*.cdl.ts", {
  eager: true,
});

/** 走査で見つけた群の名前 (`*.cdl.ts` の `*`、並べ替え済)。 */
const カタログの群の名 = (): string[] =>
  Object.keys(群ごと)
    .map((p) => p.slice(p.lastIndexOf("/") + 1).replace(/\.cdl\.ts$/, ""))
    .sort();

/** 走査で見つけた全ての図。 枚数は増えるので書かない。 */
const 全図 = Object.keys(群ごと)
  .sort()
  .flatMap((k) => Object.values(群ごと[k] as Record<string, unknown>))
  .filter(
    (v): v is { nodes: Array<{ kind?: string }> } =>
      typeof v === "object" && v !== null && Array.isArray((v as { nodes?: unknown }).nodes),
  );


/** catalog の全 module から、 図の node が使っている種別を集める。 */
function 使われている種別(): Set<string> {
  const out = new Set<string>();
  for (const v of 全図) {
    for (const n of v.nodes) if (typeof n.kind === "string") out.add(n.kind);
  }
  return out;
}

/**
 * 見本を置かない種別。
 *
 * **空にしておく**。 増やす時は理由を 1 行で書く = 「なんとなく置いていない」 と「置けない」 を
 * 分けるため。
 *
 * #1446 で依存を 0.15.0 に上げた時に 7 種増えたが、#1450 で全て記法から書けるようにして
 * ここを空に戻した。 一時的に載せていた 5 種のうち、図表 3 種
 * (`chart-stat` / `chart-waffle` / `chart-stacked-bar`) は 1 つ目の PR、
 * 印 2 種 (`mark-start` / `mark-end`) は 2 つ目の PR で外した。
 */
const 対象外: ReadonlyArray<string> = [];

describe("cdl の種別に見本がある (#1152)", () => {
  it("走査した群が dir の実体と 1 件も違わない (#2314)", () => {
    /*
     * 群を手で並べていた頃は `parts-in-box` と `parts-motion` が抜けており、38 図を 1 度も
     * 見ていなかった。 抜けた群にしか無い種別が出た日に「見本が無い」 と誤って落ちる。
     * 走査に変えただけでは走査の書き方を間違えた時に気付けないので、別の経路
     * (`readdirSync`) で数えた群と名前で突き合わせる。
     */
    expect(カタログの群の名(), `dir にある群 ${実在する群().length} 件と突き合わせた`).toEqual(
      実在する群(),
    );
  });

  it("見本の無い種別が無い", () => {
    const 使用 = 使われている種別();
    const 無い = [...NODE_KINDS].filter((k) => !使用.has(k) && !対象外.includes(k)).sort();
    expect(
      無い,
      `見本の無い種別がある (catalog に足すか、 対象外に理由つきで載せる): ${無い.join(", ")}`,
    ).toEqual([]);
  });

  it("対象外に載せた種別は実在する", () => {
    // 消えた種別が対象外に残ると、 何を除外しているか読めなくなる
    const 幽霊 = 対象外.filter((k) => !(NODE_KINDS as readonly string[]).includes(k));
    expect(幽霊, `cdl に無い種別が対象外に残っている: ${幽霊.join(", ")}`).toEqual([]);
  });
});
