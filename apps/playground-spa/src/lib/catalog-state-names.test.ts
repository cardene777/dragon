import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PHASE_ITEM_WORDS } from "@cardenelabs/dragon";

/**
 * 見本の値の名前が、段の項目の語と重ならないことの検証 (#1330)。
 *
 * 段の項目 (`draw:` / `focus:` など) と値の名前は階層が違うため、同じ語でも組み立ては
 * 正しく解釈する。 **壊れないが読みにくい**。
 *
 * 見本は「こう書けば動く」 と読まれる場所なので、同じ語が 2 つの意味で並ぶ形を置かない。
 * 実際に踏んだ = 枝分かれ図が値の名前に `draw` を使っている図で、`#1318` が段の項目の
 * `draw: mind` を足したため 1 つの図に `draw:` が 2 つの意味で並んだ。
 *
 * **記法としては禁止しない**。 `focus` や `set` のような一般的な語を値の名前に使えなく
 * するのは制約が強すぎる。 見本に限って避ける。
 */

const TOPICS = join(import.meta.dirname, "../topics/catalog");

/** 見本の記法から `states:` の名前を拾う。 `values:` も同じ名前空間なので併せて見る */
export function 値の名前(yaml: string): string[] {
  const 名前: string[] = [];
  let 節: "states" | "values" | null = null;
  for (const 行 of yaml.split("\n")) {
    if (/^(states|values):\s*$/u.test(行)) {
      節 = 行.startsWith("states") ? "states" : "values";
      continue;
    }
    // 字下げの無い行で節が終わる
    if (節 !== null && /^\S/u.test(行)) {
      節 = null;
      continue;
    }
    if (節 === null) continue;
    const m = /^\s+([A-Za-z_][A-Za-z0-9_]*)\s*:/u.exec(行);
    if (m !== null) 名前.push(m[1]);
  }
  return 名前;
}

/** 見本の module から記法の文字列をすべて拾う */
function 記法たち(src: string): Array<{ key: string; yaml: string }> {
  const out: Array<{ key: string; yaml: string }> = [];
  const re = /export const sourceYaml__(\w+)\s*=\s*`([\s\S]*?)`;/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) out.push({ key: m[1], yaml: m[2] });
  return out;
}

describe("見本の値の名前 (#1330)", () => {
  const files = readdirSync(TOPICS).filter((f) => f.endsWith(".cdl.ts"));
  const 見本 = files.flatMap((f) =>
    記法たち(readFileSync(join(TOPICS, f), "utf8")).map((x) => ({ file: f, ...x })),
  );

  it("見本を 1 つ以上読めている (検査が空振りしていない)", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(見本.length).toBeGreaterThan(0);
  });

  it("値を持つ見本を 1 つ以上読めている", () => {
    // 値を 1 つも拾えていないと、下の検査は何も見ないまま通る
    const 値あり = 見本.filter((x) => 値の名前(x.yaml).length > 0);
    expect(値あり.length, "値を持つ見本を 1 つも拾えていない").toBeGreaterThan(0);
  });

  /** 見本の一覧から、段の項目と重なる名前を拾う */
  const 重なり = (対象: ReadonlyArray<{ file: string; key: string; yaml: string }>): string[] => {
    const 語 = new Set<string>(PHASE_ITEM_WORDS);
    const out: string[] = [];
    for (const x of 対象) {
      for (const n of 値の名前(x.yaml)) {
        if (語.has(n)) out.push(`${x.file} の ${x.key} が値の名前に "${n}" を使っている`);
      }
    }
    return out;
  };

  it("段の項目と同じ語を値の名前に使っていない", () => {
    expect(重なり(見本), "段の項目と同じ語を値の名前に使っている見本がある").toEqual([]);
  });

  it("段の項目の語をすべて検出できる", () => {
    // **見本が直った後は、語の一覧から何を落としても重なりは 0 件のまま**。 一覧が痩せた
    // ことに気付けないので、語ごとに 1 件ずつ突く (実測で `draw` を落として 0 件 FAIL だった)
    for (const 語 of PHASE_ITEM_WORDS) {
      const 作り物 = [{ file: "(作り物)", key: "t", yaml: `states:\n  ${語}: 0\n` }];
      expect(重なり(作り物), `値の名前の "${語}" を検出できていない`).toHaveLength(1);
    }
  });

  it("値の名前を拾う規則が節の外まで拾わない", () => {
    // 節の外の `key:` まで拾うと、段の項目や最上位の項目を値と誤認する
    const 拾えた = 値の名前(
      ["title: t", "states:", "  a: 1", "  b: 2", "animation:", "  - step: s 1.0s", "    draw: mind"].join(
        "\n",
      ),
    );
    expect(拾えた, "節の外まで拾っている").toEqual(["a", "b"]);
  });
});
