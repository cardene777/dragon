/**
 * 記法から傾き図を書けるようにした (#1647)。
 *
 * 描画側の `chart-slope` (cdl#688) は 2 時点を直線でつなぎ、線の向きで増減を、
 * 線の交差で順位の入れ替わりを読ませる。 記法の `type:` はこの種別を知らなかった。
 *
 * ## 何を見るか
 *
 * 1. 図種を足す時に埋める先を 1 つも落としていないこと (受理 / 振り分け / 描く指定)
 * 2. **負の値を弾かないこと** = 増減を追う図なので 0 を跨ぐ値が来る。 折れ線と同じ扱い
 * 3. 前の時点を書かない図でも組み上がること
 * 4. 他の図表の扱いを変えていないこと = 陰性対照
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram } from "../src/index";
import { PRESET_TYPES, DRAW_TARGETS } from "../src/v05/parser";
import type { CompileNotice } from "../src/index";

const 記法 = (body: string, 動き = ""): string =>
  `title: "移り変わり"\ntype: slope\n\nactors:\n${body}${動き}`;

const 組む = (body: string, 動き = "") => textDslToDiagram(記法(body, 動き));

const 傾きの節 = (d: ReturnType<typeof 組む>) => d.nodes.filter((n) => n.kind === "chart-slope");

const 知らせを集める = (src: string): CompileNotice[] => {
  const 集め: CompileNotice[] = [];
  textDslToDiagram(src, { onNotice: (n) => 集め.push(n) });
  return 集め;
};

describe("図種を足す先を 1 つも落としていない (#1647)", () => {
  it("記法が `slope` を受ける", () => {
    expect(PRESET_TYPES.has("slope")).toBe(true);
  });

  it("`type: slope` が `chart-slope` の節になる", () => {
    // 受理だけ足して振り分けを落とすと、書けるのに描かれない図になる
    const 節 = 傾きの節(組む(`  - A: { value: "3", previous: "1" }\n`));
    expect(節.length, "傾き図の節が無い").toBe(1);
  });

  it("`draw: slope` が語の表に載っている", () => {
    expect(DRAW_TARGETS.get("slope")).toBe("slope");
  });

  it("段に `draw: slope` を書くと箱を指す", () => {
    const d = 組む(
      `  - A: { value: "3", previous: "1" }\n`,
      `\nanimation:\n  - step: "描く" 1.2s\n    draw: slope\n`,
    );
    expect(d.phases[0]?.draw, "描く先が決まっていない").toHaveLength(1);
    expect(d.nodes.some((n) => n.id === d.phases[0]!.draw![0])).toBe(true);
  });
});

describe("値の受け取り (#1647)", () => {
  it("前の時点が datum に届く", () => {
    const 節 = 傾きの節(組む(`  - A: { value: "45", previous: "39" }\n`))[0];
    expect(節?.chartData?.[0]?.value).toBe(45);
    expect(節?.chartData?.[0]?.previous).toBe(39);
  });

  it("負の値を弾かない", () => {
    // 増減を追う図なので損益のように 0 を跨ぐ値が来る。 折れ線と同じ扱い
    const src = 記法(`  - 利益: { value: "-6", previous: "5" }\n  - 損失: { value: "8", previous: "-4" }\n`);
    const 知らせ = 知らせを集める(src).filter((n) => n.kind === "chart-value-unreadable");
    expect(知らせ, "負の値を読めない値として捨てている").toEqual([]);
    const 節 = 傾きの節(textDslToDiagram(src))[0];
    expect(節?.chartData?.map((c) => c.value)).toEqual([-6, 8]);
  });

  it("前の時点を書かない図でも組み上がる", () => {
    // 描画側が軸 1 本の点の並びとして描く。 記法の側で弾かない
    const 節 = 傾きの節(組む(`  - A: "3"\n  - B: "1"\n`))[0];
    expect(節?.chartData?.length).toBe(2);
    expect(節?.chartData?.every((c) => c.previous === undefined)).toBe(true);
  });

  it("読めない値は知らせに出す", () => {
    const 知らせ = 知らせを集める(記法(`  - A: "あ"\n`)).filter(
      (n) => n.kind === "chart-value-unreadable",
    );
    expect(知らせ.length, "読めない値を黙って捨てている").toBe(1);
    expect(知らせ[0]?.message).toContain("type: slope");
  });
});

describe("他の図表の扱いを変えていない (陰性対照、 #1647)", () => {
  it("棒グラフは負の値を今までどおり弾く", () => {
    // 傾き図の例外を広げすぎると、棒の高さに負が入って絵が壊れる
    const src = `title: "確認"\ntype: bar\n\nactors:\n  - A: "-5"\n`;
    const 知らせ = 知らせを集める(src).filter((n) => n.kind === "chart-value-unreadable");
    expect(知らせ.length, "棒グラフで負が通っている").toBe(1);
  });

  it("`type: bar` に `draw: slope` と書くと食い違いを知らせる", () => {
    const src = `title: "確認"\ntype: bar\n\nactors:\n  - A: "5"\n\nanimation:\n  - step: "描く" 1.2s\n    draw: slope\n`;
    const 知らせ = 知らせを集める(src).filter((n) => n.kind === "draw-target-mismatch");
    expect(知らせ.length, "語と図種の食い違いを見逃している").toBe(1);
  });
});
