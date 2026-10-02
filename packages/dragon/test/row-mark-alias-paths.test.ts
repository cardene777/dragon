/**
 * 行頭の印の古い語を、読み取りの 3 経路すべてが読み替える (#2782)。
 *
 * ## なぜ経路ごとに見るか
 *
 * 印を書く場所は 1 つ (`marks`) だが、読む入口は 3 つある。
 * 縦に並べた形と、中括弧の形と、JSON で、どれも別の関数が値を受ける。
 *
 * 畳んだ当初は縦に並べた形だけが読み替えを通しており、**中括弧で書いた `pk` は印を
 * 持たないまま通っていた**。 読み替えが落ちても型は通り、組み立ても error を出さず、
 * 出来上がりの印が 1 つ減るだけなので、経路を 1 本ずつ見ないと気付けない。
 *
 * ## 何を見るか
 *
 * 同じ図を 3 通りの書き方で組み立て、印が 3 経路とも一致することを見る。
 * 新しい語 (`鍵` / `外` / `条件`) でも同じ印になることを対にして見る = 読み替えが
 * 恒等写像になっていないことの対照になる。
 */
import { describe, expect, it } from "vitest";
import { textDslToDiagram, jsonToDiagram } from "../src/index";
import type { RowMark } from "@cardenelabs/cdl";

const 行 = ["id: bigint", "user_id: bigint", "note: text"];

/** 古い語と、同じ印を指す dragon の語。 1 行ごとに対にする */
const 語の対: ReadonlyArray<readonly [string, string]> = [
  ["pk", "鍵"],
  ["fk", "外"],
  ["opt", "条件"],
];

/** 縦に並べた形 */
const 並べた形 = (印: readonly string[]): string =>
  [
    'title: "確かめ"',
    "type: record",
    "",
    "actors:",
    "  - t:",
    "      kind: storage",
    `      rows: [${行.map((r) => `"${r}"`).join(", ")}]`,
    `      marks: [${印.map((m) => `"${m}"`).join(", ")}]`,
    "",
    "flow: []",
    "",
  ].join("\n");

/** 中括弧の形 */
const 中括弧の形 = (印: readonly string[]): string =>
  [
    'title: "確かめ"',
    "type: record",
    "",
    "actors:",
    `  - t: { kind: storage, rows: [${行.map((r) => `"${r}"`).join(", ")}], marks: [${印
      .map((m) => `"${m}"`)
      .join(", ")}] }`,
    "",
    "flow: []",
    "",
  ].join("\n");

/** 印を取り出す。 行の並べ替え (`鍵` の行を上へ) が入るので、行と対で返す */
function 印を取る(図: { nodes: readonly { rows?: readonly string[] }[] }): string {
  const n = 図.nodes[0] as {
    rows?: readonly string[];
    rowMarks?: ReadonlyArray<RowMark | null>;
  };
  return (n.rows ?? [])
    .map((r, i) => `${r} | ${JSON.stringify(n.rowMarks?.[i] ?? null)}`)
    .join("\n");
}

const 経路 = {
  縦に並べた形: (印: readonly string[]) => 印を取る(textDslToDiagram(並べた形(印))),
  中括弧の形: (印: readonly string[]) => 印を取る(textDslToDiagram(中括弧の形(印))),
  JSON: (印: readonly string[]) =>
    印を取る(
      jsonToDiagram({
        title: "確かめ",
        type: "record",
        actors: [{ name: "t", kind: "storage", rows: [...行], marks: [...印] }],
        flow: [],
      }),
    ),
};

describe("行頭の印の古い語を 3 経路とも読み替える (#2782)", () => {
  const 古い語 = 語の対.map(([旧]) => 旧);
  const 新しい語 = 語の対.map(([, 新]) => 新);

  for (const [経路名, 読む] of Object.entries(経路)) {
    it(`${経路名} ... 古い語が dragon の語と同じ印になる`, () => {
      expect(読む(古い語), 経路名).toBe(読む(新しい語));
    });

    it(`${経路名} ... 読み替えが素通りでない (印が 1 つ以上付く)`, () => {
      // 3 経路とも印を 1 つも持たないなら、上の照合は「どちらも空」 で素通りする
      expect(読む(古い語), 経路名).toContain('"underline":true');
    });
  }

  it("3 経路の出来上がりが一致する (1 経路だけ落ちていると差が出る)", () => {
    const 出来上がり = Object.values(経路).map((読む) => 読む(古い語));
    expect(new Set(出来上がり).size, `経路ごとの印: ${出来上がり.join(" / ")}`).toBe(1);
  });

  it("2 語を 1 行に書いた形も 3 経路で揃う", () => {
    const 出来上がり = Object.values(経路).map((読む) => 読む(["pk fk", "fk opt", ""]));
    expect(new Set(出来上がり).size).toBe(1);
    // `fk opt` は山形 + 中空 の 2 軸を同時に動かす = 片方だけ効く形で通らない
    expect(出来上がり[0]).toContain('"shape":"chevron","filled":false');
  });
});
