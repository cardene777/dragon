/**
 * `TOP_LEVEL_KEYS` が、記法が実際に処理する項目と一致することの検査 (#1190)。
 *
 * この配列は 2 つの読み手を持つ。 読めない行の案内 (`expected one of: ...`) と、記法一覧の
 * 網羅検査 (`apps/playground-spa/src/lib/values-example.test.tsx`)。 どちらも「記法が受ける
 * 項目はこれで全部」 という前提で動く。
 *
 * **一致を機械で見ないと、配列が案内と一覧の両方を静かに誤らせる**。 項目を足した人が
 * 配列を更新し忘れると、案内が古い一覧を出し、記法一覧の網羅検査は「載せるべき項目」 を
 * 少なく数えて緑のままになる。 `states` / `values` が一覧に 1 件も無い状態が続いたのと同じ形。
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { TOP_LEVEL_KEYS } from "../src/index";

/**
 * 記法が実際に処理している項目を実装から取る。
 *
 * 判定は `head.key === "..."` の並び。 記法の読み手はこの形でしか top-level を分岐しない
 * ため、ここに現れる文字列が「処理する項目」 の全体になる。
 */
function 実装が処理する項目(): string[] {
  const src = readFileSync(new URL("../src/v05/parser.ts", import.meta.url), "utf8");
  return [...src.matchAll(/head\.key === "([a-z]+)"/g)].map((m) => m[1] ?? "");
}

describe("top-level 項目の一覧が実装と一致する (#1190)", () => {
  it("走査が空振りしていない", () => {
    // 判定の書き方が変わると 0 件になり、以下の検査が素通りする
    expect(実装が処理する項目().length).toBeGreaterThan(5);
  });

  it("処理する項目と一覧が過不足なく一致する", () => {
    // 足りない = 案内と記法一覧がその項目を知らない。
    // 余る = 書けない項目を案内が勧める
    expect([...new Set(実装が処理する項目())].sort()).toEqual([...TOP_LEVEL_KEYS].sort());
  });

  it("読めない行の案内が一覧をそのまま出す", () => {
    // 案内を手で書くと、項目を足した時に案内だけが取り残される
    const src = readFileSync(new URL("../src/v05/parser.ts", import.meta.url), "utf8");
    expect(src).toContain("expected one of: ${TOP_LEVEL_KEYS.join(\", \")}");
  });
});
