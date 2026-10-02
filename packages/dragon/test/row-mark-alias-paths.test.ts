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

/** 1 行だけの図を組み立て、その行の印を返す */
function 行1つの印(語: string): RowMark | null {
  const 図 = textDslToDiagram(
    [
      'title: "確かめ"',
      "type: record",
      "",
      "actors:",
      `  - t: { kind: storage, rows: ["id: bigint"], marks: ["${語}"] }`,
      "",
      "flow: []",
      "",
    ].join("\n"),
  );
  const n = 図.nodes[0] as { rowMarks?: ReadonlyArray<RowMark | null> };
  return n.rowMarks?.[0] ?? null;
}

describe("dragon の 3 語が印の 3 軸に 1 対 1 で当たる (#2782)", () => {
  // 語を書かない行が基準。 3 軸がどれも動いていない形
  it("語を書かない行は四角の塗りで下線を持たない", () => {
    expect(行1つの印("")).toEqual({ shape: "square", filled: true });
  });

  it("`鍵` は名前に下線を引く", () => {
    expect(行1つの印("鍵")).toEqual({ shape: "square", filled: true, underline: true });
  });

  it("`外` は行頭を山形にする", () => {
    expect(行1つの印("外")).toEqual({ shape: "chevron", filled: true });
  });

  it("`条件` は行頭を中空にする", () => {
    expect(行1つの印("条件")).toEqual({ shape: "square", filled: false });
  });

  it("3 語は同時に書ける (軸が互いを潰さない)", () => {
    expect(行1つの印("鍵 外 条件")).toEqual({
      shape: "chevron",
      filled: false,
      underline: true,
    });
  });
});

describe("古い語が dragon の語と同じ印になる (#2782)", () => {
  // 古い語 1 つずつを、読み替え先の語と突き合わせる。 表は実装 (`compile/row-marks.ts` の
  // `行頭の語の別名`) と同じ内容を手で書く = 同じ表を読むと読み替えが恒等写像でも通る
  const 対応: ReadonlyArray<readonly [string, string]> = [
    ["pk", "鍵"],
    ["fk", "外"],
    ["opt", "条件"],
    ["entry", "外"],
    ["exit", "外 条件"],
    ["do", ""],
    ["internal", "条件"],
  ];

  for (const [旧, 新] of 対応) {
    it(`\`${旧}\` は \`${新 === "" ? "語なし" : 新}\` と同じ印になる`, () => {
      expect(行1つの印(旧)).toEqual(行1つの印(新));
    });
  }

  it("読み替え先が 1 通りに潰れていない (7 語から印が 5 通り出る)", () => {
    // 7 語すべてが同じ印になるなら、上の 7 件は「どれも同じ」 で素通りする。
    // 5 通りの内訳は 格子の 4 隅 + `鍵` の下線
    const 出来上がり = new Set(対応.map(([旧]) => JSON.stringify(行1つの印(旧))));
    expect(出来上がり.size, [...出来上がり].join(" / ")).toBe(5);
  });
});

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
