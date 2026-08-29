/**
 * 図の並ぶ向きを記法から選べることの検証 (#1494)。
 *
 * 向きは長らく 2 つのことに紛れていた = どの `type` を選ぶかと、縦列を書き分けるかどうか。
 * その結果、流れ図は縦に固定され、横にしたければ泳法図を選ぶしかなかった (すると縦列の
 * 見出しが付いてくる)。
 *
 * 描き手は縦列 (`lane`) を横、段 (`stack`) を縦に置くので、両方向とも同じ仕組みで描ける。
 * 組み立て側にも「1 つの縦列に積む」 と「1 人ずつ縦列を作る」 の 2 経路が既にあった。
 * 足したのは **名指しする言葉だけ**。
 *
 * ## 何を見るか
 *
 * 並びは箱の縦列で決まる = 縦なら全部同じ縦列、横なら 1 人 1 縦列。 座標ではなく縦列で見る
 * のは、座標が描き手の計算で決まるため (組み立ての責務はどの縦列に置くかまで)。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";

/** 記法から図を組み、箱の縦列と知らせを返す。 */
function 組む(src: string): { 縦列: string[]; 知らせ: CompileNotice[] } {
  const 出た: CompileNotice[] = [];
  const d = textDslToDiagram(src, { onNotice: (n) => 出た.push(n) });
  return { 縦列: d.nodes.map((n) => n.lane), 知らせ: 出た };
}

/** 2 人の箱を持つ最小の記法。 向きの行だけを差し替えて比べる。 */
const 記法 = (type: string, 向き?: string, 縦列?: boolean): string =>
  [
    'title: "確かめ"',
    `type: ${type}`,
    ...(向き === undefined ? [] : [向き]),
    "",
    "actors:",
    縦列 === true ? "  - A: { lane: 左 }" : "  - A",
    縦列 === true ? "  - B: { lane: 左 }" : "  - B",
    "",
    "flow:",
    '  - A -> B: "x"',
    "",
  ].join("\n");

/** 全部が同じ縦列なら縦、1 人 1 縦列なら横。 */
const 向きを読む = (縦列: string[]): "縦" | "横" =>
  new Set(縦列).size === 1 ? "縦" : "横";

describe("図の並ぶ向き (#1494)", () => {
  it("書かない図の並びは変わらない", () => {
    // **既定を動かさないことが最優先**。 動かすと既存の全ての図が並び替わる
    expect(向きを読む(組む(記法("flow")).縦列), "流れ図の既定は縦").toBe("縦");
    expect(向きを読む(組む(記法("swimlane")).縦列), "泳法図の既定は横").toBe("横");
  });

  it("流れ図を横にできる", () => {
    // `#1494` の目的。 これまで流れ図は縦にしかできなかった
    const r = 組む(記法("flow", "direction: 横"));
    expect(向きを読む(r.縦列), `縦列 = ${r.縦列.join(" / ")}`).toBe("横");
    expect(r.知らせ.filter((n) => n.kind === "direction-not-honored"), "効かない知らせが出た").toEqual([]);
  });

  it("泳法図を縦にできる", () => {
    const r = 組む(記法("swimlane", "direction: 縦"));
    expect(向きを読む(r.縦列), `縦列 = ${r.縦列.join(" / ")}`).toBe("縦");
    expect(r.知らせ.filter((n) => n.kind === "direction-not-honored"), "効かない知らせが出た").toEqual([]);
  });

  it("英語の語でも同じ結果になる", () => {
    // **語は英語、値は両方**。 日本語の最上位見出しは v0.4 で廃止する側にあるため、
    // 語は `direction` に揃える。 値は箱の項目と同じく日本語でも書ける
    for (const [語, 期待] of [
      ["direction: horizontal", "横"],
      ["direction: vertical", "縦"],
      ["direction: 横", "横"],
      ["direction: 縦", "縦"],
    ] as const) {
      expect(向きを読む(組む(記法("flow", 語)).縦列), 語).toBe(期待);
    }
  });

  it("読めない語は誤りとして出す", () => {
    // 黙って既定に落とすと、綴りの誤りに気付けない
    const 出た: CompileNotice[] = [];
    expect(() => textDslToDiagram(記法("flow", "direction: ななめ"), { onNotice: (n) => 出た.push(n) })).toThrow(
      /direction が読めません/u,
    );
  });

  it("向きを選べない図種では効かず、知らせが出る", () => {
    // 並び方そのものが読み方を担う図種。 黙って捨てると「書いたのに変わらない」 になる
    for (const type of ["er", "state", "class", "sequence"]) {
      const r = 組む(記法(type, "direction: 横"));
      const n = r.知らせ.filter((x) => x.kind === "direction-not-honored");
      expect(n.length, `${type} で知らせが 1 件出る`).toBe(1);
      expect(n[0]!.message, `${type} の知らせに図種が出る`).toContain(type);
    }
  });

  it("全ての箱が縦列を書いた形では、書いた縦列が勝つ", () => {
    // 書いた指定が 2 つぶつかる形。 細かく書いた側 (箱ごとの縦列) を優先する
    const r = 組む(記法("flow", "direction: 横", true));
    expect(向きを読む(r.縦列), `縦列 = ${r.縦列.join(" / ")}`).toBe("縦");
    const n = r.知らせ.filter((x) => x.kind === "direction-not-honored");
    expect(n.length, "知らせが 1 件出る").toBe(1);
    expect(n[0]!.message, "縦列が優先されたことが読める").toContain("縦列");
  });

  it("向きを書かなければ知らせは出ない", () => {
    // 書いていない図に知らせを出すと、正しい図で毎回鳴る
    for (const type of ["er", "state", "flow", "swimlane"]) {
      const r = 組む(記法(type));
      expect(r.知らせ.filter((x) => x.kind === "direction-not-honored"), type).toEqual([]);
    }
  });
});
