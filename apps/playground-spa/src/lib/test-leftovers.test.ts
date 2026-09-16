import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * 画面の検査を消した時に、その検査のためだけに置いたものが残らないことの検証 (#2071)。
 *
 * 図の直接操作を外した時 (#923)、撮影の検査 3 件と動きの検査 1 件が消えた。 検査の file は
 * 消えたが、撮影の基準画像 3 枚と、動きの検査だけを走らせる project の設定が残っていた。
 * どちらも対象が消えても何も落ちないので、残っていることに誰も気付かない。
 *
 * 2 つを見る。
 *
 * - **基準画像** は、同じ名前の spec が同じ撮影名で `toHaveScreenshot` を呼んでいる
 * - **`playwright.config.ts` の `testMatch` / `testIgnore`** に書いた正規表現は、`tests/` の
 *   file のどれかに当たる。 `(a|b)\.spec\.ts$` の形は分岐ごとに当たることを見る = 3 件を
 *   並べた正規表現から 1 件だけ消えた時も拾う
 *
 * 基準画像の名前は Playwright の既定の形 (`<撮影名>-<project 名>-<platform>.png`)。 project 名は
 * 設定の `projects` から読み、手で並べない = project を足した日に、その project の画像だけ
 * 持ち主が無いと誤って落ちないようにする。
 */

const APP = join(import.meta.dirname, "../..");
const TESTS_DIR = join(APP, "tests");
const CONFIG = join(APP, "playwright.config.ts");

/** Playwright が基準画像の名前の末尾に付ける platform (`process.platform` の値) */
const 環境 = ["darwin", "linux", "win32"] as const;

const 読む = (名前: string, src: string) =>
  ts.createSourceFile(名前, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const 名前が = (node: ts.PropertyName, 名: string) =>
  (ts.isIdentifier(node) || ts.isStringLiteral(node)) && node.text === 名;

/** 設定の `projects` に並ぶ `name` */
function project名(src: string): string[] {
  const 名前たち: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && 名前が(node.name, "projects") && ts.isArrayLiteralExpression(node.initializer)) {
      for (const el of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(el)) continue;
        for (const p of el.properties) {
          if (ts.isPropertyAssignment(p) && 名前が(p.name, "name") && ts.isStringLiteral(p.initializer)) {
            名前たち.push(p.initializer.text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(読む("playwright.config.ts", src));
  return 名前たち;
}

/**
 * spec が `toHaveScreenshot` に渡した撮影名 (拡張子を外したもの) と、名前を渡していない呼出の数。
 *
 * 名前を渡さない呼出は、Playwright が検査の題から名前を作る。 題から作る名前は静的に追えないので
 * 数えて返し、本番の走査で 0 件を求める。
 */
function 撮影名(src: string): { 名前: string[]; 名前なし: number } {
  const 名前: string[] = [];
  let 名前なし = 0;
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "toHaveScreenshot"
    ) {
      const arg = node.arguments[0];
      if (arg !== undefined && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
        名前.push(arg.text.replace(/\.png$/u, ""));
      } else {
        名前なし += 1;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(読む("candidate.spec.ts", src));
  return { 名前, 名前なし };
}

/**
 * 持ち主の撮影が無い基準画像。
 *
 * 画像は `<spec の path>-snapshots/<撮影名>-<project 名>-<platform>.png` の形で渡す。 撮影名は
 * spec の path を鍵にして引く。 **名前は完全一致で見る** = 前方一致にすると、撮影名 `01` が
 * `01-init-default-darwin.png` の持ち主に見える。
 */
function 持ち主のない基準画像(
  画像: readonly string[],
  撮影: ReadonlyMap<string, readonly string[]>,
  projects: readonly string[],
): string[] {
  return 画像.filter((p) => {
    const dir = dirname(p);
    if (!dir.endsWith("-snapshots")) return true;
    const 名前たち = 撮影.get(dir.slice(0, -"-snapshots".length)) ?? [];
    const file = basename(p);
    return !名前たち.some((名) => projects.some((pr) => 環境.some((env) => file === `${名}-${pr}-${env}.png`)));
  });
}

/**
 * 設定の `testMatch` / `testIgnore` に書いた正規表現。
 *
 * その場に書いた正規表現と、同じ file で `const 名前 = /.../` と宣言して名前で渡したものの両方を読む。
 * 配列で渡した形は要素ごとに読む。
 */
function 対象の正規表現(src: string): RegExp[] {
  const sf = 読む("playwright.config.ts", src);
  const 宣言 = new Map<string, RegExp>();
  const 正規表現 = (lit: ts.RegularExpressionLiteral): RegExp => {
    const text = lit.text;
    const 終わり = text.lastIndexOf("/");
    return new RegExp(text.slice(1, 終わり), text.slice(終わり + 1));
  };
  const 宣言を集める = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      ts.isRegularExpressionLiteral(node.initializer)
    ) {
      宣言.set(node.name.text, 正規表現(node.initializer));
    }
    ts.forEachChild(node, 宣言を集める);
  };
  宣言を集める(sf);

  const 見つけた: RegExp[] = [];
  const 値を読む = (e: ts.Expression) => {
    if (ts.isRegularExpressionLiteral(e)) 見つけた.push(正規表現(e));
    else if (ts.isIdentifier(e) && 宣言.has(e.text)) 見つけた.push(宣言.get(e.text)!);
    else if (ts.isArrayLiteralExpression(e)) e.elements.forEach(値を読む);
  };
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && (名前が(node.name, "testMatch") || 名前が(node.name, "testIgnore"))) {
      値を読む(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return 見つけた;
}

/**
 * 正規表現を分岐ごとの正規表現に分ける。
 *
 * `前(a|b|c)後` の形 (括弧が 1 組だけ) は `前a後` / `前b後` / `前c後` にする。 それ以外は分けずに返す。
 */
function 分岐ごと(re: RegExp): RegExp[] {
  const m = /^([^()]*)\(([^()]*\|[^()]*)\)([^()]*)$/u.exec(re.source);
  if (m === null) return [re];
  const [, 前, 中, 後] = m;
  return 中!.split("|").map((alt) => new RegExp(`${前}(?:${alt})${後}`, re.flags));
}

/** どの file にも当たらない分岐。 表示は分岐の正規表現の文字列 */
function 当たらない正規表現(正規表現たち: readonly RegExp[], files: readonly string[]): string[] {
  return 正規表現たち.flatMap(分岐ごと).filter((re) => !files.some((f) => re.test(f))).map((re) => re.source);
}

describe("消えた検査のために置いたものが残らない (#2071)", () => {
  it("追跡中の基準画像は、同じ名前の spec が同じ撮影名で撮っている", () => {
    const 画像 = execFileSync("git", ["-C", APP, "ls-files", "--", "tests"], { encoding: "utf8" })
      .split("\n")
      .filter((p) => /-snapshots\/[^/]+\.png$/u.test(p))
      .map((p) => join(APP, p));
    expect(画像.length, "基準画像を 1 枚も拾えていない (検査が空振りしている)").toBeGreaterThan(0);

    const projects = project名(readFileSync(CONFIG, "utf8"));
    expect(projects.length, "project 名を 1 つも読めていない").toBeGreaterThan(0);

    const 撮影 = new Map<string, string[]>();
    let 名前なし = 0;
    for (const spec of new Set(画像.map((p) => dirname(p).replace(/-snapshots$/u, "")))) {
      if (!existsSync(spec)) continue;
      const r = 撮影名(readFileSync(spec, "utf8"));
      撮影.set(spec, r.名前);
      名前なし += r.名前なし;
    }
    expect([...撮影.values()].flat().length, "撮影名を 1 つも読めていない").toBeGreaterThan(0);
    expect(名前なし, "撮影名を渡していない toHaveScreenshot がある (名前を題から作る形は突き合わせられない)").toBe(0);
    expect(
      持ち主のない基準画像(画像, 撮影, projects).map((p) => relative(APP, p)),
      "撮る検査の無い基準画像 (検査を消した時に一緒に消す)",
    ).toEqual([]);
  });

  it("playwright.config.ts の testMatch / testIgnore は、tests/ の file のどれかに当たる", () => {
    const files = readdirSync(TESTS_DIR, { recursive: true, encoding: "utf8" });
    expect(files.length, "tests/ の file を 1 つも拾えていない").toBeGreaterThan(0);
    const 正規表現たち = 対象の正規表現(readFileSync(CONFIG, "utf8"));
    expect(正規表現たち.length, "正規表現を 1 つも読めていない").toBeGreaterThan(0);
    expect(
      当たらない正規表現(正規表現たち, files),
      "どの検査にも当たらない正規表現 (検査を消した時に設定からも消す)",
    ).toEqual([]);
  });

  it("撮る検査の無い基準画像を拾う (植え込み対照)", () => {
    // 本番の走査は 0 件を期待するので、判定が何も拾わない形に壊れていても通る。
    // 同じ判定に持ち主の無い形を渡して、拾えることを確かめる
    const 撮影 = new Map([["t/a.spec.ts", ["01-init", "01"]]]);
    expect(
      持ち主のない基準画像(
        [
          "t/a.spec.ts-snapshots/01-init-default-darwin.png",
          "t/a.spec.ts-snapshots/02-drop-default-darwin.png", // 撮影名が無い
          "t/b.spec.ts-snapshots/x-default-linux.png", // spec が無い
          "t/a.spec.ts-snapshots/01-init-other-darwin.png", // project が無い
          "t/a.spec.ts-snapshots/01-init-default-sunos.png", // platform が無い
          "t/a.spec.ts-snapshots/01-x-default-darwin.png", // `01` の前方一致で持ち主に見える形
        ],
        撮影,
        ["default"],
      ),
    ).toEqual([
      "t/a.spec.ts-snapshots/02-drop-default-darwin.png",
      "t/b.spec.ts-snapshots/x-default-linux.png",
      "t/a.spec.ts-snapshots/01-init-other-darwin.png",
      "t/a.spec.ts-snapshots/01-init-default-sunos.png",
      "t/a.spec.ts-snapshots/01-x-default-darwin.png",
    ]);
  });

  it("撮る検査のある基準画像は拾わない (陰性対照)", () => {
    // 上の対照が、画像を全部拾うだけの判定で通っていないことを確かめる。
    // 名前に `-` を含む project (`dev-setup`) も project 名の一覧から引ければ持ち主が見つかる
    const 撮影 = new Map([["t/a.spec.ts", ["01-init"]]]);
    expect(
      持ち主のない基準画像(
        ["t/a.spec.ts-snapshots/01-init-default-darwin.png", "t/a.spec.ts-snapshots/01-init-dev-setup-linux.png"],
        撮影,
        ["default", "dev-setup"],
      ),
    ).toEqual([]);
  });

  it("撮影名と project 名を読む", () => {
    expect(撮影名('await expect(stage).toHaveScreenshot("01-init.png", { animations: "disabled" });')).toEqual({
      名前: ["01-init"],
      名前なし: 0,
    });
    expect(撮影名("await expect(stage).toHaveScreenshot();").名前なし).toBe(1);
    expect(撮影名('await expect(stage).toHaveScreenshot({ animations: "disabled" });').名前なし).toBe(1);
    expect(
      project名('export default defineConfig({ projects: [{ name: "default" }, { name: "dev-setup", use: {} }] });'),
    ).toEqual(["default", "dev-setup"]);
  });

  it("どの file にも当たらない正規表現と分岐を拾い、当たるものは拾わない", () => {
    const src = [
      "const 重ねない = /(a|gone)\\.spec\\.ts$/;",
      "export default defineConfig({ projects: [",
      "  { name: \"default\", testIgnore: [/gone2\\.spec\\.ts$/, 重ねない] },",
      "  { name: \"m\", testMatch: /b\\.spec\\.ts$/ },",
      "] });",
    ].join("\n");
    const 正規表現たち = 対象の正規表現(src);
    expect(正規表現たち.map((r) => r.source)).toEqual(["gone2\\.spec\\.ts$", "(a|gone)\\.spec\\.ts$", "b\\.spec\\.ts$"]);
    // 植え込み = 消えた file (`gone2`) と、3 件並べた分岐の 1 件だけ消えた形 (`gone`)
    expect(当たらない正規表現(正規表現たち, ["a.spec.ts", "b.spec.ts"])).toEqual([
      "gone2\\.spec\\.ts$",
      "(?:gone)\\.spec\\.ts$",
    ]);
    // 陰性 = 全部の file がある
    expect(当たらない正規表現(正規表現たち, ["a.spec.ts", "b.spec.ts", "gone.spec.ts", "gone2.spec.ts"])).toEqual([]);
  });
});
