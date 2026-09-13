/**
 * 中身が違う見本 (`パターン`) の持ち方の検査 (#1696)。
 *
 * ## なぜ 2 群に分けたか
 *
 * 図の上の切替には性質の違う 2 種類がある。 `オプション` (折れ線の見せ方 等) は **1 つの
 * 記法を変換する** 操作で、押しても図に載る項目と値は変わらない。 `パターン` は **複数の
 * 記法から選ぶ** 操作で、押すと中身が入れ替わる。
 *
 * 変種を一覧の別行にすると、一覧の項目の数と記法の型の数がずれる (`大きな数字` と
 * `大きな数字 (複数)` で 2 行だが記法の型は `stat` の 1 つ)。 カタログは「この記法でこう
 * 描ける」 の目録なので、数がずれると読み違える。
 *
 * ## 実在のカタログと、自分で組み立てた module の両方を見る
 *
 * 実在のカタログだけを見ると「今そう書いてあるか」 しか確かめられず、書き方そのもの
 * (名前の無い変種を弾く 等) を確かめられない。 `moduleToItems` を直接呼ぶ検査を併せて置く。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, chart, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, moduleToItems, 選んだ見本 } from "./catalog-items";
import * as Charts from "@/topics/catalog/charts.cdl";

/** 件数ぶんの datum を持つ図を組む */
function 組む(id: string, 件数: number): CdlDiagram {
  let b = chart({ id, topic: "確認", type: "stat" });
  for (let i = 0; i < 件数; i += 1) b = b.datum({ id: `d${i}`, label: `d${i}`, value: i + 1 });
  return b.build();
}

/** 描いた結果に出てくる役割名の件数 */
function 役割の数(d: CdlDiagram, role: string): number {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);
  return [...svg.matchAll(new RegExp(`data-cdl-role="${role}"`, "g"))].length;
}

describe("変種の読み取り (#1696)", () => {
  it("`pattern__` の export は一覧の行にならず、元の見本に束ねられる", () => {
    const items = moduleToItems({
      patternBase__foo: "1 件",
      foo: 組む("foo", 1),
      pattern__foo__複数: 組む("foo-multi", 3),
    });
    expect(items.map((i) => i.id), "変種が一覧の行になっている").toEqual(["foo"]);
    expect(items[0]!.patterns?.map((p) => p.名)).toEqual(["1 件", "複数"]);
  });

  it("変種の並びの先頭は元の見本そのもの", () => {
    // 元を並びの外に置くと「元へ戻る」 を押せる場所が無くなる
    const 元 = 組む("foo", 1);
    const items = moduleToItems({
      patternBase__foo: "1 件",
      foo: 元,
      pattern__foo__複数: 組む("foo-multi", 3),
    });
    expect(items[0]!.patterns![0]!.diagram.id).toBe("foo");
    expect(items[0]!.patterns![1]!.diagram.id).toBe("foo-multi");
  });

  it("変種は自分の export 名を持つ", () => {
    // 記法の一致を見る検査は export 名で対象を引く。 名前から組み立て直すと、
    // 組み立て方が 2 箇所に分かれる
    const items = moduleToItems({
      patternBase__foo: "1 件",
      foo: 組む("foo", 1),
      pattern__foo__複数: 組む("foo-multi", 3),
    });
    expect(items[0]!.patterns?.map((p) => p.鍵)).toEqual(["foo", "pattern__foo__複数"]);
  });

  it("変種の記法は変種の鍵で引く", () => {
    const items = moduleToItems({
      patternBase__foo: "1 件",
      sourceYaml__foo: "元の記法",
      foo: 組む("foo", 1),
      sourceYaml__pattern__foo__複数: "変種の記法",
      pattern__foo__複数: 組む("foo-multi", 3),
    });
    expect(items[0]!.patterns![0]!.sourceYaml).toBe("元の記法");
    expect(items[0]!.patterns![1]!.sourceYaml).toBe("変種の記法");
  });

  it("変種を持たない見本は並びを持たない", () => {
    // 陰性対照。 何を渡しても並びが付くなら、上の検査は通っても意味を持たない
    const items = moduleToItems({ foo: 組む("foo", 1) });
    expect(items[0]!.patterns).toBeUndefined();
  });

  it("元の見本の名前が無い変種は落ちる", () => {
    // 既定値を置くと、押す先の名前が実物と違う切替が黙って出る
    expect(() =>
      moduleToItems({ foo: 組む("foo", 1), pattern__foo__複数: 組む("foo-multi", 3) }),
    ).toThrow(/patternBase__foo/);
  });
});

describe("選んだ見本を引く (#1696)", () => {
  const items = moduleToItems({
    patternBase__foo: "1 件",
    foo: 組む("foo", 1),
    pattern__foo__複数: 組む("foo-multi", 3),
  });
  const item = items[0]!;

  it("名前で引ける", () => {
    expect(選んだ見本(item, "複数")?.diagram.id).toBe("foo-multi");
  });

  it("押していない時は元の見本に落ちる", () => {
    expect(選んだ見本(item, null)?.diagram.id).toBe("foo");
  });

  it("並びに無い名前は元の見本に落ちる", () => {
    // 項目を選び直した直後は前の図の名前が残る。 そのまま引くと何も出ない
    expect(選んだ見本(item, "前の図で選んでいた名前")?.diagram.id).toBe("foo");
  });

  it("変種を持たない見本は元をそのまま返す", () => {
    const 単体 = moduleToItems({ bar: 組む("bar", 1) })[0]!;
    expect(選んだ見本(単体, "複数")?.diagram.id).toBe("bar");
  });

  it("見本が無い時は null", () => {
    // `parts` は一覧を後から読むため、選んでいる見本が無い時間がある
    expect(選んだ見本(null, "複数")).toBeNull();
  });
});

describe("カタログの 大きな数字 が 3 つのパターンを持つ (#1696 / #1711)", () => {
  const charts = CATALOG_ITEMS.charts ?? [];
  const 大きな数字 = charts.find((i) => i.title === "chartStat");

  it("カタログの図表を 1 件以上走査できている", () => {
    // 空振り検知。 0 件だと下の検査は何も見ずに通る
    expect(charts.length, "図表の見本が 1 つも無い").toBeGreaterThan(0);
    expect(大きな数字, "大きな数字 の見本が見つからない").toBeDefined();
  });

  it("一覧に `大きな数字 (複数)` の行が無い", () => {
    const 複数の行 = charts.filter((i) => i.diagram.id === "問い合わせの内訳");
    expect(複数の行, "変種が一覧の行として残っている").toHaveLength(0);
  });

  it("`1 件` と `複数` と `前の値つき` の 3 つを持つ", () => {
    expect(大きな数字!.patterns?.map((p) => p.名)).toEqual(["1 件", "複数", "前の値つき"]);
  });

  it("`前の値つき` を選ぶと前の時点が 1 行出て、`1 件` では出ない (#1711)", () => {
    // 記法は `previous` を書けるのに、engine が読んでいなかった (`cdl#763`)。
    // 書いた側と書かない側を同じ見本の切替で見比べられることを、描いて確かめる
    const 一件 = 選んだ見本(大きな数字, "1 件")!;
    const 前つき = 選んだ見本(大きな数字, "前の値つき")!;
    expect(役割の数(一件.diagram, "chart-stat-previous")).toBe(0);
    expect(役割の数(前つき.diagram, "chart-stat-previous")).toBe(1);
  });

  it("`複数` を選ぶと割合が件数ぶん出て、`1 件` では出ない", () => {
    // 割合は全件の合計に対する取り分なので、件が 1 つだと分母が自分自身になり出ない
    // (`cdl#759`)。 2 つの形が両方ともカタログから選べることを、描いて確かめる
    const 一件 = 選んだ見本(大きな数字, "1 件")!;
    const 複数 = 選んだ見本(大きな数字, "複数")!;
    expect(役割の数(一件.diagram, "chart-stat-share")).toBe(0);
    expect(役割の数(複数.diagram, "chart-stat-share")).toBeGreaterThanOrEqual(2);
  });

  it("記法も入れ替わる", () => {
    // 図だけ替わって記法が元のままだと、写したコードが画面と違う図を描く
    expect(選んだ見本(大きな数字, "1 件")!.sourceYaml).toContain("今月の解約率");
    expect(選んだ見本(大きな数字, "複数")!.sourceYaml).toContain("問い合わせの内訳");
  });

  it("折れ線は変種を持たない (陰性対照)", () => {
    // 「どの図でも並びが付く」 形なら、上の検査は通っても意味を持たない。
    //
    // 折れ線を選ぶのは、engine が中身の違う形を持たない種別だから (#1698 で実測)。
    // node から読む欄は `chartData` と 見せ方 3 つだけで、押すと中身が入れ替わる
    // 変種の作りようがない
    const 折れ線 = charts.find((i) => i.title === "chartLine");
    expect(折れ線, "折れ線の見本が見つからない").toBeDefined();
    expect(折れ線!.patterns).toBeUndefined();
  });
});

describe("変種の export はカタログの module に残る (#1696)", () => {
  it("`pattern__chartStat__複数` が図として export されている", () => {
    // 変種を module から消すと、動きを見る検査 (`catalog-motion-coverage` /
    // `catalog-motion-render`) の母集団からも落ちる。 一覧の行にしないことと、
    // module に無いことは別
    const mod = Charts as unknown as Record<string, unknown>;
    const 変種 = mod.pattern__chartStat__複数 as CdlDiagram | undefined;
    expect(変種?.id, "変種の export が消えている").toBe("問い合わせの内訳");
  });
});
