/**
 * 記法の `values:` が、書き方の案内と実例の両方で使えることの検査 (#1190)。
 *
 * `#1162` / `#1180` / `#1181` で配線したが、記法一覧にも catalog にも `values` が 1 件も
 * 無かった (実測)。 動くようになっても、書き方が分からず使った図も無い状態が続いていた。
 *
 * ここでは 2 つを見る。 記法一覧が記法の項目を覆っていること (取り残しの検知) と、
 * catalog に置いた実例が **絵として** 段ごとに変わること (`#1172` で決めた見方)。
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, computeStateValues, layout } from "@cardenelabs/cdl";
import { TOP_LEVEL_KEYS } from "@cardenelabs/dragon";
import { textDslValues } from "@/topics/catalog/text-dsl.cdl";
import { FORMS, buildSample } from "./syntax-forms";

/**
 * 一覧の各節から組んだ例文をすべて繋いだもの。
 *
 * **表示する文字ではなく例文で見る**。 節の題は日本語なので、`actors` のように題からは
 * 現れない項目がある。 例文は実際に記法として通る形なので、そこに項目が現れることは
 * 「その項目の書き方が一覧から辿れる」 と同じ意味になる。
 */
const 例文 = FORMS.map(buildSample).join("\n");

describe("記法一覧が記法の項目を覆う (#1190)", () => {
  it("記法が受ける top-level 項目が全て載っている", () => {
    // **今回の抜けはこの形で起きた** = 記法に `states` / `values` があるのに一覧が 0 件。
    // 項目を足しても一覧が取り残される形を、実装の一覧と突き合わせて止める
    const 無い = TOP_LEVEL_KEYS.filter((key) => !例文.includes(`${key}:`));
    expect(無い, `記法一覧に載っていない項目: ${無い.join(", ")}`).toEqual([]);
  });

  it("値の書き方が一覧にある", () => {
    // 上の検査は文字が含まれるかまでしか見ない。 値の節が実際にあることを別に見る
    const 題 = FORMS.map((s) => s.title);
    expect(題).toContain("値 (states:)");
    expect(題).toContain("値どうしの関係 (values:)");
  });
});

describe("catalog の実例で値が動く (#1190)", () => {
  it("段を進めると、書いていない値が変わる", () => {
    // `waiting` は段のどこにも書かれていない。 `inflow` と `done` から毎 frame 決まる
    const laid = layout(textDslValues);
    expect(computeStateValues(laid, 0, 1).waiting).toBe("40");
    expect(computeStateValues(laid, 1, 1).waiting).toBe("30");
    expect(computeStateValues(laid, 2, 1).waiting).toBe("15");
    // 比較の結果も数として出る (真 = 1 / 偽 = 0)
    expect(computeStateValues(laid, 0, 1).busy).toBe("1");
    expect(computeStateValues(laid, 2, 1).busy).toBe("0");
  });

  it("段を書いていない値が、絵の文字として出る", () => {
    // 値の計算が合っていても、描く経路が無ければ画面は変わらない (`#1173` の 79 件)
    // 段を指定した静止描画は、その段まで進めた状態を描く (実測)。 3 段目では
    // 流入 40 / 処理 25 で、**待ち行列だけが 15** = 他の箱の数と紛れない形で確かめられる
    const svg = renderToStaticMarkup(
      <CdlDiagramView diagram={textDslValues} hideHeader focusPhaseId="追いつく" />,
    );
    expect(svg).toContain(">15<");
    expect(svg).not.toContain("{waiting}");
  });

  it("実例は記法から作られている (図を直接組み立てていない)", () => {
    // 記法で書けることを示すのが実例の役割。 図を直接組み立てると、記法が壊れても気付けない。
    // 書いた式がそのまま図に載っていることで、記法を通ったことが分かる
    expect(textDslValues.derived).toEqual([
      { id: "waiting", expression: "{inflow} - {done}" },
      { id: "busy", expression: "{waiting} > 20" },
    ]);
  });
});
