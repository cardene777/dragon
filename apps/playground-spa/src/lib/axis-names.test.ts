/**
 * 走査の軸の日本語の呼び名の検証 (#1796)。
 *
 * #1795 で編集画面の案内を日本語にしたが、案内へ差し込まれる軸の名前だけが
 * `structured-data-extraction` のような識別子のまま出ていた。
 *
 * **軸の一覧は実物から導く**。 engine が返す走査の結果 (`counts`) の鍵を走査するので、
 * engine が軸を足した時に呼び名の抜けが検査で落ちる。 手で並べると、足した軸が
 * 母集団から外れて永久に緑になる。
 */
import { describe, it, expect } from "vitest";
import { visualValidate } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import {
  AXIS_JA,
  axisLabel,
  直せない軸の案内,
  まとめて直せない案内,
  軸ごとの直し方,
  直し方の既定,
} from "./axis-names";

/** engine が返しうる軸。 走査の結果の鍵から導く (手で並べない) */
function engineの軸(): string[] {
  const d = textDslToDiagram(`title: "t"
type: flow
actors:
  - Web: service
  - API: service
flow:
  - Web -> API: "a"
`);
  return Object.keys(visualValidate(d).counts);
}

const 日本語の字 = /[ぁ-んァ-ヶ一-龯]/;

describe("走査の軸の呼び名 (#1796)", () => {
  it("engine が返しうる軸に呼び名が付いている", () => {
    const 軸 = engineの軸();
    console.log(`[軸の呼び名] engine の軸=${軸.length} 表の件数=${Object.keys(AXIS_JA).length}`);
    expect(軸.length, "engine の軸を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(50);
    const 呼び名なし = 軸.filter((a) => !(a in AXIS_JA));
    expect(呼び名なし, `呼び名を持たない軸:\n${呼び名なし.join("\n")}`).toEqual([]);
  });

  it("表に engine が返さない軸が残っていない", () => {
    // 軸が消えた時に呼び名だけが残ると、画面に出ない字を直し続けることになる
    const 軸 = new Set(engineの軸());
    const 余り = Object.keys(AXIS_JA).filter((a) => !軸.has(a));
    expect(余り, `engine に無い軸の呼び名が残る:\n${余り.join("\n")}`).toEqual([]);
  });

  it("呼び名が日本語で、識別子の写しになっていない", () => {
    const 表 = Object.entries(AXIS_JA);
    expect(表.length, "呼び名を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(50);
    const 難あり = 表
      .filter(([k, v]) => !日本語の字.test(v) || v === k || /[A-Za-z]/.test(v))
      .map(([k, v]) => `${k}: ${v}`);
    expect(難あり, `呼び名が日本語になっていない:\n${難あり.join("\n")}`).toEqual([]);
  });

  it("呼び名を持たない軸を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る
    const 表 = { "node-overlap": "箱どうしが重なっていないか" };
    expect(["node-overlap"].filter((a) => !(a in 表))).toEqual([]);
    expect(["node-overlap", "植えた軸"].filter((a) => !(a in 表))).toEqual(["植えた軸"]);
  });

  it("呼び名が無い軸は識別子をそのまま返す", () => {
    // 空にすると、どの軸かが画面から消える。
    // 表の中身は言い換えうるので、特定の呼び名を書かずに表から引いて突き合わせる
    const [鍵, 値] = Object.entries(AXIS_JA)[0]!;
    expect(axisLabel(鍵)).toBe(値);
    expect(axisLabel("まだ呼び名の無い軸")).toBe("まだ呼び名の無い軸");
  });

  it("画面へ出す案内に識別子がそのまま出ない", () => {
    // #1795 で直した後も、差し込まれる軸の名前だけが `structured-data-extraction` のまま出ていた
    const 軸 = engineの軸();
    const 識別子の形 = /[a-z][a-z0-9]*(-[a-z0-9]+)+/;
    const 残る: string[] = [];
    for (const a of 軸) {
      for (const 文 of [直せない軸の案内([a]), まとめて直せない案内([a])]) {
        if (識別子の形.test(文)) 残る.push(`${a}: ${文}`);
      }
    }
    console.log(`[案内の字] 軸=${軸.length} 識別子が残る=${残る.length}`);
    expect(軸.length, "engine の軸を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(50);
    expect(残る, `案内に識別子がそのまま出る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("軸が 1 つも無い時は添え書きを付けない", () => {
    expect(直せない軸の案内([])).toBe("自動で直せるものはありません");
    // 文の中の「(重なり / 間隔 / 近さ)」 は添え書きではないので、末尾で見る
    expect(まとめて直せない案内([])).toMatch(/必要があります。$/);
    expect(まとめて直せない案内(["node-overlap"])).toMatch(/\)。$/);
  });

  it("直し方を書いた軸は既定の文に落ちない", () => {
    const 書いた = Object.keys(軸ごとの直し方);
    expect(書いた.length, "直し方を 1 つも書いていない (検査が空振りしている)").toBeGreaterThan(3);
    const 落ちた = 書いた.filter((a) => 直せない軸の案内([a]).includes(`= ${直し方の既定}`));
    expect(落ちた, `直し方を書いたのに既定に落ちる軸: ${落ちた.join(", ")}`).toEqual([]);
    // 直し方を書いていない軸は既定に落ちる (対照)
    const 書いていない = engineの軸().find((a) => !(a in 軸ごとの直し方))!;
    expect(直せない軸の案内([書いていない])).toContain(`= ${直し方の既定}`);
  });
});
