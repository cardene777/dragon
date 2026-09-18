import { describe, it, expect } from "vitest";
import schema from "../src/schemas/diagram.json" with { type: "json" };
import { EVENT_TARGET_KEYS, EVENT_REQUIRED_KEYS } from "../src/v05/parser";
import { parseTextDslV05 } from "../src/v05";
import { jsonToDiagram } from "../src/json-parser";

/**
 * 出来事が受ける項目が、記法と JSON と公開 schema で一致することの検査 (#2256)。
 *
 * ## 4 か所に分かれていた
 *
 * 相手を指す 4 語が、記法の定数 / JSON の記法の別の定数 / schema の項目の鍵 /
 * schema の説明文 の 4 か所に別々に書かれていた。
 * `json-parser.ts` は「記法と 1:1 対応する」 と名乗るのに、受ける項目が両側で別々に決まる。
 * 片方に 5 つ目を足すと **記法では通るのに JSON では弾かれる** 状態が黙って生まれる。
 *
 * 種類 (`EVENT_KINDS`) は公開した定数を両方が読み、schema とも突き合わせてある。
 * 相手の項目だけがその経路から外れていた。
 *
 * ## 何を見るか
 *
 * schema は人が読む説明文も持つので機械では作らない。 代わりに **項目の鍵が実装の一覧と
 * 一致すること**を見る。 欠けと余りの両方を落とす = 片側だけに足した時にどちらの向きでも気付く。
 *
 * ## 説明文に語を並べない
 *
 * 語を並べた文は、鍵を足した日に黙って古くなる。 鍵そのものが一覧なので、文は
 * 「ちょうど 1 つだけ書く」 という決まりだけを持つ。
 */

interface 出来事のschema {
  readonly items: {
    readonly required: readonly string[];
    readonly additionalProperties: boolean;
    readonly properties: Readonly<Record<string, unknown>>;
  };
  readonly description: string;
}

const 出来事 = (schema as unknown as { properties: { events: 出来事のschema } }).properties.events;

/** 実装が受ける項目 = 必ず書く 2 つと、相手の指し方 */
const 実装の項目 = [...EVENT_REQUIRED_KEYS, ...EVENT_TARGET_KEYS];

/** 端から端まで通す時の本文の頭 */
const 頭 = `title: "t"\ntype: flow\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n`;

/**
 * 相手ごとに書ける値。
 *
 * **指し方ごとに値の形が違う** = 箱と縦列は名前、矢印は両端、図全体は真偽。
 * 一覧に相手を足したらここにも 1 行足す (足し忘れは下の検査が落とす)。
 */
const 書ける値: Record<string, { 記法の値: string; JSONの値: unknown }> = {
  box: { 記法の値: "A", JSONの値: "A" },
  lane: { 記法の値: "main", JSONの値: "main" },
  arrow: { 記法の値: "A -> B", JSONの値: "A -> B" },
  diagram: { 記法の値: "true", JSONの値: true },
};

describe("出来事が受ける項目が記法と JSON と schema で揃う (#2256)", () => {
  it("突き合わせる材料を取れている", () => {
    // 取れていなければ、以下の一致は空同士の比較になって通る
    expect(EVENT_TARGET_KEYS.length, "相手の指し方を 1 つも取れていない").toBeGreaterThan(1);
    expect(Object.keys(出来事.items.properties).length, "schema の項目を取れていない").toBeGreaterThan(1);
  });

  it("schema の項目の鍵が実装の一覧と一致する", () => {
    // 欠けと余りの両方を見る = 片側だけに足した時にどちらの向きでも落ちる
    expect([...Object.keys(出来事.items.properties)].sort()).toEqual([...実装の項目].sort());
  });

  it("schema の必ず書く項目が実装と一致する", () => {
    expect([...出来事.items.required].sort()).toEqual([...EVENT_REQUIRED_KEYS].sort());
  });

  it("schema が知らない項目を受けない", () => {
    // 受けてしまうと、上の一致が守っている範囲の外から項目が入る
    expect(出来事.items.additionalProperties, "知らない項目を受ける形になっている").toBe(false);
  });

  it("schema の説明文が相手の語を並べていない", () => {
    // 並べた文は鍵を足した日に黙って古くなる
    const 並べている = EVENT_TARGET_KEYS.filter((k) => 出来事.description.includes(k));
    expect(並べている, "説明文が相手の語を並べている").toEqual([]);
  });

  it("実装に無い項目を足すと落ちる (植え込み対照)", () => {
    // 一致を見る形が空振りしていないことを、その場で作った鍵の集合で確かめる
    const 余り = [...Object.keys(出来事.items.properties), "足した項目"];
    expect(余り.sort()).not.toEqual([...実装の項目].sort());
    const 欠け = [...実装の項目].slice(1);
    expect(欠け.sort()).not.toEqual([...実装の項目].sort());
  });

  it("相手ごとに書ける値を 1 つずつ持っている", () => {
    // 一覧に足した相手の値を書き忘れると、下の端から端までの検査がその相手を飛ばす。
    // 表の鍵を一覧から導き、欠けをここで落とす
    expect([...Object.keys(書ける値)].sort()).toEqual([...EVENT_TARGET_KEYS].sort());
  });

  it("同じ内容を記法と JSON で書くと、どちらも同じ相手を受ける", () => {
    // 項目の一覧が揃っていても、値の読み方が違えば意味が分かれる。 端から端まで 1 度通す
    for (const 相手 of EVENT_TARGET_KEYS) {
      // 欠けは 1 つ上の検査が落とすので、ここでは在る前提で読む
      const { 記法の値, JSONの値 } = 書ける値[相手]!;
      const r = parseTextDslV05(
        `${頭}events:\n  - { on: click, ${相手}: ${記法の値}, handler: toggle }\n`,
      );
      expect(
        r.ok,
        `記法が ${相手} を受けない: ${r.ok ? "" : r.errors.map((e) => e.message).join(" / ")}`,
      ).toBe(true);
      expect(
        () =>
          jsonToDiagram({
            title: "t",
            type: "flow",
            actors: [{ name: "A" }, { name: "B" }],
            flow: [{ from: "A", to: "B", label: "x" }],
            events: [{ on: "click", [相手]: JSONの値, handler: "toggle" }],
          }),
        `JSON が ${相手} を受けない`,
      ).not.toThrow();
    }
  });
});
