/**
 * 見本帳の最初の script が、後から読む塊を待ったまま止まらないこと (#3643)。
 *
 * 後から読む塊 (英語の塊 `english-<hash>.js` など) は、最初の script から部品を読み込む。
 * 最初の script が最上位で `await` すると、最初の script の評価が終わらないので塊も動かず、互いを待って頁を描かない。
 * 英語の端末で見本帳を開くと空の頁のままになった (#3646 で英語の塊を最上位で待つ形にした)。
 * 組み立てた後の塊の分け方は vite が決めるので、最初の script (`src/main.tsx`) の最上位に `await` が無いことを構文で確かめる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const MAIN = join(process.cwd(), "apps/playground-spa/src/main.tsx");

/** 関数の外に在る `await` の行の番号 (1 から数える)。関数の中の `await` は、その関数を呼ぶ側を止めないので数えない */
function topLevelAwaits(path: string): number[] {
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lines: number[] = [];
  const walk = (node: ts.Node): void => {
    if (ts.isFunctionLike(node) || ts.isClassLike(node)) return;
    if (ts.isAwaitExpression(node) || (ts.isForOfStatement(node) && node.awaitModifier !== undefined)) {
      lines.push(source.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    }
    ts.forEachChild(node, walk);
  };
  ts.forEachChild(source, walk);
  return lines;
}

describe("見本帳の最初の script (#3643)", () => {
  it("site-entry-has-no-top-level-await", () => {
    const text = readFileSync(MAIN, "utf8");
    expect(text, "最初の script が頁を描かない").toContain("createRoot(");
    expect(topLevelAwaits(MAIN), "src/main.tsx の最上位で待つ行。待つ処理は関数の中に置く").toEqual([]);
  });
});
