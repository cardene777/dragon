/**
 * 集めた物が空でも通る検査が無いことの検証 (#2505)。
 *
 * #2494 と #2500 で「何も確かめずに通る検査」 を 2 通り潰した。
 * 判定へ届く前に本文から抜ける形と、名前が言う条件を本文が見ていない形。
 * ここは 3 通り目 = **集めた物を回して 1 件ずつ確かめる検査で、集めた物が空になる形**。
 * 回る回数が 0 になり、判定へ 1 度も入らないまま通る。
 *
 * ## 何を数えるか
 *
 * 次の 3 つを同時に満たす検査を数える。
 *
 * | 条件 | 理由 |
 * |---|---|
 * | 確かめる文が回す処理の中にしか無い | 外に 1 つでもあれば件数に依らず確かめている |
 * | 回す元が呼出の形をしている | 検査が自分で選んだ元。 下の § 見る範囲 |
 * | 同じ塊に件数を見る兄弟の検査が無い | 在れば空振りは既に塞がれている |
 *
 * ## 見る範囲
 *
 * 回す元が **呼出の形** のものに限る。 絞り込み (`filter` / `flatMap`)、
 * `Object.values` 等、関数の戻り値の 3 形で、どれも **検査が自分で選んだ元** になる。
 *
 * 取り込んだ一覧 (`import` した定数) と、試した相手が返した物の欄 (`図.nodes` 等) は見ない。
 * そこが空になるかは検査ではなく材料の側で決まり、空が正しい場合もある
 * (`各 state key 数 <= 30 (存在時)` のように名前が既に断っている)。 その 56 件は #2506 が扱う。
 *
 * その場に書いた一覧と、この file 内で literal に束ねた名前も外す。 件数が実行時に変わらない。
 *
 * ## 兄弟を塊の単位で見ることの粗さ
 *
 * 件数を見る兄弟の検査は `describe` の塊ごとに探す。 **別の集めた物に対する件数の確認でも
 * 塞がれた扱いになる**。 語の形では「どの集めた物を数えたか」 を判定できないため、
 * ここは「1 件も塞いでいない塊」 だけを止める形に倒す。
 * 塊の中で塞ぎ忘れが残る余地は、それを止めようとして正当な検査まで巻き込む形より軽い。
 *
 * ## 数え方を絞り込んだ記録
 *
 * 最初の数え方は 1240 件を出した。 4 段で絞り、どれも「正しい検査を止めない」 ための条件。
 *
 * | 段 | 外したもの | 残り |
 * |---|---|---|
 * | 1 | 確かめる文が回す処理の外にもある検査 | 285 |
 * | 2 | その場に書いた一覧と file 内の定数を回す検査 | 32 |
 * | 3 | 同じ塊に件数を見る兄弟の検査が在るもの | 17 |
 * | 4 | 字を整えるだけの `map` を回す処理と数えていた誤り | 3 |
 */
import { describe, it, expect } from "vitest";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { 走査するfile } from "../../../test-support/scan-targets";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** 単体の検査と画面の検査の両方を見る (#2502 と同じ範囲) */
function 検査のfile(): string[] {
  return 走査するfile(repo, "*.test.ts", "*.test.tsx", "*.spec.ts").filter(
    (f) => !f.includes("node_modules"),
  );
}

/** 型の注記や括弧を剥がして中身の式を返す */
function 剥がす(n: ts.Node): ts.Node {
  let 今 = n;
  for (;;) {
    if (ts.isAsExpression(今) || ts.isParenthesizedExpression(今) || ts.isNonNullExpression(今)) {
      今 = 今.expression;
      continue;
    }
    if (ts.isSatisfiesExpression(今) || ts.isAwaitExpression(今)) {
      今 = 今.expression;
      continue;
    }
    return 今;
  }
}

/** 中身を書き切った literal か (件数が実行時に変わらない) */
function 書き切ったliteral(n: ts.Node): boolean {
  const v = 剥がす(n);
  return ts.isArrayLiteralExpression(v) || ts.isObjectLiteralExpression(v);
}

/**
 * この file 内で「必ず中身のある一覧を返す」 と読める関数の名前。
 *
 * 全ての `return` が中身のある literal の一覧を返す関数は、呼んでも空にならない。
 * 呼出の形をしていても件数は実行時に変わらないので、見る範囲から外す。
 */
function 空にならない関数(src: ts.SourceFile): Set<string> {
  const out = new Set<string>();
  const 見る = (名: string, 本体: ts.Node): void => {
    const 戻り: ts.Expression[] = [];
    const 中境 = (n: ts.Node): boolean =>
      ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n);
    const 辿 = (n: ts.Node, 入れ子: boolean): void => {
      if (!入れ子 && ts.isReturnStatement(n) && n.expression) 戻り.push(n.expression);
      ts.forEachChild(n, (c) => 辿(c, 入れ子 || 中境(n)));
    };
    if (ts.isBlock(本体)) ts.forEachChild(本体, (c) => 辿(c, false));
    else if (ts.isExpression(本体)) 戻り.push(本体);
    if (戻り.length === 0) return;
    const 全部literal = 戻り.every((e) => {
      const v = 剥がす(e);
      return ts.isArrayLiteralExpression(v) && v.elements.length > 0;
    });
    if (全部literal) out.add(名);
  };
  const 集 = (n: ts.Node): void => {
    if (ts.isFunctionDeclaration(n) && n.name && n.body) 見る(n.name.text, n.body);
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.initializer &&
      (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer)) &&
      n.initializer.body
    ) {
      見る(n.name.text, n.initializer.body);
    }
    ts.forEachChild(n, 集);
  };
  集(src);
  return out;
}

/** 件数を見る形。 `.length` と `.size` の両方、閾値は 0 以上の任意の数を受ける */
const 件数を見る形 =
  /\.(length|size)[\s\S]{0,160}toBeGreaterThan(OrEqual)?\(\s*\d*\s*\)|toHaveLength\(\s*[1-9]/;

/** `it` / `test` の呼出なら、その本文 (block) を返す */
function 検査の本文(node: ts.Node): ts.Block | null {
  if (!ts.isCallExpression(node)) return null;
  const e = node.expression;
  const 名 = ts.isIdentifier(e) ? e.text : null;
  if (名 !== "it" && 名 !== "test") return null;
  const 後ろ = node.arguments[node.arguments.length - 1];
  if (!後ろ || !(ts.isArrowFunction(後ろ) || ts.isFunctionExpression(後ろ))) return null;
  return 後ろ.body && ts.isBlock(後ろ.body) ? 後ろ.body : null;
}

/** `expect(...)` の呼出か */
function expect呼出(n: ts.Node): boolean {
  return (
    ts.isCallExpression(n) &&
    ((ts.isIdentifier(n.expression) && n.expression.text === "expect") ||
      (ts.isPropertyAccessExpression(n.expression) &&
        ts.isIdentifier(n.expression.expression) &&
        n.expression.expression.text === "expect"))
  );
}

/** 回す処理なら、回す元の式を返す */
function 回す元(n: ts.Node): ts.Node | null {
  if (ts.isForOfStatement(n)) return n.expression;
  if (
    ts.isCallExpression(n) &&
    ts.isPropertyAccessExpression(n.expression) &&
    ["forEach", "map", "flatMap", "some", "every"].includes(n.expression.name.text)
  ) {
    return n.expression.expression;
  }
  return null;
}

/**
 * その元が「検査が自分で選んだ物」 か。 呼出の形に限る (§ 見る範囲)。
 *
 * `固定の名` はこの file 内で literal に束ねた名前で、件数が実行時に変わらない。
 */
function 検査が選んだ元(
  元: ts.Node,
  固定の名: ReadonlySet<string>,
  空にならない: ReadonlySet<string>,
): boolean {
  const e = 剥がす(元);
  if (!ts.isCallExpression(e)) return false;
  if (ts.isIdentifier(e.expression) && 空にならない.has(e.expression.text)) return false;

  const 名前が固定 = (x: ts.Node): boolean => {
    const v = 剥がす(x);
    return 書き切ったliteral(v) || (ts.isIdentifier(v) && 固定の名.has(v.text));
  };

  if (ts.isPropertyAccessExpression(e.expression)) {
    const 方法 = e.expression.name.text;
    // 絞り込みは元が literal でも空になりうる (当たらなければ 0 件)
    if (方法 === "filter" || 方法 === "flatMap") return true;
    const 受け = e.expression.expression;
    // `Object.values(X)` 等は X を、それ以外は受け手そのものを見る
    if (ts.isIdentifier(受け) && 受け.text === "Object" && e.arguments.length === 1) {
      return !名前が固定(e.arguments[0]!);
    }
    return !名前が固定(受け);
  }
  return true;
}

function 走査(): { 検査数: number; files: number; hits: string[] } {
  const files = 検査のfile();
  const hits: string[] = [];
  let 検査数 = 0;

  for (const f of files) {
    const text = readFileSync(join(repo, f), "utf8");
    const src = ts.createSourceFile(
      f,
      text,
      ts.ScriptTarget.Latest,
      true,
      f.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    // この file 内で literal に束ねた名前
    const 固定の名 = new Set<string>();
    const 集名 = (n: ts.Node): void => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
        const v = 剥がす(n.initializer);
        const 中身あり =
          (ts.isArrayLiteralExpression(v) && v.elements.length > 0) ||
          (ts.isObjectLiteralExpression(v) && v.properties.length > 0);
        if (中身あり) 固定の名.add(n.name.text);
      }
      ts.forEachChild(n, 集名);
    };
    集名(src);
    const 空にならない = 空にならない関数(src);

    // 件数を見る兄弟の検査を持つ塊
    const 塞ぐ塊: Array<[number, number]> = [];
    const 集塊 = (n: ts.Node): void => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "describe") {
        const 後ろ = n.arguments[n.arguments.length - 1];
        if (
          後ろ &&
          (ts.isArrowFunction(後ろ) || ts.isFunctionExpression(後ろ)) &&
          後ろ.body &&
          件数を見る形.test(後ろ.body.getText(src))
        ) {
          塞ぐ塊.push([n.getStart(src), n.getEnd()]);
        }
      }
      ts.forEachChild(n, 集塊);
    };
    集塊(src);
    const 塞がれている = (位置: number): boolean =>
      塞ぐ塊.some(([始, 終]) => 位置 >= 始 && 位置 <= 終);

    const 辿る = (n: ts.Node): void => {
      const 本文 = 検査の本文(n);
      if (本文) {
        検査数 += 1;
        let 外にexpect = false;
        let 該当: string | null = null;

        const 歩く = (m: ts.Node, 中: boolean): void => {
          if (!中 && expect呼出(m)) 外にexpect = true;
          const 元 = 回す元(m);
          // 確かめる文を含まない回す処理 (字の整形など) は、確かめる回す処理ではない
          const 確かめる回す = 元 !== null && m.getText(src).includes("expect(");
          if (確かめる回す && !中 && 該当 === null && 検査が選んだ元(元, 固定の名, 空にならない)) {
            該当 = 元.getText(src).replace(/\s+/g, " ").slice(0, 60);
          }
          ts.forEachChild(m, (c) => 歩く(c, 中 || 元 !== null));
        };
        ts.forEachChild(本文, (c) => 歩く(c, false));

        if (!外にexpect && 該当 !== null && !塞がれている(n.getStart(src))) {
          const 行 = src.getLineAndCharacterOfPosition(n.getStart(src)).line + 1;
          hits.push(`${f}:${行} (回す元 = ${該当})`);
        }
      }
      ts.forEachChild(n, 辿る);
    };
    辿る(src);
  }
  return { 検査数, files: files.length, hits };
}

describe("集めた物が空でも通る検査 (#2505)", () => {
  const { 検査数, files, hits } = 走査();

  it("検査を 1 件以上走査している (走査の生存確認)", () => {
    // 0 件だと、下の 1 件が何も確かめずに通る
    expect(files, "集める処理が検査の file を 1 件も返さない").toBeGreaterThan(0);
    expect(検査数, "走査した file から検査を 1 件も読めない").toBeGreaterThan(0);
  });

  it("集めた物が空でも通る検査が 0 件", () => {
    expect(
      hits,
      `集めた物が空だと何も確かめずに通る (検査 ${検査数} 件 / file ${files} 件を走査)。` +
        ` 同じ塊に「1 件以上ある」 を見る検査を足す`,
    ).toEqual([]);
  });
});
