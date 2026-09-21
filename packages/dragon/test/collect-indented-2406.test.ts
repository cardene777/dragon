/*
 * 字下げした行を集める仕組みを 1 つにまとめる (#2406)。
 *
 * 集める関数が 2 つあり、**中身の違いは先頭の `- ` を外すかどうかの 1 行だけ** だった。
 * 形の合わない行を捨てない振る舞いは値の節の側 (`collectIndentedRaw`) が #1169 で先に採り、
 * `collectIndentedList` が #2400 で追いついた時点で、それ以外の差が無くなっていた。
 *
 * ## まとめる前に測ったこと
 *
 * 関数の別れ方と、書き手から見える振る舞いが **揃っていなかった**。
 *
 * | 節 | 集める関数 | まとめる前の `- ` 付き |
 * |---|---|---|
 * | `flow` / `states` / `bands` / `lanes` / `groups` | List | 読める |
 * | `values` / `formulas` / `events` | Raw | 読める (読み手が自分で外している) |
 * | `readouts` / `inputs` / `scrolls` | Raw | 読めない |
 *
 * 11 節のうち 8 節が既に `- ` を受けており、受けないのは 3 節だけだった。
 * まとめると その 3 節も受けるようになる = **既にある図の意味は 1 つも変わらず**、
 * 節によって受ける形が違う不揃いが消える。
 *
 * ## 節の一覧を手で並べない
 *
 * 記法が受ける最上位の項目 (`TOP_LEVEL_KEYS`) から作る。 節を足した日に検査が古くならない。
 * 行の見本を持たない節は落とし、落とした数を出力に書く (黙って減らさない)。
 */
import { describe, expect, it } from "vitest";
import { parseTextDslV05, TOP_LEVEL_KEYS } from "../src/v05/parser";

/** 節ごとの行の見本。 `TOP_LEVEL_KEYS` のうち「字下げした行を 1 件ずつ集める」 節だけが持つ */
const 行の見本: Record<string, string> = {
  flow: 'A -> B: "x"',
  states: "v: 0",
  values: 'w: "{v} + 1"',
  bands: "A: 0..0",
  lanes: "l1: { x: 0, width: 320 }",
  groups: 'g1: { lanes: [l1], label: "g" }',
  readouts: "r: { kind: bar, source: v, min: 0, max: 10 }",
  inputs: "sl: { kind: slider, min: 0, max: 10, defaultValue: 5 }",
  formulas: 'd: "{sl} * 2"',
  events: "{ on: click, box: A, handler: toggle-active }",
  scrolls: "intro: { start: 0.9, end: 0.1 }",
};

/**
 * 行の見本を持たない節。 どちらも「字下げした行を 1 件ずつ集める」 経路を通らないので対象外。
 *
 * | 種類 | 節 |
 * |---|---|
 * | 1 行で値を書く | `title` / `type` / `eyebrow` / `reveal` / `relations` / `direction` |
 * | 1 つの塊を読む | `viewport` / `axes` / `animation` |
 */
const 対象外 = (節: string): boolean => !(節 in 行の見本);

const 本文 = (節: string, 印: boolean): string => `title: "t"
type: sequence

actors:
  - A
  - B

states:
  v: 0

${節}:
  ${印 ? "- " : ""}${行の見本[節]}
`;

const 読める = (節: string, 印: boolean): boolean => parseTextDslV05(本文(節, 印)).ok;

describe("字下げした行を集める節が、印の有無で読み分かれない (#2406)", () => {
  it("走査が空振りしていない", () => {
    const 対象 = TOP_LEVEL_KEYS.filter((節) => !対象外(節));
    const 落とした = TOP_LEVEL_KEYS.filter(対象外);
    // 0 件は「該当なし」 ではなく「測っていない」。 母数と落とした数を併記する
    expect(対象.length, `走査 ${対象.length} 節 / 落とした ${落とした.length} 節 (${落とした.join(" ")})`).toBeGreaterThan(8);
  });

  it("行の見本が、どの節でも印なしで読める", () => {
    // 見本そのものが誤っていると、下の検査が「どちらも読めない」 で揃って通る
    const 読めない = TOP_LEVEL_KEYS.filter((節) => !対象外(節)).filter((節) => !読める(節, false));
    expect(読めない, "印なしで読めない見本").toEqual([]);
  });

  it("先頭に `- ` を付けても、どの節でも読める", () => {
    // まとめる前は `readouts` / `inputs` / `scrolls` の 3 節だけが読めなかった
    const 読めない = TOP_LEVEL_KEYS.filter((節) => !対象外(節)).filter((節) => !読める(節, true));
    expect(読めない, "`- ` を付けると読めない節").toEqual([]);
  });
});

describe("まとめても既にある図の意味が変わらない (#2406)", () => {
  it("値の行を書き間違えた時、これまでどおり知らせが 1 件出る", () => {
    // 集める側が形の合わない行を捨てない振る舞い (#1169 / #2400) を保つ
    const r = parseTextDslV05(`title: "t"\ntype: flow\n\nactors:\n  - A\n\nvalues:\n  a\n`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.message).join()).toContain("値の行が読めません");
  });

  it("コメント行と空行は、これまでどおり飛ばす", () => {
    const r = parseTextDslV05(
      `title: "t"\ntype: flow\n\nactors:\n  - A\n\nvalues:\n  # めも: あ\n\n  a: "1 + 1"\n`,
    );
    expect(r.ok, r.ok ? "" : r.errors.map((e) => e.message).join()).toBe(true);
  });

  it("印を付けた行と付けない行が、同じ値として読める", () => {
    const 読む = (印: boolean) => {
      const r = parseTextDslV05(本文("values", 印));
      if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
      return JSON.stringify(r.doc.values);
    };
    expect(読む(true)).toBe(読む(false));
  });
});
