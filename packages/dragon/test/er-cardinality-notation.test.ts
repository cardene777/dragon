/**
 * ER の多重度を記法から書いた図が、組み立て API に同じ指定を渡した図と一致する (#2105)。
 *
 * 多重度の語 (`1:1` / `1:N` 等) は、欄 (`cardinality`) にも名前 (`注文する (1:1)`) にも書ける。
 * ER は段を書くかどうかで組み立てが 2 つに分かれる (段の無い図は描画側の `er()`、段を持つ図は
 * 段を書ける共通の組み立て)。 書き方 2 つ × 段の有無 2 つを別々に読んでいた間、26 通りのうち
 * 18 通りで同じ語が別の図になっていた。
 *
 * | 形 | 食い違い方 |
 * |---|---|
 * | 欄に書く (段なし) | 名前に `(1:1)`、名前の下の行に `1:N` が出て、端は `1:N` のまま |
 * | 段を持つ図 | どちらの書き方でも端の形が付かない |
 * | 語を書かない (段なし) | 書いていない `1:N` が名前の下の行と端に出る |
 *
 * ## 正は組み立て API
 *
 * 描画側の `er().relation` は語から両端の形を引き (`ER_CARDINALITY_HEAD`)、語を名前の下の行に
 * 1 度だけ出す。 記法の結果を、組み立て API に「書いた人の意図」 を渡した結果と突き合わせる。
 * 語の一覧は描画側の表から導く = 描画側が語を足すと、記法が読めない限りここが落ちる。
 */
import { describe, expect, it } from "vitest";
import { ER_CARDINALITY_HEAD, er, type CdlEdge, type ErRelation } from "@cardenelabs/cdl";
import { jsonToDiagram } from "../src/index";

type 見える欄 = Pick<CdlEdge, "label" | "sub" | "head" | "tailHead">;

const 見える = (e: CdlEdge | undefined): 見える欄 => {
  expect(e, "矢印が 1 本も組み立てられていない").toBeDefined();
  return { label: e!.label, sub: e!.sub, head: e!.head, tailHead: e!.tailHead };
};

/** 記法の 1 行を持つ ER 図を組み立て、最初の矢印の見える欄を返す */
function 記法の矢印(行: Record<string, unknown>, 段: boolean): 見える欄 {
  const d = jsonToDiagram({
    title: "注文の表",
    type: "er",
    actors: [{ name: "User" }, { name: "Order" }],
    flow: [{ from: "User", to: "Order", ...行 }],
    ...(段 ? { animation: [{ step: "全体", focus: ["User", "Order"] }] } : {}),
  });
  return 見える(d.edges[0]);
}

/** 組み立て API に同じ意図を渡した時の、矢印の見える欄 */
function 組み立ての矢印(指定: Omit<ErRelation, "from" | "to">): 見える欄 {
  const d = er({ id: "t", topic: "注文の表" })
    .entity({ id: "user", title: "User" })
    .entity({ id: "order", title: "Order" })
    .relation({ from: "user", to: "order", ...指定 })
    .build();
  return 見える(d.edges[0]);
}

const 語たち = Object.keys(ER_CARDINALITY_HEAD) as Array<keyof typeof ER_CARDINALITY_HEAD>;

type 組 = { 題: string; 行: Record<string, unknown>; 意図: Omit<ErRelation, "from" | "to"> };

const 組たち: 組[] = [
  ...語たち.flatMap((語): 組[] => [
    { 題: `欄に ${語}`, 行: { label: "注文する", cardinality: 語 }, 意図: { label: "注文する", cardinality: 語 } },
    { 題: `名前に ${語}`, 行: { label: `注文する (${語})` }, 意図: { label: "注文する", cardinality: 語 } },
    // JSON は名前の欄を省けないので、書かない形は空の名前で表す
    { 題: `名前を空にして欄に ${語}`, 行: { label: "", cardinality: 語 }, 意図: { cardinality: 語 } },
    { 題: `名前が語だけ ${語}`, 行: { label: `(${語})` }, 意図: { cardinality: 語 } },
    // 名前にも語を書いた時は欄の語が勝ち、名前の語は外す = 語が名前と名前の下の行に 2 度並ばない
    {
      題: `欄に ${語} と名前にも別の語`,
      行: { label: `注文する (${語 === "1:1" ? "N:M" : "1:1"})`, cardinality: 語 },
      意図: { label: "注文する", cardinality: 語 },
    },
    {
      題: `欄に ${語} と端を明示`,
      行: { label: "注文する", cardinality: 語, tailHead: "zero-one", head: "zero-many" },
      意図: { label: "注文する", cardinality: 語, tailHead: "zero-one", head: "zero-many" },
    },
  ]),
  { 題: "語を書かない", 行: { label: "注文する" }, 意図: { label: "注文する" } },
  {
    題: "語を書かずに端を明示",
    行: { label: "注文する", tailHead: "one", head: "zero-many" },
    意図: { label: "注文する", tailHead: "one", head: "zero-many" },
  },
  { 題: "欄に小文字で書く", 行: { label: "注文する", cardinality: "1:n" }, 意図: { label: "注文する", cardinality: "1:N" } },
  // 6 語に無い語は、組み立て API に渡す口が無い。 名前に添えて字を残し、端は決めない
  { 題: "欄に 6 語に無い語", 行: { label: "注文する", cardinality: "2..5" }, 意図: { label: "注文する (2..5)" } },
];

describe("ER の多重度を記法から書いた図が、組み立て API と一致する (#2105)", () => {
  it("描画側の表から語を 1 つ以上導けている", () => {
    expect(語たち.length, "多重度の語を 1 つも導けていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("語ごとに組み立て API の端の形が違う (比べ方が効いている)", () => {
    // 見える欄を読み違えて全ての組が同じ値になると、下の突き合わせが何も見ずに通る
    const 端たち = new Set(語たち.map((語) => JSON.stringify(組み立ての矢印({ cardinality: 語 }))));
    expect(端たち.size, "語を変えても組み立て API の矢印が変わらない").toBeGreaterThan(1);
  });

  for (const 段 of [false, true]) {
    describe(段 ? "段を持つ図" : "段の無い図", () => {
      // 題の差し込み (`$題`) は英字の名前しか読まないので、題を先頭に並べて `%s` で出す
      it.each(組たち.map((c) => [c.題, c] as const))("%s", (_題, { 行, 意図 }) => {
        expect(記法の矢印(行, 段)).toEqual(組み立ての矢印(意図));
      });
    });
  }
});
