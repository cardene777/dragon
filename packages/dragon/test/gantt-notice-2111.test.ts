/**
 * 工程表 (`type: gantt`) で効かない形を書くと、書いた行を指す知らせが出る (#2111)。
 *
 * 工程表の組み立ては効かない形を `console.warn` にだけ出していた。 編集画面は知らせ (`onNotice`) だけを
 * 画面に出すため、書いている人には理由が見えなかった。 値の図と同じく、知らせと `console.warn` の
 * 両方へ同じ文を出す。
 *
 * | 書いた形 | 知らせの種類 | 指す行 |
 * |---|---|---|
 * | 時期を書かない項目 | `chart-value-unreadable` | 最初の項目の行 |
 * | 時期の無い項目へ引いた矢印 | `chart-edge-dropped` | その矢印の行 |
 * | 飾り (文字 / 色 / 線種 / 多重度) を書いた矢印 | `edge-option-not-honored` | その矢印の行 |
 * | 終わりが始まりより前 / 前になる値を取る | `gantt-end-before-start` | その項目の行 |
 *
 * **同じ行に 2 件並べない**。 `actors` に無い名前へ引いた矢印は全ての図種に共通の知らせが伝え、
 * 多重度の知らせは図種の組み立てが知らせた行と、`actors` に無い名前を指す矢印を避ける。
 * 図種は `PRESET_TYPES` から導き、手で並べない。
 */
import { describe, expect, it } from "vitest";
import { PRESET_TYPES, jsonToDiagram, textDslToDiagram, type CompileNotice } from "../src/index";

type 結果 = { 知らせ: CompileNotice[]; 警告: string[] };

/** 記法を組み立て、知らせと `console.warn` に出た文を集める */
function 組み立てる(src: string): 結果 {
  const 知らせ: CompileNotice[] = [];
  const 警告: string[] = [];
  const もとの = console.warn;
  console.warn = (m: unknown) => void 警告.push(String(m));
  try {
    textDslToDiagram(src, { onNotice: (n) => 知らせ.push(n) });
  } finally {
    console.warn = もとの;
  }
  return { 知らせ, 警告 };
}

/** `印` を含む最初の行の番号 (1 始まり) */
function 行番号(src: string, 印: string): number {
  const i = src.split("\n").findIndex((l) => l.includes(印));
  if (i < 0) throw new Error(`"${印}" を含む行が記法に無い`);
  return i + 1;
}

const 工程表 = (...行: string[]): string => ["title: T", "type: gantt", ...行].join("\n");

/** 効かない形ごとに、知らせの種類と、指す行を探す印と、文に含む語 */
const 効かない形: Array<{ 名: string; src: string; 種類: CompileNotice["kind"]; 印: string; 語: string }> = [
  {
    名: "時期を書かない項目",
    src: 工程表("actors:", '  - 設計: "Q1"', "  - 実装", "  - 試験"),
    種類: "chart-value-unreadable",
    印: "  - 実装",
    語: "実装, 試験",
  },
  {
    名: "時期の無い項目へ引いた矢印",
    src: 工程表("actors:", '  - 設計: "Q1"', "  - 実装", "flow:", "  - 設計 -> 実装"),
    種類: "chart-edge-dropped",
    印: "設計 -> 実装",
    語: "実装 に時期がありません",
  },
  {
    名: "飾りを書いた矢印",
    src: 工程表("actors:", '  - 設計: "Q1"', '  - 実装: "Q2"', "flow:", '  - 設計 -> 実装: "後" (info, dashed)'),
    種類: "edge-option-not-honored",
    印: "設計 -> 実装",
    語: "文字 / 色 / 線種",
  },
  {
    名: "終わりが始まりより前",
    src: 工程表("actors:", '  - 設計: { value: "Q1" }', '  - 実装: { value: "Q3", end: "Q1" }'),
    種類: "gantt-end-before-start",
    印: "  - 実装",
    語: "始まりより前です",
  },
  {
    名: "状態で決まる終わりが始まりより前の値を取る",
    src: 工程表("actors:", '  - 設計: { value: "Q1" }', '  - 実装: { value: "Q2", end: "{done}" }', "states:", "  done: 0"),
    種類: "gantt-end-before-start",
    印: "  - 実装",
    語: "始まりより前になる値",
  },
];

// 検査の題は日本語の欄名を差し込めないため、名前を先頭に並べて `%s` で出す
const 形の表 = 効かない形.map((形) => [形.名, 形] as const);

describe("工程表で効かない形を書くと、書いた行へ知らせる (#2111)", () => {
  it("効かない形を 1 つ以上並べている", () => {
    expect(形の表.length, "形が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it.each(形の表)("%s: 書いた行の知らせはちょうど 1 件", (_名, { src, 種類, 印, 語 }) => {
    const { 知らせ } = 組み立てる(src);
    const 行 = 行番号(src, 印);
    const その行 = 知らせ.filter((n) => n.line === 行);
    expect(その行.map((n) => n.kind), JSON.stringify(知らせ)).toEqual([種類]);
    expect(その行[0]!.message).toContain(語);
  });

  it.each(形の表)("%s: 知らせと同じ文が console.warn にも出る", (_名, { src, 種類 }) => {
    const { 知らせ, 警告 } = 組み立てる(src);
    const 文 = 知らせ.filter((n) => n.kind === 種類).map((n) => n.message);
    expect(文.length, "知らせが出ていない (検査が空振りしている)").toBeGreaterThan(0);
    for (const m of 文) expect(警告).toContain(`[dragon] ${m}`);
  });

  it.each([
    ["飾りの無い矢印", 工程表("actors:", '  - 設計: "Q1"', '  - 実装: "Q2"', "flow:", "  - 設計 -> 実装")],
    ["終わりが始まりより後", 工程表("actors:", '  - 設計: { value: "Q1" }', '  - 実装: { value: "Q1", end: "Q2" }')],
    ["終わりが始まりと同じ", 工程表("actors:", '  - 設計: { value: "Q1" }', '  - 実装: { value: "Q2", end: "Q2" }')],
    [
      "状態で決まる終わりが始まり以降の値だけを取る",
      工程表("actors:", '  - 設計: { value: "Q1" }', '  - 実装: { value: "Q2", end: "{done}" }', "states:", "  done: 1"),
    ],
  ])("%s: 知らせない", (_名, src) => {
    const { 知らせ, 警告 } = 組み立てる(src);
    expect(知らせ).toEqual([]);
    expect(警告.filter((m) => m.startsWith("[dragon]"))).toEqual([]);
  });

  it("actors に無い名前へ引いた矢印の行は、居ない名前の知らせ 1 件だけ", () => {
    const src = 工程表("actors:", '  - 設計: "Q1"', '  - 実装: "Q2"', "flow:", '  - 設計 -> 試験: "後"');
    const { 知らせ, 警告 } = 組み立てる(src);
    const 行 = 行番号(src, "設計 -> 試験");
    expect(知らせ.filter((n) => n.line === 行).map((n) => n.kind)).toEqual(["flow-actor-missing"]);
    // 工程表の組み立ては、居ない名前を指す矢印を重ねて伝えない
    expect(警告.filter((m) => m.includes("設計 -> 試験"))).toEqual([]);
  });

  it("文字と多重度を両方書いた矢印の行は、両方を並べた知らせ 1 件", () => {
    const src = 工程表("actors:", '  - 設計: "Q1"', '  - 実装: "Q2"', "flow:", '  - 設計 -> 実装: "後" { cardinality: "1:N" }');
    const { 知らせ } = 組み立てる(src);
    const その行 = 知らせ.filter((n) => n.line === 行番号(src, "設計 -> 実装"));
    expect(その行.map((n) => n.kind)).toEqual(["edge-option-not-honored"]);
    expect(その行[0]!.message).toContain("文字 / 多重度");
  });

  it("JSON から書いても、飾りの知らせが 1 件だけ出る", () => {
    // 書いた場所の表 (`行の表`、#2117) を渡さない呼出なので、矢印は 1 本も行を持たない (0 行)。
    // 多重度の知らせは工程表の知らせと同じ 0 行を避ける
    const 知らせ: CompileNotice[] = [];
    const もとの = console.warn;
    console.warn = () => {};
    try {
      jsonToDiagram(
        {
          title: "T",
          type: "gantt",
          actors: [
            { name: "設計", value: "Q1" },
            { name: "実装", value: "Q2" },
          ],
          flow: [{ from: "設計", to: "実装", label: "", cardinality: "1:N" }],
        },
        { onNotice: (n) => 知らせ.push(n) },
      );
    } finally {
      console.warn = もとの;
    }
    expect(知らせ.map((n) => [n.kind, n.message])).toEqual([
      ["edge-option-not-honored", expect.stringContaining("多重度")],
    ]);
  });
});

describe("多重度と板の飾りの知らせが、既に知らせた行に重ならない (#2111)", () => {
  /** 箱 2 つと矢印 1 本の記法。 矢印は最後の行に置く */
  const 記法 = (type: string, 矢印: string): string =>
    ["title: T", `type: ${type}`, "actors:", '  - A: "10"', '  - B: "20"', "flow:", `  - ${矢印}`].join("\n");

  const 最後の行の知らせ = (src: string): CompileNotice[] => {
    const 行 = src.split("\n").length;
    return 組み立てる(src).知らせ.filter((n) => n.line === 行);
  };

  const 図種たち = [...PRESET_TYPES];
  const 知らせの文 = (src: string): string[] => 最後の行の知らせ(src).map((n) => `${n.kind} ${n.message}`);

  it("居る名前へ引いた矢印では、多重度を書くと矢印の行の知らせが変わる図種がある", () => {
    // 下の検査の前提。 どの図種でも変わらないなら、居ない名前の時に変わらないのは多重度を読んでいない
    // からかもしれず、避けたことの確かめにならない。 矢印を捨てたと既に知らせる図種は変わらない
    const 変わる = 図種たち.filter(
      (type) =>
        JSON.stringify(知らせの文(記法(type, 'A -> B: "x" { cardinality: "N:N" }'))) !==
        JSON.stringify(知らせの文(記法(type, 'A -> B: "x"'))),
    );
    expect(変わる.length, "多重度で知らせが変わる図種が無い").toBeGreaterThan(0);
  });

  it.each(図種たち)("%s: actors に無い名前へ引いた矢印に多重度を書いても、その行の知らせは増えない", (type) => {
    const 無し = 最後の行の知らせ(記法(type, 'A -> C: "x"'));
    const 有り = 最後の行の知らせ(記法(type, 'A -> C: "x" { cardinality: "N:N" }'));
    expect(無し.map((n) => n.kind), "居ない名前の知らせが出ていない").toContain("flow-actor-missing");
    expect(有り.map((n) => n.kind)).toEqual(無し.map((n) => n.kind));
  });

  it("木で自分を親にする矢印に多重度を書いても、その行の知らせは増えない", () => {
    const 無し = 最後の行の知らせ(記法("tree", "A -> A"));
    const 有り = 最後の行の知らせ(記法("tree", 'A -> A { cardinality: "1:N" }'));
    expect(無し.length, "自分を親にする矢印の知らせが出ていない").toBeGreaterThan(0);
    expect(有り.map((n) => n.kind)).toEqual(無し.map((n) => n.kind));
  });

  it.each(["sequence", "solidity"])("%s: actors に無い名前へ引いた言づてに飾りを書いても、居ない名前の知らせだけ", (type) => {
    expect(最後の行の知らせ(記法(type, 'A -> C: "x" (info)')).map((n) => n.kind)).toEqual(["flow-actor-missing"]);
    // 居る名前へ引けば、飾りの知らせは今までどおり出る
    expect(最後の行の知らせ(記法(type, 'A -> B: "x" (info)')).map((n) => n.kind)).toEqual(["message-option-not-honored"]);
  });
});
