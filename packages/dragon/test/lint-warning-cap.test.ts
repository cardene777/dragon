/**
 * 静的検査の注意に上限が付いていることを見る (#2006)。
 *
 * 誤り (error) は 1 件でも終了コードを 1 にするが、注意 (warning) は何件出ても 0 のまま。
 * 上限が無いと注意は増え続け、実際に直前の 2 つの取り込みで 114 件から 115 件に増えた。
 *
 * ## 数そのものは見ない
 *
 * 実際の注意の数と一致するかは `eslint` を回さないと分からず、この検査からは回せない
 * (全 file の型を読むため分単位かかる)。 ここで見るのは **上限が外れていないこと** に絞り、
 * 数の一致は取り込みのたびに `pnpm lint` の出力で確かめる。
 *
 * ## `--quiet` と併記しない
 *
 * `--quiet` は注意を報告そのものから落とす。 上限と併記すると、注意が何件あっても
 * 0 件として数えられ、上限が永久に効かない。 併記していないことを直接見る。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ここ = dirname(fileURLToPath(import.meta.url));
const 根 = join(ここ, "..", "..", "..");

const lint指令 = (): string => {
  const scripts = (
    JSON.parse(readFileSync(join(根, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    }
  ).scripts;
  const s = scripts?.lint;
  expect(s, "`lint` が package.json に無い").toBeDefined();
  return s!;
};

describe("静的検査の注意に上限が付いている (#2006)", () => {
  it("`lint` が `--max-warnings` を整数付きで持つ", () => {
    const 当たり = /--max-warnings[ =](\d+)/.exec(lint指令());
    expect(当たり, "`lint` に `--max-warnings <整数>` が無い").not.toBeNull();
    expect(Number.isInteger(Number(当たり![1])), "上限が整数でない").toBe(true);
  });

  it("上限が `eslint` 全体に掛かっている", () => {
    // 一部の dir だけを見る形にすると、外した dir の注意が上限の外に出る
    expect(lint指令()).toMatch(/\beslint \./);
  });

  it("注意を握り潰す `--quiet` と併記していない", () => {
    expect(lint指令()).not.toMatch(/--quiet\b/);
  });

  it("探し方が上限の欠落を見つけられる (植え込み対照)", () => {
    /*
     * 上の 3 件は「在る」「無い」 を期待する。 探し方が何にも当たらない形だと永久に通るため、
     * 本番と同じ探し方に **上限を外した指令** を通して見つかることを確かめる。
     */
    const 上限なし = "eslint .";
    expect(/--max-warnings[ =](\d+)/.exec(上限なし)).toBeNull();
    expect(上限なし).toMatch(/\beslint \./);
  });
});
