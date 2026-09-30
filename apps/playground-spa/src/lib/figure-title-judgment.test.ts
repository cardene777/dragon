import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * 図の字を集める検査が、図の題を数えるかどうかを判定しているかの検証 (#2749)。
 *
 * ## なぜ要るか
 *
 * 図の題は箱の中に描かれるが、中身の枠より上に置かれる (実測 = 円と帯の見本で
 * `[data-cdl-node]` の中に 1 件、`[data-cdl-shape]` の中に 0 件)。 役で絞らずに字を集める
 * 検査は題まで数え、誤った判定をする。 同じ形で 3 度落ちている (#2728 / #2733 / #2747)。
 *
 * 3 回とも落ちてから直した。 落ちていないだけの検査は、図に題が付いた日に落ちる。
 *
 * ## 何を見るか
 *
 * 字を集める file を **実物から導き**、その全てが判定を記録していることを見る。
 * 一覧を手で持つと、検査を足した日にその一覧が古くなる
 * (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
 *
 * 記録は `#2749` の 1 語で足りる。 どう判定したか (役で外した / 題も数える対象 /
 * 構造で入らない) は各 file のコメントが持ち、ここでは中身を読まない
 * = 散文の語を判定材料にすると、題に触れただけの file まで数える。
 *
 * ## 何を字を集める形と見るか
 *
 * `querySelector` / `querySelectorAll` に渡す選択子に `text` が要素として現れる形。
 * 画面の部品の class 名に `text` を含む形 (`.v4-editor-notice-text`) は図の字ではないので
 * 外す。 選択子を変数で組み立てる形は静的に読めないため、この検査は届かない。
 */

const TESTS = join(import.meta.dirname, "../../tests");

/** 選択子に `text` が要素として現れるか。 class 名や属性の中の `text` は数えない */
function 図の字を指すか(選択子: string): boolean {
  return 選択子
    .split(",")
    .some((一つ) =>
      一つ
        .trim()
        .split(/\s+|>/u)
        .some((語) => 語 === "text"),
    );
}

/** その file が図の字を集めるか */
function 字を集めるか(src: string, 名前: string): boolean {
  const 木 = ts.createSourceFile(名前, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let 見つけた = false;
  const 歩く = (n: ts.Node): void => {
    if (見つけた) return;
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      (n.expression.name.text === "querySelectorAll" || n.expression.name.text === "querySelector")
    ) {
      const 引数 = n.arguments[0];
      if (引数 !== undefined && ts.isStringLiteralLike(引数) && 図の字を指すか(引数.text)) {
        見つけた = true;
        return;
      }
    }
    ts.forEachChild(n, 歩く);
  };
  ts.forEachChild(木, 歩く);
  return 見つけた;
}

describe("図の字を集める検査は題の扱いを記録している (#2749)", () => {
  const 全 = readdirSync(TESTS).filter((f) => f.endsWith(".ts"));
  const 集める = 全.filter((f) => 字を集めるか(readFileSync(join(TESTS, f), "utf8"), f));

  it("字を集める file が 1 つも取れていない、ということが起きていない", () => {
    // 空振り防止。 0 件なら下の一致は何も言っていない
    expect(全.length, "検査の file を 1 つも読めていない").toBeGreaterThan(0);
    expect(集める.length, "字を集める file を 1 つも読めていない (走査が壊れている)").toBeGreaterThan(
      10,
    );
  });

  it("字を集める file は全て判定を記録している", () => {
    const 記録なし = 集める.filter((f) => !readFileSync(join(TESTS, f), "utf8").includes("#2749"));
    expect(
      記録なし,
      `図の字を集めているのに題の扱いを書いていない (母数 ${集める.length} 件)。` +
        " 役で外すか、数える対象である理由を書いて `#2749` を添える",
    ).toEqual([]);
  });
});
