// @vitest-environment node
/**
 * 手引きの枠の表と `playwright.config.ts` の `projects` が一致することの検証 (#2497)。
 *
 * 枠を絞って回した run が「全件通過」 として扱われていた。 実測で 866 件が通り、
 * **3 file がそもそも走っていなかった**。 そのうち `muted-text-symmetry.spec.ts` は
 * #2461 で識別子を画面に出さなくした日から落ちており、1 ヶ月以上赤いまま取り込まれ続けた。
 *
 * 気付けなかったのは、**どの枠が在るかがどこにも書かれていなかった** ため。
 * 手引きに書いても、枠を足した日に古くなれば同じことになる。 ここで突き合わせる。
 *
 * ## 名前は設定から読む
 *
 * 手引きの側だけを見て「4 つ書いてあるか」 を数える形にはしない。
 * 設定を読んで名前を取り、その全てが表に在ることを見る (`rules/quality.md`
 * § 導出可能記述は人手で書かない の経路 1)。
 *
 * 設定は import して `projects` を読む。 source を字で探す形にすると、
 * comment の中の `name:` まで拾う。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import cfg from "../../playwright.config";

/** 手引きの中で枠の表を置いた節。 節を動かしたらここも動かす */
const 節の見出し = "#### 回す枠の一覧";

const 手引き = (): string =>
  readFileSync(join(import.meta.dirname, "../../../../CONTRIBUTING.md"), "utf8");

/** 節の中の表から、1 列目に backtick で囲んだ名前を持つ行を拾う */
function 表に出る枠(md: string): string[] {
  const 始め = md.indexOf(節の見出し);
  if (始め < 0) return [];
  const 残り = md.slice(始め + 節の見出し.length);
  const 終わり = 残り.search(/\n#{1,4} /);
  const 節 = 終わり < 0 ? 残り : 残り.slice(0, 終わり);
  return [...節.matchAll(/^\| `([a-z-]+)` \|/gm)].map((m) => m[1]!);
}

const 設定の枠 = (cfg.projects ?? []).map((p) => p.name).filter((n): n is string => Boolean(n));

describe("画面の検査の枠 (#2497)", () => {
  it("設定が枠を 1 つ以上持つ (走査の生存確認)", () => {
    // 0 件だと、下の 2 件が何も確かめずに通る
    expect(
      設定の枠.length,
      "`playwright.config.ts` から枠の名前を 1 つも読めない (import か `projects` の形が変わった)",
    ).toBeGreaterThan(0);
  });

  it("設定の枠が全て手引きの表に出る", () => {
    const 表 = 表に出る枠(手引き());
    const 出ていない = 設定の枠.filter((n) => !表.includes(n));
    expect(
      出ていない,
      `設定に在る枠が手引きの表に無い (設定 ${設定の枠.length} 件 / 表 ${表.length} 件)。` +
        ` \`${節の見出し}\` の表に行を足す`,
    ).toEqual([]);
  });

  it("手引きの表に、設定に無い枠が出ていない", () => {
    const 表 = 表に出る枠(手引き());
    const 設定に無い = 表.filter((n) => !設定の枠.includes(n));
    expect(
      設定に無い,
      `手引きの表に在る枠が設定に無い (設定 ${設定の枠.length} 件 / 表 ${表.length} 件)。` +
        ` 枠を消したなら表からも消す`,
    ).toEqual([]);
  });
});
