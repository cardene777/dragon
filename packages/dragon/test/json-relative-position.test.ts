/**
 * 位置を他の要素からの相対で書く形が、本文と JSON の両方で書けること (#2039)。
 *
 * ## 何が足りなかったか
 *
 * 本文は `位置: Web の右 200` を読むが、JSON の読み取り側は同じことを書く欄を持たなかった。
 * `posRel` は `json-parser.ts` に 1 件も無く、受け付ける欄の表にも載っていなかった。
 *
 * そのためカタログに相対で置く見本を 1 件も載せられなかった。 カタログは見本ごとに本文と
 * JSON を対で持ち、同じ図に解決されることを `catalog-source-pair.test.ts` が見るためで、
 * 対を作れない書き方は載せられない。
 *
 * ## 解けない書き方の判定は 1 箇所に置く
 *
 * 相手が居ない / 自分を基準にした / 基準が輪になっている の 3 通りは `relative-pos.ts` の
 * `findRelativeProblems` が判定し、本文と JSON の両方がそれを呼ぶ。 誤りの文だけを入口ごとに
 * 作る (本文は行番号を、JSON は欄の場所を添える)。 判定を入口ごとに持つと、同じ書き方が
 * 入口によって通ったり通らなかったりする。
 *
 * ## 何を見るか
 *
 * 本文で書いた図と JSON で書いた図が **丸ごと一致する** ことを見る。 箱の数や座標だけを
 * 比べると、知らせや名札の食い違いを見落とす。
 *
 * 向きは 4 つとも 1 つずつ通す。 1 つだけ通して「書ける」 と言うと、表に 1 語だけ書いた
 * 時に気付けない。
 *
 * ## 陰性対照
 *
 * 指定を外した図と比べ、**差が出る** ことを見る。 差が出なければ、本文と JSON が一致して
 * いても「両方とも読まれていない」 だけになる。
 */
import { describe, it, expect } from "vitest";

import { jsonToDiagram, validateDragonJson, type DragonJson } from "../src/json-parser";
import { textDslToDiagram } from "../src";
import { RELATIVE_DIRECTIONS, RELATIVE_GAP_DEFAULT } from "../src/relative-pos";

/** 本文側の向きの語。 JSON の語と 1 対 1 で並ぶ */
const 本文の向き: Record<(typeof RELATIVE_DIRECTIONS)[number], string> = {
  right: "右",
  left: "左",
  above: "上",
  below: "下",
};

/** 本文で書いた、相対で置く図 */
function 本文で書く(向き: string, 間隔?: number): string {
  const 位置 = 間隔 === undefined ? `注文を受ける の${向き}` : `注文を受ける の${向き} ${間隔}`;
  return `title: "相対で置く"
type: flow

actors:
  - 注文を受ける: { kind: card }
  - 点検する:
      kind: card
      位置: ${位置}
`;
}

/** JSON で書いた、同じ図 */
function jsonで書く(dir: string, gap?: number): DragonJson {
  return {
    title: "相対で置く",
    type: "flow",
    actors: [
      { name: "注文を受ける", kind: "card" },
      {
        name: "点検する",
        kind: "card",
        posRel: gap === undefined ? { anchor: "注文を受ける", dir } : { anchor: "注文を受ける", dir, gap },
      },
    ],
    flow: [],
  } as unknown as DragonJson;
}

/** 相対で置く指定を書かない図。 陰性対照に使う */
const 指定なし: DragonJson = {
  title: "相対で置く",
  type: "flow",
  actors: [
    { name: "注文を受ける", kind: "card" },
    { name: "点検する", kind: "card" },
  ],
  flow: [],
} as unknown as DragonJson;

describe("本文と JSON が同じ図になる (#2039)", () => {
  it("向きを 4 つとも走査している", () => {
    // 1 語だけ通して「書ける」 と言わないため、走査の数を先に固定する
    expect(
      RELATIVE_DIRECTIONS.length,
      "向きの一覧が空になっている (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(Object.keys(本文の向き).sort()).toEqual([...RELATIVE_DIRECTIONS].sort());
  });

  it.each([...RELATIVE_DIRECTIONS])("%s に置いた図が、本文でも JSON でも同じになる", (dir) => {
    const 本文 = textDslToDiagram(本文で書く(本文の向き[dir], 200));
    const json = jsonToDiagram(jsonで書く(dir, 200));

    expect(json).toEqual(本文);
  });

  it("間隔を書かない時も、本文でも JSON でも同じになる", () => {
    const 本文 = textDslToDiagram(本文で書く(本文の向き.right));
    const json = jsonToDiagram(jsonで書く("right"));

    expect(json).toEqual(本文);
  });
});

describe("相対で置く指定が実際に効いている (#2039)", () => {
  it("指定を外すと図が変わる", () => {
    // 変わらなければ、本文と JSON が一致していても両方とも読まれていないだけになる
    const 置いた = jsonToDiagram(jsonで書く("right", 200));
    const 外した = jsonToDiagram(指定なし);

    expect(置いた).not.toEqual(外した);
  });

  it("間隔を変えると図が変わる", () => {
    // 間隔を読まずに既定で置いていると、この 2 つが一致する
    const 狭い = jsonToDiagram(jsonで書く("right", 200));
    const 広い = jsonToDiagram(jsonで書く("right", 600));

    expect(狭い).not.toEqual(広い);
  });

  it("間隔を書かない時は既定の間隔で置く", () => {
    const 書かない = jsonToDiagram(jsonで書く("right"));
    const 既定を書く = jsonToDiagram(jsonで書く("right", RELATIVE_GAP_DEFAULT));

    expect(書かない).toEqual(既定を書く);
  });
});

/**
 * 解けない書き方 3 通りを、本文と JSON の両方で書いたもの。
 *
 * 誤りの文は入口ごとに違う (本文は行番号、JSON は欄の場所を添える) ため、文そのものは
 * 比べない。 **どちらの入口でも誤りとして返る** ことを見る。
 */
const 解けない書き方: ReadonlyArray<{
  名: string;
  本文: string;
  json: DragonJson;
  /** JSON 側の誤りの文に必ず含まれる語 */
  印: string;
}> = [
  {
    名: "いない相手を基準にした",
    本文: `title: "t"
type: flow

actors:
  - 注文を受ける: { kind: card }
  - 点検する:
      kind: card
      位置: いない人 の右 200
`,
    json: {
      title: "t",
      type: "flow",
      actors: [
        { name: "注文を受ける", kind: "card" },
        { name: "点検する", kind: "card", posRel: { anchor: "いない人", dir: "right", gap: 200 } },
      ],
      flow: [],
    } as unknown as DragonJson,
    印: "must name an actor",
  },
  {
    名: "自分を基準にした",
    本文: `title: "t"
type: flow

actors:
  - 注文を受ける: { kind: card }
  - 点検する:
      kind: card
      位置: 点検する の右 200
`,
    json: {
      title: "t",
      type: "flow",
      actors: [
        { name: "注文を受ける", kind: "card" },
        { name: "点検する", kind: "card", posRel: { anchor: "点検する", dir: "right", gap: 200 } },
      ],
      flow: [],
    } as unknown as DragonJson,
    印: "must not be the actor itself",
  },
  {
    名: "基準が互いを指している",
    本文: `title: "t"
type: flow

actors:
  - 注文を受ける: { kind: card }
  - 点検する:
      kind: card
      位置: 出荷する の右 200
  - 出荷する:
      kind: card
      位置: 点検する の右 200
`,
    json: {
      title: "t",
      type: "flow",
      actors: [
        { name: "注文を受ける", kind: "card" },
        { name: "点検する", kind: "card", posRel: { anchor: "出荷する", dir: "right", gap: 200 } },
        { name: "出荷する", kind: "card", posRel: { anchor: "点検する", dir: "right", gap: 200 } },
      ],
      flow: [],
    } as unknown as DragonJson,
    印: "must not form a cycle",
  },
];

/** 検査の結果に入っている誤りの文を 1 本に繋ぐ。 通った時は空文字 */
function 誤りの文(r: ReturnType<typeof validateDragonJson>): string {
  return r.ok ? "" : r.errors.map((e) => e.message).join("\n");
}

describe("解けない相対の指定を、どちらの入口でも誤りとして返す (#2039)", () => {
  it("解けない書き方を 3 通りとも走査している", () => {
    // 1 通りだけ通して「入口で揃っている」 と言わないため、走査の数を先に固定する
    expect(
      解けない書き方.length,
      "解けない書き方を 1 通りも用意していない (検査が空振りしている)",
    ).toBe(3);
  });

  it.each(解けない書き方.map((c) => [c.名, c] as const))("%s — 本文が誤りにする", (_名, c) => {
    expect(() => textDslToDiagram(c.本文)).toThrow(/位置の基準/);
  });

  it.each(解けない書き方.map((c) => [c.名, c] as const))("%s — JSON が誤りにする", (_名, c) => {
    const r = validateDragonJson(c.json);

    expect(r.ok, `JSON 側が ${_名} を通してしまう`).toBe(false);
    expect(誤りの文(r)).toContain(c.印);
  });

  it("解ける書き方は、どちらの入口でも誤りにならない", () => {
    // 陰性対照 = 判定が恒真になっていないこと。 正しい図まで弾くなら誤りの側だけを見ても判らない
    expect(() => textDslToDiagram(本文で書く(本文の向き.right, 200))).not.toThrow();

    const r = validateDragonJson(jsonで書く("right", 200));
    expect(r.ok, `正しい図が弾かれている (${誤りの文(r)})`).toBe(true);
  });
});
