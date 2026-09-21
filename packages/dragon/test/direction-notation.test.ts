/**
 * 図の並ぶ向きを記法から選べることの検証 (#1494)。
 *
 * 向きは長らく 2 つのことに紛れていた = どの `type` を選ぶかと、縦列を書き分けるかどうか。
 * その結果、フローは縦に固定され、横にしたければ泳法図を選ぶしかなかった (すると縦列の
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
import { sourceYaml__pattern__flowDirection__書いた端のとおりに繋ぐ as 見本 } from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";

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
    expect(向きを読む(組む(記法("flow")).縦列), "フローの既定は縦").toBe("縦");
    expect(向きを読む(組む(記法("swimlane")).縦列), "泳法図の既定は横").toBe("横");
  });

  it("フローを横にできる", () => {
    // `#1494` の目的。 これまでフローは縦にしかできなかった
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

/**
 * 向きを書いたフローの矢印と行の対応 (#1986)。
 *
 * 向きを書いたフローは書いた端のとおりに矢印を作る。 矢印へ行の指定を書き写す処理と端の知らせが
 * 「登場人物を書いた順の鎖」 として行と対応させると、N 本目の矢印に N+1 人目を行き先に持つ行の
 * 指定が載る (実測 = `A -> C` に書いた `head: none` が `C -> B` に載り、行番号も入れ替わった)。
 *
 * **書いた端が鎖と食い違う並びで見る**。 `A -> B` / `B -> C` のように鎖と一致する並びでは、
 * どちらの対応の取り方でも同じ矢印に載り、判定の誤りが現れない。
 */
describe("向きを書いたフローの矢印 (#1986)", () => {
  const 本文 = (向き: string | undefined): string =>
    [
      'title: "t"',
      "type: flow",
      ...(向き === undefined ? [] : [向き]),
      "",
      "actors:",
      "  - A: { kind: card }",
      "  - B: { kind: card }",
      "  - C: { kind: card }",
      "",
      "flow:",
      '  - A -> C: "x" { head: none, sub: "補足" }',
      '  - C -> B: "y"',
      "",
    ].join("\n");

  function 組み立てる(src: string): {
    矢印: { 端: string; head?: string; sub?: string; 行?: number }[];
    端の知らせ: number[];
  } {
    const 知らせ: CompileNotice[] = [];
    const 行 = new Map<string, number>();
    const d = textDslToDiagram(src, {
      onNotice: (n) => 知らせ.push(n),
      onEdgeSource: (id, line) => 行.set(id, line),
    });
    return {
      矢印: d.edges.map((e) => ({
        端: `${e.from} -> ${e.to}`,
        ...(e.head !== undefined ? { head: e.head } : {}),
        ...(e.sub !== undefined ? { sub: e.sub } : {}),
        ...(行.has(e.id) ? { 行: 行.get(e.id) } : {}),
      })),
      端の知らせ: 知らせ.filter((n) => n.kind === "flow-endpoint-not-honored").map((n) => n.line),
    };
  }

  it.each(["direction: 縦", "direction: 横"])(
    "%s = 書いた行の指定と行番号が、その行の端を持つ矢印に載り、端の知らせが出ない",
    (向き) => {
      const r = 組み立てる(本文(向き));
      // 向きの行が 1 行増えるので、`A -> C` は 11 行目、`C -> B` は 12 行目
      expect(r.矢印).toEqual([
        { 端: "a -> c", head: "none", sub: "補足", 行: 11 },
        { 端: "c -> b", 行: 12 },
      ]);
      expect(r.端の知らせ).toEqual([]);
    },
  );

  it("カタログの見本は、向きの行を外すと差し戻しの矢印が消える", () => {
    // 見本が見比べる意味を持つかを見る。 段を書いたフローは向きに依らず書いた端を使うため、
    // 見本に段を足すと向きの行を消しても絵が変わらなくなる (実測)
    const 矢印 = (src: string): string[] =>
      textDslToDiagram(src).edges.map((e) => `${e.from} -> ${e.to}: ${e.label}`);
    expect(矢印(見本)).toEqual(["申し込む -> 登録する: 申込書", "登録する -> 申し込む: 差し戻し"]);
    const 向きなし = 見本.replace("direction: vertical\n", "");
    expect(向きなし, "見本の本文に向きの行が無い (検査が空振りしている)").not.toBe(見本);
    expect(矢印(向きなし)).toEqual(["申し込む -> 登録する: 申込書"]);
  });

  it("向きを書かなければ鎖になり、端が食い違う 2 行を知らせる", () => {
    // 陰性対照。 同じ行を静止した鎖で組むと、書いた端は使われない (#1269)
    const r = 組み立てる(本文(undefined));
    expect(r.矢印.map((e) => e.端)).toEqual(["a -> b", "b -> c"]);
    expect(r.端の知らせ).toEqual([10, 11]);
  });
});
