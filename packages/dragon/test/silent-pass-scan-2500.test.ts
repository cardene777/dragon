/**
 * 確かめる前に検査の本文から抜ける箇所が無いことの検証 (#2500)。
 *
 * #2494 で `layout-with-validation.test.ts` の 2 件を直した時、
 * **他の file の同じ形は対象外** とし、見つけ方を残した。 ここがその見つけ方。
 *
 * ## 何を数えるか
 *
 * 検査の本文 (`it` / `test` に渡した関数の中) で、`expect` より前に現れる `return` を数える。
 * 条件が成立しないと判定に届かないまま通るので、**落ちる検査と見分けが付かない**。
 *
 * 数えないものが 2 つある。
 *
 * | 形 | 数えない理由 |
 * |---|---|
 * | 入れ子の関数の中の `return` | その関数から戻るだけで、検査は続く |
 * | 繰り返しの中の `continue` / `return` | その回を飛ばすだけで、検査は続く |
 *
 * ## 常に真の判定は数えない
 *
 * `expect(配列.length).toBeGreaterThanOrEqual(0)` のような常に真の判定も #2500 で
 * 直したが、**ここでは数えない**。 値が数え上げた結果かどうかは型からは決まらず
 * (`indexOf` の戻り値は負になりうるので `>= 0` が正当な判定になる)、
 * 語の形だけで分けると正当な判定まで止める。
 *
 * ## 飛ばす時は `ctx.skip()` を使う
 *
 * 実物が無いと確かめられない検査 (build 前の出力、commit されない中間 file) は、
 * 裸の `return` ではなく `ctx.skip()` で飛ばす。 報告に「飛ばした」 と出るので、
 * 通ったのと見分けが付く。
 */
import { describe, it, expect } from "vitest";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { 走査するfile } from "../../../test-support/scan-targets";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** 未追跡の検査も見る = 書いている最中の file が判定を受けないと、取り込んだ回で初めて落ちる */
function 検査のfile(): string[] {
  return 走査するfile(repo, "*.test.ts", "*.test.tsx").filter((f) => !f.includes("node_modules"));
}

/** `it` / `test` に渡した関数の本文 (block) を返す。 検査の呼出でなければ `null` */
function 検査の本文(node: ts.Node): ts.Block | null {
  if (!ts.isCallExpression(node)) return null;
  const e = node.expression;
  const 名 = ts.isIdentifier(e)
    ? e.text
    : ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression)
      ? e.expression.text
      : null;
  if (名 !== "it" && 名 !== "test") return null;
  const 後ろ = node.arguments[node.arguments.length - 1];
  if (!後ろ || !(ts.isArrowFunction(後ろ) || ts.isFunctionExpression(後ろ))) return null;
  return 後ろ.body && ts.isBlock(後ろ.body) ? 後ろ.body : null;
}

/** 本文の中を、入れ子の関数と繰り返しを境として辿る */
function 抜ける行(src: ts.SourceFile, 本文: ts.Block): number | null {
  let expect済 = false;
  let 見つけた: number | null = null;

  const 辿る = (n: ts.Node, 入れ子: boolean): void => {
    if (見つけた !== null) return;
    const expect呼出 =
      (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "expect") ||
      (ts.isPropertyAccessExpression(n) &&
        ts.isCallExpression(n.expression) &&
        ts.isIdentifier(n.expression.expression) &&
        n.expression.expression.text === "expect");
    if (expect呼出) expect済 = true;

    const 境 =
      ts.isArrowFunction(n) ||
      ts.isFunctionExpression(n) ||
      ts.isFunctionDeclaration(n) ||
      ts.isMethodDeclaration(n) ||
      ts.isGetAccessorDeclaration(n) ||
      ts.isSetAccessorDeclaration(n) ||
      ts.isForStatement(n) ||
      ts.isForOfStatement(n) ||
      ts.isForInStatement(n) ||
      ts.isWhileStatement(n) ||
      ts.isDoStatement(n);

    if (!入れ子 && ts.isReturnStatement(n) && !expect済) {
      見つけた = src.getLineAndCharacterOfPosition(n.getStart()).line + 1;
      return;
    }
    ts.forEachChild(n, (c) => 辿る(c, 入れ子 || 境));
  };

  ts.forEachChild(本文, (c) => 辿る(c, false));
  return 見つけた;
}

function 走査(): { files: number; hits: string[] } {
  const files = 検査のfile();
  const hits: string[] = [];
  for (const f of files) {
    const text = readFileSync(join(repo, f), "utf8");
    const src = ts.createSourceFile(
      f,
      text,
      ts.ScriptTarget.Latest,
      true,
      f.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const 辿る = (n: ts.Node): void => {
      const 本文 = 検査の本文(n);
      if (本文) {
        const 行 = 抜ける行(src, 本文);
        if (行 !== null) hits.push(`${f}:${行}`);
      }
      ts.forEachChild(n, 辿る);
    };
    辿る(src);
  }
  return { files: files.length, hits };
}

describe("確かめる前に抜ける検査 (#2500)", () => {
  const { files, hits } = 走査();

  it("検査の file を 1 件以上走査している (走査の生存確認)", () => {
    // 0 件だと、下の 1 件が何も確かめずに通る
    expect(files, "集める処理が検査の file を 1 件も返さない").toBeGreaterThan(0);
  });

  it("確かめる前に検査の本文から抜ける箇所が 0 件", () => {
    expect(
      hits,
      `確かめる前に抜ける箇所がある (${files} file を走査)。` +
        ` 母数を絞るか、実物が無い時は \`ctx.skip()\` で飛ばす`,
    ).toEqual([]);
  });
});
