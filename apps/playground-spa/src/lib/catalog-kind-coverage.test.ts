import { describe, expect, it } from "vitest";
import { NODE_KINDS } from "@cardenelabs/cdl";

import * as Interactive from "@/topics/catalog/interactive.cdl";
import * as Cookbook from "@/topics/catalog/cookbook.cdl";
import * as Patterns from "@/topics/catalog/patterns.cdl";
import * as Primitives from "@/topics/catalog/primitives.cdl";
import * as PrimitivesExtra from "@/topics/catalog/primitives-extra.cdl";
import * as Animation from "@/topics/catalog/animation.cdl";
import * as Styles from "@/topics/catalog/styles.cdl";
import * as Presets from "@/topics/catalog/presets.cdl";
import * as Ethereum from "@/topics/catalog/ethereum.cdl";
import * as TextDsl from "@/topics/catalog/text-dsl.cdl";
import * as Parts from "@/topics/catalog/parts.cdl";
import * as Charts from "@/topics/catalog/charts.cdl";

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

const MODULES = [
  Interactive,
  Cookbook,
  Patterns,
  Primitives,
  PrimitivesExtra,
  Animation,
  Styles,
  Presets,
  Ethereum,
  TextDsl,
  Parts,
  Charts,
] as unknown as Array<Record<string, unknown>>;

/** catalog の全 module から、 図の node が使っている種別を集める。 */
function 使われている種別(): Set<string> {
  const out = new Set<string>();
  for (const mod of MODULES) {
    for (const v of Object.values(mod)) {
      if (typeof v !== "object" || v === null) continue;
      const nodes = (v as { nodes?: Array<{ kind?: string }> }).nodes;
      if (!Array.isArray(nodes)) continue;
      for (const n of nodes) if (typeof n.kind === "string") out.add(n.kind);
    }
  }
  return out;
}

/**
 * 見本を置かない種別。
 *
 * **空にしておく**。 増やす時は理由を 1 行で書く = 「なんとなく置いていない」 と「置けない」 を
 * 分けるため。
 *
 * 残る 2 種は #1446 で依存を 0.15.0 に上げた時に増えた分で、**記法からまだ書けない**。
 * 図表ではなく登場人物として書く形になるので、`kind:` の形を先に決める必要がある
 * (状態の図の組み立ては `kind:` を読まず、始まり / 終わり の印を自分で決めている)。
 * 行き先は #1450。 **載せたままにすると検査が痩せる** ので、そこで空に戻す。
 *
 * 同じ時に増えた図表 3 種 (`chart-stat` / `chart-waffle` / `chart-stacked-bar`) は
 * #1450 の 1 つ目の PR で記法から書けるようにして、ここから外した。
 */
const 対象外: ReadonlyArray<string> = [
  // 始点の印。 図表ではなく登場人物として書くので `kind:` の形が未定 (#1450)
  "mark-start",
  // 終点の印。 同上 (#1450)
  "mark-end",
];

describe("cdl の種別に見本がある (#1152)", () => {
  it("見本の無い種別が無い", () => {
    const 使用 = 使われている種別();
    const 無い = [...NODE_KINDS].filter((k) => !使用.has(k) && !対象外.includes(k)).sort();
    expect(無い, `見本の無い種別がある (catalog に足すか、 対象外に理由つきで載せる): ${無い.join(", ")}`).toEqual([]);
  });

  it("対象外に載せた種別は実在する", () => {
    // 消えた種別が対象外に残ると、 何を除外しているか読めなくなる
    const 幽霊 = 対象外.filter((k) => !(NODE_KINDS as readonly string[]).includes(k));
    expect(幽霊, `cdl に無い種別が対象外に残っている: ${幽霊.join(", ")}`).toEqual([]);
  });
});
