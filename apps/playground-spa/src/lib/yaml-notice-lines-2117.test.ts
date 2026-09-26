/**
 * YAML 欄の知らせが、書いた行を指す (#2117)。
 *
 * YAML は `load()` で素の値に変えてから組み立てるため、値になった時点で書いた場所が消える。
 * `書いた行を読む` が同じ本文を事象の並びとしてもう一度読み、場所ごとの行を集める。
 *
 * | 見るもの | 検査 |
 * |---|---|
 * | 場所と行の対応 | 書き並べた形 / `{}` の形 / 入れ子の欄 / 別名参照 / 複数行の文字列 |
 * | 通しての結果 | `yamlToDiagram` の知らせが本文の行を指し、0 行の知らせが 1 件も無い |
 * | 壊さないこと | 図そのものが変わらない。 読めない本文でも投げない |
 */
import { describe, expect, it } from "vitest";
import type { CompileNotice } from "@cardenelabs/dragon";
import { 書いた場所の鍵 } from "@cardenelabs/dragon";
import { 書いた行を読む } from "@/lib/yaml-lines";
import { yamlToDiagram, yamlToObject } from "@/lib/yaml-adapter";
import { jsonToDiagram } from "@cardenelabs/dragon";

/** 知らせを集める。 `console.warn` は同じ文を出すので黙らせる */
function 知らせを集める(組み立て: (onNotice: (n: CompileNotice) => void) => unknown): CompileNotice[] {
  const 知らせ: CompileNotice[] = [];
  const もとの = console.warn;
  console.warn = () => {};
  try {
    組み立て((n) => 知らせ.push(n));
    return 知らせ;
  } finally {
    console.warn = もとの;
  }
}

/** 行の対応を見るための本文。 行番号は右の注記と合わせてある */
const 色々な書き方 = [
  'title: "t"', // 1
  "type: flow", // 2
  'eyebrow: "小見出し"', // 3
  "actors:", // 4
  "  - 素の名前", // 5
  "  - name: 二つ目", // 6
  "    kind: storage", // 7
  "  - { name: 三つ目 }", // 8
  "flow:", // 9
  "  - from: 素の名前", // 10
  "    to: 二つ目", // 11
  '    label: ""', // 12
  "values:", // 13
  '  sales: "1"', // 14
].join("\n");

describe("書いた行を読む", () => {
  const 表 = 書いた行を読む(色々な書き方);

  it.each([
    ["文書そのもの", [] as (string | number)[], 1],
    ["小見出し", ["eyebrow"], 3],
    ["書き並べた箱", ["actors", 0], 5],
    ["縦に書いた箱", ["actors", 1], 6],
    ["箱の中の欄", ["actors", 1, "kind"], 7],
    ["1 行に書いた箱", ["actors", 2], 8],
    ["矢印", ["flow", 0], 10],
    ["矢印の中の欄", ["flow", 0, "to"], 11],
    ["値", ["values", "sales"], 14],
  ])("%s: 書いた行を覚える", (_名, 道, 期待) => {
    expect(表.get(書いた場所の鍵(...道))).toBe(期待);
  });

  it("別名参照は、参照を書いた行を覚える", () => {
    const 本文 = [
      'title: "t"', // 1
      "type: flow", // 2
      "actors:", // 3
      "  - &もと { name: A }", // 4
      "  - *もと", // 5
      "flow: []", // 6
    ].join("\n");
    const 表 = 書いた行を読む(本文);
    expect(表.get(書いた場所の鍵("actors", 0))).toBe(4);
    expect(表.get(書いた場所の鍵("actors", 1))).toBe(5);
  });

  it("複数行の文字列を跨いでも、後ろの行がずれない", () => {
    const 本文 = [
      "title: |", // 1
      "  一行目", // 2
      "  二行目", // 3
      "type: flow", // 4
      "actors:", // 5
      "  - A", // 6
      "flow: []", // 7
    ].join("\n");
    expect(書いた行を読む(本文).get(書いた場所の鍵("actors", 0))).toBe(6);
  });

  it("名前に `/` を含む欄は、入れ子の欄と別の鍵で覚える", () => {
    const 本文 = ['title: "t"', "type: flow", "actors: []", "flow: []", "values:", '  "a/b": "1"'].join(
      "\n",
    );
    const 表 = 書いた行を読む(本文);
    expect(表.get(書いた場所の鍵("values", "a/b"))).toBe(6);
    expect(表.has("/values/a/b")).toBe(false);
  });

  it("読めない本文では、投げずに空の表を返す", () => {
    expect(書いた行を読む("title: 'ここで終わる").size).toBe(0);
  });
});

describe("YAML 欄の知らせ", () => {
  /** 画面の YAML 欄に貼る本文。 3 種の知らせが別々の行から出る */
  const ガントチャート = [
    'title: "t"', // 1
    "type: gantt", // 2
    "actors:", // 3
    '  - { name: 設計, value: "Q1" }', // 4
    "  - { name: 実装 }", // 5
    "flow:", // 6
    '  - { from: 設計, to: 試験, label: "" }', // 7
    "values:", // 8
    '  sales: "1 +"', // 9
  ].join("\n");

  it("3 件の知らせが、書いた行を指す", () => {
    const 知らせ = 知らせを集める((onNotice) => yamlToDiagram(ガントチャート, { onNotice }));
    expect(知らせ.map((n) => [n.kind, n.line])).toEqual([
      ["chart-value-unreadable", 5],
      ["flow-actor-missing", 7],
      ["value-unresolved", 9],
    ]);
  });

  it("行を持たない知らせが 1 件も無い", () => {
    const 知らせ = 知らせを集める((onNotice) => yamlToDiagram(ガントチャート, { onNotice }));
    // 空振りの確認 = 知らせ自体は 1 件以上出ている
    expect(知らせ.length).toBeGreaterThan(0);
    expect(知らせ.filter((n) => n.line === 0)).toEqual([]);
  });

  it("行を載せても、図は 1 文字も変わらない", () => {
    const 読んだ = yamlToObject(ガントチャート);
    expect(読んだ.ok).toBe(true);
    if (!読んだ.ok) return;
    const 行あり = yamlToDiagram(ガントチャート);
    expect(行あり.ok).toBe(true);
    if (!行あり.ok) return;
    expect(JSON.stringify(行あり.diagram)).toBe(JSON.stringify(jsonToDiagram(読んだ.value)));
  });
});
